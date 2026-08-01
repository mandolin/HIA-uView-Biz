# Adapter runtime API / Adapter runtime API

`@hia-uview/biz-adapter-runtime` is a pure ESM package for one explicit synchronous read-adapter lifecycle. It validates a backend-agnostic declaration, runs module-specific request validation, invokes a caller-supplied local exchange, converts the private wire outcome to a canonical result, redacts internal failure, and optionally caches only canonical success in process-local memory.

`@hia-uview/biz-adapter-runtime` 是用于一个显式同步 read-adapter lifecycle 的纯 ESM package。它校验 backend-agnostic declaration，执行 module-specific request validation，调用调用方提供的本地 exchange，将 private wire outcome 转换为 canonical result，对内部失败脱敏，并可选择仅在进程内内存中缓存 canonical success。

## Exports / 导出

| Export / 导出 | Responsibility / 主责 |
| --- | --- |
| `ADAPTER_CONTRACT_VERSION` | Fixed version of the current private declaration/runtime shape / 当前 private declaration/runtime shape 的固定版本 |
| `validateAdapterDeclaration(declaration)` | Validates stable ownership, port contract, injected-fixture transport, pagination, bounded cache, and no-credential policy / 校验稳定主责、port contract、injected-fixture transport、分页、受限缓存与无 credential policy |
| `createReadAdapter(input)` | Creates a `{ contract, invoke }` provider and a separate count-only/cache controller / 创建 `{ contract, invoke }` provider 以及独立的仅计数/cache controller |

## Declaration / 声明

The initial declaration requires a stable `adapterId`, `port`, contract ID/version, implementation `owner`, `transport: "injected-fixture"`, pagination modes/page-jump capability, explicit cache mode, and `credential.mode: "none"`. A non-paginated read port uses `modes: []` and `pageJump: false`. A page-capable query port lists `page` explicitly.

初始 declaration 要求稳定的 `adapterId`、`port`、contract ID/version、implementation `owner`、`transport: "injected-fixture"`、pagination modes/page-jump capability、显式 cache mode，以及 `credential.mode: "none"`。非分页 read port 使用 `modes: []` 与 `pageJump: false`；具备页码能力的 query port 显式列出 `page`。

Memory cache requires a positive integer TTL no greater than five minutes. That bound protects the deterministic fixture from becoming an implicit persistent default; it is not a recommended production TTL.

内存缓存要求不超过五分钟的正整数 TTL。该边界用于避免确定性 fixture 变成隐式持久化默认值，并非建议的生产 TTL。

Validation returns `{ ok, diagnostics }`. Diagnostic codes are stable and bilingual messages contain no declaration values, paths, endpoint, wire payload, or credential.

校验返回 `{ ok, diagnostics }`。diagnostic code 稳定，双语 message 不含 declaration 值、路径、endpoint、wire payload 或 credential。

## `createReadAdapter(input)`

The input supplies these functions explicitly:

输入显式提供以下函数：

| Function / 函数 | Rule / 规则 |
| --- | --- |
| `validateRequest(request)` | Returns `null` or a same-version canonical failure; it runs before cache and exchange / 返回 `null` 或同版本 canonical failure；在 cache 与 exchange 前运行 |
| `createCacheKey(request)` | Required only by memory mode; receives an already accepted canonical request and returns a non-empty adapter-owned key / 仅 memory mode 需要；接收已接受的 canonical request，并返回非空 adapter-owned key |
| `createWireRequest(request)` | Maps accepted canonical input to adapter-private wire input / 将已接受 canonical input 映射为 adapter-private wire input |
| `exchange(wireRequest)` | Synchronous caller-supplied local fixture exchange / 调用方提供的同步本地 fixture exchange |
| `convertWireOutcome(wireOutcome, request)` | Maps a recognized private outcome to same-version canonical `page`, `detail`, or `failure` / 将已识别 private outcome 映射为同版本 canonical `page`、`detail` 或 `failure` |
| `now()` | Optional clock; a fixture supplies it for deterministic TTL tests / 可选时钟；fixture 可提供它以进行确定性 TTL 测试 |

Initialization snapshots the declaration fields and callback references used by the runtime. Changing the original input object after successful initialization does not replace its contract, TTL, validator, mapper, exchange, or converter.

初始化会快照 runtime 使用的 declaration 字段和 callback reference。成功初始化后修改原输入对象，不会替换其 contract、TTL、validator、mapper、exchange 或 converter。

An internal mapper, cache-key, clock, exchange, converter, or plain-data-copy failure does not throw through the port. It becomes the existing retryable `adapter-unavailable` canonical failure with `scope: "adapter"`; raw exception and wire data are discarded. Request validation failures keep their module-owned canonical code/scope and never reach exchange.

内部 mapper、cache-key、clock、exchange、converter 或 plain-data-copy 失败不会通过 port 抛出。它变成已有的、可重试的 `adapter-unavailable` canonical failure，`scope: "adapter"`；原始异常与 wire data 被丢弃。request validation failure 保留 module-owned canonical code/scope，且永不进入 exchange。

## Provider and controller / Provider 与 controller

Successful initialization returns:

成功初始化返回：

- `provider.contract` and `provider.invoke(request)`, the only surface supplied to Biz composition.
- `provider.contract` 与 `provider.invoke(request)`，这是提供给 Biz composition 的唯一 surface。
- `controller.getObservation()`, which exposes only exchange/cache/failure-category counts and cache-entry count.
- `controller.getObservation()`，仅暴露 exchange/cache/failure-category 计数与 cache-entry 数量。
- `controller.clearCache()`, which clears only this adapter instance's in-memory map.
- `controller.clearCache()`，只清理该 adapter instance 的内存 map。

Cache lookup occurs only after request validation. The runtime stores an isolated plain-data copy only when conversion produces canonical `page` or `detail`. A validation failure, adapter failure, canonical failure, raw response, exception, session, credential, or diagnostic is never cached. Every cache return is another isolated copy, so caller mutation cannot alter the stored value.

cache lookup 只在 request validation 后发生。仅当 conversion 产生 canonical `page` 或 `detail` 时，runtime 才存储隔离的 plain-data 副本。validation failure、adapter failure、canonical failure、raw response、异常、session、credential 或 diagnostic 永不缓存。每次 cache 返回都是另一个隔离副本，因此调用方 mutation 不能改变存储值。

## Neutral fixture / 中性 fixture

`@hia-uview/biz-example-catalog-query-detail-adapter-fixture` supplies independently written local query/detail wire values, exact existing port contracts, one static local-synchronous read-operation descriptor with a complete checked-in handler map, a no-account mock session, optional query memory cache, and count-only observations. It can replace the existing mock implementation only when a caller explicitly selects its implementation-package ID and providers in a composition.

`@hia-uview/biz-example-catalog-query-detail-adapter-fixture` 提供独立编写的本地 query/detail wire 值、精确的现有 port contract、一个带完整 checked-in handler map 的静态 local-synchronous read-operation descriptor、无账户 mock session、可选 query 内存缓存和仅计数 observation。只有调用方在 composition 中显式选择其 implementation-package ID 与 provider 时，它才可替换现有 mock implementation。

The fixture cases cover success, exchange failure, malformed wire, and supplementary detail-section failure. Its local static operation dispatch performs no real transport or backend discovery; P38 command remains a separate instance-local mock transaction.

fixture case 覆盖 success、exchange failure、malformed wire 与附属 detail-section failure。其本地静态 operation dispatch 不执行真实 transport，也不发现 backend；P38 command 仍是独立 instance-local mock transaction。

## Deliberate limits / 刻意限制

The runtime and fixture do not implement asynchronous transport, retry scheduling, `fetch`, `uni.request`, REST/GraphQL, Directus SDK/collection, environment configuration, real identity/account, credential/token/cookie/header handling, storage, persistent/offline/shared cache, write operation, dynamic import, arbitrary remote configuration, UI, route, telemetry export, or package discovery.

runtime 与 fixture 不实现异步 transport、retry scheduling、`fetch`、`uni.request`、REST/GraphQL、Directus SDK/collection、环境配置、真实 identity/account、credential/token/cookie/header 处理、storage、持久/离线/共享 cache、写操作、动态 import、任意远端配置、UI、route、telemetry export 或 package discovery。
