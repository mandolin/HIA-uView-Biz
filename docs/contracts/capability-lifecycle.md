# Capability lifecycle contract / 能力生命周期契约

This contract defines the first application-local composition of multiple validated business capabilities. It extends the existing one-unit core assembly without changing either manifest schema.

本契约定义首个应用本地的多项已验证业务能力组合。它扩展既有单单元 core 装配，但不修改任一 manifest schema。

## Capability unit / 能力单元

A host supplies a capability unit as one object with these members:

宿主以一个对象提供能力单元，该对象包含以下成员：

| Member / 成员 | Meaning / 含义 |
| --- | --- |
| `businessModule` | One versioned business-module manifest / 一个带版本的业务模块 manifest |
| `implementationPackage` | One versioned implementation-package manifest that supplies the module / 一个为该模块提供实现的带版本实现包 manifest |
| `profile` | The explicit profile selection accepted by core assembly / core 装配接受的显式 profile 选择 |
| `portProviders` | Providers indexed by declared required-port ID / 按已声明 required-port ID 索引的 provider |

Installation succeeds only when the existing core returns a valid composition for the entire unit. The lifecycle runtime retains that validated composition privately; it does not retain an invalid partial unit.

只有当既有 core 为整个单元返回合法 composition 时，安装才成功。lifecycle runtime 会私下保留该已验证 composition；它不会保留无效的部分单元。

## State model / 状态模型

| State or condition / 状态或条件 | Meaning / 含义 | Allowed next actions / 允许的后续动作 |
| --- | --- | --- |
| absent / 不存在 | The runtime retains no unit for the module / runtime 不保留该模块的单元 | `install` |
| `disabled` | The unit is installed and validated but is not routable / 单元已安装并验证，但不可路由 | `enable`, `uninstall` |
| `enabled` | Dependencies are satisfied, no conflict is active, and explicit port routing is allowed / 依赖已满足、没有活动冲突，并允许显式 port 路由 | `disable`, `invoke` |

`install` always creates a `disabled` unit. `uninstall` removes the entry rather than creating a retained `removed` state. Transitions do not invoke providers and do not run hooks.

`install` 总是创建 `disabled` 单元。`uninstall` 会移除条目，而不是创建并保留 `removed` 状态。状态转换不会调用 provider，也不会运行 hook。

## Operation contract / 操作契约

### `install(unit)`

The runtime validates the unit through core assembly, then verifies unique business-module and implementation-package ownership. Success retains one disabled unit. Failure retains nothing from the candidate.

runtime 通过 core 装配校验单元，再验证业务模块与实现包主责唯一。成功时保留一个已停用单元；失败时不保留候选项的任何内容。

### `enable(moduleId)`

The runtime requires the target to be installed and disabled. Every declared dependency must already be installed and enabled. No enabled unit may conflict with the target in either declaration direction. Success changes only the target to `enabled`.

runtime 要求目标已安装且已停用。每个已声明依赖都必须已经安装并启用。任何已启用单元都不能在任一声明方向与目标冲突。成功时只把目标改为 `enabled`。

### `disable(moduleId)`

The runtime requires the target to be enabled. No other enabled unit may declare the target as a dependency. Success changes only the target to `disabled`.

runtime 要求目标已启用。其他任何已启用单元都不能把目标声明为依赖。成功时只把目标改为 `disabled`。

### `uninstall(moduleId)`

The runtime requires the target to be installed and disabled. Success removes its module owner, implementation-package owner, private composition, and lifecycle metadata from this runtime.

runtime 要求目标已安装且已停用。成功时从当前 runtime 移除其 module owner、实现包 owner、私有 composition 与 lifecycle metadata。

### `invoke(moduleId, portId, input)`

The runtime routes only when the module is enabled. It delegates to the validated composition and returns the provider’s canonical result unchanged. Unknown or disabled modules, and unknown ports, fail without serializing `input`. Invocation does not grant access to another unit’s provider object.

runtime 只在模块已启用时路由。它委托给已验证 composition，并原样返回 provider 的规范化结果。未知或已停用模块以及未知 port 都会失败，且不会序列化 `input`。调用不会授予对另一单元 provider 对象的访问权。

### `snapshot()`

The snapshot lists units in stable module-ID order. Each entry contains only `moduleId`, `implementationPackageId`, `state`, `dependencies`, and `conflicts`; relationship arrays are copied and sorted. The result is detached from internal state.

snapshot 按稳定 module ID 顺序列出单元。每个条目只包含 `moduleId`、`implementationPackageId`、`state`、`dependencies` 与 `conflicts`；关系数组会复制并排序。结果与内部状态分离。

## Stable diagnostic categories / 稳定诊断类别

Lifecycle operations return a success flag and a bounded diagnostic list. The initial categories distinguish:

lifecycle 操作返回成功标志和受限诊断列表。首批类别区分：

- invalid capability-unit assembly / 无效能力单元装配；
- duplicate module or implementation owner / 重复模块或实现主责；
- unknown or invalid lifecycle state / 未知或无效生命周期状态；
- dependency missing or disabled / 依赖缺失或已停用；
- enabled conflict in either direction / 任一方向存在已启用冲突；
- enabled dependent preventing disable / 已启用依赖方阻止停用；
- enabled unit preventing uninstall / 已启用单元阻止卸载。

Diagnostics may identify the relevant stable module or implementation ID. They never contain a manifest, profile, provider, function, invocation input or output, raw error, backend payload, credential, path, environment value, or source body.

诊断可以标识相关的稳定 module 或 implementation ID。它们绝不包含 manifest、profile、provider、函数、调用输入或输出、原始错误、后端 payload、凭据、路径、环境值或 source body。

## Determinism and rollback / 确定性与回退

Every operation validates before mutating state. A failed operation preserves the complete prior snapshot. The runtime does not automatically transition a dependency or dependent, and it does not choose a replacement implementation. A host can therefore recover by correcting the declaration or issuing explicit transitions in dependency-safe order.

每个操作都先校验再修改状态。失败操作会保留完整的先前 snapshot。runtime 不会自动转换依赖或依赖方，也不会选择替代实现。因此，宿主可以通过修正声明或按依赖安全顺序发出显式转换来恢复。

The initial runtime is synchronous and process-local. It does not claim cancellation, distributed locking, persistent rollback, or recovery after process termination.

首个 runtime 是同步且进程内的。它不主张取消、分布式锁、持久化回退或进程终止后的恢复能力。

## Explicit exclusions / 明确排除

This contract does not authorize npm installation, registry or filesystem discovery, dynamic import, executable lifecycle hooks, migrations, cleanup callbacks, hot update, remote code or configuration, arbitrary scripts, environment or storage access, credential handling, real backend access, industry data, write operations, UI registration, or release behavior.

本契约不授权 npm 安装、registry 或文件系统发现、动态 import、可执行生命周期 hook、迁移、清理 callback、热更新、远程代码或配置、任意脚本、环境或 storage 访问、凭据处理、真实后端访问、行业数据、写操作、UI 登记或发布行为。

Those capabilities are not permanently rejected. Each requires a separate versioned contract with explicit ownership, provenance, threat analysis, rollback, compatibility, platform, privacy, and validation rules before adoption.

这些能力并非被永久排除。采用前，每一项都需要独立的版本化契约，明确主责、来源、威胁分析、回退、兼容性、平台、隐私和验证规则。
