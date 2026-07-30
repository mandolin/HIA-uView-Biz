# Capability runtime API / 能力 runtime API

`@hia-uview/biz-capability-runtime` is a pure ESM, process-local coordinator for explicitly supplied HIA-uView-Biz capability units. It reuses `@hia-uview/biz-core` assembly and adds deterministic application-local install, enable, disable, uninstall, invocation-routing, and snapshot behavior.

`@hia-uview/biz-capability-runtime` 是面向显式提供 HIA-uView-Biz 能力单元的纯 ESM、进程内协调器。它复用 `@hia-uview/biz-core` 装配，并增加确定的应用本地安装、启用、停用、卸载、调用路由与 snapshot 行为。

Installation means membership in one runtime instance. It is not npm or package-manager installation and does not discover, download, import, execute, migrate, persist, or delete a package.

安装只表示属于一个 runtime instance。它不是 npm 或包管理器安装，也不会发现、下载、import、执行、迁移、持久化或删除 package。

## Exports / 导出

| Export / 导出 | Responsibility / 主责 |
| --- | --- |
| `createCapabilityRuntime()` | Creates an independent in-memory lifecycle API / 创建独立的内存 lifecycle API |
| `CapabilityInvocationError` | Stable redacted `RangeError` subclass for unavailable module/port routes / 用于不可用 module/port 路由的稳定脱敏 `RangeError` 子类 |

## Capability-unit input / 能力单元输入

`install(unit)` accepts the same four explicit members required by core assembly:

`install(unit)` 接受 core 装配要求的同四项显式成员：

```js
{
  businessModule,
  implementationPackage,
  profile,
  portProviders
}
```

The runtime passes an isolated provider index to core and retains only a successful composition plus copied module IDs, implementation-package ID, required-port IDs, dependencies, and conflicts. Other properties, including a `lifecycleHooks` object, are ignored and never executed.

runtime 将隔离的 provider 索引交给 core，并且只保留成功的 composition，以及复制后的 module ID、实现包 ID、required-port ID、依赖与冲突。其他属性（包括 `lifecycleHooks` 对象）会被忽略且永不执行。

The runtime does not deep-clone provider functions or their private closures. A host remains responsible for supplying reviewed providers that already obey their module and adapter contracts.

runtime 不会深复制 provider 函数或其私有闭包。宿主仍负责提供已审阅且遵守模块与 adapter 契约的 provider。

## Lifecycle operations / 生命周期操作

Every transition returns:

每次转换都返回：

```js
{
  ok: true | false,
  diagnostics: []
}
```

A failed transition changes no state. Diagnostics have a stable `code`, bilingual `message`, and—when useful—one public-safe `subjectId`. They contain no candidate object, provider, input, output, raw exception, path, environment value, credential, or backend data.

失败转换不会改变状态。diagnostic 具有稳定 `code`、双语 `message`，并在有用时包含一个适合公开的 `subjectId`。其中不含候选对象、provider、输入、输出、原始异常、路径、环境值、凭据或后端数据。

### `install(unit)`

Core assembly must succeed first. The runtime then rejects an existing module owner or implementation-package owner. Success retains the unit as `disabled`; it neither enables dependencies nor calls a provider.

core 装配必须首先成功。随后 runtime 会拒绝已存在的 module owner 或 implementation-package owner。成功时单元以 `disabled` 保留；它既不会启用依赖，也不会调用 provider。

### `enable(moduleId)`

The target must be disabled. Every declared dependency must already be installed and enabled. A conflict declared by the target or by any enabled unit blocks the transition. Success changes only the target state.

目标必须处于 disabled。每个已声明依赖都必须已经安装并启用。目标或任何已启用单元声明的冲突都会阻止转换。成功时只改变目标状态。

### `disable(moduleId)`

The target must be enabled. An enabled unit that declares the target as a dependency blocks the transition. The runtime does not recursively disable dependents and does not cancel a provider result already returned to a caller.

目标必须处于 enabled。把目标声明为依赖的已启用单元会阻止转换。runtime 不会递归停用依赖方，也不会取消已经返回给调用方的 provider result。

### `uninstall(moduleId)`

The target must be disabled. Success removes the module record, implementation owner, and private composition from the current runtime. It executes no package-manager action, file deletion, migration, or cleanup callback.

目标必须处于 disabled。成功时从当前 runtime 移除 module record、implementation owner 与私有 composition。它不执行包管理器动作、文件删除、迁移或 cleanup callback。

## `invoke(moduleId, portId, input)`

Only an enabled module and one of its declared required ports can be routed. A valid route delegates to the core composition and returns the provider result unchanged, preserving the module-owned canonical result/failure contract.

只有已启用模块及其已声明 required port 可以路由。合法路由会委托给 core composition，并原样返回 provider result，从而保留模块拥有的 canonical result/failure 契约。

An unavailable route throws `CapabilityInvocationError`. Its stable `code` is one of:

不可用路由会抛出 `CapabilityInvocationError`。其稳定 `code` 为以下之一：

- `capability.invocation.unknown`
- `capability.invocation.disabled`
- `capability.invocation.port-unregistered`

The error message contains no module ID, port ID, or input. A provider exception on a valid route remains the responsibility of that provider’s contract; the lifecycle runtime does not reinterpret or persist it.

错误 message 不含 module ID、port ID 或输入。合法路由中的 provider 异常仍由该 provider 的契约负责；lifecycle runtime 不会重新解释或持久化该异常。

## `snapshot()`

The snapshot returns entries sorted by module ID:

snapshot 返回按 module ID 排序的条目：

```js
{
  moduleId,
  implementationPackageId,
  state,
  dependencies,
  conflicts
}
```

Relationship arrays are detached copies. Mutating a returned snapshot does not change runtime state. The snapshot never contains a composition, profile, manifest, provider, port list, lifecycle hook, invocation value, or raw error.

关系数组是分离副本。修改返回的 snapshot 不会改变 runtime 状态。snapshot 永不包含 composition、profile、manifest、provider、port 列表、lifecycle hook、调用值或原始错误。

## Stable operation diagnostics / 稳定操作诊断

The initial operation codes are:

首批操作代码为：

| Code / 代码 | Meaning / 含义 |
| --- | --- |
| `capability.unit.invalid` | Core assembly rejected the candidate / core 装配拒绝候选项 |
| `capability.module.duplicate` | The module already has an owner / 模块已有 owner |
| `capability.implementation.duplicate` | The implementation package already has an owner / 实现包已有 owner |
| `capability.module.unknown` | No installed unit has the module ID / 没有已安装单元具有该 module ID |
| `capability.state.invalid` | The requested transition does not start from the required state / 请求转换并非从要求状态开始 |
| `capability.dependency.unavailable` | A dependency is missing or disabled / 依赖缺失或已停用 |
| `capability.conflict.enabled` | An enabled conflict exists in either declaration direction / 任一声明方向存在已启用冲突 |
| `capability.dependent.enabled` | An enabled dependent prevents disablement / 已启用依赖方阻止停用 |
| `capability.uninstall.enabled` | The target must be disabled before uninstall / 目标必须先停用再卸载 |

## Deliberate limits / 刻意限制

The runtime is synchronous and process-local. It does not implement batch profile reconciliation, automatic dependency activation, concurrent transitions, cancellation, persistent state, recovery after process termination, package discovery, npm installation, dynamic import, executable lifecycle hooks, remote code/configuration, arbitrary scripts, environment or storage access, credential handling, permissions, production adapters, UI registration, or release behavior.

runtime 是同步且进程内的。它不实现批量 profile 协调、自动依赖启用、并发转换、取消、持久化状态、进程终止后恢复、包发现、npm 安装、动态 import、可执行生命周期 hook、远程代码/配置、任意脚本、环境或 storage 访问、凭据处理、权限、生产 adapter、UI 登记或发布行为。

These capabilities may be added only through separately reviewed, versioned contracts; they are not permanently rejected by the current limits.

这些能力只能通过独立复审的版本化契约增加；当前限制并不永久排除它们。
