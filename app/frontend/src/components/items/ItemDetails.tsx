import { useEffect, useState } from "react"
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import CloseIcon from "@mui/icons-material/Close"
import EditIcon from "@mui/icons-material/Edit"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import NumbersOutlinedIcon from "@mui/icons-material/NumbersOutlined"
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined"
import SaveIcon from "@mui/icons-material/Save"
import SellOutlinedIcon from "@mui/icons-material/SellOutlined"
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

import SectionLabel from "../SectionLabel"
import type { InventoryItem, InventoryItemUpdate } from "../../types/inventory"
import {
  presentNumber,
  presentText,
  presentTimestamp,
  unitSuffix,
} from "../../utils/inventoryPresentation"
import ItemAttribute from "./ItemAttribute"

type ItemDetailsProps = {
  item: InventoryItem
  onSave: (values: InventoryItemUpdate) => Promise<void>
}

type ItemFormValues = {
  category: string
  unit: string
  source: string
  low: string
  high: string
}

function formValuesFromItem(item: InventoryItem): ItemFormValues {
  return {
    category: item.category ?? "",
    unit: item.unit ?? "",
    source: item.source ?? "",
    low: item.low?.toString() ?? "",
    high: item.high?.toString() ?? "",
  }
}

function integerError(value: string) {
  return value.trim() && !/^-?\d+$/.test(value.trim())
    ? "Enter a whole number."
    : ""
}

function textOrNull(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue ? trimmedValue : null
}

function integerOrNull(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue ? Number.parseInt(trimmedValue, 10) : null
}

export default function ItemDetails({ item, onSave }: ItemDetailsProps) {
  const itemName = presentText(item.name)
  const currentQuantity =
    item.value === null ? "--" : `${item.value}${unitSuffix(item.unit)}`
  const [isEditing, setIsEditing] = useState(false)
  const [formValues, setFormValues] = useState<ItemFormValues>(() =>
    formValuesFromItem(item),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const lowError = integerError(formValues.low)
  const highError = integerError(formValues.high)

  useEffect(() => {
    setFormValues(formValuesFromItem(item))
    setIsEditing(false)
    setSaveError("")
  }, [item])

  function updateField(field: keyof ItemFormValues, value: string) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
  }

  function cancelEditing() {
    setFormValues(formValuesFromItem(item))
    setIsEditing(false)
    setSaveError("")
  }

  async function saveChanges() {
    setSaveError("")

    if (lowError || highError) {
      setSaveError("Low and high must be whole numbers.")
      return
    }

    setIsSaving(true)

    try {
      await onSave({
        category: textOrNull(formValues.category),
        unit: textOrNull(formValues.unit),
        source: textOrNull(formValues.source),
        low: integerOrNull(formValues.low),
        high: integerOrNull(formValues.high),
      })
    } catch (error) {
      setSaveError("Unable to save item. Try again.")
    } finally {
      setIsSaving(false)
    }
  }

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
            <Stack direction="row" spacing={1}>
              {isEditing ? (
                <>
                  <Button
                    disabled={isSaving}
                    onClick={cancelEditing}
                    startIcon={<CloseIcon />}
                    type="button"
                    variant="text"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isSaving}
                    onClick={saveChanges}
                    startIcon={<SaveIcon />}
                    type="button"
                    variant="contained"
                  >
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button href="/" startIcon={<ArrowBackIcon />} variant="text">
                    Inventory
                  </Button>
                  <Button
                    onClick={() => setIsEditing(true)}
                    startIcon={<EditIcon />}
                    type="button"
                    variant="contained"
                  >
                    Edit
                  </Button>
                </>
              )}
            </Stack>
          </Stack>

          <Box>
            <Typography component="h1" sx={{ fontWeight: 700 }} variant="h3">
              {itemName}
            </Typography>
            {isEditing ? (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                  mt: 3,
                }}
              >
                <TextField
                  fullWidth
                  label="Category"
                  onChange={(event) =>
                    updateField("category", event.target.value)
                  }
                  value={formValues.category}
                />
                <TextField
                  fullWidth
                  label="Source"
                  onChange={(event) => updateField("source", event.target.value)}
                  value={formValues.source}
                />
              </Box>
            ) : (
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
            )}
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
            {isEditing ? (
              <>
                <TextField
                  fullWidth
                  label="Unit"
                  onChange={(event) => updateField("unit", event.target.value)}
                  value={formValues.unit}
                />
                <TextField
                  error={Boolean(lowError)}
                  fullWidth
                  helperText={lowError}
                  inputMode="numeric"
                  label="Low"
                  onChange={(event) => updateField("low", event.target.value)}
                  value={formValues.low}
                />
                <TextField
                  error={Boolean(highError)}
                  fullWidth
                  helperText={highError}
                  inputMode="numeric"
                  label="High"
                  onChange={(event) => updateField("high", event.target.value)}
                  value={formValues.high}
                />
              </>
            ) : (
              <>
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
              </>
            )}
            <ItemAttribute
              icon={<AccessTimeOutlinedIcon color="primary" />}
              label="Last updated"
              value={presentTimestamp(item.last_updated_at)}
            />
          </Box>
          {saveError ? <Alert severity="error">{saveError}</Alert> : null}
        </Stack>
      </Box>
    </Paper>
  )
}
