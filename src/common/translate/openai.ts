import {
  Language,
  BaseTranslator,
  TranslateQueryResult,
  TranslateError,
  AiPromptPreset,
} from "./types";
import { OpenAIConfigWithBehavior } from "./types";

type PromptProfile = {
  system: string;
  user: string;
  temperature: number;
};

const DEFAULT_ROLE_PROMPT =
  "You are a professional translation engine. You understand context, terminology, tone, and formatting.";

const DEFAULT_USER_PROMPT = `Translate the following text from {from} to {to}.

Text:
{text}`;

const PROMPT_PROFILES: Record<AiPromptPreset, PromptProfile> = {
  faithful: {
    system:
      "Translate accurately and faithfully. Preserve meaning, terminology, numbers, placeholders, links, Markdown, and line breaks. Output only the translation.",
    user: DEFAULT_USER_PROMPT,
    temperature: 0.2,
  },
  natural: {
    system:
      "Translate naturally for native readers while keeping the original meaning. Avoid literal wording when it sounds awkward. Output only the translation.",
    user: DEFAULT_USER_PROMPT,
    temperature: 0.35,
  },
  technical: {
    system:
      "Translate as a technical translator. Preserve code, commands, API names, product names, units, placeholders, and Markdown. Use precise technical terminology. Output only the translation.",
    user: DEFAULT_USER_PROMPT,
    temperature: 0.2,
  },
  academic: {
    system:
      "Translate in a formal academic style. Preserve citations, terminology, equations, Markdown, and paragraph structure. Output only the translation.",
    user: DEFAULT_USER_PROMPT,
    temperature: 0.25,
  },
  casual: {
    system:
      "Translate in a clear, conversational style for everyday readers. Keep the meaning and tone, but make the result fluent. Output only the translation.",
    user: DEFAULT_USER_PROMPT,
    temperature: 0.45,
  },
  custom: {
    system: DEFAULT_ROLE_PROMPT,
    user: DEFAULT_USER_PROMPT,
    temperature: 0.3,
  },
};

const DEFAULT_CONFIG = {
  apiBase: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-3.5-turbo",
  promptPreset: "faithful" as AiPromptPreset,
  rolePrompt: "",
  systemPrompt: "",
  userPrompt: "",
  styleGuide: "",
  glossary: "",
  preserveFormatting: true,
  temperature: 0.3,
  maxTokens: 2000,
};

// 语言映射表 - 将 Language 映射为语言全名
const langMap: [Language, string][] = [
  ["auto", "auto-detect"],
  ["zh-CN", "Simplified Chinese"],
  ["zh-TW", "Traditional Chinese"],
  ["en", "English"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
  ["fr", "French"],
  ["es", "Spanish"],
  ["ru", "Russian"],
  ["de", "German"],
  ["it", "Italian"],
  ["tr", "Turkish"],
  ["pt", "Portuguese"],
  ["vi", "Vietnamese"],
  ["id", "Indonesian"],
  ["th", "Thai"],
  ["ms", "Malay"],
  ["ar", "Arabic"],
  ["hi", "Hindi"],
  ["nl", "Dutch"],
  ["pl", "Polish"],
  ["sv", "Swedish"],
  ["no", "Norwegian"],
  ["da", "Danish"],
  ["fi", "Finnish"],
  ["cs", "Czech"],
  ["ro", "Romanian"],
  ["hu", "Hungarian"],
  ["el", "Greek"],
  ["uk", "Ukrainian"],
  ["bg", "Bulgarian"],
  ["hr", "Croatian"],
  ["sk", "Slovak"],
  ["sl", "Slovenian"],
  ["et", "Estonian"],
  ["lv", "Latvian"],
  ["lt", "Lithuanian"],
  ["sr", "Serbian"],
  ["he", "Hebrew"],
  ["fa", "Persian"],
  ["bn", "Bengali"],
  ["ta", "Tamil"],
  ["te", "Telugu"],
  ["mr", "Marathi"],
  ["ur", "Urdu"],
  ["gu", "Gujarati"],
  ["kn", "Kannada"],
  ["ml", "Malayalam"],
  ["pa", "Punjabi"],
  ["ne", "Nepali"],
  ["si", "Sinhala"],
  ["km", "Khmer"],
  ["lo", "Lao"],
  ["my", "Burmese"],
  ["ka", "Georgian"],
  ["hy", "Armenian"],
  ["az", "Azerbaijani"],
  ["kk", "Kazakh"],
  ["uz", "Uzbek"],
  ["ky", "Kyrgyz"],
  ["tg", "Tajik"],
  ["mn", "Mongolian"],
  ["am", "Amharic"],
  ["sw", "Swahili"],
  ["af", "Afrikaans"],
  ["sq", "Albanian"],
  ["be", "Belarusian"],
  ["bs", "Bosnian"],
  ["ca", "Catalan"],
  ["cy", "Welsh"],
  ["eo", "Esperanto"],
  ["eu", "Basque"],
  ["fil", "Filipino"],
  ["ga", "Irish"],
  ["gd", "Scottish Gaelic"],
  ["gl", "Galician"],
  ["ha", "Hausa"],
  ["haw", "Hawaiian"],
  ["hmn", "Hmong"],
  ["ht", "Haitian Creole"],
  ["ig", "Igbo"],
  ["is", "Icelandic"],
  ["jw", "Javanese"],
  ["ku", "Kurdish"],
  ["la", "Latin"],
  ["lb", "Luxembourgish"],
  ["mg", "Malagasy"],
  ["mi", "Maori"],
  ["mk", "Macedonian"],
  ["mt", "Maltese"],
  ["ny", "Chichewa"],
  ["ps", "Pashto"],
  ["sm", "Samoan"],
  ["sn", "Shona"],
  ["so", "Somali"],
  ["st", "Sesotho"],
  ["su", "Sundanese"],
  ["sd", "Sindhi"],
  ["xh", "Xhosa"],
  ["yi", "Yiddish"],
  ["yo", "Yoruba"],
  ["zu", "Zulu"],
];

export interface OpenAIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIChatRequest {
  model: string;
  messages: OpenAIChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: OpenAIChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAI extends BaseTranslator<OpenAIConfigWithBehavior> {
  name: string = "openai";

  /** Translator lang to language name */
  private static readonly langMap = new Map(langMap);

  /** Language name to translator lang */
  private static readonly langMapReverse = new Map(
    langMap.map(([translatorLang, lang]) => [lang, translatorLang])
  );

  config: OpenAIConfigWithBehavior = { ...DEFAULT_CONFIG };

  constructor(options: { axios: any; config: any }) {
    super(options.axios);

    // 处理从配置系统传来的配置，字符串值需要转换
    if (options.config) {
      this.config.apiBase = options.config.apiBase || this.config.apiBase;
      this.config.apiKey = options.config.apiKey || "";
      this.config.model = options.config.model || this.config.model;

      this.config.promptPreset = this.getPromptPreset(options.config.promptPreset);
      this.config.rolePrompt = options.config.rolePrompt || "";
      this.config.systemPrompt = options.config.systemPrompt || "";
      this.config.userPrompt = options.config.userPrompt || "";
      this.config.styleGuide = options.config.styleGuide || "";
      this.config.glossary = options.config.glossary || "";
      this.config.preserveFormatting = options.config.preserveFormatting !== false;
      this.config.prompt = options.config.prompt || "";

      // 将字符串转换为数字
      if (options.config.temperature) {
        const temp = parseFloat(options.config.temperature);
        this.config.temperature = isNaN(temp) ? 0.3 : temp;
      }

      if (options.config.maxTokens) {
        const maxTokens = parseInt(options.config.maxTokens);
        this.config.maxTokens = isNaN(maxTokens) ? 2000 : maxTokens;
      }
      if (options.config.translatorName) {
        this.name = options.config.translatorName;
      }
    }
  }

  private getPromptPreset(value: unknown): AiPromptPreset {
    if (
      value === "faithful" ||
      value === "natural" ||
      value === "technical" ||
      value === "academic" ||
      value === "casual" ||
      value === "custom"
    ) {
      return value;
    }
    return "faithful";
  }

  private getPromptProfile(config: OpenAIConfigWithBehavior): PromptProfile {
    return PROMPT_PROFILES[this.getPromptPreset(config.promptPreset)];
  }

  private renderTemplate(
    template: string,
    text: string,
    from: Language,
    to: Language,
    config: OpenAIConfigWithBehavior
  ): string {
    const fromLang = OpenAI.langMap.get(from) || from;
    const toLang = OpenAI.langMap.get(to) || to;
    const replacements: Record<string, string> = {
      from: fromLang,
      fromName: fromLang,
      source: fromLang,
      sourceLanguage: fromLang,
      to: toLang,
      toName: toLang,
      target: toLang,
      targetLanguage: toLang,
      text,
      role: config.rolePrompt || DEFAULT_ROLE_PROMPT,
      glossary: config.glossary || "",
      styleGuide: config.styleGuide || "",
      style: config.styleGuide || "",
    };

    return template.replace(/\{([a-zA-Z]+)\}/g, (match, key) => {
      return Object.prototype.hasOwnProperty.call(replacements, key)
        ? replacements[key]
        : match;
    });
  }

  private buildMessages(
    text: string,
    from: Language,
    to: Language,
    config: OpenAIConfigWithBehavior
  ): OpenAIChatMessage[] {
    const profile = this.getPromptProfile(config);
    const systemTemplate = config.systemPrompt?.trim() || profile.system;
    const userTemplate =
      config.userPrompt?.trim() ||
      (config.prompt && config.prompt !== "default" ? config.prompt : profile.user);
    const systemSections = [
      config.rolePrompt?.trim() || DEFAULT_ROLE_PROMPT,
      this.renderTemplate(systemTemplate, text, from, to, config),
    ];

    if (config.preserveFormatting !== false) {
      systemSections.push(
        "Preserve line breaks, Markdown, code blocks, inline code, HTML tags, variables, and placeholders unless translation requires otherwise."
      );
    }
    if (config.styleGuide?.trim()) {
      systemSections.push(`Style guide:\n${config.styleGuide.trim()}`);
    }
    if (config.glossary?.trim()) {
      systemSections.push(`Glossary:\n${config.glossary.trim()}`);
    }

    return [
      {
        role: "system",
        content: systemSections.filter(Boolean).join("\n\n"),
      },
      {
        role: "user",
        content: this.renderTemplate(userTemplate, text, from, to, config),
      },
    ];
  }

  /**
   * 调用 OpenAI 兼容 API
   */
  private async callOpenAI(
    messages: OpenAIChatMessage[],
    config: OpenAIConfigWithBehavior
  ): Promise<OpenAIChatResponse> {
    const apiUrl = config.apiBase.endsWith("/")
      ? `${config.apiBase}chat/completions`
      : `${config.apiBase}/chat/completions`;

    const requestData: OpenAIChatRequest = {
      model: config.model || "gpt-3.5-turbo",
      messages: messages,
      temperature:
        config.temperature !== undefined
          ? config.temperature
          : this.getPromptProfile(config).temperature,
      max_tokens: config.maxTokens !== undefined ? config.maxTokens : 2000,
      stream: false,
    };

    const axiosConfig: any = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      timeout: 60000, // 设置 60 秒超时，AI 模型响应较慢
    };

    try {
      const response = await this.axios.post<OpenAIChatResponse>(
        apiUrl,
        requestData,
        axiosConfig
      );

      return response.data;
    } catch (error) {
      console.error("OpenAI API 调用失败:", error);
      if (error && typeof error === "object" && "response" in error) {
        console.error("错误响应:", (error as any).response.data);
        throw new TranslateError("API_SERVER_ERROR");
      }
      throw new TranslateError("NETWORK_ERROR");
    }
  }

  /**
   * 执行翻译查询
   */
  protected async query(
    text: string,
    from: Language,
    to: Language,
    config: OpenAIConfigWithBehavior
  ): Promise<TranslateQueryResult> {
    // 检查 API 密钥是否配置
    if (!config.apiKey) {
      console.error("OpenAI API 密钥未配置");
      throw new TranslateError("API_SERVER_ERROR");
    }

    const messages = this.buildMessages(text, from, to, config);

    try {
      const response = await this.callOpenAI(messages, config);

      if (
        !response.choices ||
        response.choices.length === 0 ||
        !response.choices[0].message
      ) {
        console.error("OpenAI API 响应格式异常:", response);
        throw new TranslateError("API_SERVER_ERROR");
      }

      const translatedText = response.choices[0].message.content.trim();

      return {
        text: text,
        from: from,
        to: to,
        origin: {
          paragraphs: text.split(/\n+/),
          tts: (await this.textToSpeech(text, from)) || "",
        },
        trans: {
          paragraphs: translatedText.split(/\n+/),
          tts: (await this.textToSpeech(translatedText, to)) || "",
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取支持的语言列表
   */
  getSupportLanguages(): Language[] {
    return [...OpenAI.langMap.keys()];
  }

  /**
   * 语言检测 - LLM 会在翻译时自动识别，无需单独检测
   */
  async detect(text: string): Promise<Language> {
    return "auto";
  }
}

export default OpenAI;
