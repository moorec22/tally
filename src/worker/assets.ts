import type { Env } from "./types"

export async function handleAssetRequest(request: Request, env: Env) {
  const assetResponse = await env.ASSETS.fetch(request)

  if (assetResponse.status !== 404 || request.method !== "GET") {
    return assetResponse
  }

  const url = new URL(request.url)
  const hasFileExtension = /\/[^/]+\.[^/]+$/.test(url.pathname)

  if (hasFileExtension) {
    return assetResponse
  }

  return env.ASSETS.fetch(new Request(new URL("/", url).toString(), request))
}
