import { examToken } from "@/common/translate/token";
import eventBus from "@/common/event-bus";
import conf from "@/common/configuration";
import { Language } from "@opentranslate2/languages";
import logger from "@/common/logger";
import { invoke } from "@tauri-apps/api/core";

type LanguageType =
  | "CHN_ENG"
  | "ENG"
  | "POR"
  | "FRE"
  | "GER"
  | "ITA"
  | "SPA"
  | "RUS"
  | "JAP"
  | "KOR";

export class Recognizer {
  config?: { app_id: string; api_key: string; secret_key: string };

  constructor() {}

  enabled(): boolean {
    return !!this.config;
  }

  setUp(config: { app_id: string; api_key: string; secret_key: string }) {
    if (!examToken(config)) {
      this.config = undefined;
    } else {
      this.config = config;
    }
  }

  async capture() {
    if (!this.enabled()) {
      logger.toastKey("baiduOcrConfigRequired", "请先配置百度 OCR");
      return;
    }
    try {
      const image = await invoke<string | null>("read_clipboard_image");
      if (!image) {
        logger.toastKey("clipboardNoImage", "剪贴板中没有图片");
        return;
      }
      await this.recognize(image);
    } catch (err) {
      console.error(err);
      logger.toastKey("clipboardImageReadFailed", "读取剪贴板图片失败");
    }
  }

  getLanguage(): LanguageType {
    const srcLang: Language = conf.get("sourceLanguage");
    switch (srcLang) {
      case "en":
        return "CHN_ENG";
      case "zh-CN":
        return "CHN_ENG";
      case "pt":
        return "POR";
      case "fr":
        return "FRE";
      case "de":
        return "GER";
      case "it":
        return "ITA";
      case "es":
        return "SPA";
      case "ru":
        return "RUS";
      case "ja":
        return "JAP";
      case "ko":
        return "KOR";
      default:
        return "CHN_ENG";
    }
  }

  async recognize(image: string) {
    if (!this.config) {
      return;
    }
    try {
      const text = await invoke<string>("baidu_ocr", {
        image,
        config: this.config,
        languageType: this.getLanguage(),
      });
      if (!text.trim()) {
        logger.toastKey("ocrNoText", "OCR未识别到文字");
        return;
      }
      logger.toastKey("ocrTranslateStarted", "OCR完成，正在翻译");
      eventBus.at("dispatch", "translate", text);
    } catch (err: any) {
      console.log(err);
      logger.toast(`${logger.text("ocrFailed", "OCR失败")}: ${String(err)}`);
    }
  }
}
export const recognizer = new Recognizer();
