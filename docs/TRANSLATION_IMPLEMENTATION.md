# 翻译实现机制

本文档描述当前 Tauri v2 迁移版的翻译链路。旧桌面主进程代码已经移除，运行模型改为：

- 前端 WebView：Vue/Vuetify UI、动作分发、配置状态、翻译调度和结果展示。
- Tauri Rust 后端：系统能力桥接，包括剪贴板监听、图片读取、OCR 请求、全局快捷键、窗口透明度、配置文件读写和打开系统路径。

## 1. 关键入口

- 前端入口：[main.ts](../src/main.ts)
- 应用控制器：[controller.ts](../src/renderer/controller.ts)
- 翻译控制器：[translate-controller.ts](../src/tauri/translate-controller.ts)
- Tauri 命令：[lib.rs](../src-tauri/src/lib.rs)
- 配置规则：[configuration.ts](../src/common/configuration.ts)
- 翻译器注册：[translators.ts](../src/common/translate/translators.ts)
- AI 供应商管理：[custom-translators.ts](../src/common/translate/custom-translators.ts)

## 2. 数据流

1. Rust 后端监听剪贴板文本和图片变化。
2. 后端通过 Tauri event 向前端发送 `clipboard-changed` 或 `clipboard-image-changed`。
3. 前端剪贴板适配器接收事件：[clipboard.ts](../src/tauri/clipboard.ts)。
4. `TranslateController` 读取文本、净化内容、判断语言和词典模式。
5. `Compound` 根据当前引擎、缓存组、对比组和后备引擎调度翻译。
6. 结果写入 Pinia 兼容状态层：[store/index.ts](../src/store/index.ts)。
7. 对照模式、专注模式、多源对比和词典组件从状态层渲染结果。

## 3. 动作与配置

动作定义集中在 [action.ts](../src/common/action.ts)。UI、快捷键和右键菜单都会通过事件总线分发动作。

常见动作：

- `translate`：翻译指定文本。
- `translateClipboard`：读取当前剪贴板文本并翻译。
- `copySource` / `copyResult`：复制原文或译文。
- `incrementCounter`：标记下一次复制为单次增量复制。
- `capture`：读取剪贴板图片并触发 OCR。
- `reloadCustomTranslators`：重新加载 AI 供应商模型。

配置规则由 [configuration.ts](../src/common/configuration.ts) 定义。配置读写通过 Tauri 命令 `read_config` 和 `write_config` 完成，实际文件位于操作系统标准配置目录。

## 4. 翻译器调度

内置翻译器在 [translators.ts](../src/common/translate/translators.ts) 中注册。调度器 [compound.ts](../src/common/translate/compound.ts) 负责：

- 检查引擎是否支持当前源语言和目标语言。
- 在主引擎不支持时使用 `fallbackTranslator`。
- 管理多源对比和缓存组的结果缓冲区。
- 将每个引擎的翻译状态同步到界面。

AI 翻译器通过 `translatorProviders` 配置扩展。每个供应商可以启用多个模型，`CustomTranslatorManager` 会把供应商和模型展开成独立翻译器 ID。

## 5. OCR

OCR 入口在 [ocr.ts](../src/tauri/ocr.ts)。当前 Tauri 版本使用百度 OCR REST API：

1. 前端调用 `read_clipboard_image` 读取剪贴板图片。
2. 前端调用 `baidu_ocr`，将图片和 OCR 配置交给 Rust 后端。
3. 后端请求百度 OCR API 并返回文本。
4. 前端把 OCR 文本作为普通输入继续翻译。

## 6. 快捷键

快捷键配置在 [shortcuts.ts](../src/common/shortcuts.ts)。设置页负责编辑和保存快捷键：

- 全局快捷键通过 Tauri `tauri-plugin-global-shortcut` 注册。
- 窗口内快捷键由前端 `keydown` 监听处理。

全局快捷键被系统或其他应用占用时，注册会失败，界面会提示用户更换组合键。

## 7. 本地化

内置语言包在 [locales.ts](../src/common/locales.ts)。当前运行时直接在前端加载中文和英文语言映射，并根据 `localeSetting` 切换：

- `auto`：跟随浏览器/系统语言。
- `zh-CN` / `zh-TW`：中文界面。
- `en`：英文界面。

语言名称显示由 [locale.ts](../src/common/translate/locale.ts) 提供，避免出现 `sourceLanguage-en` 这类配置键名泄漏到界面。

## 8. Rust 后端职责

[lib.rs](../src-tauri/src/lib.rs) 提供以下能力：

- 标准配置目录读写和旧配置迁移。
- 打开配置文件或配置目录。
- 系统剪贴板文本/图片监听。
- 模拟复制、模拟粘贴。
- 活动窗口名称获取，用于白名单/黑名单。
- 百度 OCR REST 请求。
- HTTP 代理请求转发。
- 全局快捷键注册。
- Linux 原生窗口透明度设置。

Rust 后端不承载翻译业务状态，翻译状态统一保存在前端状态层。
