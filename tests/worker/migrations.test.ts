import { execFile } from "node:child_process"
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

function runSql(dbPath: string, sql: string) {
  return new Promise<void>((resolve, reject) => {
    execFile("sqlite3", [dbPath, sql], (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

async function migrationSql() {
  const migrationDir = join(process.cwd(), "migrations")
  const migrationFiles = (await readdir(migrationDir))
    .filter((file) => file.endsWith(".sql"))
    .sort()

  return (
    await Promise.all(
      migrationFiles.map((file) => readFile(join(migrationDir, file), "utf8")),
    )
  ).join("\n")
}

describe("D1 migrations", () => {
  it("rejects duplicate item names at the database layer", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "tally-migrations-"))
    const dbPath = join(tempDir, "test.sqlite")

    let duplicateInsertError: unknown

    try {
      await runSql(
        dbPath,
        `${await migrationSql()}

INSERT INTO items (name, created_at, updated_at)
VALUES ('Printer Paper', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO items (name, created_at, updated_at)
VALUES ('Printer Paper', '2026-01-02T00:00:00.000Z', '2026-01-02T00:00:00.000Z');
`,
      )
    } catch (error) {
      duplicateInsertError = error
    } finally {
      await rm(tempDir, { force: true, recursive: true })
    }

    expect(duplicateInsertError).toMatchObject({
      code: 19,
    })
  })
})
