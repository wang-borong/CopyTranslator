import { Identifier } from "../common/types";
import store, { observers, restoreFromConfig } from "../store";
import bus from "../common/event-bus";
import createApp, { isDarkMode } from "./createApp";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
const openUrl = (url: string) => {
  invoke("open_url", { url }).catch(err => {
    console.error("Failed to open URL:", err);
  });
};
import { TranslateController } from "../main/translate-controller";
import config from "../common/configuration";
import logger, { initLog } from "../common/logger";
import { constants, version } from "../common/constant";
import { RenController } from "../common/controller";
import simulate from "../main/simulate";
import { en, zh_cn } from "../common/locales";

const localeMap = {
  "zh-CN": zh_cn,
  "zh-TW": zh_cn,
  en,
} as const;

const formatError = (error: unknown) => {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }
  return error;
};

const mapToLocaleObject = (locale: Map<any, string>) => ({
  ...Object.fromEntries(en),
  ...Object.fromEntries(locale),
});

const getDefaultLocale = () => {
  const language = navigator.language || "en";
  if (language === "zh" || language.startsWith("zh-CN") || language.startsWith("zh-Hans")) {
    return "zh-CN";
  }
  if (language.startsWith("zh-TW") || language.startsWith("zh-Hant")) {
    return "zh-TW";
  }
  return "en";
};

const getLocaleKey = (localeSetting: string) => {
  const key = localeSetting === "auto" ? getDefaultLocale() : localeSetting;
  return Object.prototype.hasOwnProperty.call(localeMap, key) ? key : "en";
};

export class RendererController extends RenController {
  private static _instance: RendererController;
  app: any;
  keys: Identifier[] = [];
  transCon = new TranslateController(this as any);
  proxy: any = this; // Self-reference for compatibility with code calling proxy

  set(identifier: Identifier, value: any): boolean {
    return this.config.set(identifier, value);
  }

  public static getInstance(): RendererController {
    if (this._instance == null) {
      this._instance = new RendererController();
    }
    return this._instance;
  }

  private constructor() {
    super();
    initLog();
    observers.push(this);
    observers.push(this.transCon);

    this.initTauriApp();
  }

  private async initTauriApp() {
    let initError: unknown = null;

    try {
      await this.config.load();
      restoreFromConfig(observers, store.state.config);
    } catch (e) {
      initError = e;
      console.error("Failed to load configuration:", formatError(e));
      try {
        this.config.restoreDefault();
        restoreFromConfig(observers, store.state.config);
      } catch (restoreError) {
        console.error(
          "Failed to restore default configuration:",
          formatError(restoreError)
        );
      }
    }

    this.initApp();
    bus.at("initialized");

    if (initError) {
      this.toast("配置加载失败，已使用默认配置", true);
    }

    try {
      await this.transCon.init();
    } catch (e) {
      console.error("Failed to initialize translation services:", formatError(e));
      this.toast("后台翻译服务初始化失败，请查看控制台日志", true);
    }
  }

  initApp() {
    if (this.app != undefined) {
      return;
    }
    this.app = createApp();
  }

  notify(text: string) {
    if (text.length > 0 && Notification.permission === "granted") {
      new Notification(constants.appName + " " + version, {
        body: text,
      });
    }
  }

  toast(text: string, force: boolean = false) {
    if (force || config.get("toastTip")) {
      console.log("Toast:", text);
      // We will delegate to a global snackbar event that App.vue listens to
      bus.at("global-toast", text);
    }
  }

  private updateLocale(localeSetting: string) {
    const localeKey = getLocaleKey(localeSetting);
    const locale = localeMap[localeKey as keyof typeof localeMap];
    store.dispatch("updateLocales", [
      { lang: "zh-CN", localeName: zh_cn.get("localeName") || "简体中文" },
      { lang: "en", localeName: en.get("localeName") || "English" },
    ]);
    store.dispatch("updateLocaleSetting", localeKey);
    store.dispatch("updateLocale", mapToLocaleObject(locale));
  }

  handle(identifier: Identifier, param: any = null): boolean {
    switch (identifier) {
      case "notify":
        this.notify(param);
        break;
      case "toast":
        this.toast(param);
        break;
      case "translateInput":
        bus.at("translateInput");
        break;
      case "simulateCopy":
        setTimeout(() => {
          this.toast("模拟复制");
          simulate.copy();
        }, 100);
        break;
      case "simulatePaste":
        setTimeout(() => {
          simulate.paste();
        }, 100);
        break;
      case "exit":
        getCurrentWindow().close();
        break;
      case "hideWindow":
        getCurrentWindow().hide();
        break;
      case "showWindow":
        {
          const window = getCurrentWindow();
          window.show();
          window.setFocus();
        }
        break;
      case "minimize":
        getCurrentWindow().minimize();
        break;
      case "homepage":
        openUrl(constants.homepage);
        break;
      case "changelog":
        openUrl(constants.changelogs);
        break;
      case "userManual":
        openUrl(constants.wiki);
        break;
      case "translate":
        this.transCon.translateWithOption({
          text: param as string,
          updateLanguage: true,
          clearResult: true,
          dict: true,
        });
        break;
      case "clear":
        this.transCon.clear();
        break;
      default:
        return this.transCon.handle(identifier, param);
    }
    return true;
  }

  postSet(identifier: Identifier, value: any): boolean {
    switch (identifier) {
      case "primaryColor":
        if (this.app != undefined && this.app.config?.globalProperties?.$vuetify) {
          const theme = this.app.config.globalProperties.$vuetify.theme;
          theme.themes.light.colors.primary = value.light;
          theme.themes.dark.colors.primary = value.dark;
        }
        break;
      case "colorMode":
        if (this.app != undefined && this.app.config?.globalProperties?.$vuetify) {
          const theme = this.app.config.globalProperties.$vuetify.theme;
          theme.global.name.value = isDarkMode() ? "dark" : "light";
        }
        break;
      case "localeSetting":
        this.updateLocale(String(value));
        break;
      case "layoutType":
        bus.at("dispatch", "toast", value.toString() + " 布局");
        break;
      default:
        break;
    }
    return true;
  }
}
