import { useEffect, useState } from "react"
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

import ThemeToggle from "../components/ThemeToggle"

export default function SignInPage() {
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function checkSession() {
      try {
        const response = await fetch("/api/v1/session", {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        })

        if (response.ok) {
          window.location.href = "/"
          return
        }
      } catch {
        // Cloudflare Access owns sign-in. Leave the prompt visible if the
        // identity check cannot complete.
      }

      if (!controller.signal.aborted) {
        setIsCheckingSession(false)
      }
    }

    checkSession()

    return () => controller.abort()
  }, [])

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm">
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <ThemeToggle />
        </Box>
        <Paper component="section" elevation={0} sx={{ p: { xs: 3, sm: 4 } }}>
          {isCheckingSession ? (
            <Box sx={{ display: "grid", minHeight: 320, placeItems: "center" }}>
              <CircularProgress aria-label="Checking session" />
            </Box>
          ) : (
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography component="h1" variant="h4">
                  Sign in to Tally
                </Typography>
                <Typography color="text.secondary" variant="body1">
                  Cloudflare Access protects this inventory. Continue through the
                  access prompt to use Tally.
                </Typography>
              </Stack>
              <Button
                endIcon={<LoginOutlinedIcon />}
                href="/"
                size="large"
                variant="contained"
              >
                Continue
              </Button>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  )
}
