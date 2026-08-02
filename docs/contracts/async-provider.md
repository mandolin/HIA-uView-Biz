# Async project-provider contract / 异步项目 provider 契约

This contract defines the first asynchronous, backend-agnostic project-provider boundary for HIA-uView-Biz. It is an explicitly injected Promise lifecycle and source-policy seam. It is not an HTTP client, a backend SDK, a Directus adapter, an identity system, a project generator, or a BP application.

本契约定义 HIA-uView-Biz 首个异步、后端无关的项目 provider 边界。它是显式注入的 Promise 生命周期与 source-policy seam。它不是 HTTP client、backend SDK、Directus adapter、身份系统、项目生成器或 BP 应用。

## Declaration / 声明

An async-provider declaration has exactly these fields:

异步 provider 声明精确包含以下字段：

```json
{
  "asyncProviderContractVersion": "1.0",
  "providerId": "example.async-provider",
  "portId": "booking-read",
  "owner": "example-project",
  "kind": "read",
  "contract": { "id": "booking.catalog", "version": "1.0" },
  "execution": "injected-async",
  "credential": { "mode": "none" },
  "cancellation": "explicit-handle",
  "retry": { "maxAttempts": 2 }
}
```

`providerId`, `portId`, `owner`, and contract `id`/`version` are stable identifiers. `execution` is exactly `injected-async`; every source implementation is supplied in memory by the application or fixture. `credential.mode` is exactly `none`, and the only cancellation mechanism is the explicit handle returned by `start()`.

`providerId`、`portId`、`owner` 与 contract `id`/`version` 是稳定标识。`execution` 固定为 `injected-async`；每个 source 实现均由应用或 fixture 在内存中提供。`credential.mode` 固定为 `none`，唯一的取消机制是 `start()` 返回的显式 handle。

`kind` is `read` or `write`. A read declares `retry.maxAttempts` from 1 through 3. A write must declare `maxAttempts: 1`; it is never automatically retried.

`kind` 为 `read` 或 `write`。read 声明 1 至 3 的 `retry.maxAttempts`。write 必须声明 `maxAttempts: 1`；它永不自动重试。

## Source policy and injection / Source policy 与注入

The separately versioned source policy has exactly `sourcePolicyVersion`, `mode`, `readSourceIds`, and `writeSourceId`. A source map exactly matches those IDs. Each entry has only an abstract `authority` (`local`, `virtual`, or `remote`) and an `invoke` function; it contains no URL, method, header, cookie, token, endpoint, health-check rule, or dynamic loader.

独立版本化的 source policy 精确包含 `sourcePolicyVersion`、`mode`、`readSourceIds` 与 `writeSourceId`。source map 必须精确匹配这些 ID。每个 entry 只含抽象 `authority`（`local`、`virtual` 或 `remote`）与 `invoke` 函数；它不包含 URL、method、header、cookie、token、endpoint、健康检查规则或动态 loader。

`mode: local | virtual | remote` fixes all selected source authorities to that mode. `mode: auto` has an explicit ordered read sequence and must include a local authority, preserving checkout-first fallback. The initial project profile uses `local`; remote and virtual are injected seams, not implementations of a network service.

`mode: local | virtual | remote` 固定所有选定 source authority 与该 mode 一致。`mode: auto` 具有显式有序 read 序列，且必须包含 local authority，以保留 checkout-first fallback。初始项目 profile 使用 `local`；remote 与 virtual 是注入 seam，不是网络服务实现。

## Invocation, timeout, and cancellation / 调用、超时与取消

`host.start(request)` returns `{ promise, cancel }`. `promise` always resolves to one isolated terminal envelope and never rejects a source exception. `cancel()` means only that this runtime accepted a cancellation request; it does not claim that a source, remote request, or transaction has stopped.

`host.start(request)` 返回 `{ promise, cancel }`。`promise` 始终 resolve 为一个隔离的 terminal envelope，绝不因 source exception 而 reject。`cancel()` 只表示本 runtime 接受了取消请求；它不声称 source、remote request 或 transaction 已停止。

The source receives only a copied request and `{ attempt, isCancellationRequested }`. It may return one of the following plain-data outcomes:

source 只接收 request 副本与 `{ attempt, isCancellationRequested }`。它可以返回以下任一 plain-data outcome：

```js
{ kind: 'success', value: { /* adapter-private plain data */ } }
{ kind: 'failure', code: 'offline' | 'conflict' | 'unavailable' | 'unknown', retryable: boolean }
{ kind: 'cancelled', phase: 'before-commit' }
```

Accessor, cyclic/shared, sparse, behavioral, unsupported, thrown, rejected, or unknown values become a bounded `unknown` failure. Source messages, exceptions, DTOs, URLs, credentials, and request values never cross the runtime.

accessor、cyclic/shared、sparse、带行为、不支持、throw、reject 或未知值都会变成受限 `unknown` failure。source message、exception、DTO、URL、credential 与 request value 永不跨越 runtime。

For a read, a safe cancellation becomes `cancelled`; a timeout becomes `timeout`. A later source result is discarded. For a write, cancellation before source invocation is `cancelled`. After write invocation starts, timeout or cancellation is `unknown` unless the source explicitly returns `cancelled` with `phase: "before-commit"`. This rule avoids a false claim that an authority did not mutate.

对于 read，安全取消成为 `cancelled`；超时成为 `timeout`。后到 source result 会被丢弃。对于 write，source 调用前的取消为 `cancelled`。write 调用启动后，timeout 或取消为 `unknown`，除非 source 明确返回 `phase: "before-commit"` 的 `cancelled`。该规则避免错误声称 authority 没有发生 mutation。

## Retry, degradation, and authority / Retry、降级与 authority

Read retries only the current declared source after an explicitly `retryable: true` failure and only until `maxAttempts` is exhausted. It may then advance to the next declared read source. A later source success includes its `sourceId`, `authority`, and the immediately preceding `degradedReason` so an adapter/UI can disclose visible degradation.

read 仅在显式 `retryable: true` failure 后重试当前已声明 source，且最多到达 `maxAttempts`。随后它可前进到下一个已声明 read source。后续 source 成功时会携带其 `sourceId`、`authority` 与紧邻的 `degradedReason`，使 adapter/UI 能披露可见降级。

Write selects exactly `writeSourceId` before it begins. It never retries, falls back to `local`/`virtual`, or turns remote failure into local success. Business conflict, receipt, rollback, idempotency, and canonical outcome semantics remain owned by the module and selected project adapter.

write 在开始前精确选择 `writeSourceId`。它永不重试、永不 fallback 到 `local`/`virtual`，也不会把 remote failure 变成 local success。业务 conflict、receipt、rollback、idempotency 与 canonical outcome 语义仍由 module 和选定 project adapter 拥有。

## Terminal envelope and observation / Terminal envelope 与 observation

A terminal success contains `asyncProviderContractVersion`, `kind: "success"`, an isolated adapter-private `value`, and source metadata. A terminal failure contains `kind: "failure"`, one bounded code (`invalid-request`, `offline`, `conflict`, `unavailable`, `timeout`, `cancelled`, or `unknown`), a runtime-owned bilingual message, `retryable`, and source metadata.

terminal success 包含 `asyncProviderContractVersion`、`kind: "success"`、隔离的 adapter-private `value` 与 source metadata。terminal failure 包含 `kind: "failure"`、一个受限 code（`invalid-request`、`offline`、`conflict`、`unavailable`、`timeout`、`cancelled` 或 `unknown`）、runtime 自有双语 message、`retryable` 与 source metadata。

`getObservation()` returns count-only `starts`, `attempts`, `retries`, `successes`, `lateResultsDiscarded`, and fixed failure counts. It stores no source ID, request, value, message, exception, endpoint, credential, user data, or business canonical outcome.

`getObservation()` 返回仅计数的 `starts`、`attempts`、`retries`、`successes`、`lateResultsDiscarded` 与固定 failure counts。它不存储 source ID、request、value、message、exception、endpoint、credential、用户数据或业务 canonical outcome。

## Deliberate limits / 刻意限制

Version 1 does not define HTTP, `fetch`, `uni.request`, Directus, REST, GraphQL, URL, endpoint, method, status, header, cookie, token, credential reference, identity, account, tenant, persistent storage, queue, retry backoff, background task, actual transaction, offline synchronization, source discovery, arbitrary script/DSL, dynamic import, BP JSON, UI state, Pages, or deployment.

版本 1 不定义 HTTP、`fetch`、`uni.request`、Directus、REST、GraphQL、URL、endpoint、method、status、header、cookie、token、credential reference、identity、account、tenant、persistent storage、queue、retry backoff、background task、实际 transaction、offline synchronization、source discovery、任意 script/DSL、dynamic import、BP JSON、UI state、Pages 或 deployment。

These capabilities are temporarily not adopted, not permanently excluded. Any real remote provider needs a separately reviewed adapter/trust/privacy design, source audit, data contract, platform evidence, rollback policy, and explicit product decision.

这些能力当前暂不采用，并非永久排除。任何真实 remote provider 都需要独立复审 adapter/trust/privacy 设计、source 审计、data contract、platform evidence、rollback policy 与明确产品决定。
