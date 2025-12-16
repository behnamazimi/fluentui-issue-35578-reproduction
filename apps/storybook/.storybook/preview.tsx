import type { Preview } from "@storybook/react";
import { withTheme } from "./withTheme.decorator";

export const preview: Preview = {
  parameters: {
    a11y: {
      test: "error",
    },
  },
  decorators: [
    withTheme(),
  ],
};

export default preview;
