import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category"),
  unit: text("unit"),
  preferredSource: text("preferred_source"),
  low: integer("low"),
  high: integer("high"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

export const inventorySnapshots = sqliteTable("inventory_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id),
  value: integer("value").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
})

export type ItemRecord = typeof items.$inferSelect
export type SnapshotRecord = typeof inventorySnapshots.$inferSelect
