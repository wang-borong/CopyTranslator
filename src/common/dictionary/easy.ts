import { invoke } from "@tauri-apps/api/core";
import { WordEngine, QueryDictResult, DictionaryType } from "./types";

type Phonetic = NonNullable<QueryDictResult["phonetics"]>[number];

type ProxyResponse = {
  status: number;
  body: string;
};

const emptyResult = (
  words: string,
  engine: DictionaryType,
  url: string
): QueryDictResult => ({
  words,
  engine,
  url,
  phonetics: [],
  explains: [],
  examples: [],
  suggests: [],
});

const isTauriRuntime = () =>
  typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);

const normalizeText = (text: string | null | undefined): string =>
  (text || "").replace(/\s+/g, " ").trim();

const parseHtml = (html: string): Document =>
  new DOMParser().parseFromString(html, "text/html");

async function fetchHtml(url: string): Promise<string> {
  if (isTauriRuntime()) {
    const response = (await invoke("fetch_http_proxy", {
      req: {
        url,
        method: "GET",
        headers: {},
        body: null,
      },
    })) as ProxyResponse;
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Dictionary request failed with HTTP ${response.status}`);
    }
    return response.body;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Dictionary request failed with HTTP ${response.status}`);
  }
  return response.text();
}

function parsePhoneticText(text: string): Phonetic | undefined {
  const data = normalizeText(text).split(" ").filter(Boolean);
  if (data.length > 1) {
    return { type: data[0], value: data.slice(1).join(" ") };
  }
  if (data.length === 1) {
    return { type: "", value: data[0] };
  }
  return undefined;
}

function parseYoudao(words: string, url: string, html: string): QueryDictResult {
  const doc = parseHtml(html);
  const container = doc.querySelector("#phrsListTab");
  const suggestContainer = doc.querySelector("#results-contents");
  const result = emptyResult(words, "youdao", url);

  if (!container && !suggestContainer) {
    return result;
  }

  result.phonetics = Array.from(
    container?.querySelectorAll(".pronounce") || []
  )
    .map((item) => parsePhoneticText(item.textContent || ""))
    .filter(Boolean) as Phonetic[];

  result.explains = Array.from(container?.querySelectorAll("li") || [])
    .map((item) => {
      const text = normalizeText(item.textContent);
      const match = text.match(/^([a-z]+)\.\s*(.*)$/i);
      if (match) {
        return { type: match[1], trans: match[2] };
      }
      return { type: "", trans: text };
    })
    .filter((item) => item.trans.length > 0);

  if (result.explains.length === 0) {
    result.explains = Array.from(
      container?.querySelectorAll(".contentTitle a") || []
    )
      .map((item) => ({ type: "", trans: normalizeText(item.textContent) }))
      .filter((item) => item.trans.length > 0);
  }

  const webTrans = Array.from(
    doc.querySelectorAll("#webTrans .wt-container .title > span")
  )
    .map((item) => ({ type: "网络", trans: normalizeText(item.textContent) }))
    .filter((item) => item.trans.length > 0);

  if (webTrans.length > 0) {
    result.explains = result.explains.concat(webTrans);
  } else {
    result.explains = result.explains.concat(
      Array.from(doc.querySelectorAll("#webTrans #webPhrase .wordGroup"))
        .map((item) => ({
          type: "网络释义",
          trans: normalizeText(item.textContent),
        }))
        .filter((item) => item.trans.length > 0)
    );
  }

  result.examples = Array.from(doc.querySelectorAll("#examples #bilingual li"))
    .map((item) => {
      const lines = Array.from(item.querySelectorAll("p")).map((p) =>
        normalizeText(p.textContent)
      );
      return { from: lines[0] || "", to: lines[1] || "" };
    })
    .filter((item) => item.from.length > 0 || item.to.length > 0);

  result.suggests = Array.from(
    suggestContainer?.querySelectorAll(".typo-rel") || []
  )
    .map((item) => {
      const word = normalizeText(item.querySelector("span")?.textContent);
      const translate = normalizeText(item.textContent).replace(word, "").trim();
      return { word, translate };
    })
    .filter((item) => item.word.length > 0 || item.translate.length > 0);

  return result;
}

function parseBing(words: string, url: string, html: string): QueryDictResult {
  const doc = parseHtml(html);
  const container = doc.querySelector(".qdef");
  const suggestContainer = doc.querySelector(".content");
  const result = emptyResult(words, "bing", url);

  if (!container && !suggestContainer) {
    return result;
  }

  const phoneticContainer = container?.querySelector(".hd_p1_1");
  const phoneticText = normalizeText(phoneticContainer?.textContent);
  const phoneticParts = phoneticText.split(" ").filter(Boolean);
  if ((phoneticContainer?.children.length || 0) > 0 && phoneticParts.length === 4) {
    result.phonetics = [
      { type: phoneticParts[0], value: phoneticParts[1] },
      { type: phoneticParts[2], value: phoneticParts[3] },
    ];
  } else if (phoneticText.length > 0) {
    result.phonetics = [{ type: "", value: phoneticText }];
  }

  result.explains = Array.from(container?.querySelectorAll("li") || [])
    .map((item) => ({
      type: normalizeText(item.querySelector(".pos")?.textContent).replace(
        ".",
        ""
      ),
      trans: normalizeText(item.querySelector(".def")?.textContent),
    }))
    .filter((item) => item.trans.length > 0);

  result.examples = Array.from(
    doc.querySelectorAll("#sentenceCon #sentenceSeg .se_li1")
  )
    .map((item) => {
      const children = Array.from(item.children);
      return {
        from: normalizeText(children[0]?.textContent),
        to: normalizeText(children[1]?.textContent),
      };
    })
    .filter((item) => item.from.length > 0 || item.to.length > 0);

  result.suggests = Array.from(
    suggestContainer?.querySelectorAll(".df_wb_c") || []
  )
    .map((item) => ({
      word: normalizeText(item.querySelector("a")?.textContent),
      translate: normalizeText(item.querySelector("div")?.textContent),
    }))
    .filter((item) => item.word.length > 0 || item.translate.length > 0);

  return result;
}

export class EasyEngine extends WordEngine {
  name: DictionaryType;

  constructor(engine: DictionaryType) {
    super();
    this.name = engine;
  }

  async query(words: string): Promise<QueryDictResult> {
    const keywords = encodeURIComponent(words);
    const url =
      this.name === "bing"
        ? `https://cn.bing.com/dict/search?q=${keywords}`
        : `https://www.youdao.com/w/eng/${keywords}`;
    const html = await fetchHtml(url);
    return this.name === "bing"
      ? parseBing(words, url, html)
      : parseYoudao(words, url, html);
  }
}

export class BingEngine extends EasyEngine {
  constructor() {
    super("bing");
  }
}

export class YoudaoEngine extends EasyEngine {
  constructor() {
    super("youdao");
  }
}
