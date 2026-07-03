export type Accelerator = string;
import { mapToObj, objToMap } from "./types";
import { version, compatible } from "./constant";

export interface Shortcut {
  accelerator: Accelerator;
  id: string;
}

export type Shortcuts = Map<string, Accelerator>;

export const defaultGlobalShortcuts: Shortcuts = new Map([
  ["focus", "Shift+F1"],
  ["contrast", "Shift+F2"],
  ["simulateCopy", "Super+`"],
  ["simulateIncrementCopy", "Super+Shift+`"],
]);

export const defaultLocalShortcuts: Shortcuts = new Map([
  ["undo", "CmdOrCtrl+Z"],
  ["redo", "Shift+CmdOrCtrl+Z"],
  ["cut", "CmdOrCtrl+X"],
  ["copy", "CmdOrCtrl+C"],
  ["paste", "CmdOrCtrl+V"],
  ["selectAll", "CmdOrCtrl+A"],
  ["copyResult", "CmdOrCtrl+S"],
  ["copySource", "CmdOrCtrl+D"],
  ["quit", "Cmd+Q"],
  ["hideWindow", "Escape"],
]);

export function resetFile(keyName: string, config: Map<string, Accelerator>) {
  const res = mapToObj(config);
  res["version"] = version;
  localStorage.setItem(keyName, JSON.stringify(res));
}

export function resetGlobalShortcuts() {
  resetFile("global_shortcuts", defaultGlobalShortcuts);
}

export function resetLocalShortcuts() {
  resetFile("local_shortcuts", defaultLocalShortcuts);
}

export function loadFile(
  keyName: string,
  defaultConfig: Map<string, Accelerator>
): Map<string, Accelerator> {
  try {
    const raw = localStorage.getItem(keyName);
    if (!raw) {
      resetFile(keyName, defaultConfig);
      return defaultConfig;
    }
    const config = JSON.parse(raw);
    if (!compatible(config.version)) {
      throw "config incompatible";
    } else {
      delete config.version;
      return objToMap(config);
    }
  } catch (e) {
    resetFile(keyName, defaultConfig);
    return defaultConfig;
  }
}

export function loadGlobalShortcuts(): Map<string, Accelerator> {
  return loadFile("global_shortcuts", defaultGlobalShortcuts);
}

export function loadLocalShortcuts(): Map<string, Accelerator> {
  return loadFile("local_shortcuts", defaultLocalShortcuts);
}
