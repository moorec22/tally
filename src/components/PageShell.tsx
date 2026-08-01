import { useState, type ReactNode } from "react"
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined"
import Box from "@mui/material/Box"
import Container from "@mui/material/Container"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"

import ThemeToggle from "./ThemeToggle"

export default function PageShell({ children }: { children: ReactNode }) {
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function signOut() {
    setIsSigningOut(true)
    window.location.href = "/cdn-cgi/access/logout?returnTo=/sign-in"
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        py: { xs: 2, sm: 4, md: 10 },
      }}
    >
      <Container
        maxWidth="md"
        sx={{
          px: { xs: 1.5, sm: 3 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1,
            justifyContent: "flex-end",
            mb: { xs: 1, sm: 2 },
          }}
        >
          <Tooltip title="Sign out">
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
          <ThemeToggle />
        </Box>
        {children}
      </Container>
    </Box>
  )
}
