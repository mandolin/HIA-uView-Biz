# HIA-uView-Biz — Agent 指引

- 本仓是独立公开主仓。只管理 `packages/`、`modules/`、`extensions/`、本仓文档与测试；禁止依赖父工作区、`HIA/HIA-uView/` 或私有 WorkZone 的隐式文件路径。
- Windows Shell 一律使用 PowerShell 7：`C:\Program Files\PowerShell\7\pwsh.exe`。
- 修改前检查 `git status` 并阅读 README、相关公开文档和私有 WorkZone 中适用的规划、ADR、里程碑与任务状态。
- 公开文档只面向使用者和二次开发者；内部规划、AI 协作、审计与研究过程不进入本仓。
- HIA-uView 只能以已声明的版本化 package contract、明确 local link、fixture 或集成脚本进入本仓；不得复制其源码、共享父级 lockfile 或假定未发布的包名可用。
- 所有新增或结构性修改的源码严格执行《HIA项目初始化指南》第 7 节的 ROP（面向阅读的编程）要求：每个 module/package 边界、class/type、function/method、public/exported member、重要 constant 与有独立职责/副作用的内部节点均须有紧邻声明的中英双语文档化注释；每个流程块、关键子流程、基本每个局部变量及每句非明显自明语句均须有紧邻的双语普通注释，说明目的、状态变化、约束或风险，而非复述语法。
- JS/TS 在同一 JSDoc/TSDoc-compatible block 中使用 canonical `@lang zh-CN`、`@lang en`，字段级与普通代码块使用合法 inline `<lang><zh-CN>…</zh-CN><en>…</en></lang>`；Vue/HTML/CSS 采用各自合法的注释形式和同一语言标识。中英文必须描述同一事实；术语与 API 标识保留原文；不得发明 `@zh`、`@en` 等临时 tag。
- 每次源码改动执行 touch-improve：同步补齐本次触及模块的职责、公共 API 与关键不变量；未触及存量缺口进入 WorkZone coverage inventory 和已排期治理，不得降低新代码的硬门槛。参数、返回、默认值、错误、隐私、安全、版本或兼容性变化时，注释和测试必须同一变更更新。
- 第三方依赖、字体、图标、模板或参考代码必须先完成来源、许可证、替代方案、发布范围和安全影响记录。业务能力模型不得绕过正式 ADR/规划变更。
- 每次实质文档更新完成检查后，自动在本仓创建聚焦提交；累计约 3 至 5 个提交或形成完整检查点后，核对远程、分支和范围再推送。
