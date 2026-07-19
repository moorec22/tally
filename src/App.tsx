"use client"

import { useEffect, useState } from "react"

import HomePage from "./screens/HomePage"
import ItemDetailPage from "./screens/ItemDetailPage"
import NotFoundPage from "./screens/NotFoundPage"
import SignInPage from "./screens/SignInPage"

const itemPathPattern = /^\/items\/([^/]+)\/?$/

export default function App() {
  const [pathname, setPathname] = useState<string | null>(null)

  useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  if (!pathname) {
    return null
  }

  const itemMatch = pathname.match(itemPathPattern)

  if (itemMatch) {
    return <ItemDetailPage itemId={itemMatch[1]} />
  }

  if (pathname === "/") {
    return <HomePage />
  }

  if (pathname === "/sign-in") {
    return <SignInPage />
  }

  return <NotFoundPage />
}
