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
import { ColorMode } from "../common/types";

type VuetifyInstance = ReturnType<typeof createVuetify>;

let vuetifyInstance: VuetifyInstance | undefined;

export function isDarkMode() {
  const colorMode: ColorMode = getConfigByKey("colorMode");
  switch (colorMode) {
    case "light":
      return false;
    case "dark":
      return true;
    case "auto":
      if (window.matchMedia("(prefers-color-scheme:dark)").matches) {
        return true;
      } else {
        return false;
      }
  }
}

function getVuetifyThemeName() {
  const colorMode: ColorMode = getConfigByKey("colorMode");
  return colorMode === "auto" ? "system" : colorMode;
}

function getThemes() {
  return {
    light: {
      colors: {
        primary: getConfigByKey("primaryColor")?.light || "#1976D2",
      },
    },
    dark: {
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
  theme.themes.value = {
    ...currentThemes,
    light: {
      ...currentThemes.light,
      colors: {
        ...currentThemes.light.colors,
        primary: themes.light.colors.primary,
      },
    },
    dark: {
      ...currentThemes.dark,
      colors: {
        ...currentThemes.dark.colors,
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
