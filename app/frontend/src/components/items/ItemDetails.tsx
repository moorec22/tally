import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import NumbersOutlinedIcon from "@mui/icons-material/NumbersOutlined"
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined"
import SellOutlinedIcon from "@mui/icons-material/SellOutlined"
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import SectionLabel from "../SectionLabel"
import type { InventoryItem } from "../../types/inventory"
import {
  presentNumber,
  presentText,
  presentTimestamp,
  unitSuffix,
} from "../../utils/inventoryPresentation"
import ItemAttribute from "./ItemAttribute"

export default function ItemDetails({ item }: { item: InventoryItem }) {
  const itemName = presentText(item.name)
  const currentQuantity =
    item.value === null ? "--" : `${item.value}${unitSuffix(item.unit)}`

  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: { xs: 3, sm: 5 }, py: { xs: 4, sm: 5 } }}>
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <SectionLabel icon={<Inventory2OutlinedIcon color="primary" />}>
              Item detail
            </SectionLabel>
            <Button href="/" startIcon={<ArrowBackIcon />} variant="text">
              Inventory
            </Button>
          </Stack>

          <Box>
            <Typography component="h1" sx={{ fontWeight: 700 }} variant="h3">
              {itemName}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: "wrap", gap: 1, mt: 2 }}
            >
              <Chip
                icon={<SellOutlinedIcon />}
                label={presentText(item.category)}
                variant="outlined"
              />
              <Chip
                icon={<PlaceOutlinedIcon />}
                label={presentText(item.source)}
                variant="outlined"
              />
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Divider />

      <Box sx={{ px: { xs: 3, sm: 5 }, py: { xs: 4, sm: 5 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography color="text.secondary" variant="overline">
              Current quantity
            </Typography>
            <Typography component="p" sx={{ fontWeight: 700 }} variant="h2">
              {currentQuantity}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            }}
          >
            <ItemAttribute
              icon={<StraightenOutlinedIcon color="primary" />}
              label="Unit"
              value={presentText(item.unit)}
            />
            <ItemAttribute
              icon={<NumbersOutlinedIcon color="primary" />}
              label="Low"
              value={presentNumber(item.low)}
            />
            <ItemAttribute
              icon={<NumbersOutlinedIcon color="primary" />}
              label="High"
              value={presentNumber(item.high)}
            />
            <ItemAttribute
              icon={<AccessTimeOutlinedIcon color="primary" />}
              label="Last updated"
              value={presentTimestamp(item.last_updated_at)}
            />
          </Box>
        </Stack>
      </Box>
    </Paper>
  )
}
