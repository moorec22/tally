"use client"

import App from "../src/App"
import { AppThemeProvider } from "../src/components/AppThemeProvider"

export default function Page() {
  return (
    <AppThemeProvider>
      <App />
    </AppThemeProvider>
  )
}
