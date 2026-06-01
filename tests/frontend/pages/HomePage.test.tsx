import { fireEvent, screen, waitFor, within } from "@testing-library/react"
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

const sortableItems: InventoryItem[] = [
  {
    id: 52,
    name: "Cable Ties",
    category: "Shipping",
    unit: "packs",
    preferred_source: null,
    low: null,
    high: null,
    value: 14,
    last_updated_at: "2026-01-04T15:04:00.000Z",
  },
  {
    id: 51,
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
    id: 54,
    name: "Mystery Bin",
    category: null,
    unit: null,
    preferred_source: null,
    low: null,
    high: null,
    value: null,
    last_updated_at: null,
  },
  {
    id: 53,
    name: "Clipboards",
    category: "Office",
    unit: "each",
    preferred_source: null,
    low: null,
    high: null,
    value: 6,
    last_updated_at: "2026-01-03T15:04:00.000Z",
  },
]

function rowNamesInOrder(expectedNames: string[]) {
  return screen
    .getAllByRole("link")
    .map((link) => expectedNames.find((name) => link.textContent?.includes(name)))
    .filter((name): name is string => Boolean(name))
}

describe("HomePage", () => {
  afterEach(() => {
    document
      .querySelector('meta[name="csrf-token"]')
      ?.remove()
    window.localStorage.clear()
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

  it("sorts by category ascending by default with uncategorized items last", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => sortableItems,
      }),
    )

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")

    expect(
      rowNamesInOrder(["Clipboards", "Printer Paper", "Cable Ties", "Mystery Bin"]),
    ).toEqual(["Clipboards", "Printer Paper", "Cable Ties", "Mystery Bin"])
  })

  it("toggles category sorting from descending back to ascending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => sortableItems,
      }),
    )

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")

    fireEvent.click(screen.getByRole("button", { name: /Category/i }))

    expect(
      rowNamesInOrder(["Cable Ties", "Clipboards", "Printer Paper", "Mystery Bin"]),
    ).toEqual(["Cable Ties", "Clipboards", "Printer Paper", "Mystery Bin"])

    fireEvent.click(screen.getByRole("button", { name: /Category/i }))

    expect(
      rowNamesInOrder(["Clipboards", "Printer Paper", "Cable Ties", "Mystery Bin"]),
    ).toEqual(["Clipboards", "Printer Paper", "Cable Ties", "Mystery Bin"])
  })

  it("sorts last counted newest first and toggles to oldest first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => sortableItems,
      }),
    )

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")

    fireEvent.click(screen.getByRole("button", { name: /Last counted/i }))

    expect(
      rowNamesInOrder(["Cable Ties", "Clipboards", "Printer Paper", "Mystery Bin"]),
    ).toEqual(["Cable Ties", "Clipboards", "Printer Paper", "Mystery Bin"])

    fireEvent.click(screen.getByRole("button", { name: /Last counted/i }))

    expect(
      rowNamesInOrder(["Mystery Bin", "Printer Paper", "Clipboards", "Cable Ties"]),
    ).toEqual(["Mystery Bin", "Printer Paper", "Clipboards", "Cable Ties"])
  })

  it("sorts after applying search and category filters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => sortableItems,
      }),
    )

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Category" }))
    fireEvent.click(screen.getByRole("option", { name: "Office" }))
    fireEvent.click(screen.getByRole("button", { name: /Last counted/i }))

    expect(rowNamesInOrder(["Clipboards", "Printer Paper"])).toEqual([
      "Clipboards",
      "Printer Paper",
    ])

    fireEvent.change(screen.getByLabelText("Search inventory"), {
      target: { value: "paper" },
    })

    expect(rowNamesInOrder(["Printer Paper"])).toEqual(["Printer Paper"])
    expect(screen.queryByText("Clipboards")).not.toBeInTheDocument()
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

  it("opens an add item modal from the inventory page", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }))

    const dialog = await screen.findByRole("dialog", { name: "Add Item" })
    expect(within(dialog).getByLabelText(/Name/)).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Category/)).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Unit/)).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Preferred source")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Low")).toBeInTheDocument()
    expect(within(dialog).getByLabelText("High")).toBeInTheDocument()
  })

  it("requires core item fields before creating an item", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => items,
    })
    vi.stubGlobal("fetch", fetchMock)

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }))

    const dialog = await screen.findByRole("dialog", { name: "Add Item" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }))

    expect(
      await within(dialog).findByText("Name, category, and unit are required."),
    ).toBeInTheDocument()
    expect(within(dialog).getAllByText("Required.")).toHaveLength(3)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("rejects invalid item thresholds before creating an item", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => items,
    })
    vi.stubGlobal("fetch", fetchMock)

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }))

    const dialog = await screen.findByRole("dialog", { name: "Add Item" })
    fireEvent.change(within(dialog).getByLabelText(/Name/), {
      target: { value: "Label Sheets" },
    })
    fireEvent.change(within(dialog).getByLabelText(/Category/), {
      target: { value: "Office" },
    })
    fireEvent.change(within(dialog).getByLabelText(/Unit/), {
      target: { value: "packs" },
    })
    fireEvent.change(within(dialog).getByLabelText("Low"), {
      target: { value: "low" },
    })
    fireEvent.change(within(dialog).getByLabelText("High"), {
      target: { value: "12.5" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }))

    expect(
      await within(dialog).findByText("Low and high must be whole numbers."),
    ).toBeInTheDocument()
    expect(within(dialog).getAllByText("Enter a whole number.")).toHaveLength(2)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("creates an item and renders it in the inventory list", async () => {
    const csrfMeta = document.createElement("meta")
    csrfMeta.setAttribute("name", "csrf-token")
    csrfMeta.setAttribute("content", "secure-token")
    document.head.appendChild(csrfMeta)
    const createdItem: InventoryItem = {
      id: 45,
      name: "Label Sheets",
      category: "Office",
      unit: "packs",
      preferred_source: null,
      low: 2,
      high: 12,
      value: null,
      last_updated_at: null,
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => items,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => createdItem,
      })
    vi.stubGlobal("fetch", fetchMock)

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }))

    const dialog = await screen.findByRole("dialog", { name: "Add Item" })
    fireEvent.change(within(dialog).getByLabelText(/Name/), {
      target: { value: "Label Sheets" },
    })
    fireEvent.change(within(dialog).getByLabelText(/Category/), {
      target: { value: "Office" },
    })
    fireEvent.change(within(dialog).getByLabelText(/Unit/), {
      target: { value: "packs" },
    })
    fireEvent.change(within(dialog).getByLabelText("Low"), {
      target: { value: "2" },
    })
    fireEvent.change(within(dialog).getByLabelText("High"), {
      target: { value: "12" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/items",
        expect.objectContaining({
          body: JSON.stringify({
            item: {
              name: "Label Sheets",
              category: "Office",
              unit: "packs",
              preferred_source: null,
              low: 2,
              high: 12,
            },
          }),
          headers: expect.objectContaining({
            "X-CSRF-Token": "secure-token",
          }),
          method: "POST",
        }),
      ),
    )
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Add Item" }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByRole("link", { name: /Label Sheets/i })).toHaveAttribute(
      "href",
      "/items/45",
    )
    expect(screen.getAllByText("Not counted")).toHaveLength(3)
  })

  it("keeps the add item modal open when creation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => items,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => ({ errors: { name: ["can't be blank"] } }),
        }),
    )

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }))

    const dialog = await screen.findByRole("dialog", { name: "Add Item" })
    fireEvent.change(within(dialog).getByLabelText(/Name/), {
      target: { value: "Label Sheets" },
    })
    fireEvent.change(within(dialog).getByLabelText(/Category/), {
      target: { value: "Office" },
    })
    fireEvent.change(within(dialog).getByLabelText(/Unit/), {
      target: { value: "packs" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }))

    expect(
      await within(dialog).findByText("Unable to create item. Try again."),
    ).toBeInTheDocument()
    expect(screen.getByRole("dialog", { name: "Add Item" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /Label Sheets/i })).not.toBeInTheDocument()
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

  it("starts inventory mode with draft inputs and disables row links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => items,
      }),
    )

    renderWithTheme(<HomePage />)

    await screen.findByRole("link", { name: /Printer Paper/i })
    fireEvent.click(screen.getByRole("button", { name: "Start Inventory" }))

    expect(screen.queryByRole("link", { name: /Printer Paper/i })).not.toBeInTheDocument()
    expect(
      screen.getByLabelText("Counted quantity for Printer Paper"),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Inventory note for Printer Paper")).toBeInTheDocument()
    expect(screen.getByText("Inventory in progress")).toBeInTheDocument()
    expect(screen.getByText("Counted")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Finish Inventory" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel Inventory" })).toBeInTheDocument()
  })

  it("confirms before cancelling an active inventory session and clearing the local draft", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Start Inventory" }))
    fireEvent.change(screen.getByLabelText("Counted quantity for Printer Paper"), {
      target: { value: "24" },
    })
    fireEvent.change(screen.getByLabelText("Inventory note for Printer Paper"), {
      target: { value: "Front shelf" },
    })

    expect(window.localStorage.getItem("tally.inventoryTakingDraft.v1")).toContain(
      "Front shelf",
    )

    fireEvent.click(screen.getByRole("button", { name: "Cancel Inventory" }))

    const cancelDialog = await screen.findByRole("dialog", { name: "Cancel Inventory?" })
    expect(
      within(cancelDialog).getByText(
        "This will discard the counts and notes entered for this inventory session.",
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Counted quantity for Printer Paper")).toHaveValue(24)
    expect(window.localStorage.getItem("tally.inventoryTakingDraft.v1")).toContain(
      "Front shelf",
    )

    fireEvent.click(within(cancelDialog).getByRole("button", { name: "Keep Inventory" }))

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Cancel Inventory?" }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByRole("button", { name: "Finish Inventory" })).toBeInTheDocument()
    expect(screen.getByLabelText("Counted quantity for Printer Paper")).toHaveValue(24)

    fireEvent.click(screen.getByRole("button", { name: "Cancel Inventory" }))
    const reopenedCancelDialog = await screen.findByRole("dialog", {
      name: "Cancel Inventory?",
    })
    fireEvent.click(
      within(reopenedCancelDialog).getByRole("button", { name: "Cancel Inventory" }),
    )

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Start Inventory" })).toBeInTheDocument(),
    )
    expect(screen.queryByLabelText("Counted quantity for Printer Paper")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Printer Paper/i })).toHaveAttribute(
      "href",
      "/items/42",
    )
    expect(window.localStorage.getItem("tally.inventoryTakingDraft.v1")).toBeNull()
  })

  it("persists inventory draft values through reload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => items,
    })
    vi.stubGlobal("fetch", fetchMock)

    const { unmount } = renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")
    fireEvent.click(screen.getByRole("button", { name: "Start Inventory" }))
    fireEvent.change(screen.getByLabelText("Counted quantity for Printer Paper"), {
      target: { value: "24" },
    })
    fireEvent.change(screen.getByLabelText("Inventory note for Printer Paper"), {
      target: { value: "Front shelf" },
    })

    unmount()
    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")
    expect(screen.getByRole("button", { name: "Finish Inventory" })).toBeInTheDocument()
    expect(screen.getByLabelText("Counted quantity for Printer Paper")).toHaveValue(24)
    expect(screen.getByLabelText("Inventory note for Printer Paper")).toHaveValue(
      "Front shelf",
    )
  })

  it("reviews only rows with counted quantities and returns to active inventory on cancel", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Start Inventory" }))
    fireEvent.change(screen.getByLabelText("Counted quantity for Printer Paper"), {
      target: { value: "24" },
    })
    fireEvent.change(screen.getByLabelText("Inventory note for Printer Paper"), {
      target: { value: "Front shelf" },
    })
    fireEvent.change(screen.getByLabelText("Inventory note for Packing Tape"), {
      target: { value: "Note only" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Finish Inventory" }))

    const dialog = await screen.findByRole("dialog", { name: "Finish Inventory" })
    expect(within(dialog).getByText("Counted: 24 reams")).toBeInTheDocument()
    expect(within(dialog).queryByText(/Current:/)).not.toBeInTheDocument()
    expect(within(dialog).getByText("Note: Front shelf")).toBeInTheDocument()
    expect(within(dialog).queryByText("Packing Tape")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Finish Inventory" }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByRole("button", { name: "Finish Inventory" })).toBeInTheDocument()
    expect(screen.getByLabelText("Counted quantity for Printer Paper")).toHaveValue(24)
  })

  it("confirms inventory by posting a batch payload and updating displayed quantities", async () => {
    const csrfMeta = document.createElement("meta")
    csrfMeta.setAttribute("name", "csrf-token")
    csrfMeta.setAttribute("content", "secure-token")
    document.head.appendChild(csrfMeta)
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => items,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => [
          {
            id: 101,
            item_id: 42,
            value: 24,
            note: "Front shelf",
            created_at: "2026-01-03T15:04:00.000Z",
            updated_at: "2026-01-03T15:04:00.000Z",
          },
        ],
      })
    vi.stubGlobal("fetch", fetchMock)

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")
    fireEvent.click(screen.getByRole("button", { name: "Start Inventory" }))
    fireEvent.change(screen.getByLabelText("Counted quantity for Printer Paper"), {
      target: { value: "24" },
    })
    fireEvent.change(screen.getByLabelText("Inventory note for Printer Paper"), {
      target: { value: "Front shelf" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Finish Inventory" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/inventory_snapshots/bulk",
        expect.objectContaining({
          body: JSON.stringify({
            inventory_snapshots: [
              { item_id: 42, note: "Front shelf", value: 24 },
            ],
          }),
          headers: expect.objectContaining({
            "X-CSRF-Token": "secure-token",
          }),
          method: "POST",
        }),
      ),
    )
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Start Inventory" })).toBeInTheDocument(),
    )
    expect(screen.getByText("24 reams")).toBeInTheDocument()
    expect(window.localStorage.getItem("tally.inventoryTakingDraft.v1")).toBeNull()
  })

  it("rejects invalid counted quantities before submitting", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => items,
    })
    vi.stubGlobal("fetch", fetchMock)

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")
    fireEvent.click(screen.getByRole("button", { name: "Start Inventory" }))
    fireEvent.change(screen.getByLabelText("Counted quantity for Printer Paper"), {
      target: { value: "-1" },
    })

    expect(screen.getByText("Use a whole number 0 or higher.")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Finish Inventory" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }))

    expect(
      await screen.findByText("Use whole numbers 0 or higher before saving inventory."),
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("keeps active draft values when confirmation fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => items,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => ({ errors: { value: ["is invalid"] } }),
        }),
    )

    renderWithTheme(<HomePage />)

    await screen.findByText("Printer Paper")
    fireEvent.click(screen.getByRole("button", { name: "Start Inventory" }))
    fireEvent.change(screen.getByLabelText("Counted quantity for Printer Paper"), {
      target: { value: "24" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Finish Inventory" }))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }))

    expect(
      await screen.findByText("Inventory could not be saved. Check the counts and try again."),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Finish Inventory" }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByRole("button", { name: "Finish Inventory" })).toBeInTheDocument()
    expect(screen.getByLabelText("Counted quantity for Printer Paper")).toHaveValue(24)
  })
})
