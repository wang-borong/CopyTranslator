import eventBus from "./event-bus";
import store from "@/store";

const text = (key: string, fallback?: string) => {
  return store.getters.locale[key] || fallback || key;
};

const logger: any = {
  log: (...args: any[]) => console.log(...args),
  info: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
  debug: (...args: any[]) => console.debug(...args),
  verbose: (...args: any[]) => console.log(...args),
  text,
  toastKey: (key: string, fallback?: string) => {
    eventBus.at("dispatch", "toast", text(key, fallback));
  },
  toast: (text: string) => {
    eventBus.at("dispatch", "toast", text);
  }
};

export function initLog() {
  // no-op or custom warn filtering
}

export default logger;
