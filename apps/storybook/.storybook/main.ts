import type { StorybookConfig } from "@storybook/react-vite";
import remarkGfm from "remark-gfm";
import path from "path";

import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { mergeConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { getWorkspaceAliases } from "../../../vite-config/workspace-aliases";

const config: StorybookConfig = {
  stories: [
    "./Welcome.mdx",
    "../../../packages/components/**/*.mdx",
    "../../../packages/components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    {
      name: "@storybook/addon-docs",
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "@storybook/addon-themes",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  staticDirs: ["./public"],

  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      // Use absolute path to tsconfig
      tsconfigPath: path.resolve(__dirname, "../../../tsconfig.base.json"),
      // Include all tsx files in packages
      include: [
        path.resolve(__dirname, "../../../packages/**/*.tsx"),
      ],
      // Exclude stories and test files
      exclude: [
        "**/node_modules/**",
        "**/*.stories.tsx",
        "**/*.test.tsx",
      ],
    },
  },

  viteFinal: async (config: UserConfig) =>
    mergeConfig(config, {
      plugins: [react(), nxViteTsPaths(), vanillaExtractPlugin()],
      resolve: {
        alias: getWorkspaceAliases(__dirname, 3),
      },
    }),
};

export default config;

// To customize your Vite configuration you can use the viteFinal field.
// Check https://storybook.js.org/docs/react/builders/vite#configuration
// and https://nx.dev/recipes/storybook/custom-builder-configs
