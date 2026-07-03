export const osType = "Linux";

export const osSpec = {
  Windows_NT: {
    iconName: "icon.ico",
    trayName: "icon.ico",
    name: "windows",
  },
  Darwin: {
    iconName: "icon.png",
    trayName: "tray@2x.png",
    name: "mac",
  },
  Linux: {
    iconName: "icon.png",
    trayName: "tray@2x.png",
    name: "linux",
  },
}["Linux"];

export const env = {
  configDir: "",
  userLocaleDir: "",
  configPath: "",
  style: "",
  shortcut: "",
  localShortcut: "",
  externalResource: "",
  systemLocaleDir: "",
  iconPath: "",
  trayIconPath: "",
  styleTemplate: "",
  publicUrl: "",
};

export const icon = "" as any;
