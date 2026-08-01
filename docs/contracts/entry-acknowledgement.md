# Entry acknowledgement command contract / Entry 确认命令契约

This contract defines the first bounded canonical write-shaped command for the neutral `entry` example. It proves command, idempotency, receipt, and rollback boundaries using an isolated deterministic in-memory mock. It is not an industry workflow, durable write model, user confirmation record, authorization decision, audit log, backend API, HTTP operation, storage transaction, or identity protocol.

本契约为中性 `entry` 示例定义首个受限的、具有写入形态的规范化命令。它使用隔离的确定性内存 mock 证明命令、幂等、receipt 与回退边界。它不是行业工作流、持久写入模型、用户确认记录、授权决定、审计日志、后端 API、HTTP 操作、storage 事务或身份协议。

## Public artifacts / 公开产物

| Artifact / 产物 | Responsibility / 主责 |
| --- | --- |
| [Command schema / 命令 schema](schemas/entry-acknowledgement.command.v1.schema.json) | Exact JSON command shape and stable `commandId` syntax / 精确 JSON 命令形态与稳定 `commandId` 语法 |
| [Command example / 命令示例](examples/example.catalog-query-detail.acknowledge-entry.command.json) | The single allowed `acknowledge-entry` input / 唯一允许的 `acknowledge-entry` 输入 |
| [Receipt example / Receipt 示例](examples/example.catalog-query-detail.acknowledge-entry.receipt.json) | Bounded success metadata after first local commit / 第一次本地提交后的受限成功 metadata |
| `entry-acknowledge` port | Required module port with contract `catalog-query-detail.acknowledgement` version `1.0` / 契约 `catalog-query-detail.acknowledgement` 版本 `1.0` 的 required module port |

## Command and receipt / 命令与 receipt

The command has exactly four fields: `contractVersion`, `kind`, `commandId`, and `entryId`. It accepts no payload, patch, free text, label, field selection, URL, connection, script, expression, subject, token, capability, or arbitrary metadata. `entryId` must come from a canonical result or a separately declared module contract; the mock owns only `entry-001`.

命令精确包含四个字段：`contractVersion`、`kind`、`commandId` 与 `entryId`。它不接受 payload、patch、自由文本、label、字段选择、URL、连接、脚本、表达式、subject、token、capability 或任意 metadata。`entryId` 必须来自规范化结果或另一个已声明的 module contract；mock 仅拥有 `entry-001`。

A first successful command returns a `command-receipt` with the stable command/entry IDs, fixed outcome `acknowledged`, and revision `1`. A receipt is a detached metadata copy: it carries no command body, session, grant, provider, wire value, endpoint, database fact, actor, timestamp, audit evidence, or transaction implementation.

第一次成功命令返回 `command-receipt`，包含稳定 command/entry ID、固定 outcome `acknowledged` 与 revision `1`。receipt 是分离的 metadata 副本：它不携带命令体、session、grant、provider、wire 值、endpoint、数据库事实、操作者、时间戳、审计证据或事务实现。

## Idempotency and conflict / 幂等与冲突

`commandId` is mandatory and caller-owned. Resubmitting the same valid command ID for the same entry returns an equivalent detached receipt and does not increase revision. Reusing that command ID for another entry returns non-retryable `command-id-conflict`; it changes neither acknowledgement nor revision. Submitting a different command ID after the entry is acknowledged returns non-retryable `command-not-applicable`; it is not silently treated as a second success or no-op.

`commandId` 必填且由调用方拥有。对同一 entry 重复提交相同有效 command ID 会返回等值的分离 receipt，且不会增加 revision。把该 command ID 重用于另一 entry 时，返回不可重试的 `command-id-conflict`；它既不改变 acknowledgement，也不改变 revision。entry 已确认后提交不同 command ID 时，返回不可重试的 `command-not-applicable`；它不会被静默当作第二次成功或 no-op。

## Failure and rollback / 失败与回退

Every rejection uses the existing canonical failure envelope. The first command extension adds only these stable codes and scopes:

每个拒绝均使用既有规范化 failure envelope。首个 command 扩展只增加以下稳定代码和 scope：

| Code / 代码 | Scope / 范围 | Retryable / 可重试 | Meaning / 含义 |
| --- | --- | --- | --- |
| `invalid-command` | `command` | No / 否 | Command shape, version, kind, or stable ID is invalid / 命令形态、版本、kind 或稳定 ID 无效 |
| `command-id-conflict` | `command` | No / 否 | One ID was previously bound to another entry / 一个 ID 已绑定到另一 entry |
| `command-not-applicable` | `command` | No / 否 | The entry has already been acknowledged by another command ID / entry 已由另一个 command ID 确认 |
| `command-transaction-failed` | `transaction` | No / 否 | Deterministic mock commit failure; state remains exactly unchanged / 确定性 mock 提交失败；state 精确保持不变 |

`not-found` with `request` scope remains the failure for an entry outside the selected mock. In the checked-in `commit-failure` test mode, the transaction does not write command ID, receipt, acknowledgement, or revision before it returns failure. This proves only local no-partial-mutation behavior; it is not a database rollback or distributed-transaction claim.

选中 mock 之外的 entry 仍使用 `request` scope 的 `not-found` 失败。在仓内 `commit-failure` 测试模式中，事务返回失败前不会写入 command ID、receipt、acknowledgement 或 revision。这只证明本地 no-partial-mutation 行为；不是数据库回退或分布式事务声明。

## Composition and solution boundary / 组合与 solution 边界

The business-module manifest declares `entry-acknowledge` as a required port. Both the mandatory mock implementation and the injected-wire read fixture provide an explicit `mock-command` surface; the latter still performs no write wire exchange. The application template requires that surface, so a candidate missing it is rejected before composition or provider use.

business-module manifest 将 `entry-acknowledge` 声明为 required port。必备 mock implementation 与 injected-wire 读取 fixture 都提供显式 `mock-command` surface；后者仍不会执行写 wire exchange。application template 要求该 surface，因此缺少它的 candidate 会在 composition 或 provider 使用前被拒绝。

The representative solution selects a separate static `example.catalog-query-detail.acknowledge` capability package, dependent on catalog read and requiring local `catalog.acknowledge` mock grant. This is availability composition only. It is neither a real permission grant nor an identity binding. The representative Vue page does not expose a command control in this cycle.

代表性 solution 选择独立静态 `example.catalog-query-detail.acknowledge` capability package，它依赖 catalog read 并要求本地 `catalog.acknowledge` mock grant。这只是 availability 组合，不是实际权限授予或身份绑定。代表性 Vue 页面在本周期不暴露命令控件。

## Deliberate limits / 刻意限制

This contract excludes real backend/HTTP/Directus transport, storage, database, queue, outbox, offline sync, distributed transaction, concurrent command coordination, real retry scheduling, identity, token/cookie, tenant/role policy, audit logging, timestamp, free text, patch, field update, delete, bulk command, dynamic command discovery, remote configuration, script, DSL, UI command control, deployment, and publication.

本契约排除真实 backend/HTTP/Directus transport、storage、database、queue、outbox、offline sync、分布式事务、并发命令协调、真实重试调度、身份、token/cookie、tenant/role policy、审计日志、时间戳、自由文本、patch、字段更新、删除、批量 command、动态 command discovery、远端配置、脚本、DSL、UI 命令控件、部署与发布。

These capabilities are temporarily not adopted, not permanently excluded. Any later write semantics require a separate versioned contract, trust model, failure/rollback design, tests, and explicit product decision.

这些能力目前暂不采用，并非永久排除。任何后续写语义都需要独立版本化契约、信任模型、失败/回退设计、测试与明确产品决定。
