# Controlled mp-weixin fixture / 受控 mp-weixin fixture

This private fixture compiles the neutral `example.catalog-query-detail` composition into one UniApp Vue 3 `mp-weixin` page. It is a compile-only integration check, not a published application, project template, backend adapter, authentication sample, or industry starter.

此私有 fixture 将中性的 `example.catalog-query-detail` composition 编译为一个 UniApp Vue 3 `mp-weixin` 页面。它只是编译期集成检查，不是已发布应用、项目模板、后端 adapter、认证示例或行业 starter。

## Local source prerequisite / 本地源码前提

`@hia-uview/ui` is currently private and unpublished. Before building, set `HIA_UVIEW_UI_ROOT` to the trusted local directory that contains its `package.json`. The build checks `@hia-uview/ui`, version `0.0.0`, MIT metadata, and reviewed Git commit `48354f10506d17744398f8fc159a49d0c1f9f6ea`.

`@hia-uview/ui` 当前为私有且未发布的包。构建前，请将 `HIA_UVIEW_UI_ROOT` 设置为包含其 `package.json` 的受信任本地目录。构建会检查 `@hia-uview/ui`、版本 `0.0.0`、MIT metadata 和已复审的 Git commit `48354f10506d17744398f8fc159a49d0c1f9f6ea`。

The repository declares no external `file:` dependency and never searches a parent directory or registry for this input. During the build, a temporary ignored directory junction gives the official compiler a lexical path inside the fixture input tree; it is removed even when compilation fails. UI source is neither copied, modified, committed, nor published by this fixture.

仓库不声明外部 `file:` dependency，且绝不在父目录或 registry 中搜索这一输入。构建时，一个临时且被忽略的目录 junction 为官方 compiler 提供 fixture 输入树内的词法路径；即使编译失败它也会被删除。该 fixture 不复制、修改、提交或发布 UI 源码。

## Build and verification / 构建与验证

In PowerShell, provide only the trusted local source root and run the controlled verification command:

在 PowerShell 中，仅提供受信任的本地源码根后运行受控验证命令：

```powershell
$env:HIA_UVIEW_UI_ROOT = 'path-to-local-hia-uview-ui-package'
npm run verify:fixture:mp-weixin
```

The command runs one locked local compiler invocation and then checks generated `app.json`, `project.config.json`, and the declared home-page file set. It creates no development server, watch process, WeChat DevTools session, simulator, device connection, network service, preview, upload, or release.

该命令运行一次锁定的本地 compiler，再检查生成的 `app.json`、`project.config.json` 和已声明的首页文件集合。它不创建开发服务、watch 进程、微信开发者工具会话、模拟器、设备连接、网络服务、预览、上传或发布。

## Behavior and limits / 行为与限制

The page uses named `UStack`, `UNavBar`, `UField`, `UInput`, `UCell`, `UEmpty`, `UNotice`, `UButton`, and `UValidationMessage` imports plus explicit style import. It does not install the UI global plugin or auto-register components.

页面使用命名的 `UStack`、`UNavBar`、`UField`、`UInput`、`UCell`、`UEmpty`、`UNotice`、`UButton` 和 `UValidationMessage` 导入，并显式导入样式。它不安装 UI 全局 plugin，也不自动注册组件。

The fixture uses an in-memory deterministic mock. Its query-context input is visible caller-owned text, but the neutral contract currently declares no filter fields, so that text is not sent as a hidden or invented query filter. It has no HTTP, Directus, real identity, token, cookie, storage, write operation, URL/router, deep link, persisted state, dynamic page/block import, executable configuration, industry field, or production data.

fixture 使用内存中的确定性 mock。其 query-context 输入是可见的调用方自有文本，但中性契约当前不声明 filter 字段，因此该文本不会作为隐藏或虚构的 query filter 发送。它没有 HTTP、Directus、真实身份、token、cookie、storage、写操作、URL/router、deep link、持久状态、动态 page/block import、可执行配置、行业字段或生产数据。

Compilation demonstrates only this constrained local compiler path. It does not prove WeChat DevTools import, runtime interaction, simulator/device behavior, accessibility tree, screen reader, keyboard focus, App, H5, other mini-program targets, security acceptance, or release readiness.

编译只证明这一受限的本地 compiler 路径。它不证明微信开发者工具导入、运行时交互、模拟器/设备行为、无障碍树、读屏、键盘焦点、App、H5、其他小程序目标、安全验收或发布就绪性。
