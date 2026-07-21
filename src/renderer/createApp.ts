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
  const theme = vuetifyInstance?.theme;
  if (!theme) {
    return;
  }
  const themes = getThemes();
  const currentThemes = theme.themes.value;
  if (currentThemes.light) {
    currentThemes.light.colors.primary = themes.light.colors.primary;
  }
  if (currentThemes.dark) {
    currentThemes.dark.colors.primary = themes.dark.colors.primary;
  }

  // Do not recreate the theme registry while Vuetify is rendering. WebView2
  // is especially sensitive to the resulting rapid color-scheme/style swap.
  void theme.change(getVuetifyThemeName()).catch((error) => {
    console.error("Failed to change theme:", error);
  });
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
