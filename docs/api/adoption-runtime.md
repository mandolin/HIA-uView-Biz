# Capability adoption runtime API / 能力采用 runtime API

`@hia-uview/biz-adoption-runtime` is a pure ESM, synchronous, process-local coordinator for complete explicit capability sets. It validates one versioned adoption profile, installs every caller-supplied unit into an isolated candidate lifecycle, enables requested units in dependency order, and switches the active runtime only after complete success.

`@hia-uview/biz-adoption-runtime` 是面向完整显式能力集合的纯 ESM、同步、进程内协调器。它校验一个版本化 adoption profile，把调用方提供的每个单元安装到隔离候选 lifecycle，按依赖顺序启用期望单元，并且只有完全成功后才切换活动 runtime。

The API builds on `@hia-uview/biz-capability-runtime`. It does not load JSON, interpret a package name as code, discover a unit, install npm packages, execute lifecycle hooks, or access external state.

该 API 建立在 `@hia-uview/biz-capability-runtime` 之上。它不加载 JSON、不把 package name 解释为代码、不发现单元、不安装 npm package、不执行 lifecycle hook，也不访问外部状态。

## Exports / 导出

| Export / 导出 | Responsibility / 主责 |
| --- | --- |
| `createCapabilityAdoptionRuntime(options)` | Creates an independent candidate-first adoption runtime / 创建独立的候选优先采用 runtime |
| `CapabilityAdoptionInvocationError` | Stable redacted error used before the first successful adoption / 首次成功采用前使用的稳定脱敏错误 |

## Creation policy / 创建 policy

The runtime requires three non-empty, duplicate-free host allowlists:

runtime 要求三个非空且无重复的宿主 allowlist：

```js
const runtime = createCapabilityAdoptionRuntime({
  registeredBlocks: ['query-context', 'catalog-list', 'entry-detail'],
  registeredVisibility: ['always', 'has-results', 'has-selection'],
  allowedPageSizes: [1, 5, 10, 20]
});
```

Block and visibility values are lowercase identifiers, not component paths, URLs, expressions, or callbacks. Page sizes are positive integers. An invalid creation policy throws a fixed `TypeError` without copying policy input.

block 与 visibility 值是小写标识，而不是 component path、URL、表达式或 callback。page size 是正整数。无效创建 policy 会抛出固定 `TypeError`，且不复制 policy input。

## `reconcile({ profile, units })`

`profile` follows the [capability adoption profile schema](../contracts/schemas/capability-adoption.profile.v1.schema.json). `units` is the complete explicit array corresponding to its selections. Each unit uses the existing lifecycle shape:

`profile` 遵循[能力采用 profile schema](../contracts/schemas/capability-adoption.profile.v1.schema.json)。`units` 是与其选择对应的完整显式数组。每个单元使用既有 lifecycle shape：

```js
{
  businessModule,
  implementationPackage,
  profile,
  portProviders
}
```

Reconciliation validates profile shape and presentation allowlists before creating a candidate. It then:

协调会在创建候选前校验 profile shape 与 presentation allowlist。随后它：

1. installs every supplied unit through the existing core/lifecycle validation;
2. 通过既有 core/lifecycle 校验安装每个已提供单元；
3. requires exact module/implementation correspondence with the complete profile;
4. 要求 module/implementation 与完整 profile 精确对应；
5. computes a deterministic dependency-first order for desired `enabled` units;
6. 为期望 `enabled` 单元计算确定性的依赖优先顺序；
7. lets lifecycle reject missing dependencies and symmetric conflicts;
8. 让 lifecycle 拒绝缺失依赖与双向冲突；
9. creates a redacted before/after receipt;
10. 创建脱敏的前后对比 receipt；
11. switches active runtime and presentation together.
12. 一并切换活动 runtime 与 presentation。

Success returns:

成功返回：

```js
{
  ok: true,
  diagnostics: [],
  receipt: {
    profileId: 'example.catalog-composed',
    actions: []
  }
}
```

Each module has one action: `install`, `enable`, `disable`, `uninstall`, `replace`, or `retain`. A replacement lists previous and next implementation-package IDs and states. It does not expose a unit or run migration/cleanup code.

每个 module 具有一个动作：`install`、`enable`、`disable`、`uninstall`、`replace` 或 `retain`。替换会列出前后 implementation-package ID 与状态。它不会暴露 unit，也不运行 migration/cleanup code。

Failure returns only `ok: false` and bounded `diagnostics`; it has no `receipt`. The previous runtime, invocation path, snapshot, and presentation remain active.

失败只返回 `ok: false` 与受限 `diagnostics`；不含 `receipt`。先前 runtime、调用路径、snapshot 与 presentation 保持活动。

## `invoke(moduleId, portId, input)`

After successful reconciliation, invocation delegates to the active capability lifecycle. The target must be present, enabled, and own the required port. Provider results retain their module-owned canonical contract.

成功协调后，调用会委托给活动 capability lifecycle。目标必须存在、已启用并拥有 required port。provider 结果保持其 module-owned canonical contract。

Before first success, invocation throws `CapabilityAdoptionInvocationError` with code `capability-adoption.invocation.uninitialized`. Its message contains no module ID, port ID, profile, or input.

首次成功前，调用会抛出 `CapabilityAdoptionInvocationError`，code 为 `capability-adoption.invocation.uninitialized`。其 message 不含 module ID、port ID、profile 或 input。

## `snapshot()`

Returns the active lifecycle's detached redacted entries in module-ID order. Before first success it returns a new empty array.

返回活动 lifecycle 按 module ID 排列、分离且脱敏的条目。首次成功前返回新的空数组。

## `presentation()`

Returns a fresh metadata-only copy:

返回新的 metadata-only 副本：

```js
{
  blocks: [
    {
      id: 'catalog-list',
      visibility: 'always'
    }
  ],
  order: ['catalog-list'],
  pageSize: 5
}
```

The runtime does not import or mount a block and does not execute visibility. Before first success, `blocks` and `order` are empty and `pageSize` is `null`.

runtime 不 import 或 mount block，也不执行 visibility。首次成功前，`blocks` 与 `order` 为空，`pageSize` 为 `null`。

## Diagnostic and privacy boundary / Diagnostic 与隐私边界

Diagnostics use stable codes, bilingual messages, and an optional validated stable `subjectId`. They never serialize an adoption profile, capability unit, manifest, provider, function, invocation input/output, raw lifecycle/core diagnostic, path, environment value, credential, or source body.

diagnostic 使用稳定 code、双语 message 与可选的已验证稳定 `subjectId`。它们永远不会序列化 adoption profile、capability unit、manifest、provider、函数、调用输入/输出、原始 lifecycle/core diagnostic、路径、环境值、credential 或 source body。

## Deliberate limits / 刻意限制

The runtime has no package registry, filesystem discovery, dynamic import, asynchronous/concurrent transition, persistent state, crash recovery, migration or cleanup hook, remote configuration, real backend, identity, credential, storage, write operation, component loader, deployment, or release behavior.

runtime 没有 package registry、文件系统发现、动态 import、异步/并发转换、持久化状态、崩溃恢复、migration/cleanup hook、远程配置、真实后端、身份、credential、storage、写操作、component loader、部署或发布行为。

These capabilities are not permanently excluded. They require separate versioned contracts and validation before adoption.

这些能力并非永久排除。采用前必须建立独立版本化契约与验证。
