import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined"
import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import StatusPanel from "../../../src/components/StatusPanel"
import { renderWithTheme } from "../support/renderWithTheme"

describe("StatusPanel", () => {
  it("renders the status message and inventory navigation", () => {
    renderWithTheme(
      <StatusPanel
        icon={<ErrorOutlineOutlinedIcon color="primary" />}
        title="Page not found"
        body="This page is not available in Tally."
      />,
    )

    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText("This page is not available in Tally."),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Inventory" })).toHaveAttribute(
      "href",
      "/",
    )
  })
})
