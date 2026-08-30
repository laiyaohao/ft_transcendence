import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    // Browser workflows are executed by Playwright through `test:e2e`; limit
    // Vitest to source tests so it does not collect browser specs or dependency
    // fixture tests during the PR unit suite.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // MUI interaction tests run concurrently and can exceed Vitest's five-second
    // default on developer and container hosts without indicating a deadlock.
    testTimeout: 15_000,
    setupFiles: ["./src/test/setup.ts"],
    server: {
      deps: {
        inline: [/@mui\//, /react-transition-group/],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
    },
  },
});
