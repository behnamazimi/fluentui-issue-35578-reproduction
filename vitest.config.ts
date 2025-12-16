import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    passWithNoTests: true, // Allow passing when no tests are found (root config is for extending)
    exclude: ["**/node_modules/**", "**/dist/**", "**/packages/themes/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/*.stories.{ts,tsx}",
      ],
    },
  },
});
