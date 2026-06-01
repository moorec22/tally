import type { ReactNode } from "react"
import Box from "@mui/material/Box"
import Container from "@mui/material/Container"

import ThemeToggle from "./ThemeToggle"

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <ThemeToggle />
        </Box>
        {children}
      </Container>
    </Box>
  )
}
