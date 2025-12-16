/**
 * Component size breakdown
 */
export interface ComponentSize {
  js: number; // JS size in KB
  css: number; // CSS size in KB
  total: number; // Total size in KB
}

/**
 * Report object containing component names and their size breakdowns
 */
export type ComponentReport = Record<string, ComponentSize>;

/**
 * Stats entry from vite-bundle-analyzer
 */
interface StatsEntry {
  filename: string;
  parsedSize: number;
  gzipSize?: number;
  brotliSize?: number;
  source?: Array<{
    groups?: Array<{
      filename?: string;
      parsedSize?: number;
    }>;
  }>;
}

/**
 * Utility class for data transformations
 */
export class Converter {
  /**
   * Convert bytes to kilobytes and round up
   * @param bytes - amount of bytes
   * @returns amount of kilobytes
   */
  static bytes2kilobytes(bytes: number): number {
    return Math.ceil(bytes / 1024);
  }

  /**
   * Convert report to text artifact format
   * Format: ComponentName total js css
   * @param report - report containing component sizes
   * @returns artifact text
   */
  static report2artifact(report: ComponentReport): string {
    return Object.entries(report)
      .reduce(
        (collector, [name, sizes]) =>
          `${collector}${name} ${sizes.total} ${sizes.js} ${sizes.css}\n`,
        ""
      )
      .replace(/\n$/, "");
  }

  /**
   * Convert artifact to report
   * Supports both old format (ComponentName total) and new format (ComponentName total js css)
   * @param artifact - artifact in text format
   * @returns object containing report about component sizes
   */
  static artifact2report(artifact: string): ComponentReport {
    if (!artifact || artifact.trim() === "") {
      return {};
    }

    return artifact.split("\n").reduce((collector, line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return collector;

      const parts = trimmedLine.split(/\s+/);
      if (parts.length < 2) {
        console.warn(
          `⚠️  Skipping malformed line in artifact: "${trimmedLine}"`
        );
        return collector;
      }

      const name = parts[0];
      const total = Number(parts[1]);

      if (!name || isNaN(total) || total < 0) {
        console.warn(
          `⚠️  Skipping invalid entry in artifact: "${trimmedLine}"`
        );
        return collector;
      }

      // New format: ComponentName total js css
      if (parts.length >= 4) {
        const js = Number(parts[2]);
        const css = Number(parts[3]);
        if (!isNaN(js) && !isNaN(css)) {
          return {
            ...collector,
            [name]: { js, css, total },
          };
        }
      }

      // Old format: ComponentName total (backward compatibility)
      // Assume all size is JS, no CSS
      return {
        ...collector,
        [name]: { js: total, css: 0, total },
      };
    }, {} as ComponentReport);
  }

  /**
   * Extract component sizes from stats.json array
   * Filters for ES module entries matching pattern: es/[ComponentName]/index.js
   * Also includes CSS file size if present
   * @param stats - array of stats entries from vite-bundle-analyzer
   * @returns object containing component names and their size breakdowns in KB
   */
  static extractComponentSizes(stats: StatsEntry[]): ComponentReport {
    const componentReport: ComponentReport = {};

    // Pattern to match ES module component entries: es/ComponentName/index.js
    const componentPattern = /^es\/([^/]+)\/index\.js$/;

    for (const entry of stats) {
      const match = entry.filename.match(componentPattern);
      if (!match) continue;

      const componentName = match[1];
      const jsSize = entry.parsedSize || 0;

      // Look for corresponding CSS file
      // CSS files are typically lowercase: es/banner/banner.css
      const componentNameLower = componentName.toLowerCase();
      const cssEntry = stats.find((e) => {
        const filename = e.filename.toLowerCase();
        return (
          filename === `es/${componentNameLower}/${componentNameLower}.css` ||
          filename === `es/${componentName}/${componentNameLower}.css`
        );
      });

      const cssSize = cssEntry ? cssEntry.parsedSize || 0 : 0;
      const totalSize = jsSize + cssSize;

      componentReport[componentName] = {
        js: this.bytes2kilobytes(jsSize),
        css: this.bytes2kilobytes(cssSize),
        total: this.bytes2kilobytes(totalSize),
      };
    }

    return componentReport;
  }
}
