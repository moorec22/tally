import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import CircularProgress from "@mui/material/CircularProgress"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TableSortLabel from "@mui/material/TableSortLabel"
import Typography from "@mui/material/Typography"

import InventoryItemRow from "../../components/items/InventoryItemRow"
import type { InventoryDraftEntry } from "../../components/items/InventoryItemRow"
import type { InventoryItem } from "../../types/inventory"
import type {
  InventoryDraft,
  InventorySort,
  InventorySortField,
  ItemsLoadState,
} from "./types"

type InventoryListPanelProps = {
  filteredItems: InventoryItem[]
  inventoryDraft: InventoryDraft
  inventorySort: InventorySort
  isInventoryActive: boolean
  loadState: ItemsLoadState
  onDraftChange: (itemId: number, draftEntry: InventoryDraftEntry) => void
  onSortChange: (field: InventorySortField) => void
}

export default function InventoryListPanel({
  filteredItems,
  inventoryDraft,
  inventorySort,
  isInventoryActive,
  loadState,
  onDraftChange,
  onSortChange,
}: InventoryListPanelProps) {
  const tableGridTemplateColumns = isInventoryActive
    ? "minmax(0, 1fr) 110px 100px minmax(120px, 150px) 130px minmax(160px, 1fr)"
    : "minmax(0, 1fr) 120px 110px minmax(140px, 170px) 24px"

  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {isInventoryActive ? (
        <Alert
          icon={<Inventory2OutlinedIcon fontSize="inherit" />}
          severity="info"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            borderRadius: 0,
          }}
        >
          Inventory in progress
        </Alert>
      ) : null}

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
            <TableSortLabel
              active={inventorySort.field === "category"}
              direction={
                inventorySort.field === "category"
                  ? inventorySort.direction
                  : "asc"
              }
              onClick={() => onSortChange("category")}
              sx={{
                justifyContent: "flex-start",
                width: "fit-content",
                ".MuiTableSortLabel-icon": {
                  ml: 0.25,
                },
              }}
            >
              <Typography component="span" variant="overline">
                Category
              </Typography>
            </TableSortLabel>
            <Typography component="span" variant="overline">
              Quantity
            </Typography>
            <TableSortLabel
              active={inventorySort.field === "last_counted"}
              direction={
                inventorySort.field === "last_counted"
                  ? inventorySort.direction
                  : "desc"
              }
              onClick={() => onSortChange("last_counted")}
              sx={{
                justifyContent: "flex-start",
                width: "fit-content",
                ".MuiTableSortLabel-icon": {
                  ml: 0.25,
                },
              }}
            >
              <Typography component="span" variant="overline">
                Last counted
              </Typography>
            </TableSortLabel>
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
              onDraftChange={onDraftChange}
            />
          ))}
        </Box>
      ) : null}
    </Paper>
  )
}
