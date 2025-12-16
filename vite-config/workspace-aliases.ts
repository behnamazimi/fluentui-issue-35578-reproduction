import path from "path";

/**
 * Configuration for workspace package aliases.
 * Maps package names to their source file paths relative to workspace root.
 */
interface WorkspacePackageConfig {
  /** Package name (e.g., "@scope/package-name") */
  packageName: string;
  /** Path to source entry point relative to workspace root */
  sourcePath: string;
}

/**
 * Default workspace packages that should resolve to source files in dev/test.
 *
 * This configuration forces Vite to resolve internal workspace packages to their
 * source files instead of built dist files, overriding package.json exports.
 *
 * This is necessary because:
 * 1. Vite prioritizes package.json exports over TypeScript path mappings
 * 2. We want dev/test environments to use source files for faster feedback
 * 3. Production builds still use built packages via proper dependsOn configuration
 */
const DEFAULT_WORKSPACE_PACKAGES: WorkspacePackageConfig[] = [];

/**
 * Creates Vite resolve.alias configuration for workspace packages.
 *
 * @param workspaceRoot - The root directory of the monorepo workspace
 * @param packages - Optional custom package configurations (defaults to DEFAULT_WORKSPACE_PACKAGES)
 * @returns Vite alias configuration object
 *
 * @example
 * ```ts
 * // Use default packages
 * const aliases = createWorkspaceAliases(workspaceRoot);
 *
 * // Use custom packages
 * const aliases = createWorkspaceAliases(workspaceRoot, [
 *   { packageName: "@scope/my-package", sourcePath: "packages/my-package/src/index.ts" }
 * ]);
 * ```
 */
export function createWorkspaceAliases(
  workspaceRoot: string,
  packages: WorkspacePackageConfig[] = DEFAULT_WORKSPACE_PACKAGES
): Record<string, string> {
  return packages.reduce(
    (aliases, pkg) => {
      aliases[pkg.packageName] = path.resolve(workspaceRoot, pkg.sourcePath);
      return aliases;
    },
    {} as Record<string, string>
  );
}

/**
 * Resolves the workspace root directory from a given path.
 *
 * @param fromPath - The starting path (typically __dirname)
 * @param levelsUp - Number of directory levels to traverse upward
 * @returns Absolute path to the workspace root
 *
 * @example
 * ```ts
 * // From packages/components/vitest.config.ts (2 levels up)
 * const root = resolveWorkspaceRoot(__dirname, 2);
 *
 * // From apps/storybook/.storybook/main.ts (3 levels up)
 * const root = resolveWorkspaceRoot(__dirname, 3);
 * ```
 */
export function resolveWorkspaceRoot(
  fromPath: string,
  levelsUp: number
): string {
  let root = fromPath;
  for (let i = 0; i < levelsUp; i++) {
    root = path.resolve(root, "..");
  }
  return root;
}

/**
 * Convenience function that combines resolveWorkspaceRoot and createWorkspaceAliases.
 *
 * @param fromPath - The starting path (typically __dirname)
 * @param levelsUp - Number of directory levels to traverse upward
 * @param packages - Optional custom package configurations
 * @returns Vite alias configuration object
 *
 * @example
 * ```ts
 * // Simple usage
 * export default defineConfig({
 *   resolve: {
 *     alias: getWorkspaceAliases(__dirname, 2),
 *   },
 * });
 * ```
 */
export function getWorkspaceAliases(
  fromPath: string,
  levelsUp: number,
  packages?: WorkspacePackageConfig[]
): Record<string, string> {
  const workspaceRoot = resolveWorkspaceRoot(fromPath, levelsUp);
  return createWorkspaceAliases(workspaceRoot, packages);
}
