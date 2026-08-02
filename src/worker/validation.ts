import { jsonResponse } from "./http"

export async function readJsonObject(request: Request) {
  try {
    const body = await request.json()

    if (typeof body === "object" && body !== null && !Array.isArray(body)) {
      return body as Record<string, unknown>
    }
  } catch {
    // Fall through to the validation error.
  }

  throw jsonResponse({ error: "Expected JSON request body" }, { status: 400 })
}

export function textOrNull(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmedValue = value.trim()

  return trimmedValue ? trimmedValue : null
}

export function requiredText(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmedValue = value.trim()

  return trimmedValue ? trimmedValue : null
}

export function integerOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  return Number.isInteger(value) ? value : null
}

export function nonNegativeInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null
}
