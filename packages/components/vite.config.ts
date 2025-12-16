import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import path from "path";
import fs from "fs";
import { analyzer } from "vite-bundle-analyzer";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";

// Function to dynamically discover component entry points
function getComponentEntries() {
  const srcDir = path.resolve(__dirname, "src");
  const entries: Record<string, string> = {};

  // Read all directories in src directory
  const items = fs.readdirSync(srcDir, { withFileTypes: true });

  // Find all directories that contain component files
  items.forEach((item) => {
    if (item.isDirectory() && item.name !== "types") {
      const componentDir = path.resolve(srcDir, item.name);
      const indexPath = path.resolve(componentDir, "index.ts");

      // Check if the directory has an index.ts file
      if (fs.existsSync(indexPath)) {
        entries[item.name] = indexPath;
      } else {
        // If no index.ts, look for the main component file
        const componentFiles = fs.readdirSync(componentDir);
        const mainFile = componentFiles.find(
          (file) =>
            file.endsWith(".tsx") &&
            !file.includes(".stories") &&
            !file.includes(".test")
        );
        if (mainFile) {
          entries[item.name] = path.resolve(componentDir, mainFile);
        }
      }
    }
  });

  return entries;
}

// Function to check if an entry/chunk has a CSS file
// For entries: looks in src/[entryName]/[entryName].css.ts
// For chunks: looks in the same directory as the source file
function hasCssFile(
  entryName: string,
  facadeModuleId?: string | null
): boolean {
  const srcDir = path.resolve(__dirname, "src");

  // First, try the standard entry pattern: src/[entryName]/[entryName].css.ts
  const entryDir = path.resolve(srcDir, entryName);
  if (fs.existsSync(entryDir) && fs.statSync(entryDir).isDirectory()) {
    const files = fs.readdirSync(entryDir);
    const expectedCssFile = `${entryName}.css.ts`;
    const cssFile = files.find(
      (file) => file.toLowerCase() === expectedCssFile.toLowerCase()
    );
    if (cssFile) return true;
  }

  // If not found and we have facadeModuleId (source file path), check in the same directory
  // This handles chunks like _BaseIcon that live inside another component's directory
  if (facadeModuleId) {
    const sourceDir = path.dirname(facadeModuleId);
    if (fs.existsSync(sourceDir) && fs.statSync(sourceDir).isDirectory()) {
      const files = fs.readdirSync(sourceDir);
      const expectedCssFile = `${entryName}.css.ts`;
      const cssFile = files.find(
        (file) => file.toLowerCase() === expectedCssFile.toLowerCase()
      );
      if (cssFile) return true;
    }
  }

  return false;
}

// Cache for all CSS source files discovered in src directory
let cssSourceFilesCache: Map<string, string> | null = null;

// Function to discover all .css.ts files in src directory and build a lookup map
// Maps lowercase base name to original cased base name
function getCssSourceFiles(): Map<string, string> {
  if (cssSourceFilesCache) return cssSourceFilesCache;

  const srcDir = path.resolve(__dirname, "src");
  const cssFiles = new Map<string, string>();

  function scanDirectory(dir: string): void {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.name.endsWith(".css.ts")) {
        // Extract base name (e.g., "_BaseIcon" from "_BaseIcon.css.ts")
        const baseName = item.name.replace(".css.ts", "");
        cssFiles.set(baseName.toLowerCase(), baseName);
      }
    }
  }

  scanDirectory(srcDir);
  cssSourceFilesCache = cssFiles;
  return cssFiles;
}

// Function to get entry name from CSS file name (case-insensitive match)
// Returns the original-cased name for proper directory matching
function getOriginalCasedName(cssFileName: string): string | null {
  const cssBaseName = cssFileName.replace(".css", "");
  const cssSourceFiles = getCssSourceFiles();

  // Look up the original cased name from our discovered CSS files
  return cssSourceFiles.get(cssBaseName.toLowerCase()) ?? null;
}

// Shared assetFileNames function that works for both formats
// Note: Vite 7 requires assetFileNames to be identical across all outputs
// We use a single function that places assets in a shared location
function createAssetFileNames(assetInfo: { name?: string }) {
  if (assetInfo.name?.endsWith(".css")) {
    // Get the original cased name from the source .css.ts file
    // This handles both component entries (e.g., Button) and chunks (e.g., _BaseIcon)
    const originalCasedName = getOriginalCasedName(assetInfo.name);
    if (originalCasedName) {
      // Place CSS files in the same directory as the JS files (preserving original case for directory)
      const cssFileName = originalCasedName.toLowerCase() + ".css";
      // Use [format] placeholder - Vite will replace this with the actual format
      return `[format]/${originalCasedName}/${cssFileName}`;
    }
    // Fallback: use the asset name as-is if no source file found
    const cssName = assetInfo.name.replace(".css", "");
    return `[format]/${cssName}/${cssName.toLowerCase()}.css`;
  }
  return assetInfo.name || "asset";
}

// Plugin to reorganize TypeScript declarations into component directories
function reorganizeDtsPlugin(): Plugin {
  return {
    name: "reorganize-dts",
    writeBundle() {
      const esDir = path.resolve(__dirname, "dist/es");
      const cjsDir = path.resolve(__dirname, "dist/cjs");

      // Function to move declaration files from root to component directories
      function reorganizeDtsFiles(dir: string): void {
        if (!fs.existsSync(dir)) return;

        const entries = fs.readdirSync(dir);

        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);

          // Check if it's a .d.ts file at the root level (e.g., Banner.d.ts)
          // or a .d.ts.map file (e.g., Banner.d.ts.map)
          if (
            !stat.isDirectory() &&
            (entry.endsWith(".d.ts") || entry.endsWith(".d.ts.map"))
          ) {
            const componentName = entry.endsWith(".d.ts.map")
              ? path.basename(entry, ".d.ts.map")
              : path.basename(entry, ".d.ts");
            const componentDir = path.join(dir, componentName);
            const targetFileName = entry.endsWith(".d.ts.map")
              ? "index.d.ts.map"
              : "index.d.ts";
            const targetPath = path.join(componentDir, targetFileName);
            // Only move if the component directory exists (it should, since JS files are there)
            if (fs.existsSync(componentDir)) {
              fs.mkdirSync(componentDir, { recursive: true });
              fs.renameSync(fullPath, targetPath);
            }
          } else if (stat.isDirectory()) {
            // Recursively process subdirectories
            reorganizeDtsFiles(fullPath);
          }
        }
      }

      // Function to copy all .d.ts files from es to cjs, preserving structure
      function copyDtsFiles(dir: string, basePath: string = ""): void {
        if (!fs.existsSync(dir)) return;

        const entries = fs.readdirSync(dir);

        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const relativePath = path.join(basePath, entry);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            copyDtsFiles(fullPath, relativePath);
          } else if (entry.endsWith(".d.ts") || entry.endsWith(".d.ts.map")) {
            const destPath = path.join(cjsDir, relativePath);
            const destDir = path.dirname(destPath);
            fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(fullPath, destPath);
          }
        }
      }

      // First, reorganize declaration files in ES directory
      reorganizeDtsFiles(esDir);

      // Then copy all declarations from ES to CJS
      copyDtsFiles(esDir);
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    svgr({ svgrOptions: { exportType: "default" }, include: ["**/*.svg"] }),
    vanillaExtractPlugin(),
    dts({
      entryRoot: "src",
      outDir: "dist/es",
      include: ["src/**/*"],
      exclude: ["src/**/*.test.*", "src/**/*.stories.*"],
      rollupTypes: true,
      copyDtsFiles: false,
      insertTypesEntry: false,
      tsconfigPath: "./tsconfig.json",
      logLevel: "silent",
    }),
    reorganizeDtsPlugin(),
    analyzer({
      analyzerMode: "json",
      fileName: "../../../reports/stats",
    }),
  ],
  build: {
    lib: {
      entry: getComponentEntries(),
      formats: ["es", "cjs"],
      fileName: (format, entryName) => {
        if (format === "es") {
          return `es/${entryName}/index.js`;
        } else {
          return `cjs/${entryName}/index.js`;
        }
      },
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
      ],
      // Vite 7 requires assetFileNames to be identical across all outputs
      // So we define it at the top level and use separate output configs for other options
      assetFileNames: createAssetFileNames,
      output: [
        {
          format: "es",
          dir: "dist",
          entryFileNames: "es/[name]/index.js",
          chunkFileNames: "es/[name]/[name].js",
          banner: (chunk) => {
            // Only add CSS import for entries/chunks that have CSS files
            if (!chunk.name) return "";

            const entryName = chunk.name;
            // For chunks, facadeModuleId might be null, so we find the source .tsx file from moduleIds
            const sourceModuleId =
              chunk.facadeModuleId ??
              chunk.moduleIds?.find((id) => id.endsWith(".tsx")) ??
              null;
            if (!hasCssFile(entryName, sourceModuleId)) return "";

            const componentName = entryName.toLowerCase();
            return `import './${componentName}.css';`;
          },
        },
        {
          format: "cjs",
          dir: "dist",
          entryFileNames: "cjs/[name]/index.js",
          chunkFileNames: "cjs/[name]/[name].js",
          banner: (chunk) => {
            // Only add CSS import for entries/chunks that have CSS files
            if (!chunk.name) return "";

            const entryName = chunk.name;
            // For chunks, facadeModuleId might be null, so we find the source .tsx file from moduleIds
            const sourceModuleId =
              chunk.facadeModuleId ??
              chunk.moduleIds?.find((id) => id.endsWith(".tsx")) ??
              null;
            if (!hasCssFile(entryName, sourceModuleId)) return "";

            const componentName = entryName.toLowerCase();
            return `require('./${componentName}.css');`;
          },
        },
      ],
    },
    sourcemap: true,
    cssCodeSplit: true,
  },
});
