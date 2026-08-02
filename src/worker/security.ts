import { jsonResponse } from "./http"

export function requireSameOriginMutation(request: Request) {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(request.method)) {
    return
  }

  const origin = request.headers.get("Origin")
  const expectedOrigin = new URL(request.url).origin

  if (origin !== expectedOrigin) {
    throw jsonResponse({ error: "Invalid request origin" }, { status: 403 })
  }

  if (!request.headers.get("Content-Type")?.includes("application/json")) {
    throw jsonResponse({ error: "Expected JSON request body" }, { status: 415 })
  }

  if (request.headers.get("X-Requested-With") !== "XMLHttpRequest") {
    throw jsonResponse({ error: "Invalid request headers" }, { status: 403 })
  }
}
