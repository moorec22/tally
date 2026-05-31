import { defineConfig } from "vitest/config"

export default defineConfig({
  root: "app/frontend",
  cacheDir: "../../node_modules/.vite/app-frontend-vitest",
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
  },
})
