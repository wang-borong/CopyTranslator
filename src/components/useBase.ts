import { computed } from "vue";
import { useAppStore } from "@/store";
import bus from "@/common/event-bus";
import { useTheme } from "vuetify";

export function useBase() {
  const store = useAppStore();
  const theme = useTheme();

  const callback = (...args: any[]) => {
    bus.at("dispatch", ...args);
  };

  const config = computed(() => store.config);
  const trans = computed(() => store.locale || {});
  const sharedResult = computed(() => store.sharedResult);
  const dictResult = computed(() => store.dictResult || {});
  const isDarkTheme = computed(() => theme.global.name.value === "dark");
  
  const set = (key: any, val: any) => {
    (window as any).$controller.set(key, val);
  };

  const titlebarHeightVal = computed(() => store.config.titlebarHeight || 0);
  const titlebarHeight = computed(() => `${titlebarHeightVal.value}px`);

  const openMenu = (id: any) => {
    bus.iat("openMenu", id);
  };

  const fontColor = computed(() => {
    const color = store.config.fontColor || { light: "#000000", dark: "#ffffff" };
    return isDarkTheme.value ? color.dark : color.light;
  });

  const status = computed(() => store.status);

  return {
    callback,
    config,
    trans,
    sharedResult,
    dictResult,
    isDarkTheme,
    set,
    titlebarHeightVal,
    titlebarHeight,
    openMenu,
    fontColor,
    status,
  };
}
