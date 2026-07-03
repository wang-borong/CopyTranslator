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

export default () => {
  const themes = {
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
      defaultTheme: isDarkMode() ? "dark" : "light",
      themes,
    },
  });

  const app = createApp(App);
  app.use(pinia);
  app.use(router);
  app.use(vuetify);
  app.mount("#app");
  return app;
};
