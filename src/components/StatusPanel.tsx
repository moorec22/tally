import type { ReactNode } from "react"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

export default function StatusPanel({
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
