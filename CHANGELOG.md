# Changelog

本仓库使用 GitHub Releases 作为正式发布记录，文档站也保留按大版本整理的更新日志。

## v13.0.0 澄明 - 2026-07-03

v13 是 CopyTranslator 的 Tauri 2 迁移优化版本。此版本移除 Electron 运行时，重建桌面端窗口、托盘、配置、快捷键、发布构建和更新检查链路，并继续强化 AI 翻译与 OCR 工作流。

### 主要更新

- 完成 Tauri 2 桌面端迁移，统一 Windows、macOS、Linux 构建配置。
- 更新应用图标、托盘图标、Linux Wayland/X11 窗口图标和 Release 打包流程。
- 更新界面布局、设置页、主题、透明窗口、文本可读性和多语言显示。
- 新增或完善 AI 翻译供应商配置，支持提示词预设、翻译角色、自定义 System Prompt、温度、最大 Token 和格式保留策略。
- 集成 OCR 配置入口，支持通过百度 OCR REST API 识别剪贴板图片后翻译。
- 增加快捷键配置页，支持全局快捷键和窗口内快捷键配置。
- 使用系统标准配置目录，Linux 默认迁移到 `~/.config/copytranslator`。
- 更新检查与下载地址切换到 `https://github.com/wang-borong/CopyTranslator/releases`。
- 清理旧 Electron 依赖和历史运行时入口，依赖升级到当前 Tauri/Vue/Rust 工具链。

### 升级提示

- 如果从旧版本升级，首次启动会尝试迁移旧配置文件。
- 透明窗口依赖系统合成器支持，Linux 不同桌面环境效果可能不同。
- AI 翻译和 OCR 会把对应文本或图片发送给所配置的第三方服务，使用前请确认服务条款和隐私策略。

完整说明请查看 [v13 更新日志](docs/changelogs/v13.md) 和 [v13 使用指南](docs/guide/13.0.0.md)。

