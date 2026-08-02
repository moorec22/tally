import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import InventoryItemRow from "../../../../src/components/items/InventoryItemRow"
import type { InventoryItem } from "../../../../src/types/inventory"
import { renderWithTheme } from "../../support/renderWithTheme"

const itemWithLongQuantity: InventoryItem = {
  id: 42,
  name: "Printer Paper",
  category: "Office",
  unit: "ream",
  preferred_source: "Supply Closet",
  low: 5,
  high: 30,
  value: 123456789012345,
  last_updated_at: "2026-01-02T15:04:00.000Z",
}

describe("InventoryItemRow", () => {
  it("keeps long quantities within their table cell while preserving the full value", () => {
    renderWithTheme(<InventoryItemRow item={itemWithLongQuantity} />)

    const quantity = screen.getByText("123456789012345", { exact: false })

    expect(quantity).toHaveAttribute("title", "123456789012345 reams")
    expect(quantity).toHaveStyle({
      maxWidth: "100%",
      minWidth: "0",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    })
  })
})
