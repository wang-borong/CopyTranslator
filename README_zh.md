<p align="center">
  <img src="src/images/icon.png" alt="CopyTranslator" width="128" height="128">
</p>

# CopyTranslator

[English](README.md)

[![Release](https://img.shields.io/github/v/release/wang-borong/CopyTranslator)](https://github.com/wang-borong/CopyTranslator/releases)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-orange)
![Tauri](https://img.shields.io/badge/Tauri-2.x-24c8db)
![Vue](https://img.shields.io/badge/Vue-3.x-42b883)
[![License](https://img.shields.io/badge/license-GPL--2.0-blue)](LICENSE)

CopyTranslator 是一款面向阅读、写作、论文和日常工作的桌面翻译助手。本仓库是迁移优化版本：已经完成 Tauri 2 桌面端迁移，同时保留“复制即翻译”的核心体验，并加入更现代的界面、AI 翻译、OCR、快捷键配置、透明窗口和跨平台 Release 构建。

## 版本亮点

- 复制即翻译：监听剪贴板文本，自动清理 PDF 复制时常见的多余换行，然后立即翻译。
- AI 翻译引擎：支持 OpenAI 兼容接口，可接入 OpenAI、DeepSeek、Moonshot、智谱 AI、阿里云百炼、Ollama、NVIDIA NIM、OpenRouter 或自定义端点。
- 提示词定制：支持忠实、自然、技术、学术、日常、自定义等预设，可配置翻译角色、System Prompt、温度、最大 Token 和格式保留策略。
- 多翻译引擎：内置 Google、百度、彩云、有道、搜狗、DeepL、腾讯、腾讯交互翻译、阿里云、Azure、火山、Yandex、小牛、StepFun 等引擎。
- OCR 翻译：截图后复制图片到剪贴板，通过百度 OCR REST API 识别文字并继续翻译。
- 阅读工作流：横向对照、纵向对照、专注模式、多源对比、智能词典、智能互译、增量复制和配置快照。
- 新界面体验：支持浅色/深色/跟随系统、字体设置、内容内边距、行高、透明度、可调整设置栏、中文/英文界面语言。
- 快捷键管理：在设置界面直接配置全局快捷键和窗口内快捷键。
- 标准配置目录：Linux 使用 `~/.config/copytranslator`，并自动迁移旧的 `~/copytranslator/copytranslator.json`。
- 更新检查和下载地址已切换到当前仓库的 GitHub Release：`wang-borong/CopyTranslator`。

## 基本用法

1. 启动 CopyTranslator。
2. 确认已经启用“监听剪贴板”。
3. 在 PDF、浏览器、编辑器或其他软件中选中需要翻译的文字。
4. 执行系统复制操作。
5. CopyTranslator 会自动净化文本、翻译并显示结果。

如果段落跨页或一次复制不完整，可以使用增量复制。你可以在界面里启用增量复制，也可以右键布局按钮标记“下一次复制为增量复制”，还可以在快捷键设置中绑定相关动作。

## AI 翻译

当前 AI 翻译基于 OpenAI 兼容的 Chat Completion API。一个供应商可以启用多个模型，每个启用的模型都会出现在翻译引擎列表中。

添加 AI 供应商：

1. 打开“设置” -> “自定义翻译器”。
2. 点击“添加 AI 供应商”。
3. 选择模板，例如 OpenAI、DeepSeek、Moonshot、智谱 AI、阿里云百炼、Ollama、NVIDIA NIM、OpenRouter 或自定义。
4. 填写供应商名称、API Base URL 和 API Key。
5. 如有需要，展开高级选项：
   - 提示词预设
   - 翻译角色
   - 自定义 System Prompt
   - 温度
   - 最大 Token 数
   - 是否保留格式
6. 点击刷新获取模型列表，并选择要启用的模型。
7. 回到主界面，在翻译引擎菜单中选择新添加的模型。

内置的 StepFun 入口也会作为普通翻译引擎显示。免费模型或第三方模型是否可用，取决于上游服务策略和当前发布包配置。

## OCR

Tauri 版本当前集成的是百度 OCR REST API。

使用步骤：

1. 打开“设置” -> “OCR”。
2. 启用 OCR。
3. 在 `baidu-ocr` 中填写 `app_id`、`api_key` 和 `secret_key`。
4. 使用系统截图工具截图，并将图片复制到剪贴板。
5. CopyTranslator 检测到图片后会识别文字，并使用当前翻译引擎进行翻译。

OCR 内容会发送到所配置的 OCR 服务。涉及隐私、合同、论文未公开内容或其他敏感信息时，请先确认你有权上传给第三方服务。

## 快捷键

快捷键可以在“设置” -> “快捷键”中配置。

默认全局快捷键：

| 动作 | 快捷键 |
| --- | --- |
| 专注模式 | `Shift+F1` |
| 对照模式 | `Shift+F2` |
| 模拟复制 | `Super+Backquote` |
| 模拟增量复制 | `Super+Shift+Backquote` |

默认窗口内快捷键：

| 动作 | 快捷键 |
| --- | --- |
| 复制译文 | `CmdOrCtrl+S` |
| 复制原文 | `CmdOrCtrl+D` |
| 隐藏窗口 | `Escape` |
| 常规编辑动作 | `CmdOrCtrl+Z/X/C/V/A` |

如果某个全局快捷键已被系统或其他软件占用，注册可能失败。此时在设置中换一个组合键并保存即可。

## 配置目录

CopyTranslator 使用操作系统标准配置目录：

| 系统 | 配置目录 |
| --- | --- |
| Linux | `~/.config/copytranslator` |
| macOS | `~/Library/Application Support/copytranslator` |
| Windows | `%APPDATA%\copytranslator` |

主配置文件为 `copytranslator.json`。首次启动时，程序会尝试从旧路径 `~/copytranslator/copytranslator.json` 自动迁移配置。

API Key 会保存在本地配置文件中，请将配置目录视为敏感数据。

## 本地开发

环境要求：

- Node.js 20 或更新版本
- Rust stable，建议 Rust 1.85.0 或更新版本
- Tauri 2 所需的系统 WebView 和打包依赖

安装依赖：

```bash
npm ci
```

启动 Tauri 开发模式：

```bash
npm run tauri dev
```

只构建前端：

```bash
npm run build
```

检查 Tauri/Rust 后端：

```bash
cd src-tauri
cargo check --locked
```

构建发布包：

```bash
npm run tauri build
```

Linux 说明：

- CI 中安装了 `libwebkit2gtk-4.1-dev`、`libayatana-appindicator3-dev`、`libxdo-dev`、`librsvg2-dev`、`patchelf`、`pkg-config`、`curl`、`wget` 等依赖。
- 模拟复制、模拟粘贴、活动窗口识别等运行时能力在 Linux 下会优先使用 `xdotool`。
- 透明窗口依赖桌面环境的合成器支持，不同发行版和窗口管理器的效果可能不同。

## 发布

GitHub Actions 已配置 Windows、macOS 和 Linux 的检查与发布构建。Linux
发布任务会额外上传 Arch Linux 安装包 `copytranslator.tar.zst`。

以下情况会触发 Release 构建：

- 推送 `v*` 格式的 tag。
- 在 GitHub Actions 中手动运行发布 workflow。

本地更新发布版本号：

```bash
npm run set-release-version -- 13.0.2
```

正式下载地址：

https://github.com/wang-borong/CopyTranslator/releases

应用内更新检查读取：

https://api.github.com/repos/wang-borong/CopyTranslator/releases/latest

## 隐私说明

CopyTranslator 会监听剪贴板以实现本地翻译工作流，但翻译文本和 OCR 图片会发送给你选择的翻译引擎或 OCR 服务。发送敏感文本、截图或文档前，请先确认对应服务的隐私政策和你自己的使用权限。

## 开源协议

CopyTranslator 使用 GNU General Public License v2 授权。详情请查看 [LICENSE](LICENSE)。

## 致谢

本项目基于原 CopyTranslator 项目及其贡献者的长期工作。当前迁移优化版本的目标，是在保留核心工作流的基础上，用 Tauri 运行时、更新后的界面和新的翻译能力继续维护这个工具。
