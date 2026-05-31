import { defineConfig } from "vitest/config"

export default defineConfig({
  root: "app/frontend",
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
  },
})
