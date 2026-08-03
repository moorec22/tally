import type { Env } from "./types"

function preventHtmlCaching(response: Response) {
  const contentType = response.headers.get("Content-Type")

  if (!contentType?.toLowerCase().includes("text/html")) {
    return response
  }

  const headers = new Headers(response.headers)
  headers.set("Cache-Control", "no-store")

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}

export async function handleAssetRequest(request: Request, env: Env) {
  const assetResponse = await env.ASSETS.fetch(request)

  if (assetResponse.status !== 404 || request.method !== "GET") {
    return preventHtmlCaching(assetResponse)
  }

  const url = new URL(request.url)
  const hasFileExtension = /\/[^/]+\.[^/]+$/.test(url.pathname)

  if (hasFileExtension) {
    return assetResponse
  }

  return preventHtmlCaching(
    await env.ASSETS.fetch(new Request(new URL("/", url).toString(), request)),
  )
}
