import { createPinia, defineStore } from "pinia";
import { emptySharedResult } from "@/common/translate/types";
import { emptyDictResult } from "@/common/dictionary/types";
import { zh_cn, en } from "@/common/locales";

export const pinia = createPinia();

function toLocaleObject(locale: any) {
  if (locale instanceof Map) {
    return Object.fromEntries(locale);
  }
  return locale || {};
}

export const useAppStore = defineStore("app", {
  state: () => ({
    status: "None",
    sharedResult: emptySharedResult(),
    dictResult: emptyDictResult(),
    config: {} as any,
    locale: toLocaleObject(zh_cn),
    localeSetting: "zh-CN",
    locales: [
      { lang: "zh-CN", localeName: zh_cn.get("localeName") || "简体中文" },
      { lang: "en", localeName: en.get("localeName") || "English" },
    ],
    languages: { sources: [] as string[], targets: [] as string[] },
    resultBuffer: {} as any,
  }),
  actions: {
    setShared(sharedResult: any) {
      this.sharedResult = sharedResult;
    },
    setDictResult(dictResult: any) {
      this.dictResult = dictResult;
    },
    setStatus(status: any) {
      this.status = status;
    },
    setLanguages(languages: any) {
      this.languages = languages;
    },
    setResultBuffer(resultBuffer: any) {
      this.resultBuffer = resultBuffer;
    },
    setConfig(config: any) {
      this.config = config;
    },
    updateConfig(config: any) {
      for (const key of Object.keys(config)) {
        this.config[key] = config[key];
      }
    },
    updateLocale(locale: any) {
      this.locale = toLocaleObject(locale);
    },
    updateLocales(locales: any) {
      this.locales = locales;
    },
    updateLocaleSetting(localeSetting: any) {
      this.localeSetting = localeSetting;
    },
  },
});

// Vuex compatibility wrapper for existing TypeScript logic
class StoreWrapper {
  private _store: any = null;

  private get store() {
    if (!this._store) {
      this._store = useAppStore(pinia);
    }
    return this._store;
  }

  get state() {
    return this.store;
  }

  get getters() {
    const s = this.store;
    return {
      keys: Object.keys(s.config),
      locale: s.locale || s.config.locale || {},
      locales: s.locales || [],
      localeSetting: s.localeSetting || s.config.localeSetting,
    };
  }

  dispatch(actionName: string, payload: any) {
    if (this.store[actionName]) {
      this.store[actionName](payload);
    }
  }

  commit(mutationName: string, payload: any) {
    if (this.store[mutationName]) {
      this.store[mutationName](payload);
    }
  }
}

const store = new StoreWrapper();
export default store;

export function getConfigByKey(key: any) {
  return store.state.config[key];
}
export const initState = () => {};
export const observePlugin = () => {};
export const updateViewPlugin = () => {};
export { observers, restoreFromConfig } from "./plugins/observe";
