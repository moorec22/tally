import HomePage from "./pages/HomePage"
import ItemDetailPage from "./pages/ItemDetailPage"
import NotFoundPage from "./pages/NotFoundPage"
import SignInPage from "./pages/SignInPage"

const itemPathPattern = /^\/items\/([^/]+)\/?$/

export default function App() {
  const itemMatch = window.location.pathname.match(itemPathPattern)

  if (itemMatch) {
    return <ItemDetailPage itemId={itemMatch[1]} />
  }

  if (window.location.pathname === "/") {
    return <HomePage />
  }

  if (window.location.pathname === "/sign-in") {
    return <SignInPage />
  }

  return <NotFoundPage />
}
