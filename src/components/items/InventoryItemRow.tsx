import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined"
import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import Fade from "@mui/material/Fade"
import Link from "@mui/material/Link"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { alpha } from "@mui/material/styles"

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
  const quantityLabel = `${quantity}${unitSuffix(item.unit, item.value)}`
  const lastCounted = presentCompactDate(item.last_updated_at)
  const isLowStock =
    item.value !== null && item.low !== null && item.value < item.low
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

      <Box
        component="span"
        sx={{
          alignItems: { xs: "flex-end", sm: "flex-start" },
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
          gridColumn: { xs: isInventoryActive ? "1 / -1" : 2, sm: 3 },
          gridRow: { xs: isInventoryActive ? 3 : 1, sm: "auto" },
          justifySelf: "start",
          maxWidth: "100%",
          minWidth: 0,
        }}
      >
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            maxWidth: "100%",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={quantityLabel}
        >
          {quantityLabel}
        </Typography>
        {isLowStock ? (
          <Chip
            color="error"
            icon={<ErrorOutlineOutlinedIcon />}
            label="Low stock"
            size="small"
            variant="outlined"
          />
        ) : null}
      </Box>

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
          <Fade in timeout={160}>
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
          </Fade>
          <Fade in timeout={190}>
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
          </Fade>
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
            bgcolor: (theme) =>
              isLowStock ? alpha(theme.palette.error.main, 0.08) : undefined,
            color: "text.primary",
            display: "grid",
            gap: { xs: 1.25, sm: 2 },
            gridTemplateColumns,
            px: { xs: 2, sm: 3 },
            py: { xs: 2.25, sm: 2 },
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
            gap: { xs: 1, sm: 2 },
            gridTemplateColumns,
            px: { xs: 2, sm: 3 },
            py: { xs: 2.25, sm: 2 },
            transition: "background-color 120ms ease",
            bgcolor: (theme) =>
              isLowStock ? alpha(theme.palette.error.main, 0.08) : undefined,
            "&:hover": {
              bgcolor: (theme) =>
                isLowStock ? alpha(theme.palette.error.main, 0.12) : "action.hover",
            },
            "&:focus-visible": {
              bgcolor: (theme) =>
                isLowStock ? alpha(theme.palette.error.main, 0.16) : "action.focus",
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
