export function presentText(value: string | null) {
  return value?.trim() ? value : "Not set"
}

export function presentNumber(value: number | null) {
  return value === null ? "Not set" : value.toString()
}

export function unitSuffix(unit: string | null) {
  return unit?.trim() ? ` ${unit}` : ""
}

export function presentTimestamp(value: string | null) {
  if (!value) {
    return "Not counted"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Not set"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}
