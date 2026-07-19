import { createRemoteJWKSet, jwtVerify } from "jose"

type Env = {
  ASSETS: Fetcher
  DB: D1Database
  AUTH_BYPASS_EMAIL?: string
  CF_ACCESS_AUD?: string
  CF_ACCESS_TEAM_DOMAIN?: string
}

type Account = {
  email_address: string
}

type ItemRow = {
  id: number
  name: string | null
  category: string | null
  unit: string | null
  preferred_source: string | null
  low: number | null
  high: number | null
  value: number | null
  last_updated_at: string | null
}

type SnapshotRow = {
  id: number
  item_id: number
  value: number
  note: string | null
  created_at: string
  updated_at: string
}

type ItemInput = {
  category?: unknown
  high?: unknown
  low?: unknown
  name?: unknown
  preferred_source?: unknown
  unit?: unknown
}

type SnapshotInput = {
  item_id?: unknown
  note?: unknown
  value?: unknown
}

const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  })
}

function emptyResponse(init?: ResponseInit) {
  return new Response(null, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  })
}

function notFound() {
  return jsonResponse({ error: "Not found" }, { status: 404 })
}

function normalizeAccessIssuer(teamDomain: string) {
  const normalizedTeamDomain = teamDomain
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")

  return `https://${normalizedTeamDomain}`
}

function accessJwks(issuer: string) {
  const existingJwks = jwksByIssuer.get(issuer)

  if (existingJwks) {
    return existingJwks
  }

  const jwks = createRemoteJWKSet(new URL("/cdn-cgi/access/certs", issuer))
  jwksByIssuer.set(issuer, jwks)

  return jwks
}

async function authenticateRequest(request: Request, env: Env): Promise<Account> {
  if (env.AUTH_BYPASS_EMAIL) {
    return { email_address: env.AUTH_BYPASS_EMAIL }
  }

  if (!env.CF_ACCESS_AUD || !env.CF_ACCESS_TEAM_DOMAIN) {
    throw new Response("Cloudflare Access is not configured.", { status: 500 })
  }

  const token = request.headers.get("Cf-Access-Jwt-Assertion")

  if (!token) {
    throw jsonResponse({ error: "Authentication required" }, { status: 401 })
  }

  const issuer = normalizeAccessIssuer(env.CF_ACCESS_TEAM_DOMAIN)

  try {
    const { payload } = await jwtVerify(token, accessJwks(issuer), {
      audience: env.CF_ACCESS_AUD,
      issuer,
    })

    if (typeof payload.email !== "string" || !payload.email.trim()) {
      throw new Error("Access token does not include an email claim.")
    }

    return { email_address: payload.email }
  } catch {
    throw jsonResponse({ error: "Authentication required" }, { status: 401 })
  }
}

function requireSameOriginMutation(request: Request) {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) {
    return
  }

  const origin = request.headers.get("Origin")
  const expectedOrigin = new URL(request.url).origin

  if (origin !== expectedOrigin) {
    throw jsonResponse({ error: "Invalid request origin" }, { status: 403 })
  }

  if (!request.headers.get("Content-Type")?.includes("application/json")) {
    throw jsonResponse({ error: "Expected JSON request body" }, { status: 415 })
  }

  if (request.headers.get("X-Requested-With") !== "XMLHttpRequest") {
    throw jsonResponse({ error: "Invalid request headers" }, { status: 403 })
  }
}

async function readJsonObject(request: Request) {
  try {
    const body = await request.json()

    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      return body as Record<string, unknown>
    }
  } catch {
    // Fall through to the validation error.
  }

  throw jsonResponse({ error: "Expected JSON request body" }, { status: 400 })
}

function textOrNull(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmedValue = value.trim()

  return trimmedValue ? trimmedValue : null
}

function requiredText(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmedValue = value.trim()

  return trimmedValue ? trimmedValue : null
}

function integerOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  return Number.isInteger(value) ? value : null
}

function nonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null
}

function itemQuery(whereClause = "") {
  return `
    SELECT
      i.id,
      i.name,
      i.category,
      i.unit,
      i.preferred_source,
      i.low,
      i.high,
      s.value,
      s.updated_at AS last_updated_at
    FROM items i
    LEFT JOIN inventory_snapshots s ON s.id = (
      SELECT latest.id
      FROM inventory_snapshots latest
      WHERE latest.item_id = i.id
      ORDER BY latest.created_at DESC, latest.id DESC
      LIMIT 1
    )
    ${whereClause}
  `
}

async function presentedItem(db: D1Database, id: number) {
  return db
    .prepare(`${itemQuery("WHERE i.id = ?")} LIMIT 1`)
    .bind(id)
    .first<ItemRow>()
}

async function listItems(db: D1Database) {
  const result = await db
    .prepare(`${itemQuery()} ORDER BY i.name ASC, i.id ASC`)
    .all<ItemRow>()

  return result.results
}

async function createItem(request: Request, db: D1Database) {
  const body = await readJsonObject(request)
  const item = body.item as ItemInput | undefined
  const name = requiredText(item?.name)
  const low = integerOrNull(item?.low)
  const high = integerOrNull(item?.high)
  const errors: Record<string, string[]> = {}

  if (!name) {
    errors.name = ["can't be blank"]
  }

  if (item?.low !== null && item?.low !== undefined && low === null) {
    errors.low = ["must be an integer"]
  }

  if (item?.high !== null && item?.high !== undefined && high === null) {
    errors.high = ["must be an integer"]
  }

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, { status: 422 })
  }

  const now = new Date().toISOString()
  const result = await db
    .prepare(
      `
        INSERT INTO items
          (name, category, unit, preferred_source, low, high, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .bind(
      name,
      textOrNull(item?.category),
      textOrNull(item?.unit),
      textOrNull(item?.preferred_source),
      low,
      high,
      now,
      now,
    )
    .run()
  const createdId = (result.meta as { last_row_id?: number }).last_row_id

  if (!createdId) {
    return jsonResponse({ error: "Unable to create item" }, { status: 500 })
  }

  return jsonResponse(await presentedItem(db, createdId), { status: 201 })
}

async function updateItem(request: Request, db: D1Database, id: number) {
  const existingItem = await presentedItem(db, id)

  if (!existingItem) {
    return notFound()
  }

  const body = await readJsonObject(request)
  const item = body.item as ItemInput | undefined
  const low = integerOrNull(item?.low)
  const high = integerOrNull(item?.high)
  const errors: Record<string, string[]> = {}

  if (item?.low !== null && item?.low !== undefined && low === null) {
    errors.low = ["must be an integer"]
  }

  if (item?.high !== null && item?.high !== undefined && high === null) {
    errors.high = ["must be an integer"]
  }

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, { status: 422 })
  }

  await db
    .prepare(
      `
        UPDATE items
        SET category = ?, unit = ?, preferred_source = ?, low = ?, high = ?, updated_at = ?
        WHERE id = ?
      `,
    )
    .bind(
      textOrNull(item?.category),
      textOrNull(item?.unit),
      textOrNull(item?.preferred_source),
      low,
      high,
      new Date().toISOString(),
      id,
    )
    .run()

  return jsonResponse(await presentedItem(db, id))
}

async function createBulkSnapshots(request: Request, db: D1Database) {
  const body = await readJsonObject(request)
  const snapshots = body.inventory_snapshots

  if (!Array.isArray(snapshots)) {
    return jsonResponse(
      { errors: { inventory_snapshots: ["must be an array"] } },
      { status: 422 },
    )
  }

  const snapshotInputs = snapshots as SnapshotInput[]
  const itemIds = snapshotInputs
    .map((snapshot) => (Number.isInteger(snapshot.item_id) ? snapshot.item_id : null))
    .filter((itemId): itemId is number => itemId !== null)
  const errors: Record<string, unknown> = {}

  snapshotInputs.forEach((snapshot, index) => {
    const snapshotErrors: Record<string, string[]> = {}

    if (!Number.isInteger(snapshot.item_id)) {
      snapshotErrors.item_id = ["must reference an existing item"]
    }

    if (nonNegativeInteger(snapshot.value) === null) {
      snapshotErrors.value = ["must be greater than or equal to 0"]
    }

    if (typeof snapshot.note !== "string" && snapshot.note !== undefined) {
      snapshotErrors.note = ["must be a string"]
    }

    if (Object.keys(snapshotErrors).length > 0) {
      errors[index] = snapshotErrors
    }
  })

  if (itemIds.length > 0) {
    const placeholders = itemIds.map(() => "?").join(", ")
    const result = await db
      .prepare(`SELECT id FROM items WHERE id IN (${placeholders})`)
      .bind(...itemIds)
      .all<{ id: number }>()
    const existingItemIds = new Set(result.results.map((item) => item.id))
    const missingItemIds = itemIds.filter((itemId) => !existingItemIds.has(itemId))

    if (missingItemIds.length > 0) {
      errors.item_id = ["must reference an existing item"]
    }
  }

  if (Object.keys(errors).length > 0) {
    return jsonResponse({ errors }, { status: 422 })
  }

  if (snapshotInputs.length === 0) {
    return jsonResponse([], { status: 201 })
  }

  const now = new Date().toISOString()
  const statements = snapshotInputs.map((snapshot) =>
    db
      .prepare(
        `
          INSERT INTO inventory_snapshots
            (item_id, value, note, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `,
      )
      .bind(
        snapshot.item_id,
        snapshot.value,
        typeof snapshot.note === "string" ? snapshot.note : null,
        now,
        now,
      ),
  )
  const results = await db.batch(statements)
  const createdIds = results
    .map((result) => (result.meta as { last_row_id?: number }).last_row_id)
    .filter((id): id is number => typeof id === "number")

  if (createdIds.length !== snapshotInputs.length) {
    return jsonResponse({ error: "Unable to create snapshots" }, { status: 500 })
  }

  const placeholders = createdIds.map(() => "?").join(", ")
  const createdSnapshots = await db
    .prepare(
      `
        SELECT id, item_id, value, note, created_at, updated_at
        FROM inventory_snapshots
        WHERE id IN (${placeholders})
        ORDER BY id ASC
      `,
    )
    .bind(...createdIds)
    .all<SnapshotRow>()

  return jsonResponse(createdSnapshots.results, { status: 201 })
}

async function handleApiRequest(request: Request, env: Env) {
  const account = await authenticateRequest(request, env)
  requireSameOriginMutation(request)

  const url = new URL(request.url)
  const pathname = url.pathname
  const itemMatch = pathname.match(/^\/api\/v1\/items\/(\d+)$/)

  if (request.method === "GET" && pathname === "/api/v1/session") {
    return jsonResponse({ account })
  }

  if (request.method === "GET" && pathname === "/api/v1/items") {
    return jsonResponse(await listItems(env.DB))
  }

  if (request.method === "POST" && pathname === "/api/v1/items") {
    return createItem(request, env.DB)
  }

  if (itemMatch && request.method === "GET") {
    const item = await presentedItem(env.DB, Number(itemMatch[1]))

    return item ? jsonResponse(item) : notFound()
  }

  if (itemMatch && request.method === "PATCH") {
    return updateItem(request, env.DB, Number(itemMatch[1]))
  }

  if (request.method === "POST" && pathname === "/api/v1/inventory_snapshots/bulk") {
    return createBulkSnapshots(request, env.DB)
  }

  return notFound()
}

async function handleAssetRequest(request: Request, env: Env) {
  const assetResponse = await env.ASSETS.fetch(request)

  if (assetResponse.status !== 404 || request.method !== "GET") {
    return assetResponse
  }

  const url = new URL(request.url)
  const hasFileExtension = /\/[^/]+\.[^/]+$/.test(url.pathname)

  if (hasFileExtension) {
    return assetResponse
  }

  return env.ASSETS.fetch(new Request(new URL("/", url).toString(), request))
}

export default {
  async fetch(request: Request, env: Env) {
    try {
      if (new URL(request.url).pathname.startsWith("/api/")) {
        return await handleApiRequest(request, env)
      }

      return await handleAssetRequest(request, env)
    } catch (error) {
      if (error instanceof Response) {
        return error
      }

      return jsonResponse({ error: "Internal server error" }, { status: 500 })
    }
  },
}
