export type InventoryItem = {
  id: number
  name: string | null
  category: string | null
  unit: string | null
  source: string | null
  low: number | null
  high: number | null
  value: number | null
  last_updated_at: string | null
}

export type InventoryItemUpdate = {
  category: string | null
  unit: string | null
  source: string | null
  low: number | null
  high: number | null
}
