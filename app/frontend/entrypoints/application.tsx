import React from "react"
import { createRoot } from "react-dom/client"

import App from "../src/App"
import { AppThemeProvider } from "../src/components/AppThemeProvider"

const rootElement = document.getElementById("root")

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </React.StrictMode>,
  )
}
