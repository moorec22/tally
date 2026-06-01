import { fireEvent, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import HomePage from "../../../app/frontend/src/pages/HomePage"
import type { InventoryItem } from "../../../app/frontend/src/types/inventory"
import { renderWithTheme } from "../support/renderWithTheme"

const items: InventoryItem[] = [
  {
    id: 42,
    name: "Printer Paper",
    category: "Office",
    unit: "reams",
    preferred_source: "Supply Closet",
    low: 5,
    high: 30,
    value: 20,
    last_updated_at: "2026-01-02T15:04:00.000Z",
  },
  {
    id: 43,
    name: "Packing Tape",
    category: "Shipping",
    unit: "rolls",
    preferred_source: null,
    low: null,
    high: null,
    value: 8,
    last_updated_at: null,
  },
  {
    id: 44,
    name: "Mystery Bin",
    category: null,
    unit: null,
    preferred_source: null,
    low: null,
    high: null,
    value: null,
    last_updated_at: null,
  },
]

describe("HomePage", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("loads and renders inventory items from the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => items,
    })
    vi.stubGlobal("fetch", fetchMock)

    renderWithTheme(<HomePage />)

    expect(screen.getByText("Loading inventory...")).toBeInTheDocument()
    expect(await screen.findByText("Inventory")).toBeInTheDocument()
    expect(
      await screen.findByRole("link", { name: /Printer Paper/i }),
    ).toHaveAttribute("href", "/items/42")
    expect(screen.getByText("Last counted")).toBeInTheDocument()
    expect(screen.getByText("20 reams")).toBeInTheDocument()
    expect(screen.getByText("01/02/2026")).toBeInTheDocument()
    expect(screen.getAllByText("Not counted")).toHaveLength(2)
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/items",
      expect.objectContaining({
        headers: { Accept: "application/json" },
      }),
    )
  })

  it("filters items by name and category", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => items,
      }),
    )

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")

    fireEvent.change(screen.getByLabelText("Search inventory"), {
      target: { value: "shipping" },
    })

    expect(screen.queryByText("Printer Paper")).not.toBeInTheDocument()
    expect(screen.getByText("Packing Tape")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Search inventory"), {
      target: { value: "printer" },
    })

    expect(screen.getByText("Printer Paper")).toBeInTheDocument()
    expect(screen.queryByText("Packing Tape")).not.toBeInTheDocument()
  })

  it("filters items by selected category", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => items,
      }),
    )

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Category" }))

    expect(screen.getByRole("option", { name: "All categories" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Office" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Shipping" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Not set" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("option", { name: "Shipping" }))

    expect(screen.queryByText("Printer Paper")).not.toBeInTheDocument()
    expect(screen.getByText("Packing Tape")).toBeInTheDocument()
    expect(screen.queryByText("Mystery Bin")).not.toBeInTheDocument()
  })

  it("combines search and category filters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => items,
      }),
    )

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Category" }))
    fireEvent.click(screen.getByRole("option", { name: "Shipping" }))
    fireEvent.change(screen.getByLabelText("Search inventory"), {
      target: { value: "printer" },
    })

    expect(
      screen.getByRole("heading", { name: "No matching items" }),
    ).toBeInTheDocument()
    expect(screen.queryByText("Printer Paper")).not.toBeInTheDocument()
    expect(screen.queryByText("Packing Tape")).not.toBeInTheDocument()
  })

  it("filters items with no category", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => items,
      }),
    )

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Category" }))
    fireEvent.click(screen.getByRole("option", { name: "Not set" }))

    expect(screen.queryByText("Printer Paper")).not.toBeInTheDocument()
    expect(screen.queryByText("Packing Tape")).not.toBeInTheDocument()
    expect(screen.getByText("Mystery Bin")).toBeInTheDocument()
  })

  it("shows a no-results state when search has no matches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => items,
      }),
    )

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")
    fireEvent.change(screen.getByLabelText("Search inventory"), {
      target: { value: "warehouse" },
    })

    expect(
      screen.getByRole("heading", { name: "No matching items" }),
    ).toBeInTheDocument()
    expect(screen.queryByText("Printer Paper")).not.toBeInTheDocument()
  })

  it("shows an empty state when there are no items", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      }),
    )

    renderWithTheme(<HomePage />)

    expect(
      await screen.findByRole("heading", { name: "No items yet" }),
    ).toBeInTheDocument()
  })

  it("shows an error state when the API request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network down")))

    renderWithTheme(<HomePage />)

    expect(
      await screen.findByRole("heading", { name: "Unable to load inventory" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Refresh the page or try again in a moment."),
    ).toBeInTheDocument()
  })

  it("shows an error state when the API returns a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    )

    renderWithTheme(<HomePage />)

    expect(
      await screen.findByRole("heading", { name: "Unable to load inventory" }),
    ).toBeInTheDocument()
  })
})
