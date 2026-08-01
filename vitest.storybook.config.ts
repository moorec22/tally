import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import { playwright } from "@vitest/browser-playwright"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const currentDirectory = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [
          storybookTest({
            configDir: join(currentDirectory, ".storybook"),
            storybookScript: "yarn storybook --ci --no-open",
          }),
        ],
        test: {
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }],
            provider: playwright({}),
          },
          name: "storybook",
        },
      },
    ],
  },
})
