import type { ComplexStyleRule } from "@vanilla-extract/css";

/**
 * Shared focus ring styles (oreo-focus pattern)
 * Uses lightest and darkest theme tokens for maximum contrast on all backgrounds
 *
 * See:
 * - https://www.erikkroes.nl/blog/the-universal-focus-state/
 * - https://www.sarasoueidan.com/blog/focus-indicators/
 */
export const focusRingStyles = {
  outline: "1px solid var(--color-focus-default)",
} as const;

/**
 * Universal focus state - applies to the element itself when focused
 * Use for standalone focusable elements (buttons, inputs without wrappers, links)
 */
export const universalFocus: ComplexStyleRule = {
  ":focus-visible": focusRingStyles,
};
