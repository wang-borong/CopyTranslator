import { Identifier, Mutation, Config } from "./types";

interface Observer {
  postSet(key: Identifier, value: any): boolean; //返回值用来指示是否处理完毕
}

export const observers: Observer[] = [];

export const observePlugin = (store: any) => {
  store.subscribe((mutation: Mutation, state: any) => {
    if (["setConfig", "updateConfig"].indexOf(mutation.type) == -1) {
      return;
    }
    for (const key of Object.keys(mutation.payload)) {
      const val = mutation.payload[key];
      for (const observer of observers) {
        let resolved = false;
        try {
          resolved = observer.postSet(key as Identifier, val);
        } catch (error) {
          console.error(`Config observer failed for ${key}`, error);
        }
        if (resolved) {
          break;
        }
      }
    }
  });
};

export function restoreFromConfig(observers: Observer[], config: Config) {
  for (const key of Object.keys(config)) {
    observers.forEach((observer) => {
      try {
        observer.postSet(key as Identifier, config[key]);
      } catch (error) {
        console.error(`Config observer failed for ${key}`, error);
      }
    });
  }
}
