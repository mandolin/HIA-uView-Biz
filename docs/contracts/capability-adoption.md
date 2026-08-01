# Capability adoption contract / 能力采用契约

This contract defines how an application reconciles a complete, explicit capability set into one active process-local runtime. It builds on the [capability lifecycle contract](capability-lifecycle.md) and does not change either manifest schema.

本契约定义应用如何把完整、显式的能力集合协调为一个活动进程内 runtime。它建立在[能力生命周期契约](capability-lifecycle.md)之上，不修改任一 manifest schema。

## Inputs / 输入

### Adoption profile / 采用 profile

The versioned profile has four top-level members:

带版本 profile 有四个顶层成员：

| Member / 成员 | Meaning / 含义 |
| --- | --- |
| `adoptionVersion` | Adoption contract version; initially `1.0` / 采用契约版本；首版为 `1.0` |
| `kind` | Fixed value `capability-adoption-profile` / 固定值 `capability-adoption-profile` |
| `profileId` | Stable application-composition identifier / 稳定应用组合标识 |
| `capabilities` | Complete desired module, implementation, and state list / 完整期望 module、implementation 与状态列表 |
| `presentation` | Bounded host presentation selection / 受限宿主呈现选择 |

Each capability entry contains exactly `moduleId`, `implementationPackageId`, and `state`. The initial states are `enabled` and `disabled`. Module and implementation IDs must be unique across the complete profile.

每个能力条目只包含 `moduleId`、`implementationPackageId` 与 `state`。首轮状态为 `enabled` 和 `disabled`。在完整 profile 内，module 与 implementation ID 都必须唯一。

### Supplied units / 已提供单元

The caller supplies an array of capability units using the existing lifecycle shape: `businessModule`, `implementationPackage`, `profile`, and `portProviders`. The array must correspond exactly to the adoption profile. An extra, missing, duplicate, invalid, or mismatched unit rejects reconciliation.

调用方使用既有 lifecycle shape 提供 capability unit 数组：`businessModule`、`implementationPackage`、`profile` 与 `portProviders`。数组必须与 adoption profile 精确对应。额外、缺失、重复、无效或不匹配的单元都会使协调失败。

The runtime never reads a path or package name to obtain a unit. Package identity in a manifest is metadata, not an import instruction.

runtime 永远不会通过路径或包名取得单元。manifest 中的 package identity 是元数据，不是 import 指令。

### Presentation policy / 呈现 policy

The host creates the adoption runtime with explicit allowlists for registered block IDs, visibility values, and page sizes. The profile may only select values from those allowlists. Block order must name every selected block exactly once.

宿主以已登记 block ID、visibility 值和 page size 的显式 allowlist 创建 adoption runtime。profile 只能选择这些 allowlist 中的值。block order 必须把每个已选择区块精确列出一次。

Presentation validation does not import, mount, or execute a component. It validates metadata for a later host projection.

呈现校验不会 import、mount 或执行组件。它只为后续宿主投影校验 metadata。

## Reconciliation / 协调

Reconciliation follows these bounded phases:

协调遵循以下受限阶段：

1. Validate the adoption profile and host presentation policy.
2. 校验 adoption profile 与宿主 presentation policy。
3. Match each profile entry to one supplied unit by its core-validated module and implementation IDs.
4. 以 core 已验证的 module 与 implementation ID，把每个 profile 条目匹配到一个已提供单元。
5. Install all matched units into a new candidate lifecycle runtime.
6. 把所有已匹配单元安装到新的候选 lifecycle runtime。
7. Enable requested units in stable dependency order and let lifecycle conflict checks reject an incompatible set.
8. 以稳定依赖顺序启用所需单元，并让 lifecycle 冲突检查拒绝不兼容集合。
9. Compare the complete candidate snapshot with the prior active snapshot and construct a public-safe receipt.
10. 把完整候选 snapshot 与先前活动 snapshot 比较，并构造可公开 receipt。
11. Switch the active runtime and presentation only after every prior phase succeeds.
12. 只有前述全部阶段成功后，才切换活动 runtime 与 presentation。

There is no partial success. Failed reconciliation returns no action list and leaves invocation behavior unchanged.

不存在部分成功。协调失败不返回 action list，并保持调用行为不变。

## Action receipt / 动作 receipt

Actions are sorted by module ID and use these meanings:

动作按 module ID 排序，并使用以下含义：

| Action / 动作 | Meaning / 含义 |
| --- | --- |
| `install` | Module was absent and is present in the candidate / 模块原先不存在，候选中存在 |
| `enable` | Same implementation changed from disabled to enabled / 同一实现从 disabled 变为 enabled |
| `disable` | Same implementation changed from enabled to disabled / 同一实现从 enabled 变为 disabled |
| `uninstall` | Module was present and is absent from the candidate / 模块原先存在，候选中不存在 |
| `replace` | Same module selects a different explicit implementation / 同一模块选择了不同显式实现 |
| `retain` | Same implementation and state remain / 同一实现与状态均保持 |

A `replace` action also states the previous and next implementation IDs. It does not expose either unit.

`replace` 动作还会说明先前与后继 implementation ID，但不会暴露任一单元。

The action is a bounded current-process composition receipt, not a package upgrade, profile-data conversion, persistent
migration checkpoint, or deployment record. See the [lifecycle and selection-transition boundary](../lifecycle-transition.md).

该动作是受限的当前进程 composition receipt，不是 package upgrade、profile-data conversion、persistent migration checkpoint
或 deployment record。参见[生命周期与选择过渡边界](../lifecycle-transition.md)。

## Runtime surface / Runtime 表面

The initial adoption runtime exposes:

首轮 adoption runtime 暴露：

- `reconcile({ profile, units })` for candidate-first adoption / 用于候选优先采用的 `reconcile({ profile, units })`；
- `invoke(moduleId, portId, input)` delegated only to the active runtime / 只委托给活动 runtime 的 `invoke(moduleId, portId, input)`；
- `snapshot()` for the active redacted lifecycle snapshot / 返回活动脱敏 lifecycle snapshot 的 `snapshot()`；
- `presentation()` for a detached, allowlisted presentation snapshot / 返回分离且经 allowlist 校验的呈现 snapshot 的 `presentation()`。

Before the first successful reconciliation, snapshot and presentation are empty and invocation fails with a stable adoption-runtime error.

首次成功协调前，snapshot 与 presentation 为空，调用以稳定 adoption-runtime 错误失败。

## Stable diagnostic categories / 稳定诊断类别

The initial bounded categories distinguish:

首批受限类别区分：

- invalid profile shape, version, kind, or identifier / 无效 profile shape、version、kind 或 identifier；
- duplicate module or implementation selection / 重复 module 或 implementation 选择；
- unregistered block, visibility, page size, or invalid order / 未登记 block、visibility、page size 或无效顺序；
- missing, extra, duplicate, mismatched, or invalid supplied unit / 缺失、额外、重复、不匹配或无效的已提供单元；
- dependency cycle or a dependency not enabled by the desired profile / 依赖环或期望 profile 未启用依赖；
- candidate lifecycle installation, dependency, conflict, or enablement failure / 候选 lifecycle 安装、依赖、冲突或启用失败。

Diagnostics contain only stable codes, bounded bilingual messages, and an optional validated stable identifier. They do not serialize the profile, unit, provider, action input, provider result, or raw underlying diagnostic.

diagnostic 只包含稳定 code、受限双语消息和可选的已验证稳定 ID。它们不会序列化 profile、unit、provider、动作输入、provider 结果或底层原始 diagnostic。

## Explicit exclusions / 明确排除

This contract does not authorize package discovery, npm installation, filesystem reads, dynamic import, network access, remote configuration, lifecycle or migration hooks, persistent state, concurrent reconciliation, real identity, credentials, backend access, storage, writes, industry data, component loading, route loading, deployment, or release behavior.

本契约不授权 package discovery、npm 安装、文件系统读取、动态 import、网络访问、远程配置、lifecycle/migration hook、持久化状态、并发协调、真实身份、credential、后端访问、storage、写操作、行业数据、组件加载、route 加载、部署或发布行为。

These capabilities are not permanently excluded. Each requires a separate versioned design and explicit validation before adoption.

这些能力并非永久排除。每一项都必须先建立独立版本化设计并明确验证，才能采用。
