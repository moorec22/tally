import type { ReactElement } from "react"
import { render, type RenderOptions } from "@testing-library/react"

import { AppThemeProvider } from "../../../src/components/AppThemeProvider"

export function renderWithTheme(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AppThemeProvider>{children}</AppThemeProvider>
    ),
    ...options,
  })
}
