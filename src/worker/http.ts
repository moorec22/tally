export function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  })
}

export function notFound() {
  return jsonResponse({ error: "Not found" }, { status: 404 })
}
