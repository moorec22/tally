import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"

import type { InventoryItemCreate } from "../../types/inventory"

type ItemCreateDialogProps = {
  onClose: () => void
  onCreate: (values: InventoryItemCreate) => Promise<void>
  open: boolean
}

type ItemCreateFormValues = {
  name: string
  category: string
  unit: string
  preferredSource: string
  low: string
  high: string
}

const emptyFormValues: ItemCreateFormValues = {
  name: "",
  category: "",
  unit: "",
  preferredSource: "",
  low: "",
  high: "",
}

function integerError(value: string) {
  return value.trim() && !/^-?\d+$/.test(value.trim())
    ? "Enter a whole number."
    : ""
}

function requiredError(value: string) {
  return value.trim() ? "" : "Required."
}

function textOrNull(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue ? trimmedValue : null
}

function integerOrNull(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue ? Number.parseInt(trimmedValue, 10) : null
}

export default function ItemCreateDialog({
  onClose,
  onCreate,
  open,
}: ItemCreateDialogProps) {
  const [formValues, setFormValues] =
    useState<ItemCreateFormValues>(emptyFormValues)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const nameError = hasSubmitted ? requiredError(formValues.name) : ""
  const categoryError = hasSubmitted ? requiredError(formValues.category) : ""
  const unitError = hasSubmitted ? requiredError(formValues.unit) : ""
  const lowError = integerError(formValues.low)
  const highError = integerError(formValues.high)

  useEffect(() => {
    if (open) {
      return
    }

    setFormValues(emptyFormValues)
    setHasSubmitted(false)
    setSaveError("")
    setIsSaving(false)
  }, [open])

  function updateField(field: keyof ItemCreateFormValues, value: string) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasSubmitted(true)
    setSaveError("")

    if (
      requiredError(formValues.name) ||
      requiredError(formValues.category) ||
      requiredError(formValues.unit)
    ) {
      setSaveError("Name, category, and unit are required.")
      return
    }

    if (lowError || highError) {
      setSaveError("Low and high must be whole numbers.")
      return
    }

    setIsSaving(true)

    try {
      await onCreate({
        name: formValues.name.trim(),
        category: formValues.category.trim(),
        unit: formValues.unit.trim(),
        preferred_source: textOrNull(formValues.preferredSource),
        low: integerOrNull(formValues.low),
        high: integerOrNull(formValues.high),
      })
      onClose()
    } catch {
      setSaveError("Unable to create item. Try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>Add Item</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="create-item-form"
          noValidate
          onSubmit={handleSubmit}
          spacing={2}
          sx={{ pt: 1 }}
        >
          {saveError ? <Alert severity="error">{saveError}</Alert> : null}
          <TextField
            autoFocus
            error={Boolean(nameError)}
            fullWidth
            helperText={nameError}
            label="Name"
            onChange={(event) => updateField("name", event.target.value)}
            required
            value={formValues.name}
          />
          <TextField
            error={Boolean(categoryError)}
            fullWidth
            helperText={categoryError}
            label="Category"
            onChange={(event) => updateField("category", event.target.value)}
            required
            value={formValues.category}
          />
          <TextField
            error={Boolean(unitError)}
            fullWidth
            helperText={unitError}
            label="Unit"
            onChange={(event) => updateField("unit", event.target.value)}
            required
            value={formValues.unit}
          />
          <TextField
            fullWidth
            label="Preferred source"
            onChange={(event) =>
              updateField("preferredSource", event.target.value)
            }
            value={formValues.preferredSource}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={isSaving} onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={isSaving}
          form="create-item-form"
          type="submit"
          variant="contained"
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
}
