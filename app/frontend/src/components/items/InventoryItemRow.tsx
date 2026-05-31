import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import Box from "@mui/material/Box"
import Link from "@mui/material/Link"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import type { InventoryItem } from "../../types/inventory"
import { presentText, unitSuffix } from "../../utils/inventoryPresentation"

export default function InventoryItemRow({ item }: { item: InventoryItem }) {
  const itemName = presentText(item.name)
  const category = presentText(item.category)
  const unit = presentText(item.unit)
  const quantity = item.value === null ? "--" : item.value.toString()

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
            xs: "1fr auto",
            sm: "minmax(0, 1fr) 160px 120px 120px auto",
          },
          px: { xs: 2.5, sm: 3 },
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
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography
            component="span"
            sx={{ fontWeight: 700, overflowWrap: "anywhere" }}
          >
            {itemName}
          </Typography>
          <Typography
            color="text.secondary"
            component="span"
            sx={{ display: { sm: "none" }, overflowWrap: "anywhere" }}
            variant="body2"
          >
            {category}
          </Typography>
        </Stack>

        <Typography
          color="text.secondary"
          component="span"
          sx={{
            display: { xs: "none", sm: "block" },
            overflowWrap: "anywhere",
          }}
        >
          {category}
        </Typography>

        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            justifySelf: { xs: "end", sm: "start" },
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
            display: { xs: "none", sm: "block" },
            overflowWrap: "anywhere",
          }}
        >
          {unit}
        </Typography>

        <ChevronRightIcon
          color="action"
          sx={{ alignSelf: "center", display: { xs: "none", sm: "block" } }}
        />
      </Link>
    </Box>
  )
}
