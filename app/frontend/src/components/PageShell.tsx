import type { ReactNode } from "react"
import Box from "@mui/material/Box"
import Container from "@mui/material/Container"

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <Box component="main" sx={{ minHeight: "100vh", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">{children}</Container>
    </Box>
  )
}
