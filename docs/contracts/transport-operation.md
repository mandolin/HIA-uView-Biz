# Static transport-operation contract / 静态 transport-operation 契约

This contract defines a small, backend-agnostic operation-dispatch seam between one selected Biz adapter and its checked-in local wire handlers. It makes static operation ownership reviewable without creating an HTTP client, endpoint configuration, backend protocol, identity system, or generic plugin registry.

本契约定义一个小型、backend-agnostic 的 operation-dispatch seam，位于一个选定 Biz adapter 与其 checked-in 本地 wire handler 之间。它使静态 operation 主责可审阅，但不创建 HTTP client、endpoint 配置、后端协议、身份系统或通用 plugin registry。

## Public artifacts / 公开产物

| Artifact / 产物 | Responsibility / 主责 |
| --- | --- |
| [Descriptor schema / Descriptor schema](schemas/transport-operation.descriptor.v1.schema.json) | Exact versioned JSON shape for one static local operation set / 一个静态本地 operation 集合的精确版本化 JSON 形态 |
| [Neutral catalog descriptor example / 中性目录 descriptor 示例](examples/example.catalog-query-detail.local-transport.descriptor.json) | Two declared query/detail read operations for the checked-in local fixture / 仓内本地 fixture 的两个已声明 query/detail read operation |
| `@hia-uview/biz-transport-operation-runtime` | Pure descriptor/handler-map validation, isolated dispatch, count-only observation, and bounded local failure / 纯 descriptor/handler-map 校验、隔离 dispatch、仅计数 observation 与受限本地 failure |

## Ownership / 主责

| Concern / 关注点 | Owner / 主责方 | Not owned here / 此处不负责 |
| --- | --- | --- |
| Canonical request/result/failure and business semantics / 规范化 request/result/failure 与业务语义 | Business module and selected adapter conversion / Business module 与选定 adapter conversion | Local transport runtime / 本地 transport runtime |
| Canonical-to-wire and wire-to-canonical conversion / Canonical-to-wire 与 wire-to-canonical 转换 | Selected adapter / 选定 adapter | Core, shell, page, operation runtime / core、shell、页面、operation runtime |
| Static operation ID, read port, contract correspondence, execution class / 静态 operation ID、read port、contract 对应、execution class | Versioned descriptor reviewed beside selected adapter / 与选定 adapter 一同审阅的版本化 descriptor | URL, endpoint, HTTP method/status, backend collection, token / URL、endpoint、HTTP method/status、后端 collection、token |
| Local handler-map completeness and isolated plain-data dispatch / 本地 handler-map 完整性与隔离 plain-data dispatch | Transport-operation runtime / Transport-operation runtime | Handler discovery, remote loading, generic plugin registration / handler 发现、远端加载、通用 plugin 注册 |
| Wire handler behavior and local fixture case / Wire handler 行为与本地 fixture case | Selected adapter fixture / 选定 adapter fixture | Real network, production service, account, persistence / 真实网络、生产服务、账户、持久化 |

## Descriptor and handler map / Descriptor 与 handler map

The descriptor must have exactly the fields in the schema. Version 1 permits only `execution: "local-synchronous"`, `credential.mode: "none"`, and one or more unique `read` operations. Each operation declares only a stable literal operation ID, an existing read port, and its existing contract ID/version.

descriptor 必须精确包含 schema 中的字段。版本 1 只允许 `execution: "local-synchronous"`、`credential.mode: "none"` 和一个或多个唯一的 `read` operation。每个 operation 只声明稳定字面 operation ID、一个既有 read port 及其既有 contract ID/version。

The descriptor is not a handler registry. In the same reviewed source initialization, the host supplies a plain-object handler map whose keys exactly equal the declared operation IDs. Missing, extra, accessor, non-function, discovered, or dynamically loaded handlers reject initialization; no partial transport, fallback, or operation discovery is created.

descriptor 不是 handler registry。在同一段已审阅源码初始化中，宿主提供一个 plain-object handler map，其键必须与已声明 operation ID 精确相等。缺失、额外、accessor、非 function、发现式或动态加载的 handler 都会拒绝初始化；不会创建 partial transport、fallback 或 operation discovery。

## Invocation and data boundary / 调用与数据边界

A selected adapter maps an accepted canonical request to adapter-private wire plain data, then calls `transport.invoke()` with a source-literal declared operation ID. The runtime copies the input before invoking the handler and copies the handler outcome before returning it. It rejects accessor, cyclic, shared-reference, sparse-array, behavioral, and unsupported data values. No operation ID, input, outcome, handler, descriptor, or exception appears in observation or failure envelopes.

选定 adapter 先把已接受 canonical request 映射为 adapter-private wire plain data，再以源码字面已声明 operation ID 调用 `transport.invoke()`。runtime 在调用 handler 前复制输入，并在返回前复制 handler outcome。它拒绝 accessor、循环、共享引用、稀疏数组、带行为或不支持的数据值。operation ID、输入、outcome、handler、descriptor 与异常都不会出现在 observation 或 failure envelope 中。

The local transport result is adapter-private. Success returns an isolated private outcome. Unknown operation, unsafe input, handler exception, or unsafe handler output returns one bounded local transport failure. The selected adapter maps that failure inside its injected exchange; the existing read-adapter runtime then returns the already-defined canonical `adapter-unavailable` failure. Local transport failure is not a new business outcome or UI message.

本地 transport result 是 adapter-private。成功返回隔离的 private outcome。未知 operation、不安全输入、handler 异常或不安全 handler output 返回一个受限本地 transport failure。选定 adapter 在其 injected exchange 内映射该 failure；既有 read-adapter runtime 随后返回已定义的 canonical `adapter-unavailable` failure。本地 transport failure 不是新的业务 outcome 或 UI message。

## Observation / Observation

`getObservation()` returns only `invocations`, `successes`, and counts for `operation`, `input`, and `handler` failure categories. It is local development/test evidence, not telemetry, a canonical port result, an application state API, or a user-visible diagnostic.

`getObservation()` 只返回 `invocations`、`successes` 以及 `operation`、`input`、`handler` failure category 的计数。它是本地开发/测试证据，不是 telemetry、canonical port result、应用状态 API 或用户可见 diagnostic。

## Deliberate limits / 刻意限制

Version 1 does not define HTTP, `fetch`, `uni.request`, REST, GraphQL, gRPC, WebSocket, URL, endpoint, method, status, header, cookie, token, credential reference, identity, account, tenant/role, storage, persistent cache, async/Promise lifecycle, retry, timeout, cancellation, concurrency, offline sync, dynamic handler/package discovery, remote configuration, arbitrary script/DSL, command/write transport, transaction persistence, page control, DevTools evidence, deployment, or publication.

版本 1 不定义 HTTP、`fetch`、`uni.request`、REST、GraphQL、gRPC、WebSocket、URL、endpoint、method、status、header、cookie、token、credential reference、identity、account、tenant/role、storage、持久 cache、async/Promise lifecycle、retry、timeout、cancellation、concurrency、offline sync、动态 handler/package discovery、远端配置、任意 script/DSL、command/write transport、transaction persistence、页面 control、DevTools 证据、部署或发布。

These capabilities are temporarily not adopted, not permanently excluded. A future real transport or command mapping requires a separate versioned contract, adapter/identity trust model, privacy/data review, failure/rollback design, tests, and explicit product decision.

这些能力目前暂不采用，并非永久排除。未来的真实 transport 或 command mapping 需要独立版本化契约、adapter/identity 信任模型、隐私/数据复审、failure/rollback 设计、测试与明确产品决定。
