import { describe, expect, it } from "vitest"

import {
  buildLowStockGroups,
  isLowStockItem,
} from "../../../src/utils/lowStockView"
import type { InventoryItem } from "../../../src/types/inventory"

function item(overrides: Partial<InventoryItem>): InventoryItem {
  return {
    id: 1,
    name: "Printer Paper",
    category: "Office",
    unit: "reams",
    preferred_source: null,
    low: 5,
    high: 30,
    value: 2,
    last_updated_at: null,
    ...overrides,
  }
}

describe("low stock view utilities", () => {
  it("marks an item low stock only when a counted value is below its minimum", () => {
    expect(isLowStockItem(item({ value: 4, low: 5 }))).toBe(true)
    expect(isLowStockItem(item({ value: 5, low: 5 }))).toBe(false)
    expect(isLowStockItem(item({ value: null, low: 5 }))).toBe(false)
    expect(isLowStockItem(item({ value: 4, low: null }))).toBe(false)
  })

  it("groups low-stock items by category with uncategorized items last", () => {
    const groups = buildLowStockGroups([
      item({ id: 1, name: "Tape", category: "Shipping", value: 1, low: 3 }),
      item({ id: 2, name: "Markers", category: "Office", value: 2, low: 4 }),
      item({ id: 3, name: "Cable Ties", category: null, value: 0, low: 6 }),
      item({ id: 4, name: "Boxes", category: "Shipping", value: 12, low: 3 }),
      item({ id: 5, name: "Labels", category: "Shipping", value: null, low: 3 }),
      item({ id: 6, name: "Clips", category: "Office", value: 2, low: null }),
    ])

    expect(groups).toEqual([
      {
        category: "Office",
        items: [
          {
            item: item({
              id: 2,
              name: "Markers",
              category: "Office",
              value: 2,
              low: 4,
            }),
            shortage: 2,
          },
        ],
      },
      {
        category: "Shipping",
        items: [
          {
            item: item({
              id: 1,
              name: "Tape",
              category: "Shipping",
              value: 1,
              low: 3,
            }),
            shortage: 2,
          },
        ],
      },
      {
        category: "Not set",
        items: [
          {
            item: item({
              id: 3,
              name: "Cable Ties",
              category: null,
              value: 0,
              low: 6,
            }),
            shortage: 6,
          },
        ],
      },
    ])
  })

  it("sorts items alphabetically within a category and handles unset maximums", () => {
    const groups = buildLowStockGroups([
      item({
        id: 2,
        name: "Tape",
        category: "Shipping",
        value: 1,
        low: 4,
        high: null,
      }),
      item({
        id: 1,
        name: "Boxes",
        category: "Shipping",
        value: 3,
        low: 4,
        high: null,
      }),
    ])

    expect(
      groups[0]?.items.map(({ item: lowStockItem }) => lowStockItem.name),
    ).toEqual(["Boxes", "Tape"])
    expect(groups[0]?.items.map(({ shortage }) => shortage)).toEqual([1, 3])
    expect(groups[0]?.items[0]?.item.high).toBeNull()
  })
})
