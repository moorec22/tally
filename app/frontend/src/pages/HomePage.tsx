import { useEffect, useMemo, useState } from "react"
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import SearchIcon from "@mui/icons-material/Search"
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import InputAdornment from "@mui/material/InputAdornment"
import MenuItem from "@mui/material/MenuItem"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

import InventoryItemRow from "../components/items/InventoryItemRow"
import type { InventoryDraftEntry } from "../components/items/InventoryItemRow"
import PageShell from "../components/PageShell"
import SectionLabel from "../components/SectionLabel"
import StatusPanel from "../components/StatusPanel"
import type { InventoryItem, InventorySnapshot } from "../types/inventory"
import { presentText, unitSuffix } from "../utils/inventoryPresentation"

type ItemsLoadState =
  | { status: "loading" }
  | { status: "loaded"; items: InventoryItem[] }
  | { status: "error" }

const ALL_CATEGORIES = "__all_categories__"
const NOT_SET_CATEGORY = "__not_set_category__"
const INVENTORY_DRAFT_STORAGE_KEY = "tally.inventoryTakingDraft.v1"
const COUNTED_VALUE_PATTERN = /^\d+$/

type CategoryFilterOption = {
  label: string
  value: string
}

type InventoryDraft = Record<number, InventoryDraftEntry>

type StoredInventoryDraft = {
  isActive: boolean
  entries: InventoryDraft
}

type CountedInventoryItem = {
  item: InventoryItem
  note: string
  value: number
}

function searchableText(item: InventoryItem) {
  return [item.name, item.category].join(" ").toLowerCase()
}

function normalizedCategory(item: InventoryItem) {
  return item.category?.trim() ?? ""
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

    const parsedDraft = JSON.parse(storedDraft) as Partial<StoredInventoryDraft>

    return {
      isActive: parsedDraft.isActive === true,
      entries: parsedDraft.entries ?? {},
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
  const [isInventoryActive, setIsInventoryActive] = useState(
    storedInventoryDraft.isActive,
  )
  const [inventoryDraft, setInventoryDraft] = useState<InventoryDraft>(
    storedInventoryDraft.entries,
  )
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

    return loadState.items.filter((item) => {
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
  }, [loadState, searchQuery, selectedCategory])

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

  const tableGridTemplateColumns = isInventoryActive
    ? "minmax(0, 1fr) 110px 100px minmax(120px, 150px) 130px minmax(160px, 1fr)"
    : "minmax(0, 1fr) 120px 110px minmax(140px, 170px) 24px"

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
    setIsReviewOpen(false)
    setSubmitError(null)
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
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
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
        <Paper
          elevation={0}
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            px: { xs: 3, sm: 5 },
            py: { xs: 4, sm: 5 },
          }}
        >
          <Stack spacing={3}>
            <SectionLabel icon={<Inventory2OutlinedIcon color="primary" />}>
              Inventory
            </SectionLabel>

            <Box>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Search and scan current stock levels.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name or category"
                slotProps={{
                  htmlInput: { "aria-label": "Search inventory" },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
                value={searchQuery}
              />
              <TextField
                label="Category"
                onChange={(event) => setSelectedCategory(event.target.value)}
                select
                slotProps={{
                  select: {
                    displayEmpty: true,
                  },
                }}
                sx={{ minWidth: { sm: 220 } }}
                value={selectedCategory}
              >
                {categoryFilterOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                onClick={handleInventoryToggle}
                sx={{ minWidth: { sm: 160 } }}
                variant={isInventoryActive ? "contained" : "outlined"}
              >
                {isInventoryActive ? "Finish Inventory" : "Start Inventory"}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {loadState.status === "loading" ? (
            <Stack
              spacing={2}
              sx={{ alignItems: "center", px: 3, py: { xs: 5, sm: 6 } }}
            >
              <CircularProgress aria-label="Loading inventory" />
              <Typography color="text.secondary">Loading inventory...</Typography>
            </Stack>
          ) : null}

          {loadState.status === "loaded" && loadState.items.length === 0 ? (
            <Stack
              spacing={1}
              sx={{ alignItems: "center", px: 3, py: { xs: 5, sm: 6 } }}
            >
              <Inventory2OutlinedIcon color="primary" />
              <Typography component="h2" sx={{ fontWeight: 700 }} variant="h5">
                No items yet
              </Typography>
              <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                Add inventory items to start tracking stock.
              </Typography>
            </Stack>
          ) : null}

          {loadState.status === "loaded" &&
          loadState.items.length > 0 &&
          filteredItems.length === 0 ? (
            <Stack
              spacing={1}
              sx={{ alignItems: "center", px: 3, py: { xs: 5, sm: 6 } }}
            >
              <ErrorOutlineOutlinedIcon color="primary" />
              <Typography component="h2" sx={{ fontWeight: 700 }} variant="h5">
                No matching items
              </Typography>
              <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                Try a different search or category.
              </Typography>
            </Stack>
          ) : null}

          {filteredItems.length > 0 ? (
            <Box component="ul" sx={{ m: 0, p: 0 }}>
              <Box
                component="li"
                sx={{
                  color: "text.secondary",
                  display: { xs: "none", sm: "grid" },
                  gap: 2,
                  gridTemplateColumns: tableGridTemplateColumns,
                  listStyle: "none",
                  px: 3,
                  py: 1.5,
                }}
              >
                <Typography component="span" variant="overline">
                  Name
                </Typography>
                <Typography component="span" variant="overline">
                  Category
                </Typography>
                <Typography component="span" variant="overline">
                  Quantity
                </Typography>
                <Typography component="span" variant="overline">
                  Last counted
                </Typography>
                {isInventoryActive ? (
                  <>
                    <Typography component="span" variant="overline">
                      Counted
                    </Typography>
                    <Typography component="span" variant="overline">
                      Note
                    </Typography>
                  </>
                ) : (
                  <Box />
                )}
              </Box>
              {filteredItems.map((item) => (
                <InventoryItemRow
                  draftEntry={inventoryDraft[item.id]}
                  isInventoryActive={isInventoryActive}
                  item={item}
                  key={item.id}
                  onDraftChange={handleDraftChange}
                />
              ))}
            </Box>
          ) : null}
        </Paper>
      </Stack>
      <Dialog
        fullWidth
        maxWidth="md"
        onClose={() => setIsReviewOpen(false)}
        open={isReviewOpen}
      >
        <DialogTitle>Finish Inventory</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              Review the counted items before saving snapshots.
            </Typography>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}
            {countedInventoryItems.length > 0 ? (
              <Stack
                component="ul"
                spacing={1.5}
                sx={{ listStyle: "none", m: 0, p: 0 }}
              >
                {countedInventoryItems.map(({ item, note, value }) => (
                  <Box
                    component="li"
                    key={item.id}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      display: { sm: "grid" },
                      gap: 2,
                      gridTemplateColumns: { sm: "minmax(0, 1fr) auto" },
                      p: 2,
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {presentText(item.name)}
                      </Typography>
                      {note.trim() ? (
                        <Typography color="text.secondary">
                          Note: {note}
                        </Typography>
                      ) : null}
                    </Stack>
                    <Typography
                      color="text.secondary"
                      sx={{
                        alignSelf: "center",
                        justifySelf: { sm: "end" },
                        mt: { xs: 1, sm: 0 },
                        whiteSpace: "nowrap",
                      }}
                    >
                      Counted: {value}
                      {unitSuffix(item.unit)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Alert severity="info">
                No counted quantities have been entered. Confirming will close the
                inventory without creating snapshots.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsReviewOpen(false)}>Cancel</Button>
          <Button
            disabled={isSubmittingInventory}
            onClick={confirmInventory}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  )
}
