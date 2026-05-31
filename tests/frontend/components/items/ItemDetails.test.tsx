import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import ItemDetails from "../../../../app/frontend/src/components/items/ItemDetails"
import type { InventoryItem } from "../../../../app/frontend/src/types/inventory"
import { renderWithTheme } from "../../support/renderWithTheme"

const countedItem: InventoryItem = {
  id: 1,
  name: "Printer Paper",
  category: "Office",
  unit: "reams",
  source: "Supply Closet",
  low: 5,
  high: 30,
  value: 20,
  last_updated_at: "2026-01-02T15:04:00.000Z",
}

describe("ItemDetails", () => {
  it("renders the item identity, quantity, thresholds, and last update time", () => {
    renderWithTheme(<ItemDetails item={countedItem} />)

    expect(
      screen.getByRole("heading", { name: "Printer Paper" }),
    ).toBeInTheDocument()
    expect(screen.getByText("20 reams")).toBeInTheDocument()
    expect(screen.getByText("Office")).toBeInTheDocument()
    expect(screen.getByText("Supply Closet")).toBeInTheDocument()
    expect(screen.getByText("Low")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("High")).toBeInTheDocument()
    expect(screen.getByText("30")).toBeInTheDocument()
    expect(screen.getByText("Last updated")).toBeInTheDocument()
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it("renders readable fallbacks for missing item values", () => {
    renderWithTheme(
      <ItemDetails
        item={{
          ...countedItem,
          name: null,
          category: null,
          unit: null,
          source: null,
          low: null,
          high: null,
          value: null,
          last_updated_at: null,
        }}
      />,
    )

    expect(
      screen.getByRole("heading", { level: 1, name: "Not set" }),
    ).toBeInTheDocument()
    expect(screen.getByText("--")).toBeInTheDocument()
    expect(screen.getAllByText("Not set")).toHaveLength(6)
    expect(screen.getByText("Not counted")).toBeInTheDocument()
  })
})
