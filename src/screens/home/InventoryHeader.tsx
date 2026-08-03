import AddIcon from "@mui/icons-material/Add"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined"
import SearchIcon from "@mui/icons-material/Search"
import Button from "@mui/material/Button"
import InputAdornment from "@mui/material/InputAdornment"
import MenuItem from "@mui/material/MenuItem"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

import SectionLabel from "../../components/SectionLabel"
import type { CategoryFilterOption } from "./types"

type InventoryHeaderProps = {
  categoryFilterOptions: CategoryFilterOption[]
  isInventoryActive: boolean
  onAddItem: () => void
  onCancelInventory: () => void
  onCategoryChange: (category: string) => void
  onInventoryToggle: () => void
  onLowStockView: () => void
  onSearchChange: (query: string) => void
  searchQuery: string
  selectedCategory: string
}

export default function InventoryHeader({
  categoryFilterOptions,
  isInventoryActive,
  onAddItem,
  onCancelInventory,
  onCategoryChange,
  onInventoryToggle,
  onLowStockView,
  onSearchChange,
  searchQuery,
  selectedCategory,
}: InventoryHeaderProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        px: { xs: 2, sm: 5 },
        py: { xs: 3, sm: 5 },
      }}
    >
      <Stack spacing={3}>
        <SectionLabel icon={<Inventory2OutlinedIcon color="primary" />}>
          Inventory
        </SectionLabel>

        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Search and scan current stock levels.
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{
            "& .MuiButton-root": {
              minHeight: 48,
            },
          }}
        >
          <TextField
            fullWidth
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or category"
            slotProps={{
              htmlInput: { "aria-label": "Search inventory" },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
            value={searchQuery}
          />
          <TextField
            fullWidth
            label="Category"
            onChange={(event) => onCategoryChange(event.target.value)}
            select
            slotProps={{
              select: {
                displayEmpty: true,
              },
            }}
            sx={{ minWidth: { md: 220 } }}
            value={selectedCategory}
          >
            {categoryFilterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            onClick={onLowStockView}
            startIcon={<ReportProblemOutlinedIcon />}
            sx={{ minWidth: { md: 170 }, width: { xs: "100%", md: "auto" } }}
            variant="outlined"
          >
            View Low Stock
          </Button>
          <Button
            onClick={onInventoryToggle}
            sx={{ minWidth: { md: 160 }, width: { xs: "100%", md: "auto" } }}
            variant={isInventoryActive ? "contained" : "outlined"}
          >
            {isInventoryActive ? "Finish Inventory" : "Start Inventory"}
          </Button>
          <Button
            onClick={onAddItem}
            startIcon={<AddIcon />}
            sx={{ minWidth: { md: 140 }, width: { xs: "100%", md: "auto" } }}
            variant="contained"
          >
            Add Item
          </Button>
          {isInventoryActive ? (
            <Button
              color="inherit"
              onClick={onCancelInventory}
              sx={{
                minWidth: { md: 160 },
                width: { xs: "100%", md: "auto" },
              }}
              variant="outlined"
            >
              Cancel Inventory
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  )
}
