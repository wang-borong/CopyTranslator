import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

const isTauriRuntime = () =>
  typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);

export class ClipboardWrapper {
  private static listeners = new Map<string, Function[]>();
  private static watching = false;
  private static lastText = "";
  private static lastImageDataUrl = "";

  static init() {
    if (!isTauriRuntime()) {
      return;
    }
    listen("clipboard-changed", (event) => {
      const text = event.payload as string;
      ClipboardWrapper.lastText = text;
      if (ClipboardWrapper.watching) {
        const list = ClipboardWrapper.listeners.get("text-changed") || [];
        list.forEach((cb) => cb());
      }
    }).catch((err) => {
      console.warn("Failed to listen clipboard text events:", err);
    });
    listen("clipboard-image-changed", (event) => {
      const image = event.payload as string;
      ClipboardWrapper.lastImageDataUrl = image;
      if (ClipboardWrapper.watching) {
        const list = ClipboardWrapper.listeners.get("image-changed") || [];
        list.forEach((cb) => cb());
      }
    }).catch((err) => {
      console.warn("Failed to listen clipboard image events:", err);
    });
  }

  static on(event: string, callback: Function) {
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

  static startWatching() {
    ClipboardWrapper.watching = true;
    if (!isTauriRuntime()) {
      return;
    }
    invoke("set_listen_clipboard", { listen: true }).catch((err) => {
      console.warn("Failed to start clipboard watching:", err);
    });
  }

  static stopWatching() {
    ClipboardWrapper.watching = false;
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
