import { drizzle } from "drizzle-orm/d1"

export function createDatabase(db: D1Database) {
  return drizzle(db)
}

export type AppDatabase = ReturnType<typeof createDatabase>
