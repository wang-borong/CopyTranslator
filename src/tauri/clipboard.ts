import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

const isTauriRuntime = () =>
  typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);

type ClipboardEventName = "text-changed" | "image-changed";
type ClipboardListener = (payload?: string) => void;

export class ClipboardWrapper {
  private static listeners = new Map<ClipboardEventName, ClipboardListener[]>();
  private static watching = false;
  private static lastText = "";
  private static lastImageDataUrl = "";
  private static textPollingTimer: number | null = null;
  private static readingText = false;

  static init() {
    if (!isTauriRuntime()) {
      return;
    }
    listen("clipboard-changed", (event) => {
      const text = event.payload as string;
      ClipboardWrapper.emitText(text);
    }).catch((err) => {
      console.warn("Failed to listen clipboard text events:", err);
    });
    listen("clipboard-image-changed", (event) => {
      const image = event.payload as string;
      ClipboardWrapper.lastText = "";
      ClipboardWrapper.lastImageDataUrl = image;
      if (ClipboardWrapper.watching) {
        const list = ClipboardWrapper.listeners.get("image-changed") || [];
        list.forEach((cb) => cb(image));
      }
    }).catch((err) => {
      console.warn("Failed to listen clipboard image events:", err);
    });
  }

  static on(event: ClipboardEventName, callback: ClipboardListener) {
    if (!ClipboardWrapper.listeners.has(event)) {
      ClipboardWrapper.listeners.set(event, []);
    }
    ClipboardWrapper.listeners.get(event)!.push(callback);
  }

  static writeText(text: string) {
    navigator.clipboard.writeText(text).catch(err => {
      console.error("Failed to write to clipboard:", err);
    });
  }

  static readText(): string {
    return ClipboardWrapper.lastText;
  }

  private static emitText(text: string) {
    ClipboardWrapper.lastText = text;
    if (!ClipboardWrapper.watching) {
      return;
    }
    const list = ClipboardWrapper.listeners.get("text-changed") || [];
    list.forEach((cb) => cb(text));
  }

  private static async readSystemText(): Promise<string | null> {
    if (!isTauriRuntime()) {
      return ClipboardWrapper.lastText;
    }

    try {
      return await invoke<string | null>("read_clipboard_text");
    } catch (err) {
      console.warn("Failed to read clipboard text:", err);
      return ClipboardWrapper.lastText;
    }
  }

  static async readTextFresh(): Promise<string> {
    const text = await ClipboardWrapper.readSystemText();
    if (typeof text === "string") {
      ClipboardWrapper.lastText = text;
      return text;
    }
    ClipboardWrapper.lastText = "";
    return "";
  }

  private static async pollText() {
    if (!ClipboardWrapper.watching || ClipboardWrapper.readingText) {
      return;
    }
    ClipboardWrapper.readingText = true;
    try {
      const text = await ClipboardWrapper.readSystemText();
      if (
        typeof text === "string" &&
        text.length > 0 &&
        text !== ClipboardWrapper.lastText
      ) {
        ClipboardWrapper.emitText(text);
      } else if (text === null || text === "") {
        ClipboardWrapper.lastText = "";
      }
    } finally {
      ClipboardWrapper.readingText = false;
    }
  }

  private static startTextPolling() {
    if (ClipboardWrapper.textPollingTimer !== null) {
      return;
    }
    void ClipboardWrapper.pollText();
    ClipboardWrapper.textPollingTimer = window.setInterval(() => {
      void ClipboardWrapper.pollText();
    }, 500);
  }

  private static stopTextPolling() {
    if (ClipboardWrapper.textPollingTimer === null) {
      return;
    }
    window.clearInterval(ClipboardWrapper.textPollingTimer);
    ClipboardWrapper.textPollingTimer = null;
  }

  static startWatching() {
    ClipboardWrapper.watching = true;
    ClipboardWrapper.startTextPolling();
    if (!isTauriRuntime()) {
      return;
    }
    invoke("set_listen_clipboard", { listen: true }).catch((err) => {
      console.warn("Failed to start clipboard watching:", err);
    });
  }

  static stopWatching() {
    ClipboardWrapper.watching = false;
    ClipboardWrapper.stopTextPolling();
    if (!isTauriRuntime()) {
      return;
    }
    invoke("set_listen_clipboard", { listen: false }).catch((err) => {
      console.warn("Failed to stop clipboard watching:", err);
    });
  }

  static readImage(): any {
    return { toDataURL: () => ClipboardWrapper.lastImageDataUrl };
  }
}

export const clipboard = ClipboardWrapper;
