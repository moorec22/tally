import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"

import ItemCreateDialog from "./ItemCreateDialog"

const meta = {
  component: ItemCreateDialog,
  args: {
    onClose: fn(),
    onCreate: fn(async () => undefined),
    open: true,
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ItemCreateDialog>

export default meta
type Story = StoryObj<typeof meta>

export const SmallMobile: Story = {
  globals: {
    viewport: { value: "mobile1" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)

    await waitFor(() => expect(canvas.getByText("Add Item")).toBeVisible())
    await userEvent.type(canvas.getByLabelText(/Name/i), "Shipping labels")
    await userEvent.type(canvas.getByLabelText(/Category/i), "Shipping")
    await userEvent.type(canvas.getByLabelText(/Unit/i), "rolls")
    await expect(canvas.getByRole("button", { name: "Create" })).toBeVisible()
  },
}

export const Desktop: Story = {
  globals: {
    viewport: { value: "desktop" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)

    await waitFor(() => expect(canvas.getByText("Add Item")).toBeVisible())
  },
}
