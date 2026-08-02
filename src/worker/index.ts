import { handleAssetRequest } from "./assets"
import { jsonResponse } from "./http"
import { handleApiRequest } from "./routes"
import type { Env } from "./types"

export default {
  async fetch(request: Request, env: Env) {
    try {
      if (new URL(request.url).pathname.startsWith("/api/")) {
        return await handleApiRequest(request, env)
      }

      return await handleAssetRequest(request, env)
    } catch (error) {
      if (error instanceof Response) {
        return error
      }

      return jsonResponse({ error: "Internal server error" }, { status: 500 })
    }
  },
}
