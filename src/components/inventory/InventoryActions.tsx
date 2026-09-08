import AddIcon from "@mui/icons-material/Add"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"

type InventoryActionsProps = {
  isInventoryActive: boolean
  onAddItem: () => void
  onCancelInventory: () => void
  onInventoryToggle: () => void
}

export default function InventoryActions({
  isInventoryActive,
  onAddItem,
  onCancelInventory,
  onInventoryToggle,
}: InventoryActionsProps) {
  return (
    <Stack
      aria-label="Inventory actions"
      direction={{ xs: "column", sm: "row" }}
      role="group"
      spacing={1.5}
      sx={{
        justifyContent: { sm: "flex-end" },
        "& .MuiButton-root": {
          minHeight: 48,
        },
      }}
    >
      <Button
        onClick={onInventoryToggle}
        sx={{ minWidth: { sm: 160 }, width: { xs: "100%", sm: "auto" } }}
        variant={isInventoryActive ? "contained" : "outlined"}
      >
        {isInventoryActive ? "Finish Inventory" : "Start Inventory"}
      </Button>
      <Button
        onClick={onAddItem}
        startIcon={<AddIcon />}
        sx={{ minWidth: { sm: 140 }, width: { xs: "100%", sm: "auto" } }}
        variant="contained"
      >
        Add Item
      </Button>
      {isInventoryActive ? (
        <Button
          color="inherit"
          onClick={onCancelInventory}
          sx={{
            minWidth: { sm: 160 },
            width: { xs: "100%", sm: "auto" },
          }}
          variant="outlined"
        >
          Cancel Inventory
        </Button>
      ) : null}
    </Stack>
  )
}
