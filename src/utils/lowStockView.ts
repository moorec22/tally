import type { InventoryItem } from "../types/inventory"

export type LowStockViewItem = {
  item: InventoryItem
  shortage: number
}

export type LowStockGroup = {
  category: string
  items: LowStockViewItem[]
}

const UNCATEGORIZED_LABEL = "Not set"

function normalizedCategory(item: InventoryItem) {
  return item.category?.trim() ?? ""
}

function normalizedName(item: InventoryItem) {
  return item.name?.trim() ?? ""
}

function compareNames(firstItem: InventoryItem, secondItem: InventoryItem) {
  const nameComparison = normalizedName(firstItem).localeCompare(
    normalizedName(secondItem),
  )

  if (nameComparison !== 0) {
    return nameComparison
  }

  return firstItem.id - secondItem.id
}

type CountedLowStockItem = InventoryItem & {
  low: number
  value: number
}

export function isLowStockItem(item: InventoryItem): item is CountedLowStockItem {
  return item.value !== null && item.low !== null && item.value < item.low
}

export function buildLowStockGroups(items: InventoryItem[]): LowStockGroup[] {
  const groupsByCategory = new Map<string, LowStockViewItem[]>()

  items.forEach((item) => {
    if (!isLowStockItem(item)) {
      return
    }

    const category = normalizedCategory(item) || UNCATEGORIZED_LABEL
    const lowStockItems = groupsByCategory.get(category) ?? []

    lowStockItems.push({
      item,
      shortage: item.low - item.value,
    })
    groupsByCategory.set(category, lowStockItems)
  })

  return Array.from(groupsByCategory.entries())
    .sort(([firstCategory], [secondCategory]) => {
      if (
        firstCategory === UNCATEGORIZED_LABEL &&
        secondCategory !== UNCATEGORIZED_LABEL
      ) {
        return 1
      }

      if (
        firstCategory !== UNCATEGORIZED_LABEL &&
        secondCategory === UNCATEGORIZED_LABEL
      ) {
        return -1
      }

      return firstCategory.localeCompare(secondCategory)
    })
    .map(([category, lowStockItems]) => ({
      category,
      items: lowStockItems.sort((firstItem, secondItem) =>
        compareNames(firstItem.item, secondItem.item),
      ),
    }))
}
