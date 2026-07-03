import { computed, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
const openUrl = (url: string) => {
  invoke("open_url", { url }).catch(err => {
    console.error("Failed to open URL:", err);
  });
};
import { useBase } from "./useBase";
import eventBus from "@/common/event-bus";
import logger from "@/common/logger";

export function useBaseView(getModifiedText: () => string | undefined) {
  const base = useBase();

  const toKeyan = () => {
    openUrl("https://www.keyanyuedu.com/?channel=copytranslator");
  };

  const toStepfun = () => {
    openUrl("https://www.stepfun.com/?channel=copytranslator");
  };

  const mode = computed(() => {
    if (base.config.value.multiSource) return "diff";
    if (base.config.value.smartDict && base.dictResult.value?.valid) return "dict";
    if (base.status.value === "None") return "none";
    return "normal";
  });

  const currentEngine = computed(() => {
    switch (mode.value) {
      case "dict":
        return base.config.value.dictionaryType;
      case "diff":
        return "copytranslator";
      case "normal":
      case "none":
        return base.config.value.translatorType;
      default:
        return "";
    }
  });

  const multiSource = computed(() => base.config.value.multiSource);
  const layoutType = computed({
    get: () => base.config.value.layoutType,
    set: (val) => base.set("layoutType", val),
  });

  const sharedResult = computed(() => base.sharedResult.value);
  const dictResult = computed(() => base.dictResult.value || {});

  const layoutConfig = computed(() => base.config.value[layoutType.value] || {});
  const sourceSize = computed(() => layoutConfig.value.sourceFontSize || 14);
  const resultSize = computed(() => layoutConfig.value.resultFontSize || 14);
  const diffSize = computed(() => layoutConfig.value.diffFontSize || 14);
  const dictSize = computed(() => layoutConfig.value.dictFontSize || 14);

  const changeFont = (name: string, plus: boolean) => {
    let targetName = name;
    if (name === "result") {
      if (multiSource.value) {
        targetName = "diff";
      } else if (!base.config.value.contrastDict || !dictResult.value.valid) {
      } else if (base.config.value.contrastDict && dictResult.value.valid) {
        targetName = "dict";
      }
    }
    const fontKey = `${targetName}FontSize`;
    const size = base.config.value[layoutType.value][fontKey] || 14;
    updateLayoutConfig({ [fontKey]: plus ? size + 1 : size - 1 });
  };

  const wheelHandler = (e: WheelEvent, name: string) => {
    if (!e.ctrlKey) return;
    if (e.deltaY > 0) {
      changeFont(name, false);
    } else if (e.deltaY < 0) {
      changeFont(name, true);
    }
  };

  const keyboardFontHandler = (e: KeyboardEvent, name: string) => {
    if (e.key === "-") {
      changeFont(name, false);
    } else if (e.key === "=") {
      changeFont(name, true);
    }
  };

  const updateLayoutConfig = (newLayoutConfig: any) => {
    base.set(layoutType.value, { ...layoutConfig.value, ...newLayoutConfig });
  };

  const baidu = () => {
    openUrl(`https://www.baidu.com/s?ie=utf-8&wd=${getModifiedText()}`);
  };

  const google = () => {
    openUrl(`https://www.google.com/search?q=${getModifiedText()}`);
  };

  const translate = () => {
    const text = getModifiedText();
    if (text !== undefined) {
      eventBus.at("dispatch", "translate", text);
    }
  };

  onMounted(() => {
    eventBus.on("translateInput", translate);
  });

  const appStyle = computed(() => ({
    "font-family": base.config.value.interfaceFontFamily,
  }));

  const contentPadding = computed(() => base.config.value.contentPadding ?? 12);
  const contentLineHeight = computed(() => base.config.value.contentLineHeight ?? 1.6);

  const command = () => {
    const text = getModifiedText();
    eventBus.at("dispatch", text);
    logger.toast(`执行命令 ${text}`);
  };

  return {
    ...base,
    toKeyan,
    toStepfun,
    currentEngine,
    multiSource,
    layoutType,
    sharedResult,
    dictResult,
    sourceSize,
    resultSize,
    diffSize,
    dictSize,
    layoutConfig,
    changeFont,
    wheelHandler,
    keyboardFontHandler,
    updateLayoutConfig,
    baidu,
    google,
    translate,
    appStyle,
    contentPadding,
    contentLineHeight,
    mode,
    command,
  };
}
