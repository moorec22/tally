import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn, userEvent, within } from "storybook/test"

import type { InventoryItem } from "../../types/inventory"
import InventoryItemRow from "./InventoryItemRow"

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
  id: 43,
  name: "Thermal shipping label rolls for the front counter",
  category: "Warehouse receiving and outbound shipping",
  unit: "rolls",
  value: 8,
  last_updated_at: null,
}

const lowStockItem: InventoryItem = {
  ...item,
  id: 44,
  name: "antacids",
  category: "First Aid",
  unit: null,
  low: 5,
  value: 4,
  last_updated_at: "2026-08-03T00:10:18.941Z",
}

const meta = {
  component: InventoryItemRow,
  args: {
    item,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Inventory list row shown in browsing mode and inventory-taking mode.",
      },
    },
  },
} satisfies Meta<typeof InventoryItemRow>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  render: (args) => (
    <ul style={{ margin: 0, padding: 0 }}>
      <InventoryItemRow {...args} />
    </ul>
  ),
  globals: {
    viewport: { value: "desktop" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole("link", { name: /Printer Paper/i })).toBeVisible()
  },
}

export const SmallMobile: Story = {
  args: {
    item: longItem,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
  render: (args) => (
    <ul style={{ margin: 0, padding: 0 }}>
      <InventoryItemRow {...args} />
    </ul>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole("link", { name: /Thermal shipping label rolls/i }),
    ).toBeVisible()
  },
}

export const LowStockMobile: Story = {
  args: {
    item: lowStockItem,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
  render: (args) => (
    <ul style={{ margin: 0, padding: 0 }}>
      <InventoryItemRow {...args} />
    </ul>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const quantity = canvas.getByText("4")
    const lowStockBadge = canvas.getByText("Low stock").closest(".MuiChip-root")

    if (!lowStockBadge) {
      throw new Error("Low stock badge root was not rendered.")
    }

    const quantityBounds = quantity.getBoundingClientRect()
    const badgeBounds = lowStockBadge.getBoundingClientRect()

    await expect(
      Math.abs(quantityBounds.right - badgeBounds.right),
    ).toBeLessThan(1)
  },
}

export const InventoryTakingMobile: Story = {
  args: {
    draftEntry: { note: "", value: "" },
    isInventoryActive: true,
    item: longItem,
    onDraftChange: fn(),
  },
  globals: {
    viewport: { value: "mobile1" },
  },
  render: (args) => (
    <ul style={{ margin: 0, padding: 0 }}>
      <InventoryItemRow {...args} />
    </ul>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.type(canvas.getByLabelText(/Counted quantity/i), "12")
    await expect(args.onDraftChange).toHaveBeenCalled()
  },
}
