import type { Preview } from "@storybook/nextjs-vite"
import { MINIMAL_VIEWPORTS } from "storybook/viewport"

import { AppThemeProvider } from "../src/components/AppThemeProvider"

const preview: Preview = {
  decorators: [
    (Story) => (
      <AppThemeProvider>
        <Story />
      </AppThemeProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: MINIMAL_VIEWPORTS,
    },
  },
}

export default preview
