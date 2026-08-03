import { useEffect, useMemo, useState } from "react"
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined"
import Stack from "@mui/material/Stack"

import ItemCreateDialog from "../components/items/ItemCreateDialog"
import type { InventoryDraftEntry } from "../components/items/InventoryItemRow"
import PageShell from "../components/PageShell"
import StatusPanel from "../components/StatusPanel"
import type {
  InventoryItem,
  InventoryItemCreate,
  InventorySnapshot,
} from "../types/inventory"
import { apiJsonHeaders } from "../api/client"
import CancelInventoryDialog from "./home/CancelInventoryDialog"
import InventoryHeader from "./home/InventoryHeader"
import InventoryListPanel from "./home/InventoryListPanel"
import LowStockViewDialog from "./home/LowStockViewDialog"
import ReviewInventoryDialog from "./home/ReviewInventoryDialog"
import type {
  CategoryFilterOption,
  CountedInventoryItem,
  InventoryDraft,
  InventorySort,
  InventorySortField,
  ItemsLoadState,
  SortDirection,
  StoredInventoryDraft,
} from "./home/types"

const ALL_CATEGORIES = "__all_categories__"
const NOT_SET_CATEGORY = "__not_set_category__"
const INVENTORY_DRAFT_STORAGE_KEY = "tally.inventoryTakingDraft.v1"
const COUNTED_VALUE_PATTERN = /^\d+$/

function searchableText(item: InventoryItem) {
  return [item.name, item.category].join(" ").toLowerCase()
}

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

function compareByCategory(
  firstItem: InventoryItem,
  secondItem: InventoryItem,
  direction: SortDirection,
) {
  const firstCategory = normalizedCategory(firstItem)
  const secondCategory = normalizedCategory(secondItem)

  if (!firstCategory && secondCategory) {
    return 1
  }

  if (firstCategory && !secondCategory) {
    return -1
  }

  const categoryComparison = firstCategory.localeCompare(secondCategory)

  if (categoryComparison !== 0) {
    return direction === "asc" ? categoryComparison : -categoryComparison
  }

  return compareNames(firstItem, secondItem)
}

function compareByLastCounted(
  firstItem: InventoryItem,
  secondItem: InventoryItem,
  direction: SortDirection,
) {
  const firstTimestamp = firstItem.last_updated_at
    ? Date.parse(firstItem.last_updated_at)
    : null
  const secondTimestamp = secondItem.last_updated_at
    ? Date.parse(secondItem.last_updated_at)
    : null

  if (firstTimestamp === null && secondTimestamp !== null) {
    return direction === "asc" ? -1 : 1
  }

  if (firstTimestamp !== null && secondTimestamp === null) {
    return direction === "asc" ? 1 : -1
  }

  if (firstTimestamp !== null && secondTimestamp !== null) {
    const timestampComparison = firstTimestamp - secondTimestamp

    if (timestampComparison !== 0) {
      return direction === "asc" ? timestampComparison : -timestampComparison
    }
  }

  return compareNames(firstItem, secondItem)
}

function sortInventoryItems(items: InventoryItem[], sort: InventorySort) {
  return [...items].sort((firstItem, secondItem) => {
    if (sort.field === "category") {
      return compareByCategory(firstItem, secondItem, sort.direction)
    }

    return compareByLastCounted(firstItem, secondItem, sort.direction)
  })
}

function readStoredInventoryDraft(): StoredInventoryDraft {
  if (typeof window === "undefined") {
    return { isActive: false, entries: {} }
  }

  try {
    const storedDraft = window.localStorage.getItem(INVENTORY_DRAFT_STORAGE_KEY)

    if (!storedDraft) {
      return { isActive: false, entries: {} }
    }

    const parsedDraft = JSON.parse(storedDraft) as {
      isActive?: unknown
      entries?: unknown
    }

    const rawEntries =
      typeof parsedDraft.entries === "object" && parsedDraft.entries !== null
        ? (parsedDraft.entries as Record<string, unknown>)
        : {}

    const entries: InventoryDraft = {}

    for (const [key, entry] of Object.entries(rawEntries)) {
      const itemId = Number(key)
      if (!Number.isFinite(itemId) || typeof entry !== "object" || entry === null) {
        continue
      }

      const value = (entry as { value?: unknown }).value
      const note = (entry as { note?: unknown }).note
      const normalizedEntry: InventoryDraftEntry = {
        value: typeof value === "string" ? value : "",
        note: typeof note === "string" ? note : "",
      }

      if (normalizedEntry.value.trim() || normalizedEntry.note.trim()) {
        entries[itemId] = normalizedEntry
      }
    }

    return {
      isActive: parsedDraft.isActive === true,
      entries,
    }
  } catch {
    return { isActive: false, entries: {} }
  }
}

function persistInventoryDraft(isActive: boolean, entries: InventoryDraft) {
  if (typeof window === "undefined") {
    return
  }

  try {
    if (!isActive && Object.keys(entries).length === 0) {
      window.localStorage.removeItem(INVENTORY_DRAFT_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(
      INVENTORY_DRAFT_STORAGE_KEY,
      JSON.stringify({ isActive, entries }),
    )
  } catch {
    // Local persistence is a convenience; the in-memory draft still works.
  }
}

function isCountedValue(value: string) {
  return COUNTED_VALUE_PATTERN.test(value.trim())
}

export default function HomePage() {
  const storedInventoryDraft = useMemo(() => readStoredInventoryDraft(), [])
  const [loadState, setLoadState] = useState<ItemsLoadState>({
    status: "loading",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES)
  const [inventorySort, setInventorySort] = useState<InventorySort>({
    direction: "asc",
    field: "category",
  })
  const [isInventoryActive, setIsInventoryActive] = useState(
    storedInventoryDraft.isActive,
  )
  const [inventoryDraft, setInventoryDraft] = useState<InventoryDraft>(
    storedInventoryDraft.entries,
  )
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false)
  const [isCancelInventoryOpen, setIsCancelInventoryOpen] = useState(false)
  const [isLowStockViewOpen, setIsLowStockViewOpen] = useState(false)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isSubmittingInventory, setIsSubmittingInventory] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadItems() {
      setLoadState({ status: "loading" })

      try {
        const response = await fetch("/api/v1/items", {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        })

        if (!response.ok) {
          setLoadState({ status: "error" })
          return
        }

        const items = (await response.json()) as InventoryItem[]
        setLoadState({ status: "loaded", items })
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadState({ status: "error" })
        }
      }
    }

    loadItems()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    persistInventoryDraft(isInventoryActive, inventoryDraft)
  }, [inventoryDraft, isInventoryActive])

  const categoryFilterOptions = useMemo<CategoryFilterOption[]>(() => {
    if (loadState.status !== "loaded") {
      return [{ label: "All categories", value: ALL_CATEGORIES }]
    }

    const categories = new Set<string>()
    let hasBlankCategory = false

    loadState.items.forEach((item) => {
      const category = normalizedCategory(item)

      if (category) {
        categories.add(category)
      } else {
        hasBlankCategory = true
      }
    })

    const options = Array.from(categories)
      .sort((firstCategory, secondCategory) =>
        firstCategory.localeCompare(secondCategory),
      )
      .map((category) => ({ label: category, value: category }))

    if (hasBlankCategory) {
      options.push({ label: "Not set", value: NOT_SET_CATEGORY })
    }

    return [{ label: "All categories", value: ALL_CATEGORIES }, ...options]
  }, [loadState])

  const filteredItems = useMemo(() => {
    if (loadState.status !== "loaded") {
      return []
    }

    const normalizedQuery = searchQuery.trim().toLowerCase()

    const matchingItems = loadState.items.filter((item) => {
      const category = normalizedCategory(item)
      const matchesSearch =
        !normalizedQuery || searchableText(item).includes(normalizedQuery)
      const matchesCategory =
        selectedCategory === ALL_CATEGORIES ||
        (selectedCategory === NOT_SET_CATEGORY
          ? !category
          : category === selectedCategory)

      return matchesSearch && matchesCategory
    })

    return sortInventoryItems(matchingItems, inventorySort)
  }, [inventorySort, loadState, searchQuery, selectedCategory])
  const allLoadedItems = loadState.status === "loaded" ? loadState.items : []

  const countedInventoryItems = useMemo<CountedInventoryItem[]>(() => {
    if (loadState.status !== "loaded") {
      return []
    }

    return loadState.items.flatMap((item) => {
      const draftEntry = inventoryDraft[item.id]

      if (!draftEntry || !isCountedValue(draftEntry.value)) {
        return []
      }

      return [
        {
          item,
          note: draftEntry.note,
          value: Number.parseInt(draftEntry.value.trim(), 10),
        },
      ]
    })
  }, [inventoryDraft, loadState])
  const hasInvalidDraftCounts = useMemo(
    () =>
      Object.values(inventoryDraft).some(
        (draftEntry) =>
          draftEntry.value.trim() !== "" && !isCountedValue(draftEntry.value),
      ),
    [inventoryDraft],
  )

  function handleInventoryToggle() {
    setSubmitError(null)

    if (isInventoryActive) {
      if (hasInvalidDraftCounts) {
        setSubmitError("Use whole numbers 0 or higher before finishing inventory.")
      }

      setIsReviewOpen(true)
      return
    }

    setIsInventoryActive(true)
  }

  function handleSortChange(field: InventorySortField) {
    setInventorySort((currentSort) => {
      if (currentSort.field !== field) {
        return {
          field,
          direction: field === "last_counted" ? "desc" : "asc",
        }
      }

      return {
        ...currentSort,
        direction: currentSort.direction === "asc" ? "desc" : "asc",
      }
    })
  }

  function handleDraftChange(itemId: number, draftEntry: InventoryDraftEntry) {
    setInventoryDraft((currentDraft) => {
      const nextDraft = { ...currentDraft }

      if (!draftEntry.value.trim() && !draftEntry.note.trim()) {
        delete nextDraft[itemId]
      } else {
        nextDraft[itemId] = draftEntry
      }

      return nextDraft
    })
  }

  function clearInventoryDraft() {
    setInventoryDraft({})
    setIsInventoryActive(false)
    setIsCancelInventoryOpen(false)
    setIsReviewOpen(false)
    setSubmitError(null)
  }

  function cancelInventorySession() {
    setIsCancelInventoryOpen(true)
  }

  function confirmCancelInventorySession() {
    clearInventoryDraft()
  }

  async function confirmInventory() {
    if (hasInvalidDraftCounts) {
      setSubmitError("Use whole numbers 0 or higher before saving inventory.")
      return
    }

    if (countedInventoryItems.length === 0) {
      clearInventoryDraft()
      return
    }

    setIsSubmittingInventory(true)
    setSubmitError(null)

    try {
      const response = await fetch("/api/v1/inventory_snapshots/bulk", {
        body: JSON.stringify({
          inventory_snapshots: countedInventoryItems.map(({ item, note, value }) => ({
            item_id: item.id,
            note,
            value,
          })),
        }),
        headers: apiJsonHeaders(),
        method: "POST",
      })

      if (!response.ok) {
        setSubmitError("Inventory could not be saved. Check the counts and try again.")
        return
      }

      const snapshots = (await response.json()) as InventorySnapshot[]
      const snapshotsByItemId = new Map(
        snapshots.map((snapshot) => [snapshot.item_id, snapshot]),
      )

      setLoadState((currentLoadState) => {
        if (currentLoadState.status !== "loaded") {
          return currentLoadState
        }

        return {
          status: "loaded",
          items: currentLoadState.items.map((item) => {
            const snapshot = snapshotsByItemId.get(item.id)

            if (!snapshot) {
              return item
            }

            return {
              ...item,
              last_updated_at: snapshot.updated_at,
              value: snapshot.value,
            }
          }),
        }
      })
      clearInventoryDraft()
    } catch {
      setSubmitError("Inventory could not be saved. Check your connection and try again.")
    } finally {
      setIsSubmittingInventory(false)
    }
  }

  async function createItem(values: InventoryItemCreate) {
    const response = await fetch("/api/v1/items", {
      body: JSON.stringify({ item: values }),
      headers: apiJsonHeaders(),
      method: "POST",
    })

    if (!response.ok) {
      throw new Error("Unable to create item")
    }

    const item = (await response.json()) as InventoryItem

    setLoadState((currentLoadState) => {
      if (currentLoadState.status !== "loaded") {
        return currentLoadState
      }

      return {
        status: "loaded",
        items: sortInventoryItems([...currentLoadState.items, item], inventorySort),
      }
    })
  }

  if (loadState.status === "error") {
    return (
      <PageShell>
        <StatusPanel
          icon={<WarningAmberOutlinedIcon color="primary" />}
          title="Unable to load inventory"
          body="Refresh the page or try again in a moment."
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <Stack spacing={3}>
        <InventoryHeader
          categoryFilterOptions={categoryFilterOptions}
          isInventoryActive={isInventoryActive}
          onAddItem={() => setIsCreateItemOpen(true)}
          onCancelInventory={cancelInventorySession}
          onCategoryChange={setSelectedCategory}
          onInventoryToggle={handleInventoryToggle}
          onLowStockView={() => setIsLowStockViewOpen(true)}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
        />

        <InventoryListPanel
          filteredItems={filteredItems}
          inventoryDraft={inventoryDraft}
          inventorySort={inventorySort}
          isInventoryActive={isInventoryActive}
          loadState={loadState}
          onDraftChange={handleDraftChange}
          onSortChange={handleSortChange}
        />
      </Stack>
      <ReviewInventoryDialog
        countedInventoryItems={countedInventoryItems}
        isSubmittingInventory={isSubmittingInventory}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={confirmInventory}
        open={isReviewOpen}
        submitError={submitError}
      />
      <LowStockViewDialog
        items={allLoadedItems}
        onClose={() => setIsLowStockViewOpen(false)}
        open={isLowStockViewOpen}
      />
      <ItemCreateDialog
        onClose={() => setIsCreateItemOpen(false)}
        onCreate={createItem}
        open={isCreateItemOpen}
      />
      <CancelInventoryDialog
        onClose={() => setIsCancelInventoryOpen(false)}
        onConfirm={confirmCancelInventorySession}
        open={isCancelInventoryOpen}
      />
    </PageShell>
  )
}
