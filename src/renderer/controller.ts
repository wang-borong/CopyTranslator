import {
  Category,
  Identifier,
  LayoutType,
  MenuActionType,
  Role,
  layoutTypes,
  roles,
} from "../common/types";
import store, { observers } from "../store";
import bus from "../common/event-bus";
import createApp, { applyThemeFromConfig } from "./createApp";
import router from "../router";
import { getCurrentWindow, type Color } from "@tauri-apps/api/window";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
const openUrl = (url: string) => {
  invoke("open_url", { url }).catch(err => {
    console.error("Failed to open URL:", err);
  });
};
import { TranslateController } from "../main/translate-controller";
import config from "../common/configuration";
import logger, { initLog } from "../common/logger";
import { constants, isLower, version } from "../common/constant";
import { RenController } from "../common/controller";
import simulate from "../main/simulate";
import { en, zh_cn } from "../common/locales";
import {
  type Accelerator,
  loadGlobalShortcuts,
  loadLocalShortcuts,
} from "../common/shortcuts";

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

type GithubRelease = {
  tag_name?: string;
  name?: string;
  html_url?: string;
};

const MIN_NATIVE_WINDOW_OPACITY = 0.25;

const clampNumber = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
};

type ShortcutRegistrationResult = {
  id: string;
  accelerator: string;
  ok: boolean;
  error?: string;
};

type GlobalShortcutPayload = {
  id: string;
  accelerator: string;
};

const modifierAliases: Record<string, string[]> = {
  cmdorctrl: ["cmdorctrl", "commandorcontrol"],
  ctrl: ["ctrl", "control"],
  cmd: ["cmd", "command", "meta", "super"],
  alt: ["alt", "option"],
  shift: ["shift"],
};

const keyAliases: Record<string, string> = {
  esc: "escape",
  spacebar: "space",
  " ": "space",
  arrowup: "up",
  arrowdown: "down",
  arrowleft: "left",
  arrowright: "right",
  del: "delete",
  return: "enter",
  plus: "+",
};

const isMacPlatform = () => /mac|iphone|ipad|ipod/i.test(navigator.platform);

const normalizeShortcutPart = (part: string) => part.trim().toLowerCase().replace(/\s+/g, "");

const normalizeShortcutKey = (key: string) => {
  const normalized = normalizeShortcutPart(key);
  return keyAliases[normalized] || normalized;
};

const acceleratorParts = (accelerator: Accelerator) =>
  accelerator
    .split("+")
    .map(normalizeShortcutPart)
    .filter((part) => part.length > 0);

const hasModifier = (parts: string[], name: keyof typeof modifierAliases) =>
  parts.some((part) => modifierAliases[name].includes(part));

const acceleratorMatchesEvent = (accelerator: Accelerator, event: KeyboardEvent) => {
  const parts = acceleratorParts(accelerator);
  if (parts.length === 0) return false;

  const wantsCmdOrCtrl = hasModifier(parts, "cmdorctrl");
  const wantsCtrl = hasModifier(parts, "ctrl") || (wantsCmdOrCtrl && !isMacPlatform());
  const wantsMeta = hasModifier(parts, "cmd") || (wantsCmdOrCtrl && isMacPlatform());
  const wantsAlt = hasModifier(parts, "alt");
  const wantsShift = hasModifier(parts, "shift");
  const keyPart = parts.find(
    (part) =>
      !Object.values(modifierAliases).some((aliases) => aliases.includes(part))
  );

  if (!keyPart) return false;
  if (event.ctrlKey !== wantsCtrl) return false;
  if (event.metaKey !== wantsMeta) return false;
  if (event.altKey !== wantsAlt) return false;
  if (event.shiftKey !== wantsShift) return false;

  const eventKey = normalizeShortcutKey(event.key);
  const eventCode = normalizeShortcutKey(event.code.replace(/^Key/, "").replace(/^Digit/, ""));
  return normalizeShortcutKey(keyPart) === eventKey || normalizeShortcutKey(keyPart) === eventCode;
};

const isEditableShortcutTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
};

export class RendererController extends RenController {
  private static _instance: RendererController;
  app: any;
  keys: Identifier[] = [];
  transCon = new TranslateController(this as any);
  proxy: any = this; // Self-reference for compatibility with code calling proxy
  private globalShortcutUnlisten: UnlistenFn | null = null;
  private localShortcutHandler: ((event: KeyboardEvent) => void) | null = null;

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
    this.applyNativeTransparency();
    this.reloadShortcuts();
    bus.at("initialized");

    if (initError) {
      this.toast(this.text("configLoadFailed", "配置加载失败，已使用默认配置"), true);
    }

    try {
      await this.transCon.init();
      if (this.get<boolean>("autoCheckUpdate")) {
        this.checkUpdate(true);
      }
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

  private applyNativeTransparency() {
    const transparentBackground: Color = [0, 0, 0, 0];
    const transparency = clampNumber(Number(this.get<number>("transparency") || 0), 0, 1);
    const windowOpacity = clampNumber(
      1 - transparency,
      MIN_NATIVE_WINDOW_OPACITY,
      1
    );
    Promise.allSettled([
      getCurrentWindow().setBackgroundColor(transparentBackground),
      getCurrentWebview().setBackgroundColor(transparentBackground),
      invoke("set_window_opacity", { opacity: windowOpacity }),
    ]).then((results) => {
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const target = ["window", "webview", "opacity"][index] || "native";
          console.warn(`Failed to apply transparent ${target} background:`, result.reason);
        }
      });
    });
  }

  private dispatchShortcut(id: string) {
    this.action.dispatch(id as Identifier);
  }

  private canHandleLocalShortcut(id: string, target: EventTarget | null) {
    if (roles.includes(id as Role)) {
      return false;
    }
    if (!isEditableShortcutTarget(target)) {
      return true;
    }
    return ["hideWindow", "closeWindow"].includes(id);
  }

  private bindLocalShortcuts(shortcuts: Map<string, Accelerator>) {
    if (this.localShortcutHandler) {
      document.removeEventListener("keydown", this.localShortcutHandler, true);
    }

    this.localShortcutHandler = (event: KeyboardEvent) => {
      if (event.repeat) return;
      for (const [id, accelerator] of shortcuts.entries()) {
        const normalizedAccelerator = String(accelerator || "").trim();
        if (!normalizedAccelerator || !this.canHandleLocalShortcut(id, event.target)) {
          continue;
        }
        if (acceleratorMatchesEvent(normalizedAccelerator, event)) {
          event.preventDefault();
          event.stopPropagation();
          this.dispatchShortcut(id);
          return;
        }
      }
    };
    document.addEventListener("keydown", this.localShortcutHandler, true);
  }

  private async bindGlobalShortcuts(shortcuts: Map<string, Accelerator>) {
    if (this.globalShortcutUnlisten) {
      this.globalShortcutUnlisten();
      this.globalShortcutUnlisten = null;
    }

    this.globalShortcutUnlisten = await listen<GlobalShortcutPayload>(
      "global-shortcut",
      (event) => {
        if (event.payload?.id) {
          this.dispatchShortcut(event.payload.id);
        }
      }
    );

    const registrations = Array.from(shortcuts.entries())
      .map(([id, accelerator]) => ({
        id,
        accelerator: String(accelerator || "").trim(),
      }))
      .filter(({ accelerator }) => accelerator.length > 0);
    const results = (await invoke("configure_global_shortcuts", {
      shortcuts: registrations,
    })) as ShortcutRegistrationResult[];
    const failed = results.filter((result) => !result.ok);
    if (failed.length > 0) {
      const first = failed[0];
      this.toast(
        `${this.text("shortcutRegisterFailed", "快捷键注册失败")}: ${first.accelerator}`,
        true
      );
      console.warn("Failed to register shortcuts:", failed);
    }
  }

  async reloadShortcuts() {
    try {
      this.bindLocalShortcuts(loadLocalShortcuts());
      await this.bindGlobalShortcuts(loadGlobalShortcuts());
    } catch (err) {
      console.warn("Failed to reload shortcuts:", err);
      this.toast(this.text("shortcutReloadFailed", "快捷键加载失败"), true);
    }
  }

  private normalizeReleaseTag(tag: string) {
    const trimmed = tag.trim();
    return trimmed.startsWith("v") ? trimmed : `v${trimmed}`;
  }

  private async checkUpdate(auto = false) {
    if (!auto) {
      this.toast(this.text("updateChecking", "正在检查更新"), true);
    }
    try {
      const response = await fetch(constants.githubLatestReleaseApi, {
        headers: {
          Accept: "application/vnd.github+json",
        },
      });
      if (!response.ok) {
        throw new Error(`GitHub release API returned ${response.status}`);
      }
      const release = (await response.json()) as GithubRelease;
      const latestTag = this.normalizeReleaseTag(release.tag_name || "");
      if (!latestTag || latestTag === "v") {
        throw new Error("GitHub release tag is empty");
      }
      const currentTag = `v${constants.version}`;
      if (isLower(currentTag, latestTag)) {
        const releaseName = release.name || latestTag;
        this.toast(
          `${this.text("updateAvailable", "发现新版本")}: ${releaseName}`,
          true
        );
        if (!auto) {
          openUrl(release.html_url || constants.githubReleases);
        }
      } else if (!auto) {
        this.toast(this.text("updateCurrent", "当前已是最新版本"), true);
      }
    } catch (err) {
      console.error("Failed to check GitHub releases:", err);
      this.toast(this.text("updateCheckFailed", "检查更新失败"), true);
      if (!auto) {
        openUrl(constants.githubReleases);
      }
    }
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
      case "checkUpdate":
        this.checkUpdate(false);
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
      case "colorMode":
        applyThemeFromConfig();
        this.applyNativeTransparency();
        break;
      case "backgroundColor":
      case "transparency":
        this.applyNativeTransparency();
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
