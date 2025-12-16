import { ComponentReport, ComponentSize } from "./Converter.js";

/**
 * Invisible marker for identifying component-size-report comments in GitLab MRs
 */
export const COMPONENT_SIZE_REPORT_MARKER = "<!-- component-size-report -->";

/**
 * Returns the text of the comment with a table inside
 * This table contains the changes in all component sizes
 *
 * @param branch - report from feature branch
 * @param master - report from master branch
 * @returns comment markdown
 */
export function buildCommentText(
  branch: ComponentReport,
  master: ComponentReport
): string {
  const masterKeys = Object.keys(master);
  const removed = masterKeys.filter((name) => branch[name] === undefined);
  const changed = Object.entries(branch)
    // show only new and updated components
    .filter(([component, size]) => {
      const oldValue = master[component];

      return (
        oldValue === undefined ||
        size.total !== oldValue.total ||
        size.js !== oldValue.js ||
        size.css !== oldValue.css
      );
    });

  const formatSizeChange = (
    size: ComponentSize,
    oldSize: ComponentSize | undefined
  ): string => {
    if (!oldSize) {
      return `🚨 Added`;
    }

    const isChanged = size.total !== oldSize.total;
    if (!isChanged) return "";

    const isLarger = size.total > oldSize.total;
    const difference = `${Math.abs(size.total - oldSize.total)}Kb`;
    const vector = isLarger ? " 💔 +" : " 💚 -";
    return `${vector}${difference}`;
  };

  const formatComponentRow = (
    component: string,
    size: ComponentSize,
    oldSize: ComponentSize | undefined,
    isRemoved = false
  ): string => {
    if (isRemoved && oldSize) {
      return `|${component}|${oldSize.total}Kb 🗑 Removed|
|└─ JS|${oldSize.js}Kb|
|└─ CSS|${oldSize.css}Kb|
`;
    }

    const changeIndicator = formatSizeChange(size, oldSize);
    const isNew = oldSize === undefined;
    const prefix = isNew ? "🚨 " : "";

    let rows = `|${prefix}${component}|${size.total}Kb${changeIndicator ? ` ${changeIndicator}` : ""}|\n`;

    // Add JS and CSS sub-rows
    if (size.js > 0 || size.css > 0) {
      rows += `|└─ JS|${size.js}Kb|\n`;
      if (size.css > 0) {
        rows += `|└─ CSS|${size.css}Kb|\n`;
      }
    }

    return rows;
  };

  if (removed.length === 0 && changed.length === 0)
    return `${COMPONENT_SIZE_REPORT_MARKER}\nNo component size differences\n\n<sub>Please don't reply to this comment, it may be removed by CI.</sub>`;

  let table = changed.reduce((collector, [component, size]) => {
    const oldValue = master[component];
    return collector + formatComponentRow(component, size, oldValue);
  }, "");

  table = removed.reduce(
    (collector, name) =>
      collector + formatComponentRow(name, master[name], master[name], true),
    table
  );

  // Add invisible marker for identifying component-size-report comments
  return `${COMPONENT_SIZE_REPORT_MARKER}
|Component|Size|
|--- |--- |
${table}

<sub>Please don't reply to this comment, it may be removed by CI.</sub>`;
}
