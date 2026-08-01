# ADR-0001: Business composition and contract boundaries / 业务组合与契约边界

Date / 日期：2026-07-30
Status / 状态：Accepted / 已接受

## Context / 背景

HIA-uView-Biz is a configurable, capability-composed UniApp business framework. It must support mini-program applications first while avoiding an implicit dependency on one backend, one identity provider, one industry model, or unreleased HIA-uView packages.

HIA-uView-Biz 是可配置、按能力组合的 UniApp 业务框架。它首先服务小程序应用，同时不能隐式依赖单一后端、单一身份提供方、单一行业模型或尚未发布的 HIA-uView 包。

The framework needs a public vocabulary that distinguishes business responsibility from engineering delivery. Without that distinction, backend envelopes, UI routes, package metadata, and remote configuration could become accidental core APIs.

框架需要一套公开术语，用于区分业务主责与工程交付。缺少这一层区分时，后端 envelope、UI 路由、包元数据和远程配置都可能意外成为 core API。

## Decision / 决定

### 1. Composition core / 组合核心

The composition core owns only composition rules: it validates declared manifests, resolves enabled capabilities, detects declared dependency or conflict conditions, registers declared ports, and exposes validation hooks. It does not own industry records, backend connections, routes, credentials, tokens, or UI component implementations.

组合核心只拥有组合规则：校验声明的 manifest、解析启用的能力、检测已声明的依赖或冲突、登记已声明的 port，并提供验证挂钩。它不拥有行业记录、后端连接、路由、凭据、token 或 UI 组件实现。

### 2. Business module and implementation package / 业务模块与实现包

A business module declares a business capability: its owner, lifecycle, permissions, public requests and results, policy, and domain schemas. An implementation package declares how installed engineering assets provide that capability, including package identity, runtime targets, exported integration surface, compatibility, provenance and validation evidence. One module may be supplied by more than one implementation package; a package may not silently claim business ownership merely because it is reused by several pages.

业务模块声明一项业务能力：其主责方、生命周期、权限、公开请求与结果、策略和领域 schema。实现包声明已安装的工程资产如何提供该能力，包括包身份、运行时目标、导出的集成面、兼容性、来源与验证证据。一个模块可以由多个实现包提供；一个包即使被多个页面复用，也不能因此悄然取得业务主责。

The two declarations are separate, versioned contract artifacts. `package.json` remains engineering metadata and is not a replacement for either business declaration.

两类声明是相互独立且带版本的契约产物。`package.json` 仍是工程元数据，不能替代其中任一业务声明。

### 3. Ports, adapters, and canonical outcomes / 端口、adapter 与规范化结果

A module talks to external systems through declared ports. An adapter implements a port and owns protocol-specific work such as HTTP transport, Directus mapping, legacy envelopes, pagination translation, retries, telemetry, and credential injection. It must convert those wire details into the module's canonical result or canonical failure before the composition core or a business module observes them.

模块通过已声明的 port 与外部系统通信。adapter 实现 port，并拥有 HTTP 传输、Directus 映射、旧 envelope、分页转换、重试、遥测和凭据注入等协议专项工作。它必须先将这些 wire 细节转换为模块的规范化结果或规范化失败，组合核心或业务模块才能观察到它们。

HTTP and a `{ code, message, data }` envelope remain valid adapter-facing protocols. This decision does not require a single HTTP client: multiple clients or adapters are permitted when their port ownership and error conversion are explicit and non-overlapping.

HTTP 与 `{ code, message, data }` envelope 仍是有效的 adapter 面向协议。本决定不要求只能有一个 HTTP client：只要 port 主责与错误转换明确、互不重叠，就可以存在多个 client 或 adapter。

### 4. Profile and channel projection / Profile 与渠道投影

A profile selects and orders declared modules, implementation packages, policies, and permitted configuration values for one application composition. A channel projection maps approved business intents and view state to a channel-specific presentation such as a mini-program route, a registered block, or a navigation action. It is not the source of domain truth and must not expose undeclared backend syntax.

profile 为一次应用组合选择并排序已声明的模块、实现包、策略和允许的配置值。渠道投影把已批准的业务 intent 与视图状态映射为特定渠道的呈现，例如小程序路由、已登记区块或导航动作。它不是领域事实来源，也不能暴露未声明的后端语法。

### 5. Declarative dynamic presentation / 声明式动态呈现

Configuration may dynamically enable, order, hide, or parameterize registered modules and registered presentation blocks; it may also select declared pagination and visibility policies. Every value must be accepted by the relevant versioned schema and allowlist. Configuration cannot introduce executable online scripts, unreviewed dependencies, unknown components, arbitrary URLs, arbitrary connections, or undeclared cross-module private-data reads.

配置可以动态启用、排序、隐藏或参数化已登记的模块和呈现区块，也可以选择已声明的分页与可见性策略。每个值都必须通过相应的带版本 schema 和 allowlist。配置不能引入可执行的在线脚本、未经审查的依赖、未知组件、任意 URL、任意连接或未声明的跨模块私有数据读取。

### 6. HIA-uView integration / HIA-uView 集成

HIA-uView is a presentational dependency only. A future integration may use a released versioned package, an explicit local link, a fixture, or a dedicated integration script. UI components render intent, loading, empty, error, and feedback states; they do not own business records, session state, transport, or query semantics.

HIA-uView 只作为呈现层依赖。未来集成可以使用已发布且带版本的包、显式本地链接、fixture 或专用集成脚本。UI 组件渲染 intent、加载、空、错误和反馈状态；它们不拥有业务记录、session 状态、传输或查询语义。

## Initial example boundary / 首个示例边界

The initial neutral profile identifier is `example.catalog-query-detail`, and its example object is `entry`. Its catalog, query, and detail behavior is read-only; it additionally defines one separately contracted instance-local acknowledgement mock command. It is not an industry package or a production data model.

首个中性 profile 标识为 `example.catalog-query-detail`，示例对象为 `entry`。其目录、查询和详情行为为只读；另行定义一个已契约化、instance-local 的确认 mock command。它不是行业包或生产数据模型。

The canonical query uses a module-owned filter schema plus `page` and `pageSize`. Cursor or offset can be an adapter capability only when conversion is lossless; otherwise the adapter declares its supported pagination mode rather than pretending to support page jumps.

规范化 query 使用模块自有的 filter schema 加 `page` 与 `pageSize`。cursor 或 offset 只能在转换无损时作为 adapter capability；否则 adapter 必须声明其支持的分页模式，不能假装支持页码跳转。

The initial boundary includes deterministic mock data, a mock or anonymous session port, canonical query/detail result and failure contracts, one bounded instance-local acknowledgement mock command, and a restricted route projection. It excludes real authentication, persistent/backend writes, preferences, CMS or rich text, industry packages, a Directus adapter, and production data.

首个边界包含确定性的 mock 数据、mock 或匿名 session port、规范化的 query/detail 结果与失败契约、一个受限 instance-local 确认 mock command，以及受限路由投影。它不包含真实认证、持久化/后端写操作、偏好、CMS 或富文本、行业包、Directus adapter 或生产数据。

## Alternatives considered / 备选项

### Backend-shaped core / 按后端形状设计 core

Letting HTTP responses, Directus collections, or a legacy envelope become the public module contract would speed up one adapter but couple every other adapter and UI to that backend. Rejected.

让 HTTP 响应、Directus collection 或旧 envelope 成为公开模块契约，虽然能加快单一 adapter 的开发，却会把其他 adapter 和 UI 都耦合到该后端。未采用。

### Package metadata as the only manifest / 仅用包元数据作为 manifest

Putting business ownership and engineering distribution facts into `package.json` would blur independent versioning and validation responsibilities. Rejected.

将业务主责与工程分发事实都放入 `package.json` 会模糊独立的版本管理与验证责任。未采用。

### Unrestricted remote configuration / 不受限的远程配置

Allowing configuration to select arbitrary code, components, URLs, dependencies, or connections would make dynamic presentation an execution and supply-chain mechanism. Rejected for the framework baseline.

允许配置选择任意代码、组件、URL、依赖或连接，会把动态呈现变成执行与供应链机制。框架基线不采用。

## Consequences / 后果

- Public contracts must state whether a declaration describes business responsibility or engineering implementation.
- 公开契约必须说明声明描述的是业务主责还是工程实现。

- Adapters are the only place where backend-specific protocol details enter the framework boundary.
- adapter 是后端专项协议细节进入框架边界的唯一位置。

- Dynamic behavior stays useful but auditable: it is limited to installed, registered, schema-approved capabilities and presentation blocks.
- 动态行为保持有用且可审计：它受限于已安装、已登记、经 schema 批准的能力与呈现区块。

- Every source, asset, dependency, or reusable upstream file added later requires provenance, license or NOTICE review, declared scope, and validation evidence.
- 未来新增的每个来源、资产、依赖或可复用上游文件都需要来源、许可证或 NOTICE 审查、声明范围和验证证据。

## Verification and review / 验证与复审

The first contract artifacts must validate module and implementation manifests separately, demonstrate the neutral example's query/detail/mock/session/route contracts, and keep the public repository free of private workspace references and production data.

首批契约产物必须分别校验模块与实现包 manifest，演示中性示例的 query/detail/mock/session/route 契约，并确保公开仓不含私有工作区引用和生产数据。

Review this decision before adding executable runtime code, a real backend adapter, a new dynamic capability class, a published HIA-uView dependency, or a production identity or persistence model.

在新增可执行运行时代码、真实后端 adapter、新的动态能力类别、已发布 HIA-uView 依赖或生产身份/持久化模型之前，必须复审本决定。
