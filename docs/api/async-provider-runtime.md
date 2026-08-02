# Async-provider runtime API / 异步 provider runtime API

## `validateAsyncProviderDeclaration`

Validates one versioned async-provider declaration without invoking a source, reading configuration, or accessing external state.

校验一份版本化 async-provider declaration，不调用 source、不读取配置，也不访问外部状态。

## `validateAsyncSourcePolicy`

Validates one versioned source policy shape. It does not discover source providers; `createAsyncProviderHost` later verifies that the explicit provider map exactly matches the policy.

校验一份版本化 source policy 形状。它不发现 source provider；`createAsyncProviderHost` 随后会验证显式 provider map 与 policy 精确匹配。

## `createAsyncProviderHost`

Creates a host only when declaration, policy, exact injected source map, timeout, and scheduler functions pass validation. The host exposes `start(request)` and `getObservation()`.

只有 declaration、policy、精确注入的 source map、timeout 与 scheduler 函数全部通过校验时，才创建 host。host 暴露 `start(request)` 与 `getObservation()`。

`start(request)` returns `{ promise, cancel }`. `promise` resolves once to an isolated source envelope. A read may retry a declared source and advance through declared fallback sources. A write uses one authority fixed before start; it never retries or falls back. `cancel()` is an explicit request, not a remote-abort or rollback guarantee.

`start(request)` 返回 `{ promise, cancel }`。`promise` 一次性 resolve 为隔离 source envelope。read 可重试已声明 source，并前进到已声明 fallback source。write 使用开始前固定的一个 authority；它从不 retry 或 fallback。`cancel()` 是显式请求，不是 remote-abort 或 rollback 保证。

`getObservation()` returns a copied, count-only local development/test record. It is not telemetry, an application store, a user-visible diagnostic, or a canonical business outcome.

`getObservation()` 返回复制后的、仅计数的本地开发/测试记录。它不是 telemetry、application store、用户可见 diagnostic 或 canonical business outcome。

See the [async project-provider contract](../contracts/async-provider.md) for terminal-envelope, timeout/cancel, source-authority, and deliberate-limit semantics.

关于 terminal envelope、timeout/cancel、source authority 与刻意限制的语义，详见 [async 项目 provider 契约](../contracts/async-provider.md)。
