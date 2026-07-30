# ADR-0003: Adapter, session, and cache boundary / Adapter、会话与缓存边界

## Status / 状态

Accepted for the first backend-agnostic adapter contract and deterministic fixture.

已接受，适用于首个 backend-agnostic adapter 契约与确定性 fixture。

## Context / 背景

The current Biz core composes declared ports, while the example module and application shell consume only canonical query, detail, failure, and mock-session values. This protects presentation and business semantics from one backend, but a future adapter still needs a precise place to translate wire protocols, pagination, failure details, session policy, and optional caching.

当前 Biz core 组合已声明 port，example module 与应用 shell 只消费规范化的 query、detail、failure 与 mock-session 值。这保护了呈现层和业务语义不受单一后端影响，但未来 adapter 仍需要一个精确位置来转换 wire protocol、分页、失败细节、会话策略和可选缓存。

Existing projects demonstrate the value of an application-facing facade, separately mockable endpoints, and independent detail-section failures. They also demonstrate risks that must not become defaults: exposing backend envelopes to pages, coupling the core to Directus collections, duplicating transport ownership, dynamically executing remote code, or placing credentials in broadly visible request surfaces.

既有项目证明了面向应用的 facade、可独立 mock 的端点和详情 section 独立失败的价值；它们也展示了不能成为默认的风险：让页面看到后端 envelope、让 core 耦合 Directus collection、重复传输主责、动态执行远端代码，或把凭据放入广泛可见的请求表面。

## Decision / 决定

### 1. Adapter is the protocol boundary / Adapter 是协议边界

Only an explicit adapter implementation may construct a backend-specific request, invoke a transport, interpret a raw response, map a pagination model, apply a declared retry policy, or retain protocol diagnostics. Its public port result is always the module's canonical result or canonical failure. Core, business modules, app shell, route projection, and UI must not receive raw response objects, HTTP status, Directus error objects, legacy envelopes, request URLs, headers, cookies, or credentials.

只有显式 adapter 实现可以构造后端专用请求、调用传输、解释原始响应、映射分页模型、应用已声明 retry policy 或保留协议诊断。它对外的 port 结果始终是模块的规范化结果或规范化失败。core、业务模块、app shell、route projection 与 UI 不得接收原始响应对象、HTTP status、Directus error 对象、旧 envelope、请求 URL、header、cookie 或凭据。

One application may use more than one transport client or adapter. Each required port must nevertheless have one explicit implementation owner in a selected composition. An adapter may not silently fall back to another client, claim a port it did not declare, or create competing retries for the same call.

一个应用可以使用多个 transport client 或 adapter。但每个 required port 在选定 composition 中仍必须有一个明确的实现主责方。adapter 不得静默回退到另一 client、声明未声明的 port，或为同一次调用创建相互竞争的 retry。

### 2. Wire conversion and failure redaction / Wire 转换与失败脱敏

The canonical request belongs to the module contract. An adapter may map it to its own wire request only inside that adapter. A successful wire response becomes a canonical page or detail result; an invalid request becomes the module's request-scope failure before transport; an unavailable or invalid wire interaction becomes a stable adapter-scope canonical failure without raw payload, endpoint, status, credential, or backend error text.

规范化 request 归模块契约所有。adapter 只能在自身内部把它映射为自己的 wire request。成功 wire response 转为规范化 page 或 detail 结果；无效 request 在 transport 前成为模块的 request-scope failure；不可用或无效的 wire interaction 成为稳定的 adapter-scope 规范化 failure，其中不含原始 payload、endpoint、status、凭据或 backend error 文本。

Adapter-local diagnostics may retain a safely bounded category for development observation, but they are not a port result, UI message, persisted record, or contract extension. Adding a new canonical failure code, scope, or data member requires a versioned module-contract review.

adapter 本地 diagnostic 可保留受安全约束的类别以供开发观察，但它不是 port 结果、UI message、持久记录或契约扩展。新增规范化 failure code、scope 或数据成员需要版本化模块契约复审。

### 3. Pagination belongs to the declared adapter capability / 分页属于已声明 adapter 能力

The neutral catalog contract remains page-based. An adapter exposes `page` and page jump only when its own cursor or offset model can preserve page request and result semantics without loss. Otherwise it declares its actual mode and refuses unsupported navigation rather than fabricating page numbers, totals, or `hasNext` values.

中性 catalog 契约仍以 page 为基础。adapter 只有在自身 cursor 或 offset 模型可以无损保留 page request 与 result 语义时，才暴露 `page` 与 page jump。否则它声明实际 mode，并拒绝不支持的导航，不伪造页码、total 或 `hasNext`。

### 4. Session and credentials remain separate / 会话与凭据保持分离

The initial session port stays `anonymous` or `mock`. It neither fetches accounts nor issues, stores, serializes, logs, or injects credentials. An adapter may later receive an opaque, adapter-owned credential reference only after a separately reviewed identity and transport contract defines acquisition, audience, visibility, expiration, revocation, logging, cache interaction, and platform behavior. No credential is accepted in a canonical query, detail request, route, page state, configuration manifest, or cache key.

初始 session port 仍为 `anonymous` 或 `mock`。它不获取账户，也不签发、存储、序列化、记录或注入凭据。只有独立复审的 identity 与 transport 契约定义获取、audience、可见性、过期、撤销、日志、缓存交互和平台行为后，adapter 才可接收不透明且由 adapter 所有的 credential reference。规范化 query、detail request、route、page state、configuration manifest 或 cache key 中不得接受凭据。

### 5. Cache is opt-in, adapter-owned, and non-persistent / 缓存是 opt-in、adapter-owned 且非持久化的

The first adapter fixture may use only an in-memory cache that is explicitly selected for an idempotent read port. Its owner, key shape, bounded TTL, invalidation condition, and observability must be declared by the adapter. It may cache only a successfully validated canonical read result; it never caches a canonical failure, raw response, credential, session object, request header, or cross-adapter value. It does not use `uni` storage, browser storage, files, environment variables, or any cross-session persistence.

首个 adapter fixture 只能为明确选择的幂等 read port 使用内存缓存。其 owner、key 形状、受限 TTL、失效条件与可观察性必须由 adapter 声明。它只能缓存已成功校验的规范化 read result；绝不缓存规范化 failure、原始响应、凭据、session 对象、request header 或跨 adapter 值。它不使用 `uni` storage、浏览器 storage、文件、环境变量或任何跨会话持久化。

Offline, shared, encrypted, user-preference, or persistent caching requires a separate data classification, retention, consent, encryption, invalidation, and platform review.

离线、共享、加密、用户偏好或持久缓存需要独立的数据分类、保留、同意、加密、失效与平台复审。

### 6. Directus is a migration candidate, not a framework dependency / Directus 是迁移候选，不是框架依赖

Directus may be implemented later as an explicit adapter package. Such a package may own a reviewed facade route, Directus collection/query mapping, error conversion, and its declared credential policy. It must not make Directus packages, collections, dynamic scripts, endpoint source files, industry fields, deployment configuration, or legacy envelopes part of the core, module, app-shell, or generic adapter runtime.

Directus 可以在未来实现为显式 adapter package。该 package 可以拥有经过复审的 facade route、Directus collection/query 映射、错误转换和已声明 credential policy。它不得让 Directus package、collection、动态脚本、endpoint source file、行业字段、部署配置或旧 envelope 成为 core、module、app-shell 或通用 adapter runtime 的一部分。

## Consequences / 后果

- The first adapter runtime can be deterministic and dependency-free: it accepts a caller-supplied exchange function in tests, but does not perform network I/O itself.
- 首个 adapter runtime 可以是确定性且无依赖的：它在测试中接受调用方提供的 exchange function，但自身不执行网络 I/O。

- The example's mock remains valid and independently selectable. A wire fixture must prove conversion and redaction without replacing the mock as the default data source.
- example 的 mock 仍然有效且可独立选择。wire fixture 必须证明转换与脱敏，而不能替换 mock 成为默认数据源。

- A future real transport or identity integration has a narrow review point instead of changing core/module/UI APIs.
- 未来真实 transport 或 identity 集成有明确而狭窄的复审点，而不必改变 core/module/UI API。

## Rejected alternatives / 未采用方案

- Putting `fetch`, Directus SDK calls, environment lookup, or credential logic into core, the example module, or app shell.
- 将 `fetch`、Directus SDK 调用、环境读取或凭据逻辑放入 core、example module 或 app shell。

- Treating legacy `{ code, message, data }`, HTTP status, or Directus error objects as canonical module results.
- 将旧 `{ code, message, data }`、HTTP status 或 Directus error 对象视为规范化 module 结果。

- A global or persistent cache with inferred keys, cached failures, or credentials.
- 使用推断 key、缓存 failure 或凭据的全局/持久缓存。

- A generic remote script, arbitrary URL, or unknown adapter selection mechanism.
- 通用远端脚本、任意 URL 或未知 adapter 选择机制。

## Review conditions / 复审条件

Review this ADR before adding a network transport, a third-party backend SDK, real credentials or identity, persistent cache, write operation, new canonical outcome version, Directus adapter, or any backend-specific configuration. Review also when a selected adapter changes its declared owner, pagination capability, retry policy, cache policy, or provenance.

在新增网络 transport、第三方 backend SDK、真实凭据或 identity、持久缓存、写操作、新规范化结果版本、Directus adapter 或任何后端专用配置前复审本 ADR。当选定 adapter 改变已声明 owner、pagination capability、retry policy、cache policy 或 provenance 时，也必须复审。
