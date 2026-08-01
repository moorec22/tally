import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { expect, within } from "storybook/test"

import StatusPanel from "./StatusPanel"

const meta = {
  component: StatusPanel,
  args: {
    body: "Refresh the page or try again in a moment.",
    icon: <ErrorOutlineOutlinedIcon color="primary" />,
    title: "Unable to load inventory",
  },
} satisfies Meta<typeof StatusPanel>

export default meta
type Story = StoryObj<typeof meta>

export const SmallMobile: Story = {
  globals: {
    viewport: { value: "mobile1" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole("heading", { name: "Unable to load inventory" }),
    ).toBeVisible()
  },
}

export const Desktop: Story = {
  globals: {
    viewport: { value: "desktop" },
  },
}
