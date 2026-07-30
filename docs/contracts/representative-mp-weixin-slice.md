# Representative `mp-weixin` slice / 代表性 `mp-weixin` 纵切

This contract defines the first end-to-end application fixture for `example.catalog-query-detail`. It proves that one neutral mini-program can join the versioned business contract, capability lifecycle, backend-agnostic adapter boundary, application shell, and named HIA-uView components. It remains a representative engineering fixture rather than an industry preset, generated application, production backend, or release template.

本契约定义 `example.catalog-query-detail` 的首个端到端应用 fixture。它验证一个中性小程序可以串联带版本业务契约、能力生命周期、后端无关 adapter 边界、应用 shell 与 HIA-uView 命名组件。它仍是代表性工程 fixture，而不是行业预置、生成式应用、生产后端或发布模板。

Read it together with the [profile schema](schemas/representative-mp-weixin.profile.v1.schema.json), [profile example](examples/example.catalog-query-detail.representative-mp-weixin.profile.json), [catalog-query-detail contract](catalog-query-detail.md), [adapter boundary](adapter-boundary.md), and [capability lifecycle](capability-lifecycle.md).

请将本文与 [profile schema](schemas/representative-mp-weixin.profile.v1.schema.json)、[profile 示例](examples/example.catalog-query-detail.representative-mp-weixin.profile.json)、[目录—查询—详情契约](catalog-query-detail.md)、[adapter 边界](adapter-boundary.md)和[能力生命周期](capability-lifecycle.md)一并阅读。

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
| `presentation.enabledBlocks` | A unique subset of registered IDs; order does not create component imports or a free-form layout / 已登记 ID 的无重复子集；顺序不会创建组件导入或自由布局 |

`catalog-list` and `entry-detail` are required because removing either would break the accepted query-to-detail slice. `runtime-status` and `query-context` are optional application-owned projections. Enabling a block only reveals already compiled presentation; it cannot name a new component, package, route, URL, expression, dependency, connection, or data field.

`catalog-list` 与 `entry-detail` 必须存在，因为移除任一项都会破坏已验收的 query-to-detail 纵切。`runtime-status` 与 `query-context` 是可选的应用自有投影。启用区块只会显示已经编译的呈现；它不能指定新组件、包、路由、URL、表达式、依赖、连接或数据字段。

The default checked-in profile selects `wire-fixture`, page `1`, page size `1`, and all registered blocks. Page size `1` deliberately makes next-page metadata observable without adding a paging control or claiming a complete pagination UX.

仓内默认 profile 选择 `wire-fixture`、第 `1` 页、每页 `1` 项以及全部已登记区块。每页 `1` 项刻意使下一页 metadata 可观察，但不增加分页控件，也不声称已经形成完整分页 UX。

## Source modes / 数据源模式

Both modes are deterministic, local, read-only, and free of network I/O. They share the same canonical port contracts and application-shell projection.

两种模式都具有确定性、仅在本地、只读且不访问网络。它们共享相同的规范化 port 契约与应用 shell 投影。

| Mode / 模式 | Responsibility / 主责 | Evidence / 证据 |
| --- | --- | --- |
| `wire-fixture` | Select the injected-wire implementation, install and enable it in the application-local capability runtime, convert a bounded backend-like fixture into canonical results, and route the app shell through that enabled capability / 选择 injected-wire 实现，在应用本地 capability runtime 中安装并启用它，把受限的类后端 fixture 转为规范化结果，并通过已启用能力向 app shell 路由 | Lifecycle snapshot names the enabled module and implementation; bounded observation counts adapter exchange without exposing payloads / lifecycle snapshot 标识已启用模块与实现；受限 observation 统计 adapter exchange 而不暴露 payload |
| `mock` | Select the neutral in-memory mock implementation, install and enable it through the same lifecycle boundary, and retain mandatory offline/regression behavior / 选择中性内存 mock 实现，通过相同 lifecycle 边界安装并启用它，并保留必备的离线与回归行为 | Canonical page, detail, failure, and mock-session outcomes remain deterministic / 规范化 page、detail、failure 与 mock-session 结果保持确定 |

An unavailable, unknown, or invalid selected mode makes initialization fail with bounded diagnostics. The runtime does not retry the other mode, inspect the environment, search a registry, or open a connection.

所选模式不可用、未知或无效时，初始化以受限 diagnostics 失败。runtime 不重试另一模式、不检查环境、不搜索 registry，也不打开连接。

## End-to-end acceptance / 端到端验收

The representative path is one explicit sequence:

代表性路径是下面这条明确序列：

1. Validate the complete profile before creating or invoking a provider. / 在创建或调用 provider 前校验完整 profile。
2. Assemble the selected capability unit, install it as disabled, then explicitly enable it. / 装配所选 capability unit，以 disabled 状态安装，再显式启用。
3. Bridge only the enabled capability invocation and registered route projection into the application shell. / 只把已启用能力调用与已登记路由投影桥接给应用 shell。
4. Submit the profile-owned canonical `page` and `pageSize`, then display the resulting catalog page. / 提交 profile 自有的规范化 `page` 与 `pageSize`，再显示结果目录页。
5. Select an `entry` from that canonical page, invoke `entry-detail`, and display its primary entry and section states. / 从规范化页面选择一个 `entry`，调用 `entry-detail`，再显示主条目与 section 状态。
6. Return to the catalog projection without a URL, platform router, page-stack mutation, or second copy of business state. / 不使用 URL、平台 router、页面栈修改或第二份业务状态副本，返回目录投影。

Automated acceptance covers invalid-profile rejection before invocation; successful `wire-fixture` lifecycle and bounded adapter observation; explicit `mock`; query, empty/failure semantics where supplied by the selected fixture; detail and section states; back-to-catalog state; detached snapshots; and absence of manifests, providers, input payloads, raw wire values, credentials, paths, or environment data from public diagnostics.

自动验收覆盖：调用前拒绝无效 profile；成功的 `wire-fixture` lifecycle 与受限 adapter observation；显式 `mock`；所选 fixture 已提供的 query、empty/failure 语义；detail 与 section 状态；返回目录状态；隔离 snapshot；以及公开 diagnostics 不包含 manifest、provider、输入 payload、原始 wire 值、凭据、路径或环境数据。

The controlled compiler and output verifier remain separate evidence. They prove that the checked-in profile and Vue projection compile for `mp-weixin`; they do not prove simulator, device, accessibility-service, backend, security-certification, or production-release behavior.

受控 compiler 与输出 verifier 是独立证据。它们证明仓内 profile 与 Vue 投影可以编译为 `mp-weixin`；它们不证明模拟器、真机、无障碍服务、后端、安全认证或生产发布行为。

## Ownership / 主责

| Layer / 层 | Owns / 主责 | Must not own / 禁止主责 |
| --- | --- | --- |
| App profile / 应用 profile | Source selection, bounded initial paging values, registered block visibility / 数据源选择、受限初始分页值、已登记区块可见性 | Scripts, arbitrary components, URLs, connections, dependencies, business schema / 脚本、任意组件、URL、连接、依赖、业务 schema |
| Fixture runtime / Fixture runtime | Profile validation, explicit source construction, lifecycle transition, safe shell bridge, bounded observation / profile 校验、显式数据源构造、lifecycle 转换、安全 shell bridge、受限 observation | UI refs, platform navigation, hidden fallback, real backend discovery / UI ref、平台导航、隐藏回退、真实后端发现 |
| Capability runtime / 能力 runtime | Validated application-local install/enable/invoke state / 已验证的应用本地 install/enable/invoke 状态 | Package manager, lifecycle script, remote installation / 包管理器、生命周期脚本、远程安装 |
| Adapter or mock / Adapter 或 mock | Canonical read-port results for the selected explicit mode / 为明确选择的模式提供规范化只读 port 结果 | UI layout, route ownership, raw wire leakage, implicit mode selection / UI 布局、路由主责、原始 wire 泄露、隐式模式选择 |
| Application shell / 应用 shell | Screen/action gate and detached presentation state / screen/action gate 与隔离呈现状态 | Provider construction, profile parsing, backend protocol / provider 构造、profile 解析、后端协议 |
| Vue page / Vue 页面 | Named HIA-uView presentation, local input text, explicit user actions / HIA-uView 命名呈现、本地输入文字、明确用户操作 | Core/provider assembly, source fallback, business-data duplication, dynamic import / core/provider 装配、数据源回退、业务数据复制、动态 import |

## Non-goals / 非目标

This slice does not add a real HTTP client, Directus adapter, authentication provider, token transport, storage, preference service, write port, industry field, enterprise-capability package, remote configuration, CMS layout, arbitrary script, dynamic dependency, online module installation, native route, production data, release, or a general application generator.

本纵切不增加真实 HTTP client、Directus adapter、认证 provider、token 传输、存储、偏好服务、写入 port、行业字段、企业能力包、远程配置、CMS 布局、任意脚本、动态依赖、在线模块安装、原生路由、生产数据、发布或通用应用生成器。
