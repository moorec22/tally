export type InventoryItem = {
  id: number
  name: string | null
  category: string | null
  unit: string | null
  preferred_source: string | null
  low: number | null
  high: number | null
  value: number | null
  last_updated_at: string | null
}

export type InventoryItemUpdate = {
  category: string | null
  unit: string | null
  preferred_source: string | null
  low: number | null
  high: number | null
}

export type InventorySnapshot = {
  id: number
  item_id: number
  value: number
  note: string | null
  created_at: string
  updated_at: string
}
