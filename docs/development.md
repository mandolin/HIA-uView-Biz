# Development / 开发

## Prerequisites / 前置条件

- Node.js 22 or later / Node.js 22 或更高版本
- npm 10 or later / npm 10 或更高版本
- A local Git checkout of the reviewed private HIA-uView UI source only when compiling the optional `mp-weixin` fixture / 仅在编译可选 `mp-weixin` fixture 时需要一个已复审私有 HIA-uView UI source 的本地 Git checkout

## Baseline commands / 基线命令

Install the committed development dependency graph without lifecycle scripts, then run the static and Node contracts:

在不执行 lifecycle script 的前提下安装 committed 开发依赖图，再运行静态与 Node 契约：

```bash
npm ci --ignore-scripts
npm run check
npm test
npm run quality:release-candidate
```

`npm run check` verifies required workspace files and the minimum bilingual ROP markers in controlled JavaScript, Vue, and CSS source. `npm test` runs that gate first and then executes deterministic Node contracts for core, the neutral mock, application shell, adapter runtime, capability lifecycle, complete-set adoption/replacement, application-template integration, the injected neutral wire fixture, and the representative app runtime.

`npm run check` 校验必需 workspace 文件，以及受控 JavaScript、Vue 与 CSS 源码的最低双语 ROP 标记。`npm test` 先运行该门禁，再执行 core、中性 mock、应用 shell、adapter runtime、能力生命周期、完整集合采用/替换、应用模板集成、注入式中性 wire fixture 与代表性 app runtime 的确定性 Node 契约。

These commands use the committed lockfile and installed dependencies. They do not start a service, access production data, or create a runtime backend connection.

这些命令使用 committed lockfile 和已安装依赖。它们不启动服务、不访问生产数据，也不创建运行时后端连接。

`npm run quality:release-candidate` is an offline static package-quality gate. A passing result is candidate evidence only: it does not publish, upload, make a release decision, prove device behavior, or certify security or accessibility. See [release-quality candidate](quality.md).

`npm run quality:release-candidate` 是离线静态 package-quality 门禁。通过结果仅是候选证据：它不会 publish、upload、作出 release 决定、证明设备行为或认证安全/无障碍。详见[发布质量候选](quality.md)。

## Application-template development / 应用模板开发

The initial template lives in `templates/example-catalog-query-detail-mp-weixin/`. Its public declarative contract is checked in separately under `docs/contracts/`; its runtime factory returns a fresh template plus a complete explicit adoption profile and capability-unit set. Keep the template, adoption profile, app profile, business-module manifests, implementation-package manifests, and `package.json` as separate artifacts.

首个模板位于 `templates/example-catalog-query-detail-mp-weixin/`。其公开声明式契约单独存放在 `docs/contracts/`；runtime factory 返回新的模板，以及完整显式 adoption profile 与 capability-unit 集合。模板、adoption profile、app profile、business-module manifest、implementation-package manifest 和 `package.json` 必须保持为不同工件。

Add a capability to a template only by declaring a complete slot, required state and surfaces, supplying its explicit unit, and extending acceptance first. Do not derive a package name from a slot, search a registry, copy a scaffold, load arbitrary JSON/YAML inside the runtime, run a lifecycle/migration script, or add a silent mock/wire fallback.

只有在声明完整 slot、必需 state 与 surfaces、提供其显式 unit 并先扩展验收后，才能向模板增加能力。不得从 slot 推导 package 名、搜索 registry、复制脚手架、在 runtime 内加载任意 JSON/YAML、运行 lifecycle/migration script，或增加静默 mock/wire fallback。

## Controlled mp-weixin fixture / 受控 mp-weixin fixture

The fixture in `apps/example-catalog-query-detail-mp-weixin/` is the only current UniApp integration surface. Its build is local and compile-only. Before building, set `HIA_UVIEW_UI_ROOT` to the local UI package directory, not to a parent workspace or registry URL.

`apps/example-catalog-query-detail-mp-weixin/` 中的 fixture 是当前唯一的 UniApp 集成表面。其构建仅限本地编译。构建前，请将 `HIA_UVIEW_UI_ROOT` 设置为本地 UI package 目录，而非父工作区或 registry URL。

The checked-in `src/representative.profile.json` defaults to the local `wire-fixture`. It may select only `wire-fixture` or `mock`, page sizes `1`, `5`, `10`, or `20`, and registered compiled blocks. Invalid source or shape fails before provider creation and never falls back. See the [representative slice contract](contracts/representative-mp-weixin-slice.md).

仓内 `src/representative.profile.json` 默认选择本地 `wire-fixture`。它只能选择 `wire-fixture` 或 `mock`、每页 `1`/`5`/`10`/`20` 项，以及已登记的已编译区块。无效 source 或 shape 会在 provider 构造前失败，且绝不回退。详见[代表性纵切契约](contracts/representative-mp-weixin-slice.md)。

```powershell
$env:HIA_UVIEW_UI_ROOT = 'path-to-local-hia-uview-ui-package'
npm run verify:fixture:mp-weixin
```

The runner verifies the local UI package name, version, MIT metadata, and reviewed Git commit before Vite resolution. It makes a one-use ignored directory junction inside the fixture input tree, preserves its lexical path for the DCloud compiler, and removes it in cleanup. This avoids both source copying and an external `file:` dependency. A missing or wrong source input fails before compiler startup.

runner 会在 Vite resolution 前校验本地 UI package 的名称、版本、MIT metadata 和已复审 Git commit。它在 fixture 输入树内创建一次性且被忽略的目录 junction，为 DCloud compiler 保留其词法路径，并在清理时删除它。这同时避免源码复制和外部 `file:` dependency。输入缺失或错误会在 compiler 启动前失败。

The verification command builds once, then checks generated `app.json`, `project.config.json`, the exact home-page `usingComponents` registry, relative component paths, and all required page/component runtime files. It does not start a development server, watch process, WeChat DevTools session, simulator, device connection, preview, upload, release, network service, or browser test.

验证命令构建一次，随后检查生成的 `app.json`、`project.config.json`、精确首页 `usingComponents` registry、相对组件路径以及全部必需页面/组件运行文件。它不启动开发服务、watch 进程、微信开发者工具会话、模拟器、设备连接、预览、上传、发布、网络服务或浏览器测试。

## Current dependency-risk disclosure / 当前依赖风险披露

The compiler and documentation toolchain uses exact development dependency versions in the committed lockfile. The local full development audit currently reports 39 advisories: 14 low, 12 moderate, 13 high, and 0 critical. This is an accepted, explicitly limited development risk for trusted local source and compile-only work; it is not a production-security conclusion, release approval, or permission to run untrusted input.

compiler 与文档工具链使用 committed lockfile 中的精确开发依赖版本。当前本地完整开发审计报告 39 项 advisory：14 项 low、12 项 moderate、13 项 high、0 项 critical。这是针对受信任本地源码与仅编译工作的已接受且明确受限的开发风险；它不是生产安全结论、发布批准，也不允许处理不可信输入。

Do not use `npm audit fix` or `npm audit fix --force` as an unreviewed repair. A compiler, lockfile, UI-source commit, package metadata, vulnerability result, license result, or fixture scope change requires a fresh review and updated evidence.

不得将 `npm audit fix` 或 `npm audit fix --force` 用作未经复审的修复。compiler、lockfile、UI-source commit、package metadata、漏洞结果、许可证结果或 fixture scope 的变化都需要重新复审和更新证据。

## Current runtime boundary / 当前运行时边界

Core receives already parsed in-memory manifests and explicit port providers. The deterministic example validates composition, page query, detail, canonical failure, mock session, and restricted route action. Application shell adds in-memory screen-state projection, mock capability gate, and retry retention. Adapter runtime adds an explicit synchronous injected-exchange lifecycle, redaction, and optional bounded process-local success cache. Capability runtime adds explicit process-local install/enable/disable/uninstall state, dependency/conflict checks, unique owners, enabled-only routing, and redacted snapshots without package-manager behavior or hooks. Adoption runtime adds complete profile validation, exact caller-supplied unit matching, dependency-first candidate activation, bounded presentation metadata, public-safe receipts, and atomic in-memory implementation replacement. Application integration adds application-template validation, exact slot/state/implementation/surface correspondence, adoption delegation, and a shell bridge fixed to the primary module. The private template package assembles the complete neutral reference-data and selected catalog candidate, so the representative app no longer duplicates lifecycle/provider assembly. None is a JSON/YAML loader, complete JSON Schema engine, package installer, registry, real backend adapter, application generator, migration engine, or real identity system.

core 接收已解析的内存 manifest 和显式 port provider。确定性示例验证组合、页码 query、详情、规范化 failure、mock session 与受限 route action。应用 shell 增加内存 screen-state 投影、mock capability gate 与 retry 保留。adapter runtime 增加显式同步注入式 exchange lifecycle、脱敏与可选受限进程内成功缓存。capability runtime 增加显式进程内安装/启用/停用/卸载状态、依赖/冲突检查、唯一 owner、仅已启用路由与脱敏 snapshot，且没有包管理器行为或 hook。adoption runtime 增加完整 profile 校验、精确调用方单元匹配、依赖优先候选启用、受限呈现 metadata、可公开 receipt 与原子进程内实现替换。application integration 增加 application-template 校验、精确 slot/state/implementation/surface 对应、采用委托与固定主模块 shell bridge。私有模板包装配完整的中性 reference-data 与所选 catalog 候选，因此代表性 app 不再重复 lifecycle/provider 装配。它们都不是 JSON/YAML loader、完整 JSON Schema engine、包安装器、registry、真实后端 adapter、应用生成器、迁移引擎或真实身份系统。

The fixture uses explicit HIA-uView SFC imports and an explicit style entry through the one-use verified source link. It does not install the UI global plugin, auto-scan components, introduce UI global services, or change HIA-uView source. The neutral query-context input is not an implicit filter: current module schema owns no filter field. Future filter semantics require a separate versioned module contract.

fixture 通过一次性且已核验的 source link 使用显式 HIA-uView SFC 导入和显式样式入口。它不安装 UI 全局 plugin、不自动扫描组件、不引入 UI global service，也不修改 HIA-uView 源码。中性 query-context 输入不是隐式 filter：当前 module schema 不拥有 filter 字段。未来 filter 语义需要独立的版本化 module contract。

## Integration boundary / 集成边界

HIA-uView is a separate repository. Current fixture consumption is a documented, operator-provided, commit-verified local source integration. A normal clone has no external `file:` dependency and does not search a sibling directory. No shared root lockfile is created.

HIA-uView 是独立仓库。当前 fixture 消费方式是已文档化、由操作者提供且经过 commit 校验的本地源码集成。普通 clone 没有外部 `file:` dependency，也不会搜索同级目录。不会创建共享 root lockfile。

The first surface is read-only and single-page. Its adapter exchange is synchronous, local, and injected only. It has no real HTTP/Directus adapter, token/cookie/header transport, account lookup, WeChat or enterprise identity, write operation, persistent/offline/shared cache, URL/router/deep link, dynamic import, executable configuration, industry fields, online CMS, or production data. These are intentional non-goals until separately designed, reviewed, and validated.

首个表面是只读且单页的。其 adapter exchange 仅为同步、局部、注入式。它没有真实 HTTP/Directus adapter、token/cookie/header transport、账户查询、微信或企业身份、写操作、持久/离线/共享 cache、URL/router/deep link、动态 import、可执行配置、行业字段、在线 CMS 或生产数据。在完成独立设计、复审与验证前，这些都是有意的非目标。
