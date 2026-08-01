import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import type { InventoryItem } from "../../types/inventory"
import ItemDetails from "./ItemDetails"

const item: InventoryItem = {
  id: 42,
  name: "Printer Paper",
  category: "Office supplies",
  unit: "reams",
  preferred_source: "Supply closet",
  low: 5,
  high: 30,
  value: 20,
  last_updated_at: "2026-01-02T15:04:00.000Z",
}

const longItem: InventoryItem = {
  ...item,
  name: "Thermal shipping label rolls for the front counter",
  preferred_source: "Receiving cage by the loading dock",
}

const meta = {
  component: ItemDetails,
  args: {
    item,
    onSave: fn(async () => undefined),
  },
} satisfies Meta<typeof ItemDetails>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  globals: {
    viewport: { value: "desktop" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole("heading", { name: "Printer Paper" })).toBeVisible()
  },
}

export const SmallMobile: Story = {
  args: {
    item: longItem,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole("heading", {
        name: "Thermal shipping label rolls for the front counter",
      }),
    ).toBeVisible()
  },
}

export const EditingMobile: Story = {
  args: {
    item: longItem,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole("button", { name: "Edit" }))
    await expect(canvas.getByLabelText("Category")).toBeVisible()
    await expect(canvas.getByRole("button", { name: "Save" })).toBeVisible()
  },
}
