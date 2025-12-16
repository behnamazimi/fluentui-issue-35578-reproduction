export const ButtonVariants = ["solid", "subtle", "outline", "ghost"] as const;
export type ButtonVariant = (typeof ButtonVariants)[number];

export const ButtonColors = ["primary", "neutral", "danger"] as const;
export type ButtonColor = (typeof ButtonColors)[number];

export const ButtonSizes = ["sm", "md", "lg"] as const;
export type ButtonSize = (typeof ButtonSizes)[number];

// Defaults derived from the same source
export const DEFAULT_BUTTON_VARIANT: ButtonVariant = "solid";
export const DEFAULT_BUTTON_COLOR: ButtonColor = "primary";
export const DEFAULT_BUTTON_SIZE: ButtonSize = "lg";
