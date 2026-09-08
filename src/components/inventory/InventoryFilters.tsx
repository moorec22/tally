import SearchIcon from "@mui/icons-material/Search"
import InputAdornment from "@mui/material/InputAdornment"
import MenuItem from "@mui/material/MenuItem"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"

export type CategoryFilterOption = {
  label: string
  value: string
}

type InventoryFiltersProps = {
  categoryFilterOptions: CategoryFilterOption[]
  onCategoryChange: (category: string) => void
  onSearchChange: (query: string) => void
  searchQuery: string
  selectedCategory: string
}

export default function InventoryFilters({
  categoryFilterOptions,
  onCategoryChange,
  onSearchChange,
  searchQuery,
  selectedCategory,
}: InventoryFiltersProps) {
  return (
    <Stack
      aria-label="Inventory filters"
      direction={{ xs: "column", md: "row" }}
      role="search"
      spacing={2}
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
        sx={{ maxWidth: { md: 260 }, minWidth: { md: 220 } }}
        value={selectedCategory}
      >
        {categoryFilterOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  )
}
