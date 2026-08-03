import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import type { InventoryItem } from "../../types/inventory"
import {
  buildLowStockGroups,
  type LowStockGroup,
  type LowStockViewItem,
} from "../../utils/lowStockView"
import {
  presentQuantity,
  presentText,
} from "../../utils/inventoryPresentation"

type LowStockViewDialogProps = {
  items: InventoryItem[]
  onClose: () => void
  open: boolean
}

function quantityLabel(label: string, value: number | null, unit: string) {
  return `${label}: ${presentQuantity(value, unit)}`
}

function LowStockDialogContent({ groups }: { groups: LowStockGroup[] }) {
  if (groups.length === 0) {
    return <EmptyLowStockState />
  }

  return (
    <Stack spacing={3} sx={{ pt: 1 }}>
      {groups.map((group) => (
        <LowStockGroupSection group={group} key={group.category} />
      ))}
    </Stack>
  )
}

function EmptyLowStockState() {
  return (
    <Typography color="text.secondary" sx={{ pt: 1 }}>
      No low-stock items right now.
    </Typography>
  )
}

function LowStockGroupSection({ group }: { group: LowStockGroup }) {
  return (
    <Stack spacing={1.25}>
      <Typography component="h2" variant="h6">
        {group.category}
      </Typography>
      <Stack component="ul" spacing={1.5} sx={{ listStyle: "none", m: 0, p: 0 }}>
        {group.items.map((lowStockItem) => (
          <LowStockItemCard
            key={lowStockItem.item.id}
            lowStockItem={lowStockItem}
          />
        ))}
      </Stack>
    </Stack>
  )
}

function LowStockItemCard({
  lowStockItem,
}: {
  lowStockItem: LowStockViewItem
}) {
  const { item, shortage } = lowStockItem

  return (
    <Box
      component="li"
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        display: { sm: "grid" },
        gap: 2,
        gridTemplateColumns: {
          sm: "minmax(0, 1fr) minmax(180px, auto)",
        },
        p: 2,
      }}
    >
      <Stack spacing={0.75}>
        <Typography sx={{ fontWeight: 700 }}>{presentText(item.name)}</Typography>
        <Typography color="error.main" sx={{ fontWeight: 700 }}>
          Need {shortage} to reach minimum
        </Typography>
      </Stack>
      <LowStockQuantitySummary item={item} />
    </Box>
  )
}

function LowStockQuantitySummary({ item }: { item: InventoryItem }) {
  return (
    <Stack
      spacing={0.5}
      sx={{
        alignSelf: "center",
        justifySelf: { sm: "end" },
        minWidth: 0,
        mt: { xs: 1.5, sm: 0 },
        textAlign: { sm: "right" },
      }}
    >
      <QuantityLine label="Current" unit={item.unit} value={item.value} />
      <QuantityLine label="Minimum" unit={item.unit} value={item.low} />
      <QuantityLine label="Maximum" unit={item.unit} value={item.high} />
    </Stack>
  )
}

function QuantityLine({
  label,
  unit,
  value,
}: {
  label: string
  unit: string
  value: number | null
}) {
  return (
    <Typography color="text.secondary">
      {quantityLabel(label, value, unit)}
    </Typography>
  )
}

export default function LowStockViewDialog({
  items,
  onClose,
  open,
}: LowStockViewDialogProps) {
  const lowStockGroups = buildLowStockGroups(items)

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            m: { xs: 1.5, sm: 4 },
            maxHeight: { xs: "calc(100% - 24px)", sm: "calc(100% - 64px)" },
          },
        },
      }}
    >
      <DialogTitle>Low Stock</DialogTitle>
      <DialogContent>
        <LowStockDialogContent groups={lowStockGroups} />
      </DialogContent>
      <DialogActions
        sx={{
          px: { xs: 3, sm: 2 },
          pb: { xs: 3, sm: 1 },
        }}
      >
        <Button onClick={onClose} sx={{ width: { xs: "100%", sm: "auto" } }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
