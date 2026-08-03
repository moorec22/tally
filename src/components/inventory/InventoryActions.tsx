import AddIcon from "@mui/icons-material/Add"
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"

type InventoryActionsProps = {
  isInventoryActive: boolean
  onAddItem: () => void
  onCancelInventory: () => void
  onInventoryToggle: () => void
  onLowStockView: () => void
}

export default function InventoryActions({
  isInventoryActive,
  onAddItem,
  onCancelInventory,
  onInventoryToggle,
  onLowStockView,
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
        onClick={onLowStockView}
        startIcon={<ReportProblemOutlinedIcon />}
        sx={{ minWidth: { sm: 170 }, width: { xs: "100%", sm: "auto" } }}
        variant="outlined"
      >
        View Low Stock
      </Button>
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
