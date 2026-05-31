import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import PageShell from "../components/PageShell"
import SectionLabel from "../components/SectionLabel"

export default function HomePage() {
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
