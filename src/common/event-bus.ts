import { emit, listen } from "@tauri-apps/api/event";
import busModule from "@gotoeasy/bus";

const bus = busModule as any;

const getChannel = (key: string) => `gbus-${key}`;
const listenersMap = new Map<any, any>();

const isTauriRuntime = () =>
  typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);

const reportTauriEventError = (action: string, key: string, error: unknown) => {
  console.warn(`[event-bus] ${action} failed for ${key}`, error);
};

const safeEmit = (key: string, payload: any[]) => {
  if (!isTauriRuntime()) {
    return;
  }
  const channel = getChannel(key);
  emit(channel, payload).catch((error) => {
    reportTauriEventError("emit", key, error);
  });
};

const safeListen = async (key: string, listener: Function) => {
  if (!isTauriRuntime()) {
    return () => {};
  }
  const channel = getChannel(key);
  try {
    return await listen(channel, (event) => {
      if (Array.isArray(event.payload)) {
        listener(...event.payload);
      } else {
        listener(event.payload);
      }
    });
  } catch (error) {
    reportTauriEventError("listen", key, error);
    return () => {};
  }
};

for (const methodName of ["on", "once", "at", "off"]) {
  const method = bus[methodName];
  bus[methodName] = (key: string, ...args: any[]) => {
    const channel = getChannel(key);
    return method(channel, ...args);
  };
}

bus.ion = async (key: string, listener: Function) => {
  const unlisten = await safeListen(key, listener);
  listenersMap.set(listener, unlisten);
};

bus.ionce = async (key: string, listener: Function) => {
  const wrappedListener = (...args: any[]) => {
    listener(...args);
    unlisten();
    listenersMap.delete(listener);
  };
  const unlisten = await safeListen(key, wrappedListener);
  listenersMap.set(listener, unlisten);
};

bus.ioff = (key: string, listener: Function) => {
  const unlisten = listenersMap.get(listener);
  if (unlisten) {
    unlisten();
    listenersMap.delete(listener);
  }
};

bus.iat = (key: string, ...args: any[]) => {
  safeEmit(key, args);
};

bus.gon = (key: string, listener: Function) => {
  bus.on(key, listener);
  bus.ion(key, listener);
};

bus.gonce = (key: string, listener: Function) => {
  bus.once(key, listener);
  bus.ionce(key, listener);
};

bus.goff = (key: string, listener: Function) => {
  bus.off(key, listener);
  bus.ioff(key, listener);
};

bus.gat = (key: string, ...args: any[]) => {
  safeEmit(key, args);
  bus.at(key, ...args);
};

export default bus;
