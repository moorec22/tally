import { useEffect, useState } from "react"
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined"
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined"

import PageShell from "../components/PageShell"
import StatusPanel from "../components/StatusPanel"
import ItemDetails from "../components/items/ItemDetails"
import ItemLoadingState from "../components/items/ItemLoadingState"
import type { InventoryItem } from "../types/inventory"

type ItemLoadState =
  | { status: "loading" }
  | { status: "loaded"; item: InventoryItem }
  | { status: "not_found" }
  | { status: "error" }

export default function ItemDetailPage({ itemId }: { itemId: string }) {
  const [loadState, setLoadState] = useState<ItemLoadState>({
    status: "loading",
  })

  useEffect(() => {
    const controller = new AbortController()

    async function loadItem() {
      setLoadState({ status: "loading" })

      try {
        const response = await fetch(`/api/v1/items/${itemId}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        })

        if (response.status === 404) {
          setLoadState({ status: "not_found" })
          return
        }

        if (!response.ok) {
          setLoadState({ status: "error" })
          return
        }

        const item = (await response.json()) as InventoryItem
        setLoadState({ status: "loaded", item })
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadState({ status: "error" })
        }
      }
    }

    loadItem()

    return () => controller.abort()
  }, [itemId])

  return (
    <PageShell>
      {loadState.status === "loading" ? <ItemLoadingState /> : null}
      {loadState.status === "loaded" ? (
        <ItemDetails item={loadState.item} />
      ) : null}
      {loadState.status === "not_found" ? (
        <StatusPanel
          icon={<ErrorOutlineOutlinedIcon color="primary" />}
          title="Item not found"
          body="This inventory item could not be found."
        />
      ) : null}
      {loadState.status === "error" ? (
        <StatusPanel
          icon={<WarningAmberOutlinedIcon color="primary" />}
          title="Unable to load item"
          body="Refresh the page or try again in a moment."
        />
      ) : null}
    </PageShell>
  )
}
