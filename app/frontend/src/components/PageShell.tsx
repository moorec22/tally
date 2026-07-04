import { useEffect, useState, type ReactNode } from "react"
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined"
import Box from "@mui/material/Box"
import Container from "@mui/material/Container"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"

import type { Account, SessionResponse } from "../types/account"
import { jsonHeadersWithCsrf } from "../utils/csrf"
import ThemeToggle from "./ThemeToggle"

export default function PageShell({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function loadAccount() {
      try {
        const response = await fetch("/api/v1/session", {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        })

        if (response.status === 401) {
          window.location.href = "/sign-in"
          return
        }

        if (!response.ok) {
          return
        }

        const session = (await response.json()) as SessionResponse
        setAccount(session.account)
      } catch {
        // Account display is useful but not required for the page to work.
      }
    }

    loadAccount()

    return () => controller.abort()
  }, [])

  async function signOut() {
    setIsSigningOut(true)

    try {
      await fetch("/api/v1/session", {
        method: "DELETE",
        headers: jsonHeadersWithCsrf(),
      })
    } finally {
      window.location.href = "/sign-in"
    }
  }

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mb: 2 }}>
          {account ? (
            <Tooltip title={`Sign out ${account.email_address}`}>
              <IconButton
                aria-label="Sign out"
                color="primary"
                disabled={isSigningOut}
                onClick={signOut}
                size="large"
              >
                <LogoutOutlinedIcon />
              </IconButton>
            </Tooltip>
          ) : null}
          <ThemeToggle />
        </Box>
        {children}
      </Container>
    </Box>
  )
}
