import { screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import InventoryHeader from "../../../../src/components/inventory/InventoryHeader"
import { renderWithTheme } from "../../support/renderWithTheme"

describe("InventoryHeader", () => {
  it("renders inventory filters separately from inventory actions", () => {
    renderWithTheme(
      <InventoryHeader
        categoryFilterOptions={[
          { label: "All categories", value: "__all_categories__" },
          { label: "Office", value: "Office" },
        ]}
        isInventoryActive={false}
        onAddItem={vi.fn()}
        onCancelInventory={vi.fn()}
        onCategoryChange={vi.fn()}
        onInventoryToggle={vi.fn()}
        onSearchChange={vi.fn()}
        searchQuery=""
        selectedCategory="__all_categories__"
      />,
    )

    const filters = screen.getByRole("search", {
      name: "Inventory filters",
    })
    const actions = screen.getByRole("group", {
      name: "Inventory actions",
    })

    expect(
      within(filters).getByLabelText("Search inventory"),
    ).toBeInTheDocument()
    expect(
      within(filters).getByRole("combobox", { name: "Category" }),
    ).toBeInTheDocument()
    expect(
      within(actions).getByRole("button", { name: "Start Inventory" }),
    ).toBeInTheDocument()
    expect(
      within(actions).getByRole("button", { name: "Add Item" }),
    ).toBeInTheDocument()
  })
})
