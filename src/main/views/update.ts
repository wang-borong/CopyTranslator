import { dialog, BrowserWindow, ipcMain } from "electron";
import { env, icon, osType } from "@/common/env";
import { Controller } from "@/main/controller";
import path from "path";
const remoteMain = require("@electron/remote/main");
import {
  constants,
  getChangelogURL,
  isLower,
  version,
} from "@/common/constant";
import axios_ from "axios";

type UpdateInfo = {
  releaseName: string;
  releaseNotes: string;
  needCompile: boolean;
  isWin: boolean;
  manualLink: string;
};

export class UpdateChecker {
  controller: Controller;
  win?: BrowserWindow;
  private _autoUpdater: any;
  private bound = false;

  constructor(controller: Controller) {
    this.controller = controller;
  }

  get autoUpdater() {
    if (!this._autoUpdater) {
      this._autoUpdater = require("electron-updater").autoUpdater;
      this._autoUpdater.autoDownload = false;
      this.bindUpdateEvents();
    }
    return this._autoUpdater;
  }

  bindUpdateEvents() {
    if (this.bound) return;
    this.bound = true;
    const autoUpdater = this._autoUpdater;

    autoUpdater.on("error", (error: Error) => {
      console.error("Github检查更新失败");
      this.checkTheGithubPages();
    });

    autoUpdater.on("update-available", (updateInfo: any) => {
      updateInfo.needCompile = false;
      updateInfo.isWin = require("os").platform == "win32";
      updateInfo.manualLink = constants.manualDownloadLink;
      this.postUpdateInfo(updateInfo);
    });

    autoUpdater.on("update-downloaded", () => {
      dialog
        .showMessageBox(BrowserWindow.getAllWindows()[0], {
          type: "info",
          title: "安装更新",
          icon: icon,
          message: "更新已下载",
          buttons: ["现在退出并安装", "退出后自动安装", "cancel"],
          cancelId: 2,
        })
        .then((res) => res.response)
        .then((response) => {
          if (response == 0) {
            setImmediate(() => autoUpdater.quitAndInstall());
          } else if (response == 1) {
            autoUpdater.autoInstallOnAppQuit = true;
          }
        });
    });

    ipcMain.on("confirm-update", (event, args: any) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (win) {
        win.close();
      }
      autoUpdater.downloadUpdate();
    });
  }

  async check() {
    console.log("正在检查Github更新");
    this.autoUpdater.checkForUpdates().catch((e: any) => {
      console.log("成功捕获异常好吧");
    });
  }

  get(url: string) {
    return axios_.get(url, { timeout: 5000 });
  }

  checkTheGithubPages() {
    console.log("正在检查Github更新");
    console.log(constants.githubLatestReleaseApi);
    this.get(constants.githubLatestReleaseApi)
      .then((res) => res.data)
      .then((data) => {
        console.log("Github上最新版本为", JSON.stringify(data));
        const rawTagName = String(data.tag_name || "").trim();
        if (!rawTagName) {
          throw new Error("GitHub release tag is empty");
        }
        const tagName = rawTagName.startsWith("v") ? rawTagName : `v${rawTagName}`;
        if (isLower(version, tagName)) {
          const updateInfo: UpdateInfo = {
            releaseNotes: data.body || data.html_url || "",
            releaseName: data.name || tagName,
            needCompile: true,
            isWin: false,
            manualLink: data.html_url || constants.githubReleases,
          };
          this.postUpdateInfo(updateInfo);
        } else {
          console.log("Github显示当前即为最新版本");
        }
      })
      .catch((e) => console.error("通过Github获取最新版本失败"));
  }

  showCurrentChangelog(targetVersion?: string) {
    const url = targetVersion
      ? getChangelogURL(targetVersion)
      : constants.currentChangelog;
    console.log("正在获取更新日志", url);
    this.get(url)
      .then(() => {
        this.controller.win.registerPostStart(() => {
          const win = this.getWindow(
            "更新日志",
            path.join(env.externalResource, "update", "changelog.html")
          );
          win.webContents.once("did-finish-load", () => {
            const buff = Buffer.from(url, "utf-8");
            const base64data = buff.toString("base64"); //这里因为是直接传，所以可能会存在一些问题，看看如果先加密再解密会不会好点
            win.webContents.executeJavaScript(`fetchPage("${base64data}");`);
          });
        });
        this.controller.set("isNewUser", false);
      })
      .catch((e) => {
        console.error("获取当前版本更新日志失败", url);
        // console.error(e);
      });
  }

  getWindow(title: string, file: string) {
    let win = this.win;
    if (!win) {
      win = new BrowserWindow({
        icon,
        title,
        parent: this.controller.win.mainWindow,
        modal: osType !== "Darwin",
        width: 800,
        height: 600,
        minimizable: false,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          webSecurity: false,
          preload: path.join(__dirname, "preload.js"),
        },
      }) as BrowserWindow;
      remoteMain.enable(win.webContents);
      win.on("closed", (e: any) => {
        this.win = undefined;
      });
      this.win = win;
    }

    win.loadFile(file);
    if (process.env.NODE_ENV !== "production") win.webContents.openDevTools();
    return win;
  }

  postUpdateInfo(updateInfo: any) {
    const win = this.getWindow(
      "存在可用更新",
      path.join(env.externalResource, "update", "newer.html")
    );

    win.webContents.once("did-finish-load", () => {
      win.webContents.send("releaseNote", updateInfo);
    });
  }
}
