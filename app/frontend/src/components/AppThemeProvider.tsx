import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import CssBaseline from "@mui/material/CssBaseline"
import { ThemeProvider } from "@mui/material/styles"

import { createAppTheme, type AppThemeMode } from "../theme"

export const THEME_MODE_STORAGE_KEY = "tally.themeMode"

type AppThemeContextValue = {
  mode: AppThemeMode
  toggleMode: () => void
}

const AppThemeContext = createContext<AppThemeContextValue | undefined>(
  undefined,
)

function isAppThemeMode(value: string | null): value is AppThemeMode {
  return value === "light" || value === "dark"
}

function storedThemeMode() {
  try {
    const value = window.localStorage.getItem(THEME_MODE_STORAGE_KEY)
    return isAppThemeMode(value) ? value : undefined
  } catch {
    return undefined
  }
}

function systemThemeMode(): AppThemeMode {
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }

  return "light"
}

function initialThemeMode() {
  return storedThemeMode() ?? systemThemeMode()
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppThemeMode>(initialThemeMode)
  const theme = useMemo(() => createAppTheme(mode), [mode])

  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)")

    if (!mediaQuery) {
      return undefined
    }

    function handleSystemThemeChange(event: MediaQueryListEvent) {
      if (!storedThemeMode()) {
        setMode(event.matches ? "dark" : "light")
      }
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange)
    }
  }, [])

  const value = useMemo<AppThemeContextValue>(
    () => ({
      mode,
      toggleMode: () => {
        setMode((currentMode) => {
          const nextMode = currentMode === "dark" ? "light" : "dark"

          try {
            window.localStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode)
          } catch {
            // The UI should still update if browser storage is unavailable.
          }

          return nextMode
        })
      },
    }),
    [mode],
  )

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  )
}

export function useAppTheme() {
  const context = useContext(AppThemeContext)

  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider")
  }

  return context
}
