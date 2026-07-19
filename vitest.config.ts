import { defineConfig } from "vitest/config"

export default defineConfig({
  root: ".",
  cacheDir: "node_modules/.vite/frontend-vitest",
  test: {
    environment: "jsdom",
    include: ["tests/frontend/**/*.test.tsx", "tests/worker/**/*.test.ts"],
    setupFiles: ["tests/frontend/support/setup.ts"],
  },
})
