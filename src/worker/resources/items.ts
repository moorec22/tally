import { jsonResponse, notFound } from "../http"
import {
  integerOrNull,
  readJsonObject,
  requiredText,
  textOrNull,
} from "../validation"

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

type ItemInput = {
  category?: unknown
  high?: unknown
  low?: unknown
  name?: unknown
  preferred_source?: unknown
  unit?: unknown
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

export async function presentedItem(db: D1Database, id: number) {
  return db
    .prepare(`${itemQuery("WHERE i.id = ?")} LIMIT 1`)
    .bind(id)
    .first<ItemRow>()
}

export async function listItems(db: D1Database) {
  const result = await db
    .prepare(`${itemQuery()} ORDER BY i.name ASC, i.id ASC`)
    .all<ItemRow>()

  return result.results
}

export async function getItem(db: D1Database, id: number) {
  const item = await presentedItem(db, id)

  return item ? jsonResponse(item) : notFound()
}

export async function createItem(request: Request, db: D1Database) {
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

export async function updateItem(request: Request, db: D1Database, id: number) {
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
