/// <reference types="vitest/config" />
import { defineConfig, mergeConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { getWorkspaceAliases } from "../../vite-config/workspace-aliases";
import baseConfig from "./vite.config";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  baseConfig,
  defineConfig({
    resolve: {
      alias: getWorkspaceAliases(__dirname, 2),
    },
    test: {
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, ".storybook"),
            }),
          ],
          test: {
            name: "storybook-a11y",
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [{ browser: "chromium" }],
            },
            setupFiles: [".storybook/vitest.setup.ts"],
          },
          // Without this optimization tests are failing at first run
          optimizeDeps: {
            include: ["@vanilla-extract/recipes/*"],
          },
        },
      ],
    },
  })
);
