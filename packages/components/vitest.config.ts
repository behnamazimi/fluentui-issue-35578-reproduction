/// <reference types='vitest' />
import { defineConfig } from "vitest/config";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { getWorkspaceAliases } from "../../vite-config/workspace-aliases";

export default defineConfig({
  root: __dirname,
  plugins: [
    react(),
    vanillaExtractPlugin(),
    nxViteTsPaths(),
    svgr({
      svgrOptions: {
        exportType: "default",
      },
      include: ["**/*.svg"],
    }),
  ],
  resolve: {
    alias: getWorkspaceAliases(__dirname, 2),
  },
  test: {
    globals: true,
    environment: "jsdom",
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
