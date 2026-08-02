import { jsonResponse } from "../http"
import { nonNegativeInteger, readJsonObject } from "../validation"

type SnapshotRow = {
  id: number
  item_id: number
  value: number
  note: string | null
  created_at: string
  updated_at: string
}

type SnapshotInput = {
  item_id?: unknown
  note?: unknown
  value?: unknown
}

export async function createBulkSnapshots(request: Request, db: D1Database) {
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
