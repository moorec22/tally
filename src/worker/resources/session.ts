import { jsonResponse } from "../http"
import type { Account } from "../types"

export function getSession(account: Account) {
  return jsonResponse({ account })
}
