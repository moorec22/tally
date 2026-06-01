import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined"
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"

import { useAppTheme } from "./AppThemeProvider"

export default function ThemeToggle() {
  const { mode, toggleMode } = useAppTheme()
  const isDarkMode = mode === "dark"
  const label = isDarkMode ? "Switch to light mode" : "Switch to dark mode"

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        color="primary"
        onClick={toggleMode}
        size="large"
      >
        {isDarkMode ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  )
}
