import { FormEvent, useEffect, useState } from "react"
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

import ThemeToggle from "../components/ThemeToggle"
import type { SessionResponse } from "../types/account"
import { jsonHeadersWithCsrf } from "../utils/csrf"

export default function SignInPage() {
  const [emailAddress, setEmailAddress] = useState("")
  const [password, setPassword] = useState("")
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        // The form remains usable when the session check cannot complete.
      }

      if (!controller.signal.aborted) {
        setIsCheckingSession(false)
      }
    }

    checkSession()

    return () => controller.abort()
  }, [])

  async function submitSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/v1/session", {
        method: "POST",
        headers: jsonHeadersWithCsrf(),
        body: JSON.stringify({
          email_address: emailAddress,
          password,
        }),
      })

      if (!response.ok) {
        setError("Try another email address or password.")
        return
      }

      ;(await response.json()) as SessionResponse
      window.location.href = "/"
    } catch {
      setError("Unable to sign in right now.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
            <Stack
              component="form"
              onSubmit={submitSignIn}
              spacing={3}
            >
              <Stack spacing={1}>
                <Typography component="h1" variant="h4">
                  Sign in to Tally
                </Typography>
                <Typography color="text.secondary" variant="body1">
                  Use your account to manage the shared inventory.
                </Typography>
              </Stack>
              {error ? <Alert severity="error">{error}</Alert> : null}
              <Stack spacing={2}>
                <TextField
                  autoComplete="email"
                  autoFocus
                  disabled={isSubmitting}
                  fullWidth
                  label="Email address"
                  name="email_address"
                  onChange={(event) => setEmailAddress(event.target.value)}
                  required
                  type="email"
                  value={emailAddress}
                />
                <TextField
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  fullWidth
                  label="Password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </Stack>
              <Button
                disabled={isSubmitting}
                endIcon={
                  isSubmitting ? (
                    <CircularProgress color="inherit" size={18} />
                  ) : (
                    <LoginOutlinedIcon />
                  )
                }
                size="large"
                type="submit"
                variant="contained"
              >
                Sign in
              </Button>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  )
}
