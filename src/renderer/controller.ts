import {
  Category,
  Identifier,
  LayoutType,
  MenuActionType,
  layoutTypes,
} from "../common/types";
import store, { observers } from "../store";
import bus from "../common/event-bus";
import createApp, { isDarkMode } from "./createApp";
import router from "../router";
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
    } catch (e) {
      initError = e;
      console.error("Failed to load configuration:", formatError(e));
      try {
        this.config.restoreDefault();
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
      this.toast(this.text("configLoadFailed", "配置加载失败，已使用默认配置"), true);
    }

    try {
      await this.transCon.init();
    } catch (e) {
      console.error("Failed to initialize translation services:", formatError(e));
      this.toast(
        this.text("translationServiceInitFailed", "后台翻译服务初始化失败，请查看控制台日志"),
        true
      );
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

  private text(key: string, fallback: string) {
    return store.getters.locale[key] || fallback;
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

  private enumerateLayouts() {
    const current = config.get<LayoutType>("layoutType");
    const currentIndex = layoutTypes.indexOf(current);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % layoutTypes.length;
    this.set("layoutType", layoutTypes[nextIndex]);
  }

  private restoreMultiDefault(optionType: MenuActionType | Category) {
    const keys = this.action.getKeys(optionType);
    for (const key of keys) {
      this.config.reset(key as Identifier);
    }
  }

  private openConfigTarget(command: "open_config_file" | "open_config_folder") {
    this.config.save();
    invoke(command).catch((err) => {
      console.error(`Failed to run ${command}:`, err);
      this.toast(this.text("configActionFailed", "配置操作失败，请查看控制台日志"), true);
    });
  }

  private applyWindowSetting(action: string, task: Promise<void>) {
    task.catch((err) => {
      console.warn(`Failed to apply window setting ${action}:`, err);
    });
  }

  handle(identifier: Identifier, param: any = null): boolean {
    switch (identifier) {
      case "newConfigSnapshot":
        if (typeof param === "string" && param.length > 0) {
          this.config.newSnapshot(param);
        } else {
          this.toast(this.text("snapshotValidate", "快照名不能为空且不能包含'|'"), true);
        }
        break;
      case "delConfigSnapshot":
        this.config.delSnapshot(param as string);
        break;
      case "configSnapshot":
        this.config.resumeSnapshot(param as string);
        break;
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
          this.toast(this.text("simulateCopyDone", "模拟复制"));
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
      case "closeWindow":
        if (router.currentRoute.value.name === "settings") {
          router.push({ name: "contrast" });
        } else if (config.get("closeAsQuit")) {
          getCurrentWindow().close();
        } else {
          getCurrentWindow().hide();
        }
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
      case "enumerateLayouts":
        this.enumerateLayouts();
        break;
      case "restoreMultiDefault":
        this.restoreMultiDefault(param as MenuActionType | Category);
        break;
      case "restoreDefault":
        if (param == null) {
          this.config.restoreDefault();
        } else {
          this.config.reset(param as Identifier);
        }
        break;
      case "editConfigFile":
        this.openConfigTarget("open_config_file");
        break;
      case "showConfigFolder":
        this.openConfigTarget("open_config_folder");
        break;
      case "settings":
        router.push({
          name: "settings",
          query: typeof param === "string" ? { tab: param } : {},
        });
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
        {
          const layoutName = store.getters.locale[value] || value.toString();
          bus.at(
            "dispatch",
            "toast",
            `${this.text("layoutChanged", "已切换布局")}: ${layoutName}`
          );
        }
        break;
      case "stayTop":
        this.applyWindowSetting(
          "stayTop",
          getCurrentWindow().setAlwaysOnTop(Boolean(value))
        );
        break;
      case "skipTaskbar":
        this.applyWindowSetting(
          "skipTaskbar",
          getCurrentWindow().setSkipTaskbar(Boolean(value))
        );
        break;
      case "ignoreMouseEvents":
        this.applyWindowSetting(
          "ignoreMouseEvents",
          getCurrentWindow().setIgnoreCursorEvents(Boolean(value))
        );
        break;
      default:
        return false;
    }
    return true;
  }
}
