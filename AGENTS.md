# HIA-uView-Biz — Agent 指引

- 本仓是独立公开主仓。只管理 `packages/`、`modules/`、`extensions/`、本仓文档与测试；禁止依赖父工作区、`HIA/HIA-uView/` 或私有 WorkZone 的隐式文件路径。
- Windows Shell 一律使用 PowerShell 7：`C:\Program Files\PowerShell\7\pwsh.exe`。
- 修改前检查 `git status` 并阅读 README、相关公开文档和私有 WorkZone 中适用的规划、ADR、里程碑与任务状态。
- 公开文档只面向使用者和二次开发者；内部规划、AI 协作、审计与研究过程不进入本仓。
- HIA-uView 只能以已声明的版本化 package contract、明确 local link、fixture 或集成脚本进入本仓；不得复制其源码、共享父级 lockfile 或假定未发布的包名可用。
- 新增公共 API、配置、模块契约、非显然逻辑、兼容性分支或 I/O 时，在同一 JSDoc/TSDoc 注释块中提供准确的中文和英文说明。
- 第三方依赖、字体、图标、模板或参考代码必须先完成来源、许可证、替代方案、发布范围和安全影响记录。业务能力模型不得绕过正式 ADR/规划变更。
- 每次实质文档更新完成检查后，自动在本仓创建聚焦提交；累计约 3 至 5 个提交或形成完整检查点后，核对远程、分支和范围再推送。
