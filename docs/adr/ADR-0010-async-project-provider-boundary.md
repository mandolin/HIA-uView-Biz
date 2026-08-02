# ADR-0010: Async project-provider boundary / 异步项目 provider 边界

Status: Accepted

状态：已接受

## Context / 背景

The first BP requires visible loading, timeout, cancellation, retry, read degradation, and write uncertainty while staying independent of Directus, HTTP client, identity, and concrete backend. Existing `provider-port-runtime` v1 intentionally supports only synchronous `injected-sync` providers. Changing its declaration or `invoke()` return type would break its public contract and existing consumers.

首个 BP 需要可见 loading、timeout、取消、retry、read 降级与 write 不确定性，同时保持与 Directus、HTTP client、身份和具体 backend 无关。既有 `provider-port-runtime` v1 有意只支持同步 `injected-sync` provider。改变其 declaration 或 `invoke()` 返回类型会破坏其公开 contract 与既有消费者。

## Decision / 决定

Add a separate private workspace package, `@hia-uview/biz-async-provider-runtime`, with its own `1.0` declaration and source-policy contract. It accepts only explicit in-memory sources and returns `{ promise, cancel }`. Its promise resolves to a bounded success/failure envelope, and it exposes only count-only observation.

新增独立 private workspace package `@hia-uview/biz-async-provider-runtime`，具有自己的 `1.0` declaration 与 source-policy contract。它只接受显式内存 source，并返回 `{ promise, cancel }`。其 promise resolve 为受限 success/failure envelope，且只暴露仅计数 observation。

Read may make a finite retry of an explicitly retryable source and then advance only through policy-declared sources. `auto` requires a local read source. Write selects a single authority before start and never automatically retries or falls back. Timeout or cancellation after write start returns `unknown` unless the source explicitly confirms `cancelled` before commit.

read 可对显式 retryable source 进行有限 retry，随后只可前进到 policy 声明的 source。`auto` 要求一个 local read source。write 在开始前选择单一 authority，且从不自动 retry 或 fallback。write 启动后的 timeout 或取消返回 `unknown`，除非 source 明确确认 commit 前已 `cancelled`。

The runtime owns lifecycle isolation, timeout/cancel race handling, bounded source metadata, and redaction. The module and selected project adapter own request mapping, source selection configuration, business conflict, idempotency, receipts, rollback semantics, and canonical business outcome mapping.

runtime 拥有生命周期隔离、timeout/cancel race 处理、受限 source metadata 与脱敏。module 与选定 project adapter 拥有 request mapping、source selection 配置、业务 conflict、idempotency、receipt、rollback 语义与 canonical business outcome mapping。

## Consequences / 后果

- Sync provider-port v1 remains compatible and does not inherit a hidden Promise/remote behavior.
- 同步 provider-port v1 保持兼容，不会继承隐藏的 Promise/remote 行为。
- A future BP can project source/authority/degraded reason without reading HTTP or provider-private data.
- 未来 BP 可投影 source/authority/degraded reason，而无需读取 HTTP 或 provider-private data。
- A local deterministic fixture can verify read retry/degradation and write uncertainty before any BP repository or remote service exists.
- 在任何 BP repository 或 remote service 出现前，本地确定性 fixture 就可验证 read retry/降级与 write 不确定性。
- The package does not prove transaction rollback, remote abort, remote health, offline sync, production persistence, or a real backend adapter.
- package 不证明 transaction rollback、remote abort、remote health、offline sync、production persistence 或真实 backend adapter。

## Rejected alternatives / 未采用方案

### Extend provider-port v1 in place / 原地扩展 provider-port v1

Rejected because `injected-sync` and synchronous outcomes are intentional v1 constraints. A changed return type or declaration would make old consumers ambiguous and remove a reviewable compatibility boundary.

未采用，因为 `injected-sync` 与同步 outcome 是有意的 v1 约束。改变返回类型或 declaration 会使旧消费者含糊，并移除可审阅的兼容边界。

### Use HTTP/fetch/uni.request directly / 直接使用 HTTP/fetch/uni.request

Rejected because BP source selection must remain backend-agnostic and testable locally. HTTP, credential, trust, CORS, domain whitelist, DTO, endpoint, and platform semantics need a separate provider/adapter decision.

未采用，因为 BP source selection 必须保持 backend-agnostic 且可本地测试。HTTP、credential、trust、CORS、域名白名单、DTO、endpoint 与 platform 语义需要独立 provider/adapter 决定。

### Treat write cancellation as rollback / 将 write cancellation 视为 rollback

Rejected because an in-flight authority may have committed even when the caller stops waiting. Only a source-confirmed pre-commit cancellation is known safe; all other post-start cancel/timeout cases remain unknown.

未采用，因为即使调用方停止等待，正在运行的 authority 仍可能已提交。只有 source 确认的 commit 前取消是已知安全；其他启动后 cancel/timeout 情况仍保持 unknown。

## Review triggers / 复审触发条件

Review before introducing any real URL/endpoint, HTTP client, credential/reference, identity, persistent storage, retry backoff/queue, transaction/rollback claim, remote health selection, offline synchronization, public package release, BP repository, Pages, or production data.

在引入任何真实 URL/endpoint、HTTP client、credential/reference、身份、persistent storage、retry backoff/queue、transaction/rollback claim、remote health selection、offline synchronization、公开 package release、BP repository、Pages 或 production data 前，必须复审。
