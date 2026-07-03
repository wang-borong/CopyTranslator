import { createApp } from "vue";
import App from "../App.vue";
import router from "../router";
import { pinia, getConfigByKey } from "../store";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import { ColorMode, colorModes } from "../common/types";

type VuetifyInstance = ReturnType<typeof createVuetify>;

let vuetifyInstance: VuetifyInstance | undefined;

export function isDarkMode() {
  const colorMode = normalizeColorMode(getConfigByKey("colorMode"));
  switch (colorMode) {
    case "light":
      return false;
    case "dark":
      return true;
    case "auto":
      return window.matchMedia("(prefers-color-scheme:dark)").matches;
  }
}

function normalizeColorMode(value: unknown): ColorMode {
  return colorModes.includes(value as ColorMode) ? (value as ColorMode) : "auto";
}

function getVuetifyThemeName() {
  const colorMode = normalizeColorMode(getConfigByKey("colorMode"));
  if (colorMode === "auto") {
    return isDarkMode() ? "dark" : "light";
  }
  return colorMode;
}

function getThemes() {
  return {
    light: {
      dark: false,
      colors: {
        primary: getConfigByKey("primaryColor")?.light || "#1976D2",
      },
    },
    dark: {
      dark: true,
      colors: {
        primary: getConfigByKey("primaryColor")?.dark || "#2196F3",
      },
    },
  };
}

export function applyThemeFromConfig() {
  const theme = vuetifyInstance?.theme as any;
  if (!theme) {
    return;
  }
  const themes = getThemes();
  const currentThemes = theme.themes.value;
  const currentLight = currentThemes.light || themes.light;
  const currentDark = currentThemes.dark || themes.dark;
  theme.themes.value = {
    ...currentThemes,
    light: {
      ...currentLight,
      dark: false,
      colors: {
        ...currentLight.colors,
        primary: themes.light.colors.primary,
      },
    },
    dark: {
      ...currentDark,
      dark: true,
      colors: {
        ...currentDark.colors,
        primary: themes.dark.colors.primary,
      },
    },
  };
  theme.change(getVuetifyThemeName());
}

export default () => {
  const vuetify = createVuetify({
    components,
    directives,
    icons: {
      defaultSet: "mdi",
      aliases,
      sets: {
        mdi,
      },
    },
    theme: {
      defaultTheme: getVuetifyThemeName(),
      themes: getThemes(),
    },
  });
  vuetifyInstance = vuetify;

  const app = createApp(App);
  app.use(pinia);
  app.use(router);
  app.use(vuetify);
  app.mount("#app");
  return app;
};
