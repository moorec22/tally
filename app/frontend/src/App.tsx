import { useEffect, useState, type ReactNode } from "react"
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import NumbersOutlinedIcon from "@mui/icons-material/NumbersOutlined"
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined"
import SellOutlinedIcon from "@mui/icons-material/SellOutlined"
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined"
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Divider from "@mui/material/Divider"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

type InventoryItem = {
  id: number
  name: string | null
  category: string | null
  unit: string | null
  source: string | null
  low: number | null
  high: number | null
  value: number | null
  last_updated_at: string | null
}

type ItemLoadState =
  | { status: "loading" }
  | { status: "loaded"; item: InventoryItem }
  | { status: "not_found" }
  | { status: "error" }

const itemPathPattern = /^\/items\/([^/]+)\/?$/

export default function App() {
  const itemMatch = window.location.pathname.match(itemPathPattern)

  if (itemMatch) {
    return <ItemDetailPage itemId={itemMatch[1]} />
  }

  if (window.location.pathname === "/") {
    return <HomePage />
  }

  return <NotFoundPage />
}

function HomePage() {
  return (
    <PageShell>
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          px: { xs: 3, sm: 5 },
          py: { xs: 4, sm: 6 },
        }}
      >
        <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
          <SectionLabel icon={<Inventory2OutlinedIcon color="primary" />}>
            Inventory
          </SectionLabel>

          <Box>
            <Typography component="h1" variant="h1" gutterBottom>
              Tally
            </Typography>
            <Typography color="text.secondary" variant="body1">
              Track items, quantities, and stock changes from one simple
              workspace.
            </Typography>
          </Box>

          <Button
            color="primary"
            startIcon={<Inventory2OutlinedIcon />}
            variant="contained"
          >
            Manage Inventory
          </Button>
        </Stack>
      </Paper>
    </PageShell>
  )
}

function ItemDetailPage({ itemId }: { itemId: string }) {
  const [loadState, setLoadState] = useState<ItemLoadState>({
    status: "loading",
  })

  useEffect(() => {
    const controller = new AbortController()

    async function loadItem() {
      setLoadState({ status: "loading" })

      try {
        const response = await fetch(`/api/v1/items/${itemId}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        })

        if (response.status === 404) {
          setLoadState({ status: "not_found" })
          return
        }

        if (!response.ok) {
          setLoadState({ status: "error" })
          return
        }

        const item = (await response.json()) as InventoryItem
        setLoadState({ status: "loaded", item })
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadState({ status: "error" })
        }
      }
    }

    loadItem()

    return () => controller.abort()
  }, [itemId])

  return (
    <PageShell>
      {loadState.status === "loading" ? <ItemLoadingState /> : null}
      {loadState.status === "loaded" ? (
        <ItemDetails item={loadState.item} />
      ) : null}
      {loadState.status === "not_found" ? (
        <StatusPanel
          icon={<ErrorOutlineOutlinedIcon color="primary" />}
          title="Item not found"
          body="This inventory item could not be found."
        />
      ) : null}
      {loadState.status === "error" ? (
        <StatusPanel
          icon={<WarningAmberOutlinedIcon color="primary" />}
          title="Unable to load item"
          body="Refresh the page or try again in a moment."
        />
      ) : null}
    </PageShell>
  )
}

function ItemLoadingState() {
  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        px: { xs: 3, sm: 5 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <CircularProgress />
        <Typography color="text.secondary">Loading item...</Typography>
      </Stack>
    </Paper>
  )
}

function ItemDetails({ item }: { item: InventoryItem }) {
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

function ItemAttribute({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <Stack
      spacing={1}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        minWidth: 0,
        p: 2,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        {icon}
        <Typography color="text.secondary" variant="body2">
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ overflowWrap: "anywhere" }} variant="h6">
        {value}
      </Typography>
    </Stack>
  )
}

function NotFoundPage() {
  return (
    <PageShell>
      <StatusPanel
        icon={<ErrorOutlineOutlinedIcon color="primary" />}
        title="Page not found"
        body="This page is not available in Tally."
      />
    </PageShell>
  )
}

function StatusPanel({
  icon,
  title,
  body,
}: {
  icon: ReactNode
  title: string
  body: string
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        px: { xs: 3, sm: 5 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        {icon}
        <Box>
          <Typography component="h1" sx={{ fontWeight: 700 }} variant="h4">
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {body}
          </Typography>
        </Box>
        <Button href="/" startIcon={<ArrowBackIcon />} variant="contained">
          Inventory
        </Button>
      </Stack>
    </Paper>
  )
}

function SectionLabel({
  children,
  icon,
}: {
  children: ReactNode
  icon: ReactNode
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
      {icon}
      <Typography color="primary" sx={{ fontWeight: 700 }} variant="overline">
        {children}
      </Typography>
    </Stack>
  )
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">{children}</Container>
    </Box>
  )
}

function presentText(value: string | null) {
  return value?.trim() ? value : "Not set"
}

function presentNumber(value: number | null) {
  return value === null ? "Not set" : value.toString()
}

function unitSuffix(unit: string | null) {
  return unit?.trim() ? ` ${unit}` : ""
}

function presentTimestamp(value: string | null) {
  if (!value) {
    return "Not counted"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Not set"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}
