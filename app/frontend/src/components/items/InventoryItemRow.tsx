import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import Box from "@mui/material/Box"
import Link from "@mui/material/Link"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

import type { InventoryItem } from "../../types/inventory"
import {
  presentCompactDate,
  presentText,
  unitSuffix,
} from "../../utils/inventoryPresentation"

export type InventoryDraftEntry = {
  value: string
  note: string
}

type InventoryItemRowProps = {
  draftEntry?: InventoryDraftEntry
  isInventoryActive?: boolean
  item: InventoryItem
  onDraftChange?: (itemId: number, draftEntry: InventoryDraftEntry) => void
}

export default function InventoryItemRow({
  draftEntry = { value: "", note: "" },
  isInventoryActive = false,
  item,
  onDraftChange,
}: InventoryItemRowProps) {
  const itemName = presentText(item.name)
  const category = presentText(item.category)
  const quantity = item.value === null ? "--" : item.value.toString()
  const lastCounted = presentCompactDate(item.last_updated_at)
  const hasInvalidCount =
    draftEntry.value.trim() !== "" && !/^\d+$/.test(draftEntry.value.trim())
  const gridTemplateColumns = isInventoryActive
    ? {
        xs: "minmax(0, 1fr)",
        sm: "minmax(0, 1fr) 110px 100px minmax(120px, 150px) 130px minmax(160px, 1fr)",
      }
    : {
        xs: "minmax(0, 1fr) auto",
        sm: "minmax(0, 1fr) 120px 110px minmax(140px, 170px) 24px",
      }
  const rowContent = (
    <>
      <Typography
        component="span"
        sx={{
          fontWeight: 700,
          gridColumn: { sm: 1 },
          gridRow: { xs: 1, sm: "auto" },
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {itemName}
      </Typography>

      <Typography
        color="text.secondary"
        component="span"
        sx={{
          gridColumn: { xs: "1 / -1", sm: "auto" },
          gridRow: { xs: 2, sm: "auto" },
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {category}
      </Typography>

      <Typography
        component="span"
        sx={{
          fontWeight: 700,
          gridColumn: { xs: isInventoryActive ? "1 / -1" : 2, sm: 3 },
          gridRow: { xs: isInventoryActive ? 3 : 1, sm: "auto" },
          justifySelf: "start",
          whiteSpace: "nowrap",
        }}
      >
        {quantity}
        {unitSuffix(item.unit)}
      </Typography>

      <Typography
        color="text.secondary"
        component="span"
        sx={{
          gridColumn: { xs: "1 / -1", sm: 4 },
          gridRow: { xs: isInventoryActive ? 4 : 3, sm: "auto" },
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {lastCounted}
      </Typography>

      {isInventoryActive ? (
        <>
          <TextField
            error={hasInvalidCount}
            helperText={hasInvalidCount ? "Use a whole number 0 or higher." : undefined}
            inputMode="numeric"
            label="Counted quantity"
            onChange={(event) =>
              onDraftChange?.(item.id, {
                ...draftEntry,
                value: event.target.value,
              })
            }
            size="small"
            slotProps={{
              htmlInput: {
                "aria-label": `Counted quantity for ${itemName}`,
                min: 0,
                step: 1,
              },
            }}
            sx={{ gridColumn: { xs: "1 / -1", sm: 5 } }}
            type="number"
            value={draftEntry.value}
          />
          <TextField
            label="Note"
            onChange={(event) =>
              onDraftChange?.(item.id, {
                ...draftEntry,
                note: event.target.value,
              })
            }
            size="small"
            slotProps={{
              htmlInput: { "aria-label": `Inventory note for ${itemName}` },
            }}
            sx={{ gridColumn: { xs: "1 / -1", sm: 6 } }}
            value={draftEntry.note}
          />
        </>
      ) : (
        <ChevronRightIcon
          color="action"
          sx={{ alignSelf: "center", display: { xs: "none", sm: "block" } }}
        />
      )}
    </>
  )

  return (
    <Box
      component="li"
      sx={{
        borderTop: 1,
        borderColor: "divider",
        listStyle: "none",
        m: 0,
      }}
    >
      {isInventoryActive ? (
        <Box
          sx={{
            alignItems: { sm: "center" },
            color: "text.primary",
            display: "grid",
            gap: 2,
            gridTemplateColumns,
            px: 3,
            py: 2,
          }}
        >
          {rowContent}
        </Box>
      ) : (
        <Link
          href={`/items/${item.id}`}
          underline="none"
          sx={{
            color: "text.primary",
            display: "grid",
            gap: 2,
            gridTemplateColumns,
            px: 3,
            py: 2,
            transition: "background-color 120ms ease",
            "&:hover": {
              bgcolor: "action.hover",
            },
            "&:focus-visible": {
              bgcolor: "action.focus",
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: "-2px",
            },
          }}
        >
          {rowContent}
        </Link>
      )}
    </Box>
  )
}
