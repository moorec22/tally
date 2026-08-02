import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import { presentText, unitSuffix } from "../../utils/inventoryPresentation"
import type { CountedInventoryItem } from "./types"

type ReviewInventoryDialogProps = {
  countedInventoryItems: CountedInventoryItem[]
  isSubmittingInventory: boolean
  onClose: () => void
  onConfirm: () => void
  open: boolean
  submitError: string | null
}

export default function ReviewInventoryDialog({
  countedInventoryItems,
  isSubmittingInventory,
  onClose,
  onConfirm,
  open,
  submitError,
}: ReviewInventoryDialogProps) {
  return (
    <Dialog
      fullWidth
      fullScreen={false}
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
                  </Stack>
                  <Stack
                    spacing={0.5}
                    sx={{
                      alignSelf: "center",
                      justifySelf: { sm: "end" },
                      minWidth: 0,
                      mt: { xs: 1, sm: 0 },
                      textAlign: { sm: "right" },
                    }}
                  >
                    <Typography color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                      Counted: {value}
                      {unitSuffix(item.unit)}
                    </Typography>
                    {note.trim() ? (
                      <Typography
                        color="text.secondary"
                        sx={{ overflowWrap: "anywhere" }}
                      >
                        Note: {note}
                      </Typography>
                    ) : null}
                  </Stack>
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
      <DialogActions
        sx={{
          flexDirection: { xs: "column-reverse", sm: "row" },
          gap: { xs: 1, sm: 0 },
          px: { xs: 3, sm: 2 },
          pb: { xs: 3, sm: 1 },
          "& > :not(style) ~ :not(style)": {
            ml: { xs: 0, sm: 1 },
          },
        }}
      >
        <Button onClick={onClose} sx={{ width: { xs: "100%", sm: "auto" } }}>
          Cancel
        </Button>
        <Button
          disabled={isSubmittingInventory}
          onClick={onConfirm}
          sx={{ width: { xs: "100%", sm: "auto" } }}
          variant="contained"
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
