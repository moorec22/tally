import { asc, inArray } from "drizzle-orm"
import type { BatchItem } from "drizzle-orm/batch"

import type { AppDatabase } from "../db/client"
import { inventorySnapshots, items } from "../db/schema"
import { jsonResponse } from "../http"
import { nonNegativeInteger, readJsonObject } from "../validation"

type SnapshotInput = {
  item_id?: unknown
  note?: unknown
  value?: unknown
}

export async function createBulkSnapshots(request: Request, db: AppDatabase) {
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
    const existingItems = await db
      .select({ id: items.id })
      .from(items)
      .where(inArray(items.id, itemIds))
      .all()
    const existingItemIds = new Set(existingItems.map((item) => item.id))
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
    db.insert(inventorySnapshots).values({
      itemId: snapshot.item_id as number,
      value: snapshot.value as number,
      note: typeof snapshot.note === "string" ? snapshot.note : null,
      createdAt: now,
      updatedAt: now,
    }),
  ) as unknown as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]
  const results = await db.batch(statements)
  const createdIds = results
    .map((result) => (result.meta as { last_row_id?: number }).last_row_id)
    .filter((id): id is number => typeof id === "number")

  if (createdIds.length !== snapshotInputs.length) {
    return jsonResponse({ error: "Unable to create snapshots" }, { status: 500 })
  }

  const createdSnapshots = await db
    .select({
      id: inventorySnapshots.id,
      item_id: inventorySnapshots.itemId,
      value: inventorySnapshots.value,
      note: inventorySnapshots.note,
      created_at: inventorySnapshots.createdAt,
      updated_at: inventorySnapshots.updatedAt,
    })
    .from(inventorySnapshots)
    .where(inArray(inventorySnapshots.id, createdIds))
    .orderBy(asc(inventorySnapshots.id))
    .all()

  return jsonResponse(createdSnapshots, { status: 201 })
}
