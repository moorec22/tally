import { createTheme } from "@mui/material/styles"

export type AppThemeMode = "light" | "dark"

const sharedThemeOptions = {
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: "clamp(3rem, 8vw, 5rem)",
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 1,
    },
    button: {
      fontWeight: 700,
      letterSpacing: 0,
      textTransform: "none",
    },
    overline: {
      letterSpacing: 0,
      textTransform: "uppercase",
    },
  },
} as const

const lightPalette = {
  mode: "light",
  background: {
    default: "#f6f8fb",
    paper: "#ffffff",
  },
  primary: {
    main: "#426b5b",
  },
  secondary: {
    main: "#7b5f3d",
  },
  text: {
    primary: "#202124",
    secondary: "#4f5965",
  },
} as const

const darkPalette = {
  mode: "dark",
  background: {
    default: "#121614",
    paper: "#1d2420",
  },
  primary: {
    main: "#8bb8a4",
  },
  secondary: {
    main: "#d1b17d",
  },
  text: {
    primary: "#f3f6f4",
    secondary: "#b7c1bb",
  },
} as const

export function createAppTheme(mode: AppThemeMode) {
  return createTheme({
    ...sharedThemeOptions,
    palette: mode === "dark" ? darkPalette : lightPalette,
  })
}

export const theme = createAppTheme("light")
