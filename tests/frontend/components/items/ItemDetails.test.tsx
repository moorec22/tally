import { fireEvent, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import ItemDetails from "../../../../app/frontend/src/components/items/ItemDetails"
import type { InventoryItem } from "../../../../app/frontend/src/types/inventory"
import { renderWithTheme } from "../../support/renderWithTheme"

const countedItem: InventoryItem = {
  id: 1,
  name: "Printer Paper",
  category: "Office",
  unit: "reams",
  preferred_source: "Supply Closet",
  low: 5,
  high: 30,
  value: 20,
  last_updated_at: "2026-01-02T15:04:00.000Z",
}

describe("ItemDetails", () => {
  it("renders the item identity, quantity, thresholds, and last update time", () => {
    renderWithTheme(<ItemDetails item={countedItem} onSave={vi.fn()} />)

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
          preferred_source: null,
          low: null,
          high: null,
          value: null,
          last_updated_at: null,
        }}
        onSave={vi.fn()}
      />,
    )

    expect(
      screen.getByRole("heading", { level: 1, name: "Not set" }),
    ).toBeInTheDocument()
    expect(screen.getByText("--")).toBeInTheDocument()
    expect(screen.getAllByText("Not set")).toHaveLength(6)
    expect(screen.getByText("Not counted")).toBeInTheDocument()
  })

  it("saves edited fields from the inline form", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    renderWithTheme(<ItemDetails item={countedItem} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    fireEvent.change(screen.getByLabelText("Unit"), {
      target: { value: "boxes" },
    })
    fireEvent.change(screen.getByLabelText("Low"), {
      target: { value: "3" },
    })
    fireEvent.change(screen.getByLabelText("High"), {
      target: { value: "25" },
    })
    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "Warehouse" },
    })
    fireEvent.change(screen.getByLabelText("Preferred source"), {
      target: { value: "Aisle 4" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        category: "Warehouse",
        unit: "boxes",
        preferred_source: "Aisle 4",
        low: 3,
        high: 25,
      })
    })
  })

  it("does not save when entering edit mode", () => {
    const onSave = vi.fn()
    renderWithTheme(<ItemDetails item={countedItem} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  it("cancels inline edits without saving", () => {
    const onSave = vi.fn()
    renderWithTheme(<ItemDetails item={countedItem} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    fireEvent.change(screen.getByLabelText("Unit"), {
      target: { value: "boxes" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText("reams")).toBeInTheDocument()
    expect(screen.queryByLabelText("Unit")).not.toBeInTheDocument()
  })

  it("validates low and high as integers before saving", async () => {
    const onSave = vi.fn()
    renderWithTheme(<ItemDetails item={countedItem} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    fireEvent.change(screen.getByLabelText("Low"), {
      target: { value: "3.5" },
    })
    fireEvent.change(screen.getByLabelText("High"), {
      target: { value: "many" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    expect(
      await screen.findByText("Low and high must be whole numbers."),
    ).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it("shows a save error when the update fails", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Nope"))
    renderWithTheme(<ItemDetails item={countedItem} onSave={onSave} />)

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    expect(
      await screen.findByText("Unable to save item. Try again."),
    ).toBeInTheDocument()
  })
})
