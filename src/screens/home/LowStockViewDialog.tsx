import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import type { InventoryItem } from "../../types/inventory"
import { buildLowStockGroups } from "../../utils/lowStockView"
import {
  presentNumber,
  presentText,
  unitSuffix,
} from "../../utils/inventoryPresentation"

type LowStockViewDialogProps = {
  items: InventoryItem[]
  onClose: () => void
  open: boolean
}

function quantityLabel(label: string, value: number | null, unit: string) {
  if (value === null) {
    return `${label}: Not set`
  }

  return `${label}: ${presentNumber(value)}${unitSuffix(unit, value)}`
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
        {lowStockGroups.length > 0 ? (
          <Stack spacing={3} sx={{ pt: 1 }}>
            {lowStockGroups.map((group) => (
              <Stack key={group.category} spacing={1.25}>
                <Typography component="h2" variant="h6">
                  {group.category}
                </Typography>
                <Stack
                  component="ul"
                  spacing={1.5}
                  sx={{ listStyle: "none", m: 0, p: 0 }}
                >
                  {group.items.map(({ item, shortage }) => (
                    <Box
                      component="li"
                      key={item.id}
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
                        <Typography sx={{ fontWeight: 700 }}>
                          {presentText(item.name)}
                        </Typography>
                        <Typography color="error.main" sx={{ fontWeight: 700 }}>
                          Need {shortage} to reach minimum
                        </Typography>
                      </Stack>
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
                        <Typography color="text.secondary">
                          {quantityLabel("Current", item.value, item.unit)}
                        </Typography>
                        <Typography color="text.secondary">
                          {quantityLabel("Minimum", item.low, item.unit)}
                        </Typography>
                        <Typography color="text.secondary">
                          {quantityLabel("Maximum", item.high, item.unit)}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary" sx={{ pt: 1 }}>
            No low-stock items right now.
          </Typography>
        )}
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
