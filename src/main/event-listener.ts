import simulate from "./simulate";
import os from "os";
import { clipboard } from "./clipboard";
import eventBus from "../common/event-bus";
import config from "../common/configuration";
import { isValidWindow } from "./focus-handler";
import { globalShortcut } from "electron";

class EventListener {
  drag = false;
  lastDown = Date.now();
  lastX = 0;
  lastY = 0;
  newY = 0;
  newX = 0;
  copied: boolean = false;
  // Just for linux x11
  selectedText: string = "";
  preLeftBtn: string = "mouseup";
  lastClick = Date.now();
  lastClickX = 0;
  lastClickY = 0;

  lastCopy = Date.now();
  linuxSelectionInterval: any = null;

  bind() {
    if (os.platform() !== "linux") {
      this.bindHooks();
    } else {
      this.bindLinuxHooks();
    }
  }

  /**
   * Linux 下安全的事件监听与全局快捷键捕获
   */
  bindLinuxHooks() {
    try {
      // 注册快捷键 Ctrl+Alt+C 快速复制翻译
      globalShortcut.register("CommandOrControl+Alt+C", () => {
        this.simulateCopy();
      });
    } catch (e) {
      console.warn("Failed to register Linux global shortcut:", e);
    }

    // 轮询 Linux Primary Selection（X11 选区文字）
    if (this.linuxSelectionInterval) {
      clearInterval(this.linuxSelectionInterval);
    }
    this.linuxSelectionInterval = setInterval(() => {
      if (!config.get("dragCopy") || !config.get("listenClipboard")) return;
      try {
        const selectedText = clipboard.readText("selection");
        if (
          selectedText &&
          selectedText !== this.selectedText &&
          selectedText.trim().length > 0
        ) {
          this.selectedText = selectedText;
          const currentClipboard = clipboard.readText();
          if (selectedText !== currentClipboard) {
            clipboard.writeText(selectedText);
          }
        }
      } catch (e) {
        // Wayland 下可能不支持 selection 读取，静默处理
      }
    }, 600);
  }

  simulateCopy() {
    simulate.copy();
    eventBus.at("dispatch", "toast", "模拟复制");
  }

  bindHooks() {
    // windows和mac上的监听
    try {
      const req = eval("require");
      const ioHook = req("iohook");

      ioHook.on("keydown", (event: any) => {
        if (event.keycode == 46 && event.ctrlKey) {
          //双击ctrl c 可以在没有开监听剪贴板的情况下 翻译
          const now = Date.now();
          if (
            now - this.lastCopy < 1000 &&
            config.get("enableDoubleCopyTranslate")
          ) {
            console.debug("triggered double ctrl c", clipboard.readText());
            eventBus.at("dispatch", "doubleCopyTranslate");
          }
          this.lastCopy = now;
        }
      });

      ioHook.on("mouseup", (event: any) => {
        //模拟点按复制
        if (
          !this.copied &&
          Date.now() - this.lastDown > 100 &&
          Math.abs(this.newX - this.lastX) + Math.abs(this.newY - this.lastY) >
            10
        ) {
          isValidWindow("dragCopy").then((valid) => {
            const condition =
              valid && config.get("dragCopy") && config.get("listenClipboard");
            if (!condition) {
              return;
            }
            this.simulateCopy();
            if (event.ctrlKey) {
              eventBus.at("dispatch", "incrementCounter", 1);
            }
            this.copied = true;
          });
        }
      });

      ioHook.on("mousedown", (event: any) => {
        this.lastDown = Date.now();
        this.lastX = event.x;
        this.lastY = event.y;
        this.copied = false;
      });

      ioHook.on("mousedrag", (event: any) => {
        this.drag = true;
        this.newX = event.x;
        this.newY = event.y;
      });

      ioHook.on("mouseclick", (event: any) => {
        const now = Date.now();
        const newY = event.y;
        const newX = event.x;
        if (
          now - this.lastDown < 500 &&
          Math.abs(newX - this.lastClickX) < 4 &&
          Math.abs(newY - this.lastClickY) < 4
        ) {
          isValidWindow("dragCopy").then((valid) => {
            const condition =
              valid &&
              config.get("listenClipboard") &&
              config.get("dragCopy") &&
              config.get("doubleClickCopy");
            if (condition) {
              this.simulateCopy();
            }
          });
        }
        this.lastClick = now;
        this.lastClickX = event.x;
        this.lastClickY = event.y;
      });

      ioHook.start(false);
    } catch (err) {
      console.warn("iohook native module not available:", err);
    }
  }
}

export const eventListener = new EventListener();
