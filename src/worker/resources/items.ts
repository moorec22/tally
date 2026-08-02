import { and, asc, eq, inArray, max } from "drizzle-orm"

import type { AppDatabase } from "../db/client"
import {
  inventorySnapshots,
  items,
  type ItemRecord,
  type SnapshotRecord,
} from "../db/schema"
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

function presentItem(item: ItemRecord, snapshot?: SnapshotRecord): ItemRow {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    unit: item.unit,
    preferred_source: item.preferredSource,
    low: item.low,
    high: item.high,
    value: snapshot?.value ?? null,
    last_updated_at: snapshot?.updatedAt ?? null,
  }
}

async function latestSnapshotsByItemId(db: AppDatabase, itemIds: number[]) {
  if (itemIds.length === 0) {
    return new Map<number, SnapshotRecord>()
  }

  const latestCreatedAt = db
    .select({
      itemId: inventorySnapshots.itemId,
      createdAt: max(inventorySnapshots.createdAt).as("created_at"),
    })
    .from(inventorySnapshots)
    .where(inArray(inventorySnapshots.itemId, itemIds))
    .groupBy(inventorySnapshots.itemId)
    .as("latest_created_at")
  const latestSnapshotIds = db
    .select({
      itemId: inventorySnapshots.itemId,
      id: max(inventorySnapshots.id).as("id"),
    })
    .from(inventorySnapshots)
    .innerJoin(
      latestCreatedAt,
      and(
        eq(inventorySnapshots.itemId, latestCreatedAt.itemId),
        eq(inventorySnapshots.createdAt, latestCreatedAt.createdAt),
      ),
    )
    .groupBy(inventorySnapshots.itemId)
    .as("latest_snapshot_ids")
  const rows = await db
    .select({
      id: inventorySnapshots.id,
      itemId: inventorySnapshots.itemId,
      value: inventorySnapshots.value,
      note: inventorySnapshots.note,
      createdAt: inventorySnapshots.createdAt,
      updatedAt: inventorySnapshots.updatedAt,
    })
    .from(inventorySnapshots)
    .innerJoin(latestSnapshotIds, eq(inventorySnapshots.id, latestSnapshotIds.id))
    .orderBy(asc(inventorySnapshots.itemId))
    .all()

  return new Map(rows.map((row) => [row.itemId, row]))
}

export async function presentedItem(db: AppDatabase, id: number) {
  const item = await db.select().from(items).where(eq(items.id, id)).limit(1).get()

  if (!item) {
    return null
  }

  const snapshotsByItemId = await latestSnapshotsByItemId(db, [id])

  return presentItem(item, snapshotsByItemId.get(id))
}

export async function listItems(db: AppDatabase) {
  const rows = await db
    .select()
    .from(items)
    .orderBy(asc(items.name), asc(items.id))
    .all()
  const snapshotsByItemId = await latestSnapshotsByItemId(
    db,
    rows.map((item) => item.id),
  )

  return rows.map((item) => presentItem(item, snapshotsByItemId.get(item.id)))
}

export async function getItem(db: AppDatabase, id: number) {
  const item = await presentedItem(db, id)

  return item ? jsonResponse(item) : notFound()
}

export async function createItem(request: Request, db: AppDatabase) {
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

  if (Object.keys(errors).length > 0 || name === null) {
    return jsonResponse({ errors }, { status: 422 })
  }

  const now = new Date().toISOString()
  const result = await db
    .insert(items)
    .values({
      name,
      category: textOrNull(item?.category),
      unit: textOrNull(item?.unit),
      preferredSource: textOrNull(item?.preferred_source),
      low,
      high,
      createdAt: now,
      updatedAt: now,
    })
    .run()
  const createdId = (result.meta as { last_row_id?: number }).last_row_id

  if (!createdId) {
    return jsonResponse({ error: "Unable to create item" }, { status: 500 })
  }

  return jsonResponse(await presentedItem(db, createdId), { status: 201 })
}

export async function updateItem(request: Request, db: AppDatabase, id: number) {
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
    .update(items)
    .set({
      category: textOrNull(item?.category),
      unit: textOrNull(item?.unit),
      preferredSource: textOrNull(item?.preferred_source),
      low,
      high,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(items.id, id))
    .run()

  return jsonResponse(await presentedItem(db, id))
}
