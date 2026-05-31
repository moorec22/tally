import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import App from "./App"
import { renderWithTheme } from "./test/renderWithTheme"

vi.mock("./pages/HomePage", () => ({
  default: () => <div>Home page</div>,
}))

vi.mock("./pages/ItemDetailPage", () => ({
  default: ({ itemId }: { itemId: string }) => <div>Item page {itemId}</div>,
}))

vi.mock("./pages/NotFoundPage", () => ({
  default: () => <div>Not found page</div>,
}))

function setPathname(pathname: string) {
  window.history.pushState({}, "", pathname)
}

describe("App", () => {
  it("renders the home page at the root path", () => {
    setPathname("/")

    renderWithTheme(<App />)

    expect(screen.getByText("Home page")).toBeInTheDocument()
  })

  it("renders the item page with the captured item id", () => {
    setPathname("/items/42")

    renderWithTheme(<App />)

    expect(screen.getByText("Item page 42")).toBeInTheDocument()
  })

  it("renders the not found page for unknown paths", () => {
    setPathname("/somewhere-else")

    renderWithTheme(<App />)

    expect(screen.getByText("Not found page")).toBeInTheDocument()
  })
})
