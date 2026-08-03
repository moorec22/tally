import { describe, expect, it } from "vitest"

import worker from "../../src/worker/index"

type ItemRecord = {
  id: number
  name: string
  category: string | null
  unit: string | null
  preferred_source: string | null
  low: number | null
  high: number | null
  created_at: string
  updated_at: string
}

type SnapshotRecord = {
  id: number
  item_id: number
  value: number
  note: string | null
  created_at: string
  updated_at: string
}

class MockD1Statement {
  private params: unknown[] = []

  constructor(
    private readonly db: MockD1Database,
    private readonly sql: string,
  ) {}

  bind(...params: unknown[]) {
    this.params = params

    return this
  }

  async all<T>() {
    return { results: this.db.all<T>(this.sql, this.params) }
  }

  async first<T>() {
    return this.db.first<T>(this.sql, this.params)
  }

  async run() {
    return this.db.run(this.sql, this.params)
  }

  async raw<T extends unknown[]>() {
    return this.db.raw<T>(this.sql, this.params)
  }
}

class MockD1Database {
  items: ItemRecord[] = [
    {
      id: 42,
      name: "Printer Paper",
      category: "Office",
      unit: "reams",
      preferred_source: null,
      low: 5,
      high: 30,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ]
  snapshots: SnapshotRecord[] = [
    {
      id: 7,
      item_id: 42,
      value: 20,
      note: null,
      created_at: "2026-01-02T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    },
  ]

  prepare(sql: string) {
    return new MockD1Statement(this, sql)
  }

  async batch(statements: MockD1Statement[]) {
    const results = []

    for (const statement of statements) {
      results.push(await statement.run())
    }

    return results
  }

  all<T>(sql: string, params: unknown[]) {
    const normalizedSql = this.normalizeSql(sql)

    if (
      normalizedSql.includes('from "items"') &&
      normalizedSql.includes('where "items"."id" in')
    ) {
      return this.items
        .filter((item) => params.includes(item.id))
        .sort((first, second) => first.id - second.id) as T[]
    }

    if (
      normalizedSql.includes('from "items"') &&
      normalizedSql.includes('where "items"."id" = ?')
    ) {
      return this.items.filter((item) => item.id === params[0]) as T[]
    }

    if (normalizedSql.includes('from "items"')) {
      return [...this.items]
        .sort((first, second) => {
          const nameComparison = first.name.localeCompare(second.name)

          return nameComparison === 0 ? first.id - second.id : nameComparison
        }) as T[]
    }

    if (
      normalizedSql.includes('from "inventory_snapshots"') &&
      normalizedSql.includes('"latest_snapshot_ids"')
    ) {
      return this.latestSnapshotsForItemIds(
        params.filter((param): param is number => Number.isInteger(param)),
      ) as T[]
    }

    if (
      normalizedSql.includes('from "inventory_snapshots"') &&
      normalizedSql.includes('where "inventory_snapshots"."id" in')
    ) {
      return this.snapshots
        .filter((snapshot) => params.includes(snapshot.id))
        .sort((first, second) => first.id - second.id) as T[]
    }

    return []
  }

  raw<T extends unknown[]>(sql: string, params: unknown[]) {
    const columns = this.selectedColumns(sql)

    return this.all<Record<string, unknown>>(sql, params).map((row) =>
      columns.map((column) => row[column]),
    ) as T[]
  }

  first<T>(_sql: string, params: unknown[]) {
    const item = this.items.find((candidate) => candidate.id === params[0])

    return item ? (this.presentedItem(item) as T) : null
  }

  run(sql: string, params: unknown[]) {
    const normalizedSql = this.normalizeSql(sql)

    if (normalizedSql.includes('insert into "items"')) {
      const id = Math.max(...this.items.map((item) => item.id), 0) + 1
      this.items.push({
        id,
        name: params[0] as string,
        category: params[1] as string | null,
        unit: params[2] as string | null,
        preferred_source: params[3] as string | null,
        low: params[4] as number | null,
        high: params[5] as number | null,
        created_at: params[6] as string,
        updated_at: params[7] as string,
      })

      return { meta: { last_row_id: id } }
    }

    if (normalizedSql.includes('update "items"')) {
      const id = params[6] as number
      const item = this.items.find((candidate) => candidate.id === id)

      if (item) {
        item.category = params[0] as string | null
        item.unit = params[1] as string | null
        item.preferred_source = params[2] as string | null
        item.low = params[3] as number | null
        item.high = params[4] as number | null
        item.updated_at = params[5] as string
      }

      return { meta: {} }
    }

    if (normalizedSql.includes('insert into "inventory_snapshots"')) {
      const id = Math.max(...this.snapshots.map((snapshot) => snapshot.id), 0) + 1
      this.snapshots.push({
        id,
        item_id: params[0] as number,
        value: params[1] as number,
        note: params[2] as string | null,
        created_at: params[3] as string,
        updated_at: params[4] as string,
      })

      return { meta: { last_row_id: id } }
    }

    return { meta: {} }
  }

  private latestSnapshotsForItemIds(itemIds: number[]) {
    return itemIds
      .map((itemId) =>
        this.snapshots
          .filter((snapshot) => snapshot.item_id === itemId)
          .sort((first, second) => {
            const dateComparison = second.created_at.localeCompare(first.created_at)

            return dateComparison === 0 ? second.id - first.id : dateComparison
          })[0],
      )
      .filter((snapshot): snapshot is SnapshotRecord => snapshot !== undefined)
  }

  private normalizeSql(sql: string) {
    return sql.replace(/\s+/g, " ").trim().toLowerCase()
  }

  private selectedColumns(sql: string) {
    const normalizedSql = this.normalizeSql(sql)

    if (
      normalizedSql.includes('from "items"') &&
      normalizedSql.includes('select "id" from "items"')
    ) {
      return ["id"]
    }

    if (normalizedSql.includes('from "items"')) {
      return [
        "id",
        "name",
        "category",
        "unit",
        "preferred_source",
        "low",
        "high",
        "created_at",
        "updated_at",
      ]
    }

    if (normalizedSql.includes('from "inventory_snapshots"')) {
      return ["id", "item_id", "value", "note", "created_at", "updated_at"]
    }

    return []
  }

  private presentedItem(item: ItemRecord) {
    const latestSnapshot = this.latestSnapshotsForItemIds([item.id])[0]

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      preferred_source: item.preferred_source,
      low: item.low,
      high: item.high,
      value: latestSnapshot?.value ?? null,
      last_updated_at: latestSnapshot?.updated_at ?? null,
    }
  }
}

function env(db = new MockD1Database()) {
  return {
    ASSETS: { fetch: async () => new Response("asset") },
    AUTH_BYPASS_EMAIL: "owner@example.com",
    DB: db,
  } as unknown as Parameters<typeof worker.fetch>[1]
}

function assetEnv(assetResponse: Response) {
  return {
    ASSETS: { fetch: async () => assetResponse.clone() },
    AUTH_BYPASS_EMAIL: "owner@example.com",
    DB: new MockD1Database(),
  } as unknown as Parameters<typeof worker.fetch>[1]
}

function jsonRequest(path: string, body: unknown) {
  return new Request(`https://tally.example.com${path}`, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Origin: "https://tally.example.com",
      "X-Requested-With": "XMLHttpRequest",
    },
    method: "POST",
  })
}

describe("worker API", () => {
  it("serves HTML assets with no-store caching so clients pick up new bundles", async () => {
    const response = await worker.fetch(
      new Request("https://tally.example.com/"),
      assetEnv(
        new Response("<!doctype html>", {
          headers: {
            "Cache-Control": "public, max-age=31536000",
            "Content-Type": "text/html; charset=utf-8",
          },
        }),
      ),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(response.headers.get("Content-Type")).toBe("text/html; charset=utf-8")
    expect(await response.text()).toBe("<!doctype html>")
  })

  it("requires Cloudflare Access identity unless local auth bypass is configured", async () => {
    const response = await worker.fetch(
      new Request("https://tally.example.com/api/v1/items"),
      {
        ASSETS: { fetch: async () => new Response("asset") },
        CF_ACCESS_AUD: "test-aud",
        CF_ACCESS_TEAM_DOMAIN: "team.cloudflareaccess.com",
        DB: new MockD1Database(),
      } as unknown as Parameters<typeof worker.fetch>[1],
    )

    expect(response.status).toBe(401)
  })

  it("returns the authenticated account from the local auth bypass", async () => {
    const response = await worker.fetch(
      new Request("https://tally.example.com/api/v1/session"),
      env(),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      account: { email_address: "owner@example.com" },
    })
  })

  it("lists items with latest snapshot presentation", async () => {
    const response = await worker.fetch(
      new Request("https://tally.example.com/api/v1/items"),
      env(),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([
      expect.objectContaining({
        id: 42,
        last_updated_at: "2026-01-02T00:00:00.000Z",
        name: "Printer Paper",
        value: 20,
      }),
    ])
  })

  it("creates an item after validating same-origin JSON", async () => {
    const db = new MockD1Database()
    const response = await worker.fetch(
      jsonRequest("/api/v1/items", {
        item: {
          category: "Shipping",
          name: "Packing Tape",
          unit: "rolls",
        },
      }),
      env(db),
    )

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual(
      expect.objectContaining({
        category: "Shipping",
        name: "Packing Tape",
        unit: "rolls",
      }),
    )
  })

  it("rejects mutating requests without a same-origin Origin header", async () => {
    const response = await worker.fetch(
      new Request("https://tally.example.com/api/v1/items", {
        body: JSON.stringify({ item: { name: "Packing Tape" } }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
      env(),
    )

    expect(response.status).toBe(403)
  })

  it("rejects invalid bulk snapshots before inserting any rows", async () => {
    const db = new MockD1Database()
    const response = await worker.fetch(
      jsonRequest("/api/v1/inventory_snapshots/bulk", {
        inventory_snapshots: [
          { item_id: 42, value: 24 },
          { item_id: 999, value: -1 },
        ],
      }),
      env(db),
    )

    expect(response.status).toBe(422)
    expect(db.snapshots).toHaveLength(1)
  })
})
