import React from "react"
import { createRoot } from "react-dom/client"
import CssBaseline from "@mui/material/CssBaseline"
import { ThemeProvider } from "@mui/material/styles"

import App from "../src/App"
import { theme } from "../src/theme"

const rootElement = document.getElementById("root")

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </React.StrictMode>,
  )
}
