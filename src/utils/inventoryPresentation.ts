export function presentText(value: string | null) {
  return value?.trim() ? value : "Not set"
}

export function presentNumber(value: number | null) {
  return value === null ? "Not set" : value.toString()
}

const INVARIANT_UNITS = new Set(["ea", "each"])

function pluralizeUnit(unit: string) {
  const lowerUnit = unit.toLowerCase()

  if (INVARIANT_UNITS.has(lowerUnit) || lowerUnit.endsWith("s")) {
    return unit
  }

  if (/[^aeiou]y$/i.test(unit)) {
    return `${unit.slice(0, -1)}ies`
  }

  if (/(s|x|z|ch|sh)$/i.test(unit)) {
    return `${unit}es`
  }

  return `${unit}s`
}

export function unitSuffix(unit: string | null, quantity?: number | null) {
  const trimmedUnit = unit?.trim()

  if (!trimmedUnit) {
    return ""
  }

  if (
    quantity === undefined ||
    quantity === null ||
    quantity === 1 ||
    quantity === -1
  ) {
    return ` ${trimmedUnit}`
  }

  return ` ${pluralizeUnit(trimmedUnit)}`
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

export function presentCompactDate(value: string | null) {
  if (!value) {
    return "Not counted"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Not set"
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}
