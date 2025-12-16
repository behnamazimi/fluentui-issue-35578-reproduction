import type { ComplexStyleRule } from "@vanilla-extract/css";

/**
 * Visually hidden utility - hides content visually while keeping it accessible to screen readers
 * Based on the standard visually hidden pattern used across design systems
 *
 * See:
 * - https://www.a11yproject.com/posts/how-to-hide-content/
 * - https://react-spectrum.adobe.com/react-aria/VisuallyHidden.html
 */
export const visuallyHidden: ComplexStyleRule = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};
