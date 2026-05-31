import { createTheme } from "@mui/material/styles"

export const theme = createTheme({
  palette: {
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
  },
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
})
