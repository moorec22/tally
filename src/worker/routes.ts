import { authenticateRequest } from "./auth"
import { createDatabase } from "./db/client"
import { jsonResponse, notFound } from "./http"
import { createBulkSnapshots } from "./resources/inventorySnapshots"
import { createItem, getItem, listItems, updateItem } from "./resources/items"
import { getSession } from "./resources/session"
import { requireSameOriginMutation } from "./security"
import type { Env } from "./types"

export async function handleApiRequest(request: Request, env: Env) {
  const account = await authenticateRequest(request, env)
  requireSameOriginMutation(request)
  const db = createDatabase(env.DB)

  const url = new URL(request.url)
  const pathname = url.pathname
  const itemMatch = pathname.match(/^\/api\/v1\/items\/(\d+)$/)

  if (request.method === "GET" && pathname === "/api/v1/session") {
    return getSession(account)
  }

  if (request.method === "GET" && pathname === "/api/v1/items") {
    return jsonResponse(await listItems(db))
  }

  if (request.method === "POST" && pathname === "/api/v1/items") {
    return createItem(request, db)
  }

  if (itemMatch && request.method === "GET") {
    return getItem(db, Number(itemMatch[1]))
  }

  if (itemMatch && request.method === "PATCH") {
    return updateItem(request, db, Number(itemMatch[1]))
  }

  if (request.method === "POST" && pathname === "/api/v1/inventory_snapshots/bulk") {
    return createBulkSnapshots(request, db)
  }

  return notFound()
}
