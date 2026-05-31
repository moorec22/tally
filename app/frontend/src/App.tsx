import HomePage from "./pages/HomePage"
import ItemDetailPage from "./pages/ItemDetailPage"
import NotFoundPage from "./pages/NotFoundPage"

const itemPathPattern = /^\/items\/([^/]+)\/?$/

export default function App() {
  const itemMatch = window.location.pathname.match(itemPathPattern)

  if (itemMatch) {
    return <ItemDetailPage itemId={itemMatch[1]} />
  }

  if (window.location.pathname === "/") {
    return <HomePage />
  }

  return <NotFoundPage />
}
