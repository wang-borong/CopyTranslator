import {
  BaseTranslator,
  Language,
  TranslateQueryResult,
  TranslateResult,
  Translator,
} from "./types";
import { Simply } from "./simply";
import { Lingva, defaultLingvaConfig } from "./lingva";
import { getProxyAxios } from "./proxy";

export interface GoogleWrapperConfig {
  apiKey: string; // Google API token
  mirror: string | undefined; // Google mirror URL
  source: "google" | "simply" | "lingva"; // 使用哪个后端
}

const googleLangMap: [Language, string][] = [
  ["auto", "auto"],
  ["af", "af"],
  ["sq", "sq"],
  ["am", "am"],
  ["ar", "ar"],
  ["hy", "hy"],
  ["az", "az"],
  ["eu", "eu"],
  ["be", "be"],
  ["bn", "bn"],
  ["bs", "bs"],
  ["bg", "bg"],
  ["ca", "ca"],
  ["ceb", "ceb"],
  ["ny", "ny"],
  ["zh-CN", "zh-CN"],
  ["zh-TW", "zh-TW"],
  ["co", "co"],
  ["hr", "hr"],
  ["cs", "cs"],
  ["da", "da"],
  ["nl", "nl"],
  ["en", "en"],
  ["eo", "eo"],
  ["et", "et"],
  ["fi", "fi"],
  ["fr", "fr"],
  ["fy", "fy"],
  ["gl", "gl"],
  ["ka", "ka"],
  ["de", "de"],
  ["el", "el"],
  ["gu", "gu"],
  ["ht", "ht"],
  ["ha", "ha"],
  ["haw", "haw"],
  ["hi", "hi"],
  ["hmn", "hmn"],
  ["hu", "hu"],
  ["is", "is"],
  ["ig", "ig"],
  ["id", "id"],
  ["ga", "ga"],
  ["it", "it"],
  ["ja", "ja"],
  ["jw", "jw"],
  ["kn", "kn"],
  ["kk", "kk"],
  ["km", "km"],
  ["ko", "ko"],
  ["ku", "ku"],
  ["ky", "ky"],
  ["lo", "lo"],
  ["la", "la"],
  ["lv", "lv"],
  ["lt", "lt"],
  ["lb", "lb"],
  ["mk", "mk"],
  ["mg", "mg"],
  ["ms", "ms"],
  ["ml", "ml"],
  ["mt", "mt"],
  ["mi", "mi"],
  ["mr", "mr"],
  ["mn", "mn"],
  ["my", "my"],
  ["ne", "ne"],
  ["no", "no"],
  ["ps", "ps"],
  ["fa", "fa"],
  ["pl", "pl"],
  ["pt", "pt"],
  ["pa", "pa"],
  ["ro", "ro"],
  ["ru", "ru"],
  ["sm", "sm"],
  ["gd", "gd"],
  ["sr", "sr"],
  ["st", "st"],
  ["sn", "sn"],
  ["sd", "sd"],
  ["si", "si"],
  ["sk", "sk"],
  ["sl", "sl"],
  ["so", "so"],
  ["es", "es"],
  ["su", "su"],
  ["sw", "sw"],
  ["sv", "sv"],
  ["tg", "tg"],
  ["ta", "ta"],
  ["te", "te"],
  ["th", "th"],
  ["tr", "tr"],
  ["uk", "uk"],
  ["ur", "ur"],
  ["ug", "ug"],
  ["uz", "uz"],
  ["vi", "vi"],
  ["cy", "cy"],
  ["xh", "xh"],
  ["yi", "yi"],
  ["yo", "yo"],
  ["zu", "zu"],
];

type GoogleApiResponse = [
  Array<[string | null, string | null, unknown?, unknown?, unknown?]>?,
  unknown?,
  string?
];

interface GoogleOfficialConfig {
  mirror?: string;
}

class GoogleOfficial extends BaseTranslator<GoogleOfficialConfig> {
  readonly name = "google";
  private static readonly langMap = new Map(googleLangMap);
  private static readonly langMapReverse = new Map(
    googleLangMap.map(([translatorLang, lang]) => [lang, translatorLang])
  );

  private buildBaseUrl(config: GoogleOfficialConfig): string {
    const mirror = (config.mirror || "").trim().replace(/\/+$/, "");
    return mirror || "https://translate.googleapis.com";
  }

  protected async query(
    text: string,
    from: Language,
    to: Language,
    config: GoogleOfficialConfig
  ): Promise<TranslateQueryResult> {
    const source = GoogleOfficial.langMap.get(from) || from;
    const target = GoogleOfficial.langMap.get(to) || to;
    const url =
      `${this.buildBaseUrl(config)}/translate_a/single` +
      `?client=gtx&dt=t&sl=${encodeURIComponent(source)}` +
      `&tl=${encodeURIComponent(target)}&q=${encodeURIComponent(text)}`;
    const response = await this.axios.get<GoogleApiResponse>(url);
    const sentences = response.data?.[0] || [];
    const transText = sentences
      .map((sentence) => sentence?.[0] || "")
      .join("");

    if (!transText) {
      throw new Error("Invalid Google translate response");
    }

    const detected = response.data?.[2];
    return {
      text,
      from:
        (detected
          ? GoogleOfficial.langMapReverse.get(detected) || from
          : from) || "auto",
      to,
      origin: {
        paragraphs: text.split(/\n+/),
        tts: "",
      },
      trans: {
        paragraphs: transText.split(/(\n ?)+/),
        tts: "",
      },
    };
  }

  getSupportLanguages(): Language[] {
    return [...GoogleOfficial.langMap.keys()];
  }

  async detect(text: string): Promise<Language> {
    try {
      return (await this.translate(text, "auto", "en")).from;
    } catch (error) {
      return "auto";
    }
  }
}

export class GoogleWrapper implements Translator {
  readonly name = "Google";
  config: GoogleWrapperConfig;
  private axios: any;
  private googleTranslator: GoogleOfficial | null = null;
  private simplyTranslator: Simply | null = null;
  private lingvaTranslator: Lingva | null = null;

  constructor({ axios, config }: { axios: any; config: GoogleWrapperConfig }) {
    this.axios = axios;
    this.config = config;
    this.initTranslators();
  }

  private initTranslators() {
    // 初始化各个翻译器实例（延迟初始化，按需使用）
  }

  private getGoogleTranslator(): GoogleOfficial {
    if (!this.googleTranslator) {
      let mirror = this.config.mirror;
      if (mirror != undefined) {
        if (mirror.endsWith("/")) {
          mirror = mirror.substring(0, mirror.length - 1);
        }
        if (mirror.length == 0) {
          mirror = undefined;
        }
      }
      this.googleTranslator = new GoogleOfficial({
        axios: getProxyAxios(true) as any,
        config: { mirror },
      });
    }
    return this.googleTranslator;
  }

  private getSimplyTranslator(): Simply {
    if (!this.simplyTranslator) {
      this.simplyTranslator = new Simply({
        axios: this.axios,
        config: { URL: "https://simplytranslate.org" },
      });
    }
    return this.simplyTranslator;
  }

  private getLingvaTranslator(): Lingva {
    if (!this.lingvaTranslator) {
      this.lingvaTranslator = new Lingva({
        axios: this.axios,
        config: defaultLingvaConfig,
      });
    }
    return this.lingvaTranslator;
  }

  makeitGoogle(result: TranslateResult): TranslateResult {
    // 将结果包装成 Google 翻译的格式，方便后续处理
    return {
      ...result,
      engine: "google",
    };
  }

  get translator(): Translator {
    switch (this.config.source) {
      case "google":
        return this.getGoogleTranslator();
      case "simply":
        return this.getSimplyTranslator();
      case "lingva":
        return this.getLingvaTranslator();
      default:
        throw new Error(`Unknown Google source: ${this.config.source}`);
    }
  }

  async translate(
    text: string,
    from: Language,
    to: Language
  ): Promise<TranslateResult> {
    return this.translator
      .translate(text, from, to)
      .then((res) => this.makeitGoogle(res));
  }

  async detect(text: string): Promise<Language> {
    return this.translator.detect(text);
  }

  getSupportLanguages(): Language[] {
    // 所有后端都支持相同的语言集（实际上可能略有不同，但为了简化返回通用集）
    return [
      "auto",
      "zh-CN",
      "zh-TW",
      "en",
      "ja",
      "ko",
      "fr",
      "es",
      "ru",
      "de",
      "it",
      "pt",
      "vi",
      "id",
      "th",
      "ms",
      "ar",
      "hi",
      "nl",
      "pl",
      "sv",
      "no",
      "da",
      "fi",
      "cs",
      "ro",
      "hu",
      "el",
      "uk",
      "bg",
      "hr",
      "sk",
      "sl",
      "et",
      "lv",
      "lt",
      "sr",
      "he",
      "fa",
      "bn",
      "ta",
      "te",
      "mr",
      "ur",
      "gu",
      "kn",
      "ml",
      "pa",
      "ne",
      "si",
      "km",
      "lo",
      "my",
      "ka",
      "hy",
      "az",
      "kk",
      "uz",
      "ky",
      "tg",
      "mn",
      "am",
      "sw",
      "af",
      "sq",
      "be",
      "bs",
      "ca",
      "cy",
      "eo",
      "eu",
      "fil",
      "ga",
      "gd",
      "gl",
      "ha",
      "haw",
      "hmn",
      "ht",
      "ig",
    ];
  }
}
