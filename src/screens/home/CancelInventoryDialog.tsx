import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import Typography from "@mui/material/Typography"

type CancelInventoryDialogProps = {
  onClose: () => void
  onConfirm: () => void
  open: boolean
}

export default function CancelInventoryDialog({
  onClose,
  onConfirm,
  open,
}: CancelInventoryDialogProps) {
  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: {
            m: { xs: 1.5, sm: 4 },
          },
        },
      }}
    >
      <DialogTitle>Cancel Inventory?</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ pt: 1 }}>
          This will discard the counts and notes entered for this inventory session.
        </Typography>
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
          Keep Inventory
        </Button>
        <Button
          color="error"
          onClick={onConfirm}
          sx={{ width: { xs: "100%", sm: "auto" } }}
          variant="contained"
        >
          Cancel Inventory
        </Button>
      </DialogActions>
    </Dialog>
  )
}
