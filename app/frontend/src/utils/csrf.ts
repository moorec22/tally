export function csrfToken() {
  return document
    .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
    ?.getAttribute("content")
}

export function jsonHeadersWithCsrf() {
  const token = csrfToken()
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  }

  if (token) {
    headers["X-CSRF-Token"] = token
  }

  return headers
}
