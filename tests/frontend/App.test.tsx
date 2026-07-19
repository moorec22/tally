import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import App from "../../src/App"
import { renderWithTheme } from "./support/renderWithTheme"

vi.mock("../../src/screens/HomePage", () => ({
  default: () => <div>Home page</div>,
}))

vi.mock("../../src/screens/ItemDetailPage", () => ({
  default: ({ itemId }: { itemId: string }) => <div>Item page {itemId}</div>,
}))

vi.mock("../../src/screens/NotFoundPage", () => ({
  default: () => <div>Not found page</div>,
}))

function setPathname(pathname: string) {
  window.history.pushState({}, "", pathname)
}

describe("App", () => {
  it("renders the home page at the root path", async () => {
    setPathname("/")

    renderWithTheme(<App />)

    expect(await screen.findByText("Home page")).toBeInTheDocument()
  })

  it("renders the item page with the captured item id", async () => {
    setPathname("/items/42")

    renderWithTheme(<App />)

    expect(await screen.findByText("Item page 42")).toBeInTheDocument()
  })

  it("renders the not found page for unknown paths", async () => {
    setPathname("/somewhere-else")

    renderWithTheme(<App />)

    expect(await screen.findByText("Not found page")).toBeInTheDocument()
  })
})
