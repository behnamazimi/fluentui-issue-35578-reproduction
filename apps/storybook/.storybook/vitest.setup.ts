import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/react-vite";
import * as preview from "./preview";

setProjectAnnotations([preview, a11yAddonAnnotations]);
