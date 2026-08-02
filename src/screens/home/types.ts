import type { InventoryDraftEntry } from "../../components/items/InventoryItemRow"
import type { InventoryItem } from "../../types/inventory"

export type ItemsLoadState =
  | { status: "loading" }
  | { status: "loaded"; items: InventoryItem[] }
  | { status: "error" }

export type CategoryFilterOption = {
  label: string
  value: string
}

export type InventorySortField = "category" | "last_counted"
export type SortDirection = "asc" | "desc"

export type InventorySort = {
  direction: SortDirection
  field: InventorySortField
}

export type InventoryDraft = Record<number, InventoryDraftEntry>

export type StoredInventoryDraft = {
  isActive: boolean
  entries: InventoryDraft
}

export type CountedInventoryItem = {
  item: InventoryItem
  note: string
  value: number
}
