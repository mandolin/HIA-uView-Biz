# Adapter boundary contract / Adapter 边界契约

This contract defines the first backend-agnostic adapter boundary for Biz read ports. It is a contract and deterministic-fixture target, not a network client, Directus adapter, identity system, or production cache.

本契约定义 Biz read port 的首个 backend-agnostic adapter 边界。它是契约和确定性 fixture 目标，不是网络 client、Directus adapter、identity system 或生产缓存。

## Ownership map / 主责地图

| Concern / 关注点 | Owner / 主责方 | Never exposed to / 绝不暴露给 |
| --- | --- | --- |
| Canonical query/detail request, result, and failure | Business module contract / 业务模块契约 | Backend-specific wire protocol / 后端专用 wire protocol |
| Port selection and implementation correspondence | Composition core / 组合核心 | URL, credential, transport singleton / URL、凭据、transport singleton |
| Screen state and visible UX policy | Application shell and channel application / 应用 shell 与渠道应用 | Raw response, endpoint, cache internals / 原始响应、endpoint、缓存内部信息 |
| Wire request/response, envelope, pagination conversion, retry policy, bounded diagnostics | Selected adapter / 选定 adapter | Core, module, shell, UI / core、module、shell、UI |
| Account acquisition and credential lifecycle | Future separately reviewed identity provider / 将来独立复审的 identity provider | Canonical request, route, manifest, cache key / 规范化 request、route、manifest、cache key |
| In-memory read cache | Selected adapter only / 仅选定 adapter | Other adapter, global store, persistent storage / 其他 adapter、global store、持久 storage |

## Required adapter declaration / Required adapter 声明

Every adapter implementation records these facts beside its implementation package. The current repository may validate this declaration in memory; it does not discover packages or load arbitrary manifest files.

每个 adapter 实现在其 implementation package 旁记录以下事实。当前仓库可以在内存中校验该声明；它不发现 package，也不加载任意 manifest 文件。

```json
{
  "adapterId": "example.catalog-query-detail.wire-fixture",
  "port": "catalog-query",
  "contract": { "id": "catalog-query-detail.query", "version": "1.0" },
  "owner": "example-catalog-query-detail-adapter-fixture",
  "transport": "injected-fixture",
  "pagination": { "modes": ["page"], "pageJump": true },
  "cache": { "mode": "memory", "ttlMs": 1000 },
  "credential": { "mode": "none" }
}
```

`transport` identifies an adapter implementation class, not an endpoint URL. `owner` is an installed implementation identifier, not a user or account. `credential.mode: "none"` is the only initial mode. A future reference mode needs the separate identity/transport review required by ADR-0003.

`transport` 标识 adapter 实现类别，而不是 endpoint URL。`owner` 是已安装实现标识，而不是用户或账户。`credential.mode: "none"` 是唯一的初始 mode。未来 reference mode 需要 ADR-0003 要求的独立 identity/transport 复审。

## Invocation lifecycle / 调用生命周期

1. Module validation accepts or rejects a canonical request before an adapter exchange begins.
2. The selected adapter maps an accepted canonical request to its own local wire request.
3. Its declared exchange obtains a local wire outcome. The deterministic fixture injects that exchange; generic runtime code does not call a network API.
4. The adapter converts only a declared, recognized outcome to the current canonical page, detail, or failure shape.
5. The adapter returns a redacted canonical failure when conversion or exchange cannot serve the port. No raw object crosses the port.

1. module validation 在 adapter exchange 开始前接受或拒绝规范化 request。
2. 选定 adapter 将已接受的规范化 request 映射为自己的本地 wire request。
3. 其已声明 exchange 获得本地 wire outcome。确定性 fixture 注入该 exchange；通用 runtime 代码不调用网络 API。
4. adapter 只将已声明、已识别的 outcome 转换为当前规范化 page、detail 或 failure 形状。
5. 当转换或 exchange 无法服务该 port 时，adapter 返回脱敏的规范化 failure。没有原始对象跨越 port。

## Failure and diagnostic rules / 失败与诊断规则

A request that violates module validation returns its declared request-scope failure without reaching the adapter exchange. Exchange unavailability, malformed wire values, unsupported pagination, or unmappable protocol outcomes become an adapter-scope canonical failure with a stable code and localized message. Such a result contains no URL, HTTP status, Directus collection, backend text, header, cookie, token, credential, request body, or raw payload.

违反 module validation 的 request 在到达 adapter exchange 前返回其已声明的 request-scope failure。exchange 不可用、wire value 格式错误、不支持的 pagination 或无法映射的 protocol outcome 都成为带稳定 code 和本地化 message 的 adapter-scope 规范化 failure。该结果不含 URL、HTTP status、Directus collection、backend text、header、cookie、token、credential、request body 或 raw payload。

An adapter may count a bounded diagnostic category such as `exchange-unavailable` in its own fixture observation. It may not return diagnostic objects through a port or reuse them as user-facing text.

adapter 可以在自身 fixture observation 中统计如 `exchange-unavailable` 的受限 diagnostic category。它不得通过 port 返回 diagnostic object，也不得将其复用为面向用户的文本。

## Pagination rules / 分页规则

For a declared `page` adapter, the canonical `page`, `pageSize`, `total`, and `hasNext` describe one result set. A cursor or offset implementation can advertise that mode only if the conversion is lossless. Otherwise the adapter's declaration excludes page jump and its port returns a controlled unsupported failure for an incompatible request; it does not synthesize totals or page numbers.

对于已声明 `page` 的 adapter，规范化 `page`、`pageSize`、`total` 与 `hasNext` 描述同一个结果集。cursor 或 offset 实现只有在转换无损时才可以宣称该 mode。否则 adapter 的声明排除 page jump，且其 port 对不兼容 request 返回受控 unsupported failure；它不合成 total 或页码。

## Cache rules / 缓存规则

Memory cache is optional per declared idempotent read port. A cache key derives only from the adapter ID, contract version, port ID, and canonical request fields that the module has already accepted. A cache entry is bounded by a positive TTL and cleared when the adapter instance is discarded. Success may be cached only after conversion to a canonical read result. Validation failure, exchange failure, conversion failure, session value, credential reference, raw response, and diagnostic are never cached.

内存缓存按已声明的幂等 read port 可选。cache key 只从 adapter ID、contract version、port ID 和 module 已接受的规范化 request 字段导出。cache entry 受正 TTL 限制，并在 adapter instance 丢弃时清除。成功只能在转换为规范化 read result 后缓存。validation failure、exchange failure、conversion failure、session 值、credential reference、raw response 与 diagnostic 永不缓存。

The initial cache is process-local. It has no storage, hydration, synchronization, background refresh, cross-user behavior, or offline guarantee.

初始 cache 仅限进程本地。它没有 storage、hydration、同步、后台刷新、跨用户行为或离线保证。

## Directus migration mapping / Directus 迁移映射

| Keep as an adapter lesson / 保留为 adapter 经验 | Exclude from the generic baseline / 排除出通用基线 |
| --- | --- |
| Application facade separates pages from backend persistence / 应用 facade 将页面与后端持久化分离 | Collection name, endpoint path, or query syntax / collection 名称、endpoint path 或 query syntax |
| Per-port mock supports offline contract verification / 按 port mock 支持离线契约验证 | Legacy envelope and raw Directus error / 旧 envelope 与原始 Directus error |
| Primary detail and supplementary section can fail independently / 主详情与附属 section 可以独立失败 | Dynamic script loader and dual source/build path / 动态脚本 loader 与双 source/build path |
| Explicit credential and cache policy must be reviewed / 必须复审显式 credential 与 cache policy | Default token transport, persistent storage, industry fields, and production data / 默认 token 传输、持久 storage、行业字段与生产数据 |

## Non-goals / 非目标

This contract does not authorize or implement `fetch`, `uni.request`, a Directus SDK, REST/GraphQL endpoint, environment configuration, real account lookup, credential injection, storage, write command, dynamic import, remote configuration, industry schema, or package discovery.

本契约不授权或实现 `fetch`、`uni.request`、Directus SDK、REST/GraphQL endpoint、环境配置、真实账户查询、credential injection、storage、写 command、动态 import、远端配置、行业 schema 或 package discovery。
