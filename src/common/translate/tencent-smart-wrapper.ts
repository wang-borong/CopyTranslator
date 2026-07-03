import {
  BaseTranslator,
  Language,
  TranslateError,
  TranslateQueryResult,
} from "./types";

const langMap: [Language, string][] = [
  ["auto", "auto"],
  ["zh-CN", "zh"],
  ["zh-TW", "zh"],
  ["en", "en"],
  ["ar", "ar"],
  ["de", "de"],
  ["ru", "ru"],
  ["fr", "fr"],
  ["fil", "fil"],
  ["ko", "ko"],
  ["ms", "ms"],
  ["pt", "pt"],
  ["ja", "ja"],
  ["th", "th"],
  ["tr", "tr"],
  ["es", "es"],
  ["it", "it"],
  ["hi", "hi"],
  ["id", "id"],
  ["vi", "vi"],
];

const CLIENT_KEY =
  "browser-chrome-110.0.0-Mac OS-df4bd4c5-a65d-44b2-a40f-42f34f3535f2-1677486696487";

const normalizeParagraphs = (value: any): string[] => {
  if (typeof value === "string") {
    return value.split(/\n+/);
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return normalizeParagraphs(
      value.text_list ||
        value.result ||
        value.target_text ||
        value.translation ||
        value.text
    );
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      if (item && typeof item === "object") {
        return (
          item.target_text ||
          item.translation ||
          item.text ||
          item.tgt ||
          item.dst ||
          ""
        );
      }
      return "";
    })
    .filter((item) => item.length > 0);
};

export class TencentSmartWrapper extends BaseTranslator<{}> {
  readonly name = "tencentsmart";
  readonly endpoint = "https://transmart.qq.com/api/imt";

  private static readonly langMap = new Map(langMap);
  private static readonly langMapReverse = new Map(
    langMap.map(([translatorLang, lang]) => [lang, translatorLang])
  );

  getSupportLanguages(): Language[] {
    return [...TencentSmartWrapper.langMap.keys()];
  }

  protected async query(
    text: string,
    from: Language,
    to: Language
  ): Promise<TranslateQueryResult> {
    try {
      const response = await this.request({
        url: this.endpoint,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari/537.36",
          referer: "https://transmart.qq.com/zh-CN/index",
        },
        data: {
          header: {
            fn: "auto_translation",
            client_key: CLIENT_KEY,
          },
          type: "plain",
          model_category: "normal",
          source: {
            text_list: [text],
            lang: TencentSmartWrapper.langMap.get(from) || "auto",
          },
          target: {
            lang: TencentSmartWrapper.langMap.get(to) || "auto",
          },
        },
      });

      const data = (response.data || {}) as any;
      const transResult =
        data.auto_translation || data.translation || data.target || data.target_text;
      const paragraphs = normalizeParagraphs(transResult);
      if (paragraphs.length === 0) {
        throw new TranslateError("UNKNOWN", "empty TencentSmart response");
      }

      const langDetected = data.src_lang || data.source_lang || data.language;
      const detectedFrom =
        TencentSmartWrapper.langMapReverse.get(langDetected) || from;

      return {
        text,
        from: detectedFrom,
        to,
        origin: {
          paragraphs: text.split(/\n+/),
        },
        trans: {
          paragraphs,
        },
      };
    } catch (error) {
      if (error instanceof TranslateError) {
        throw error;
      }
      console.error(new Error(`[TencentSmart service]${error}`));
      throw new TranslateError("NETWORK_ERROR");
    }
  }

  async detect(text: string): Promise<Language> {
    try {
      const response = await this.request({
        url: this.endpoint,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          header: {
            fn: "text_analysis",
            client_key: CLIENT_KEY,
          },
          text,
        },
      });
      const data = (response.data || {}) as any;
      const language = data.language || data.src_lang;
      return TencentSmartWrapper.langMapReverse.get(language) || "auto";
    } catch (error) {
      return super.detect(text);
    }
  }
}

export default TencentSmartWrapper;
