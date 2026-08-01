# Representative `mp-weixin` slice / 代表性 `mp-weixin` 纵切

This contract defines the first end-to-end application fixture for `example.catalog-query-detail`. It proves that one neutral mini-program can consume a versioned application template that joins the business contract, complete capability adoption, backend-agnostic adapter boundary, application shell, and named HIA-uView components. It remains a representative engineering fixture rather than an industry preset, generated application, copied scaffold, production backend, or release template.

本契约定义 `example.catalog-query-detail` 的首个端到端应用 fixture。它验证一个中性小程序可以消费版本化应用模板，由模板串联业务契约、完整能力采用、后端无关 adapter 边界、应用 shell 与 HIA-uView 命名组件。它仍是代表性工程 fixture，而不是行业预置、生成式应用、复制式脚手架、生产后端或发布模板。

Read it together with the [application-template contract](application-template.md), [template example](examples/example.catalog-query-detail.mp-weixin.template.manifest.json), [profile schema](schemas/representative-mp-weixin.profile.v1.schema.json), [profile example](examples/example.catalog-query-detail.representative-mp-weixin.profile.json), and [catalog-query-detail contract](catalog-query-detail.md).

请将本文与[应用模板契约](application-template.md)、[模板示例](examples/example.catalog-query-detail.mp-weixin.template.manifest.json)、[profile schema](schemas/representative-mp-weixin.profile.v1.schema.json)、[profile 示例](examples/example.catalog-query-detail.representative-mp-weixin.profile.json)和[目录—查询—详情契约](catalog-query-detail.md)一并阅读。

## Profile boundary / Profile 边界

The application owns one declarative JSON profile. JSON has no comments, so the schema supplies bilingual descriptions and this document supplies semantics. A profile is data only: it is neither a DSL nor an executable manifest.

应用拥有一个声明式 JSON profile。JSON 不支持注释，因此 schema 提供双语描述，本文提供语义。profile 只是数据：它既不是 DSL，也不是可执行 manifest。

```json
{
  "profileVersion": "1.0",
  "id": "example.catalog-query-detail.representative-mp-weixin",
  "sourceMode": "wire-fixture",
  "query": {
    "page": 1,
    "pageSize": 1
  },
  "presentation": {
    "enabledBlocks": [
      "runtime-status",
      "query-context",
      "catalog-list",
      "entry-detail"
    ],
    "blockOrder": [
      "query-context",
      "runtime-status",
      "catalog-list",
      "entry-detail"
    ]
  }
}
```

| Field / 字段 | Rule / 规则 |
| --- | --- |
| `profileVersion` | Exactly `1.0`; an incompatible shape requires an explicit new version / 固定为 `1.0`；不兼容结构必须使用明确的新版本 |
| `id` | Fixed application-profile identity, not a module or package identity / 固定的应用 profile 标识，不是模块或包标识 |
| `sourceMode` | Explicitly `wire-fixture` or `mock`; failure never selects the other source implicitly / 明确选择 `wire-fixture` 或 `mock`；失败时绝不隐式选择另一数据源 |
| `query.page` | Positive integer beginning at `1` / 从 `1` 开始的正整数 |
| `query.pageSize` | One of `1`, `5`, `10`, or `20`; the small allowlist keeps the representative states deterministic / 只能为 `1`、`5`、`10` 或 `20`；小型白名单使代表性状态保持确定 |
| `presentation.enabledBlocks` | A unique subset of registered IDs that controls visibility only / 控制可见性的已登记 ID 无重复子集 |
| `presentation.blockOrder` | A unique complete permutation of the enabled IDs; it supplies only finite relative order for fixed compiled blocks, never a component, template, style text, route, URL, or expression / enabled ID 的无重复完整排列；它只为固定已编译区块提供有限相对顺序，绝不指定组件、模板、样式文本、路由、URL 或表达式 |

`catalog-list` and `entry-detail` are required because removing either would break the accepted query-to-detail slice. `runtime-status` and `query-context` are optional application-owned projections. Enabling a block only reveals already compiled presentation. `blockOrder` must list exactly the same enabled IDs once each; the page maps only the resulting small integer to its own fixed flex-layout branch. Neither field can name a new component, package, route, URL, expression, dependency, connection, style text, or data field.

`catalog-list` 与 `entry-detail` 必须存在，因为移除任一项都会破坏已验收的 query-to-detail 纵切。`runtime-status` 与 `query-context` 是可选的应用自有投影。启用区块只会显示已经编译的呈现。`blockOrder` 必须恰好各列一次同一批 enabled ID；页面只把所得的小整数映射到自身固定 flex-layout 分支。两字段都不能指定新组件、包、路由、URL、表达式、依赖、连接、样式文本或数据字段。

The default checked-in profile selects `wire-fixture`, page `1`, page size `1`, and all registered blocks. It places query context before runtime status, then catalog and detail; that observable reorder still uses four fixed compiled branches. Page size `1` deliberately makes next-page metadata observable without adding a paging control or claiming a complete pagination UX.

仓内默认 profile 选择 `wire-fixture`、第 `1` 页、每页 `1` 项以及全部已登记区块。它把查询上下文排在运行状态之前，再是目录和详情；这个可观察的重排仍只使用四个固定已编译分支。每页 `1` 项刻意使下一页 metadata 可观察，但不增加分页控件，也不声称已经形成完整分页 UX。

## Source modes / 数据源模式

Both modes are deterministic, local, read-only, and free of network I/O. They share the same canonical port contracts and application-shell projection.

两种模式都具有确定性、仅在本地、只读且不访问网络。它们共享相同的规范化 port 契约与应用 shell 投影。

| Mode / 模式 | Responsibility / 主责 | Evidence / 证据 |
| --- | --- | --- |
| `wire-fixture` | Template supplies complete explicit neutral reference-data plus injected-wire catalog units; integration validates slots/surfaces, adopts them dependency-first, and routes the shell through the enabled primary module / 模板提供完整显式中性 reference-data 加 injected-wire catalog 单元；integration 校验 slots/surfaces、按依赖优先顺序采用，并通过已启用主模块向 shell 路由 | Adoption snapshot names both enabled modules and implementations; bounded observation counts adapter exchange without exposing payloads / adoption snapshot 标识两项已启用模块与实现；受限 observation 统计 adapter exchange 而不暴露 payload |
| `mock` | Template supplies the same complete slots with the neutral in-memory catalog mock, retaining mandatory explicit offline/regression behavior through the same integration path / 模板使用中性内存 catalog mock 提供相同完整 slots，并通过同一集成路径保留必备显式离线/回归行为 | Canonical page, detail, failure, and mock-session outcomes remain deterministic / 规范化 page、detail、failure 与 mock-session 结果保持确定 |

An unavailable, unknown, or invalid selected mode makes initialization fail with bounded diagnostics. The runtime does not retry the other mode, inspect the environment, search a registry, or open a connection.

所选模式不可用、未知或无效时，初始化以受限 diagnostics 失败。runtime 不重试另一模式、不检查环境、不搜索 registry，也不打开连接。

## End-to-end acceptance / 端到端验收

The representative path is one explicit sequence:

代表性路径是下面这条明确序列：

1. Validate the complete profile before creating or invoking a provider. / 在创建或调用 provider 前校验完整 profile。
2. Ask the fixed template package for one complete explicit reference-data plus selected catalog candidate; no unit is discovered or auto-filled. / 请求固定模板包创建一个完整显式 reference-data 加所选 catalog 候选；不发现或自动补齐任何单元。
3. Validate template identity, complete slots, selected implementations, required surfaces, and host policy; then atomically adopt the complete candidate in dependency-first order. / 校验模板 identity、完整 slots、所选实现、必需 surfaces 与宿主 policy；再按依赖优先顺序原子采用完整候选。
4. Let application integration create the shell bridge fixed to the template primary module and registered route projection. / 由 application integration 创建固定到模板主模块与已登记路由投影的 shell bridge。
5. Submit the profile-owned canonical `page` and `pageSize`, then display the resulting catalog page. / 提交 profile 自有的规范化 `page` 与 `pageSize`，再显示结果目录页。
6. Select an `entry` from that canonical page, invoke `entry-detail`, and display its primary entry and section states. / 从规范化页面选择一个 `entry`，调用 `entry-detail`，再显示主条目与 section 状态。
7. Return to the catalog projection without a URL, platform router, page-stack mutation, or second copy of business state. / 不使用 URL、平台 router、页面栈修改或第二份业务状态副本，返回目录投影。

Automated acceptance covers invalid-profile rejection before invocation; successful `wire-fixture` lifecycle and bounded adapter observation; explicit `mock`; query, empty/failure semantics where supplied by the selected fixture; detail and section states; back-to-catalog state; detached snapshots; and absence of manifests, providers, input payloads, raw wire values, credentials, paths, or environment data from public diagnostics.

自动验收覆盖：调用前拒绝无效 profile；成功的 `wire-fixture` lifecycle 与受限 adapter observation；显式 `mock`；所选 fixture 已提供的 query、empty/failure 语义；detail 与 section 状态；返回目录状态；隔离 snapshot；以及公开 diagnostics 不包含 manifest、provider、输入 payload、原始 wire 值、凭据、路径或环境数据。

The controlled compiler and output verifier remain separate evidence. They prove that the checked-in profile and Vue projection compile for `mp-weixin`; they do not prove simulator, device, accessibility-service, backend, security-certification, or production-release behavior.

受控 compiler 与输出 verifier 是独立证据。它们证明仓内 profile 与 Vue 投影可以编译为 `mp-weixin`；它们不证明模拟器、真机、无障碍服务、后端、安全认证或生产发布行为。

## Ownership / 主责

| Layer / 层 | Owns / 主责 | Must not own / 禁止主责 |
| --- | --- | --- |
| App profile / 应用 profile | Source selection, bounded initial paging values, registered block visibility and complete order / 数据源选择、受限初始分页值、已登记区块可见性及完整排序 | Scripts, arbitrary components, URLs, connections, dependencies, style text, business schema / 脚本、任意组件、URL、连接、依赖、样式文本、业务 schema |
| Fixture runtime / Fixture runtime | App-profile validation, explicit template-candidate request, query factory, registered-block predicate/projection, and bounded observation / app-profile 校验、显式模板候选请求、query factory、已登记 block 判断/投影与受限 observation | Manifest/provider/lifecycle/shell assembly, UI refs, platform navigation, hidden fallback, real backend discovery / manifest/provider/lifecycle/shell 装配、UI ref、平台导航、隐藏回退、真实后端发现 |
| Template package / 模板包 | Versioned application-template metadata and complete explicit reference-data plus selected catalog unit assembly / 版本化 application-template metadata 与完整显式 reference-data 加所选 catalog 单元装配 | Generator, scaffold copying, discovery, installation, remote catalog, industry fields, fallback / 生成器、脚手架复制、发现、安装、远端目录、行业字段、回退 |
| Application integration / 应用集成 | Template/slot/surface gate, complete-set adoption delegation, fixed-primary-module shell, safe receipts/snapshots / 模板/slot/surface 门禁、完整集合采用委托、固定主模块 shell、安全 receipt/snapshot | File/package loading, provider invention, dynamic component/script, backend or external state / 文件/package 加载、provider 虚构、动态组件/脚本、后端或外部状态 |
| Adapter or mock / Adapter 或 mock | Canonical read-port results for the selected explicit mode / 为明确选择的模式提供规范化只读 port 结果 | UI layout, route ownership, raw wire leakage, implicit mode selection / UI 布局、路由主责、原始 wire 泄露、隐式模式选择 |
| Application shell / 应用 shell | Screen/action gate and detached presentation state / screen/action gate 与隔离呈现状态 | Provider construction, profile parsing, backend protocol / provider 构造、profile 解析、后端协议 |
| Vue page / Vue 页面 | Named HIA-uView presentation, local input text, explicit user actions / HIA-uView 命名呈现、本地输入文字、明确用户操作 | Core/provider assembly, source fallback, business-data duplication, dynamic import / core/provider 装配、数据源回退、业务数据复制、动态 import |

## Non-goals / 非目标

This slice does not add a real HTTP client, Directus adapter, authentication provider, token transport, storage, preference service, write port, industry field, enterprise-capability package, remote configuration, CMS layout, arbitrary script, dynamic dependency, online module installation, native route, production data, release, or a general application generator.

本纵切不增加真实 HTTP client、Directus adapter、认证 provider、token 传输、存储、偏好服务、写入 port、行业字段、企业能力包、远程配置、CMS 布局、任意脚本、动态依赖、在线模块安装、原生路由、生产数据、发布或通用应用生成器。
