import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import Box from "@mui/material/Box"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"

import type { InventoryItem } from "../../types/inventory"
import {
  presentCompactDate,
  presentText,
  unitSuffix,
} from "../../utils/inventoryPresentation"

export default function InventoryItemRow({ item }: { item: InventoryItem }) {
  const itemName = presentText(item.name)
  const category = presentText(item.category)
  const quantity = item.value === null ? "--" : item.value.toString()
  const lastCounted = presentCompactDate(item.last_updated_at)

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
      <Link
        href={`/items/${item.id}`}
        underline="none"
        sx={{
          color: "text.primary",
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr) auto",
            sm: "minmax(0, 1fr) 120px 110px minmax(140px, 170px) 24px",
          },
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
            gridColumn: { xs: 2, sm: 3 },
            gridRow: { xs: 1, sm: "auto" },
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
            gridRow: { xs: 3, sm: "auto" },
            minWidth: 0,
            overflowWrap: "anywhere",
          }}
        >
          {lastCounted}
        </Typography>

        <ChevronRightIcon
          color="action"
          sx={{ alignSelf: "center", display: { xs: "none", sm: "block" } }}
        />
      </Link>
    </Box>
  )
}
