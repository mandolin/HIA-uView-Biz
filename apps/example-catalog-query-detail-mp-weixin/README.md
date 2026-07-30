# Controlled mp-weixin fixture / 受控 mp-weixin fixture

This non-published representative fixture composes the neutral `example.catalog-query-detail` capability into one UniApp Vue 3 `mp-weixin` page. Pure Node acceptance exercises its profile, explicit source, lifecycle, query, detail, and back-to-catalog path; the controlled compiler verifies the checked-in Vue projection. It is not a published application, project template, production backend adapter, authentication sample, or industry starter.

此非发布代表性 fixture 将中性的 `example.catalog-query-detail` 能力组合为一个 UniApp Vue 3 `mp-weixin` 页面。纯 Node 验收执行其 profile、显式 source、lifecycle、query、detail 与返回目录路径；受控 compiler 校验仓内 Vue 投影。它不是已发布应用、项目模板、生产后端 adapter、认证示例或行业 starter。

The acceptance boundary is defined by the [representative slice contract](../../docs/contracts/representative-mp-weixin-slice.md). The app consumes `src/representative.profile.json`, whose shape is fixed by the [versioned profile schema](../../docs/contracts/schemas/representative-mp-weixin.profile.v1.schema.json).

验收边界由[代表性纵切契约](../../docs/contracts/representative-mp-weixin-slice.md)定义。应用消费 `src/representative.profile.json`，其 shape 由[带版本 profile schema](../../docs/contracts/schemas/representative-mp-weixin.profile.v1.schema.json)固定。

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

## Profile and source selection / Profile 与数据源选择

The checked-in profile selects `wire-fixture`, page `1`, page size `1`, and four registered compiled blocks. `catalog-list` and `entry-detail` are required. `runtime-status` and `query-context` may be hidden declaratively. Block IDs only control existing template branches; they cannot become component imports, routes, URLs, dependencies, connections, expressions, or data fields.

仓内 profile 选择 `wire-fixture`、第 `1` 页、每页 `1` 项和四个已登记的已编译区块。`catalog-list` 与 `entry-detail` 必选。`runtime-status` 与 `query-context` 可以声明式隐藏。区块 ID 只控制既有 template 分支；它们不能成为组件导入、路由、URL、依赖、连接、表达式或数据字段。

`wire-fixture` is the default explicit source and proves injected adapter conversion through application-local install and enable lifecycle. `mock` remains a mandatory explicit offline/regression source. An invalid or unavailable selection fails initialization; neither mode falls back to the other. Both are deterministic, local, synchronous, and read-only.

`wire-fixture` 是默认显式 source，用于通过应用本地 install/enable lifecycle 证明注入式 adapter 转换。`mock` 仍是必备的显式离线/回归 source。无效或不可用选择会使初始化失败；两种模式都不会回退到另一模式。二者都具有确定性、仅在本地、同步且只读。

## Behavior and limits / 行为与限制

The page uses named `UStack`, `UNavBar`, `UField`, `UInput`, `UCell`, `UEmpty`, `UNotice`, `UButton`, and `UValidationMessage` imports plus explicit style import. It does not install the UI global plugin or auto-register components.

页面使用命名的 `UStack`、`UNavBar`、`UField`、`UInput`、`UCell`、`UEmpty`、`UNotice`、`UButton` 和 `UValidationMessage` 导入，并显式导入样式。它不安装 UI 全局 plugin，也不自动注册组件。

The page consumes only the app-owned fixture runtime's safe shell, profile/lifecycle snapshots, query factory, source observation, and registered-block predicate. It does not assemble core, providers, adapters, or manifests. The default wire observation exposes counts only; mock observation exposes only its explicit source mode.

页面只消费 app-owned fixture runtime 的安全 shell、profile/lifecycle snapshot、query factory、source observation 与已登记区块判断；它不装配 core、provider、adapter 或 manifest。默认 wire observation 只公开计数；mock observation 只公开其显式 source mode。

The query-context input is visible caller-owned text, but the neutral contract currently declares no filter fields, so that text is not sent as a hidden or invented query filter. The fixture has no HTTP, Directus, real identity, token, cookie, storage, write operation, URL/router, deep link, persisted state, dynamic page/block import, executable configuration, industry field, or production data.

query-context 输入是可见的调用方自有文本，但中性契约当前不声明 filter 字段，因此该文本不会作为隐藏或虚构的 query filter 发送。fixture 没有 HTTP、Directus、真实身份、token、cookie、storage、写操作、URL/router、deep link、持久状态、动态 page/block import、可执行配置、行业字段或生产数据。

Compilation demonstrates only this constrained local compiler path. It does not prove WeChat DevTools import, runtime interaction, simulator/device behavior, accessibility tree, screen reader, keyboard focus, App, H5, other mini-program targets, security acceptance, or release readiness.

编译只证明这一受限的本地 compiler 路径。它不证明微信开发者工具导入、运行时交互、模拟器/设备行为、无障碍树、读屏、键盘焦点、App、H5、其他小程序目标、安全验收或发布就绪性。
