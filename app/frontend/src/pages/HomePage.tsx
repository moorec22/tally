import { useEffect, useMemo, useState } from "react"
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import SearchIcon from "@mui/icons-material/Search"
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined"
import Box from "@mui/material/Box"
import CircularProgress from "@mui/material/CircularProgress"
import InputAdornment from "@mui/material/InputAdornment"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

import InventoryItemRow from "../components/items/InventoryItemRow"
import PageShell from "../components/PageShell"
import SectionLabel from "../components/SectionLabel"
import StatusPanel from "../components/StatusPanel"
import type { InventoryItem } from "../types/inventory"

type ItemsLoadState =
  | { status: "loading" }
  | { status: "loaded"; items: InventoryItem[] }
  | { status: "error" }

function searchableText(item: InventoryItem) {
  return [item.name, item.category].join(" ").toLowerCase()
}

export default function HomePage() {
  const [loadState, setLoadState] = useState<ItemsLoadState>({
    status: "loading",
  })
  const [searchQuery, setSearchQuery] = useState("")

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

  const filteredItems = useMemo(() => {
    if (loadState.status !== "loaded") {
      return []
    }

    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return loadState.items
    }

    return loadState.items.filter((item) =>
      searchableText(item).includes(normalizedQuery),
    )
  }, [loadState, searchQuery])

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
                Try a different name or category.
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
                  gridTemplateColumns: "minmax(0, 1fr) 160px 120px 120px auto",
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
                  Unit
                </Typography>
                <Box />
              </Box>
              {filteredItems.map((item) => (
                <InventoryItemRow item={item} key={item.id} />
              ))}
            </Box>
          ) : null}
        </Paper>
      </Stack>
    </PageShell>
  )
}
