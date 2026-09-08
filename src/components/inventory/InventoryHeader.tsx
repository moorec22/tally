import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import SectionLabel from "../SectionLabel"
import InventoryActions from "./InventoryActions"
import InventoryFilters from "./InventoryFilters"
import type { CategoryFilterOption } from "./InventoryFilters"

type InventoryHeaderProps = {
  categoryFilterOptions: CategoryFilterOption[]
  isInventoryActive: boolean
  onAddItem: () => void
  onCancelInventory: () => void
  onCategoryChange: (category: string) => void
  onInventoryToggle: () => void
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

        <Stack spacing={2}>
          <InventoryFilters
            categoryFilterOptions={categoryFilterOptions}
            onCategoryChange={onCategoryChange}
            onSearchChange={onSearchChange}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
          />
          <InventoryActions
            isInventoryActive={isInventoryActive}
            onAddItem={onAddItem}
            onCancelInventory={onCancelInventory}
            onInventoryToggle={onInventoryToggle}
          />
        </Stack>
      </Stack>
    </Paper>
  )
}
