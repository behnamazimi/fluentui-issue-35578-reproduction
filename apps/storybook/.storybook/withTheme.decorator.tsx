/**
 * Custom Storybook decorator for vanilla-extract themes
 * Follows the guide from @storybook/addon-themes
 * https://github.com/storybookjs/storybook/blob/next/code/addons/themes/docs/api.md
 */
import { DecoratorHelpers } from "@storybook/addon-themes";
import type { Decorator } from "@storybook/react";
import { useLayoutEffect } from "react";

const { initializeThemeState, pluckThemeFromContext } = DecoratorHelpers;

type Theme = "Light" | "Dark";

const defaultTheme: Theme = "Light";
const THEME_STORAGE_KEY = "design-system-theme";
const THEME_STYLESHEET_ID = "theme-stylesheet";

const themeCssMap: Record<Theme, string> = {
  Light: "",
  Dark: "",
};

declare global {
  interface Window {
    __ODS_THEME__?: string;
  }
}

// Preload all theme CSS files so switching is instant
function preloadThemeCss(): void {
  Object.values(themeCssMap).forEach((cssPath) => {
    const existingPreload = document.querySelector(`link[rel="preload"][href="${cssPath}"]`);
    if (existingPreload) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "style";
    link.href = cssPath;
    document.head.appendChild(link);
  });
}

function loadThemeCss(theme: Theme): void {
  const themeCssPath = themeCssMap[theme];
  if (!themeCssPath) return;

  let link = document.getElementById(THEME_STYLESHEET_ID) as HTMLLinkElement | null;
  
  if (!link) {
    link = document.createElement("link");
    link.rel = "stylesheet";
    link.id = THEME_STYLESHEET_ID;
    document.head.appendChild(link);
  }
  
  if (link.href !== themeCssPath) {
    link.href = themeCssPath;
  }
}

function persistTheme(theme: Theme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

// Load initial theme CSS immediately (before React renders)
// Reads from window.__ODS_THEME__ set by preview-head.html
const initialTheme = (window.__ODS_THEME__ as Theme) || defaultTheme;
loadThemeCss(initialTheme);

// Preload other theme CSS for instant switching
preloadThemeCss();

export const withTheme = (): Decorator => {
  const themes: Theme[] = ["Light", "Dark"];
  initializeThemeState(themes, defaultTheme);

  return (story, context) => {
    const selectedTheme = pluckThemeFromContext(context);
    const { themeOverride } = context.parameters.themes ?? {};
    const selected = (themeOverride || selectedTheme || defaultTheme) as Theme;

    useLayoutEffect(() => {
      loadThemeCss(selected);
      persistTheme(selected);
    }, [selected]);

    return story();
  };
};
