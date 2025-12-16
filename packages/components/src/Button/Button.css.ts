import { recipe } from "@vanilla-extract/recipes";
import { style } from "@vanilla-extract/css";


import { universalFocus } from "../utilities/focus";
import {
  DEFAULT_BUTTON_VARIANT,
  DEFAULT_BUTTON_COLOR,
  DEFAULT_BUTTON_SIZE,
} from "./Button.config";

const DISABLED_SELECTOR = "&:disabled, &[aria-disabled='true']";

export const button = recipe({
  base: [
    {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      cursor: "pointer",
      lineHeight: 1,
      outline: "none",
      gap: "8px",
      minWidth: "100px",
      textDecoration: "none",
      selectors: {
        [DISABLED_SELECTOR]: {
          cursor: "not-allowed",
        },
      },
    },
    style(universalFocus),
  ],
  variants: {
    variant: {
      solid: {},
      subtle: {},
      outline: {
        outlineOffset: -1,
        outlineWidth: 1,
        outlineStyle: "solid",
      },
      ghost: {},
    },
    color: {
      primary: {},
      neutral: {},
      danger: {},
    },
    size: {
      sm: {
        padding: "4px 8px",
      },
      md: {
        padding: "8px 12px",
      },
      lg: {
        padding: "16px 16px",
      },
    },
    iconOnly: {
      true: {
        minWidth: "unset",
      },
      false: {},
    },
  },
  defaultVariants: {
    variant: DEFAULT_BUTTON_VARIANT,
    color: DEFAULT_BUTTON_COLOR,
    size: DEFAULT_BUTTON_SIZE,
  },
});

export const loadingContent = style({
  visibility: "hidden",
  display: "contents",
});

export const loadingSpinner = style({
  position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  inset: 0,
});
