import { fireEvent, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import ItemDetailPage from "../../../app/frontend/src/pages/ItemDetailPage"
import type { InventoryItem } from "../../../app/frontend/src/types/inventory"
import { renderWithTheme } from "../support/renderWithTheme"

const item: InventoryItem = {
  id: 42,
  name: "Printer Paper",
  category: "Office",
  unit: "reams",
  preferred_source: "Supply Closet",
  low: 5,
  high: 30,
  value: 20,
  last_updated_at: "2026-01-02T15:04:00.000Z",
}

describe("ItemDetailPage", () => {
  afterEach(() => {
    document
      .querySelector('meta[name="csrf-token"]')
      ?.remove()
    vi.unstubAllGlobals()
  })

  it("loads and renders item details from the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => item,
    })
    vi.stubGlobal("fetch", fetchMock)

    renderWithTheme(<ItemDetailPage itemId="42" />)

    expect(screen.getByText("Loading item...")).toBeInTheDocument()
    expect(
      await screen.findByRole("heading", { name: "Printer Paper" }),
    ).toBeInTheDocument()
    expect(screen.getByText("20 reams")).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/items/42",
      expect.objectContaining({
        headers: { Accept: "application/json" },
      }),
    )
  })

  it("patches item edits and refreshes the loaded item", async () => {
    const csrfMeta = document.createElement("meta")
    csrfMeta.setAttribute("name", "csrf-token")
    csrfMeta.setAttribute("content", "secure-token")
    document.head.appendChild(csrfMeta)
    const updatedItem: InventoryItem = {
      ...item,
      category: "Warehouse",
      unit: "boxes",
      preferred_source: "Aisle 4",
      low: 3,
      high: 25,
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => item,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updatedItem,
      })
    vi.stubGlobal("fetch", fetchMock)

    renderWithTheme(<ItemDetailPage itemId="42" />)

    await screen.findByRole("heading", { name: "Printer Paper" })
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
      expect(fetchMock).toHaveBeenLastCalledWith(
        "/api/v1/items/42",
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CSRF-Token": "secure-token",
          }),
          body: JSON.stringify({
            item: {
              category: "Warehouse",
              unit: "boxes",
              preferred_source: "Aisle 4",
              low: 3,
              high: 25,
            },
          }),
        }),
      )
    })
    expect(await screen.findByText("Warehouse")).toBeInTheDocument()
    expect(screen.getByText("Aisle 4")).toBeInTheDocument()
    expect(screen.getByText("20 boxes")).toBeInTheDocument()
  })

  it("shows a not found state when the API returns 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    )

    renderWithTheme(<ItemDetailPage itemId="missing" />)

    expect(
      await screen.findByRole("heading", { name: "Item not found" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("This inventory item could not be found."),
    ).toBeInTheDocument()
  })

  it("shows an error state when the API request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network down")))

    renderWithTheme(<ItemDetailPage itemId="42" />)

    expect(
      await screen.findByRole("heading", { name: "Unable to load item" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Refresh the page or try again in a moment."),
    ).toBeInTheDocument()
  })

  it("shows an error state when the API returns a non-404 error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    )

    renderWithTheme(<ItemDetailPage itemId="42" />)

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Unable to load item" }),
      ).toBeInTheDocument()
    })
  })
})
