# Provider-port contract / Provider-port 契约

This contract defines the first explicit consumer-owned provider host for HIA-uView-Biz. It is a local, synchronous, plain-data boundary for `session`, optional `storage`, `read`, and `write` ports. It is not a network client or a backend adapter.

本契约定义 HIA-uView-Biz 首个显式 consumer-owned provider host。它是面向 `session`、可选 `storage`、`read`、`write` port 的本地同步 plain-data 边界，不是网络 client 或后端 adapter。

## Declaration / Declaration

Each declaration has exactly these fields:

每份 declaration 精确包含以下字段：

```json
{
  "providerContractVersion": "1.0",
  "providerId": "example.consumer.mock-session",
  "portId": "session-state",
  "owner": "example-consumer",
  "kind": "session",
  "contract": { "id": "catalog-query-detail.session", "version": "1.0" },
  "execution": "injected-sync",
  "credential": { "mode": "none" },
  "optional": false,
  "rollback": "not-applicable"
}
```

`providerId`, `portId`, `owner`, and contract `id/version` are stable identifiers. `execution` is `injected-sync`; provider discovery and dynamic import are not allowed. `credential.mode` is `none`. `write` declarations must use `rollback: "local-no-partial-mutation"`; other kinds use `not-applicable`.

`providerId`、`portId`、`owner` 与 contract `id/version` 是稳定标识。`execution` 固定为 `injected-sync`，不允许 provider 发现或动态 import。`credential.mode` 固定为 `none`。`write` declaration 必须使用 `rollback: "local-no-partial-mutation"`；其他分类使用 `not-applicable`。

## Provider map / Provider map

The host receives a plain-object map whose keys exactly equal the declared `portId` values. Each provider has only `contract` and `invoke`. The host rejects missing, extra, accessor, mismatched, or non-function provider entries before creating a host.

host 接收一个 plain-object map，其 key 必须与 declaration 的 `portId` 完全一致。每个 provider 只含 `contract` 与 `invoke`。host 在创建前拒绝缺失、额外、accessor、contract 不匹配或非 function provider。

Provider `invoke` returns an internal outcome that contains no message or backend data:

provider `invoke` 返回不含 message 或后端数据的内部 outcome：

```js
{ kind: 'success', value: { /* canonical plain data */ } }
{ kind: 'failure', code: 'write-conflict', retryable: false, rollback: 'completed' }
```

The runtime copies input before invocation and copies success values before returning them. Accessors, cycles, shared references, sparse arrays, unsupported values, thrown exceptions, and unknown outcome fields become a bounded failure. Raw exception text, HTTP/endpoint/token/credential values, and provider-private DTO fields never cross the host.

runtime 在调用前复制 input，在返回前复制 success value。accessor、循环、共享引用、稀疏数组、不支持的值、抛出异常与未知 outcome 字段都会变成受限 failure。原始异常文本、HTTP/endpoint/token/credential 值与 provider 私有 DTO 字段不会跨越 host。

## Session and storage / Session 与 storage

`session` providers are expected to return the module's already-defined `anonymous`/`mock` canonical plain shape. The provider-port runtime does not acquire accounts, serialize credentials, or infer identity.

`session` provider 应返回 module 已定义的 `anonymous`/`mock` canonical plain shape。provider-port runtime 不获取账户、不序列化 credential，也不推断身份。

`storage` is optional. A consumer may inject a memory-only provider with its own declared key/value contract. This runtime adds no persistence, hydration, synchronization, encryption, retention, or cross-session guarantee.

`storage` 是可选的。业务项目可以注入自有声明的内存 key/value provider。runtime 不增加持久化、hydration、同步、加密、保留策略或跨 session 保证。

## Read/write and rollback / Read/write 与 rollback

Read and write providers own canonical mapping. The host only verifies the provider outcome shape and projects a fixed bilingual failure envelope. A write provider may report `completed`, `not-needed`, or `unknown` rollback. `unknown` remains a failure and is never upgraded to success.

Read 与 write provider 拥有 canonical mapping。host 只校验 provider outcome shape，并投影固定双语 failure envelope。write provider 可以报告 `completed`、`not-needed` 或 `unknown` rollback。`unknown` 保持 failure，绝不会升级为 success。

`completed` means only that the injected test/consumer provider claims its local no-partial-mutation rule. It does not prove a database transaction, distributed rollback, queue/outbox, concurrency control, or production durability.

`completed` 只表示注入的测试/业务 provider 声明其本地 no-partial-mutation 规则成立，不证明数据库事务、分布式回退、队列/outbox、并发控制或生产持久性。

## Observation / Observation

`getObservation()` returns only `invocations`, `successes`, and failure counts for `input`, `provider`, `output`, and `rollback`. It is local development/test evidence, not telemetry, user-visible state, or a canonical business outcome.

`getObservation()` 只返回 `invocations`、`successes` 以及 `input`、`provider`、`output`、`rollback` failure 计数。它是本地开发/测试证据，不是 telemetry、用户可见状态或 canonical business outcome。

## Deliberate limits / 刻意限制

Version 1 does not define `fetch`, `uni.request`, REST/GraphQL, Directus, URL, endpoint, method, header, cookie, token, credential reference, identity provider, persistent storage, async/Promise lifecycle, retry scheduling, timeout, cancellation, dynamic package/handler discovery, arbitrary script/DSL, remote configuration, page control, deployment, or publication.

版本 1 不定义 `fetch`、`uni.request`、REST/GraphQL、Directus、URL、endpoint、method、header、cookie、token、credential reference、identity provider、持久 storage、async/Promise 生命周期、重试调度、timeout、cancellation、动态 package/handler 发现、任意脚本/DSL、远端配置、页面控制、部署或发布。

These capabilities are temporarily not adopted, not permanently excluded. A future real remote provider requires a separate versioned contract, identity/trust review, data/privacy review, failure/rollback design, tests, and explicit product decision.

这些能力目前暂不采用，并非永久排除。未来真实 remote provider 需要独立版本化契约、identity/trust 复审、数据/隐私复审、失败/回退设计、测试与明确产品决定。
