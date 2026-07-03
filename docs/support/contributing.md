---
sidebarDepth: 6
---

# 参与贡献

## 编译源码

### 项目结构
- dist: 前端构建输出
- src-tauri: Tauri v2 后端与桌面打包配置
- dist_locales: 翻译文件
- docs: 本文档的源码

### 编译环境要求
- Node.js 20 或更新版本
- Rust stable，建议 1.77.2 或更新版本
- Tauri v2 所需系统依赖

```bash
git clone https://github.com/wang-borong/CopyTranslator.git
cd CopyTranslator
npm ci
```
要调试和运行程序：
```bash
npm run tauri dev
```
要编译为可分发的程序：
```bash
npm run tauri build
```

如果您是想编译后自用，请在设置中填入需要的翻译引擎或 AI 供应商 API Key。

## Locale settings
Using my own l10n module, for memory saving purpose. 
### For locale maintainers
If you want to add a new locale, follow the instructions below.

> View `json` files under `dist_locales` to see the format of the locale file, fork the repo and add a new `{{locale}}.json` file under the directory, and create a pull request.

Outdated locale files do not block startup. Missing keys fall back to English.
