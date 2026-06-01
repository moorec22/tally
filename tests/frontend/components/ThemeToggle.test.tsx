import { fireEvent, screen } from "@testing-library/react"
import { useTheme } from "@mui/material/styles"
import { afterEach, describe, expect, it, vi } from "vitest"

import { THEME_MODE_STORAGE_KEY } from "../../../app/frontend/src/components/AppThemeProvider"
import ThemeToggle from "../../../app/frontend/src/components/ThemeToggle"
import { renderWithTheme } from "../support/renderWithTheme"

function ThemeModeStatus() {
  const theme = useTheme()

  return <div>Theme mode: {theme.palette.mode}</div>
}

function mockSystemTheme(prefersDark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" && prefersDark,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe("ThemeToggle", () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it("defaults to the system dark mode when no preference is stored", () => {
    mockSystemTheme(true)

    renderWithTheme(<ThemeModeStatus />)

    expect(screen.getByText("Theme mode: dark")).toBeInTheDocument()
  })

  it("defaults to the system light mode when no preference is stored", () => {
    mockSystemTheme(false)

    renderWithTheme(<ThemeModeStatus />)

    expect(screen.getByText("Theme mode: light")).toBeInTheDocument()
  })

  it("toggles the mode and stores the explicit preference", () => {
    mockSystemTheme(false)

    renderWithTheme(
      <>
        <ThemeToggle />
        <ThemeModeStatus />
      </>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }))

    expect(screen.getByText("Theme mode: dark")).toBeInTheDocument()
    expect(window.localStorage.getItem(THEME_MODE_STORAGE_KEY)).toBe("dark")
    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toBeInTheDocument()
  })

  it("uses a stored preference before checking the system mode", () => {
    mockSystemTheme(false)
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, "dark")

    renderWithTheme(<ThemeModeStatus />)

    expect(screen.getByText("Theme mode: dark")).toBeInTheDocument()
  })

})
