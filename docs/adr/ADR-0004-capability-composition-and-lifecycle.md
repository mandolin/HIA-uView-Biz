# ADR-0004: Capability composition and lifecycle / 能力组合与生命周期

## Status / 状态

Accepted for the first in-memory capability lifecycle runtime.

已接受，适用于首个内存能力生命周期 runtime。

## Context / 背景

The current core validates and assembles one explicitly supplied business module, implementation package, profile, and provider set. An application still needs a deterministic way to hold several validated capability units, enable a dependency-safe subset, reject conflicts, route calls only to enabled capabilities, and remove units without leaving hidden registrations.

当前 core 会校验并装配一个显式提供的业务模块、实现包、profile 与 provider 集合。应用仍需要一种确定的方式来持有多个已验证能力单元、启用满足依赖的子集、拒绝冲突、只向已启用能力路由调用，并在不遗留隐藏登记的情况下移除单元。

The terms “install” and “uninstall” are easily confused with package-manager actions. In this boundary they describe only membership in one process-local application composition. They must not download packages, inspect a registry, scan a filesystem, execute lifecycle scripts, or persist plugin state.

“安装”和“卸载”容易与包管理器动作混淆。在本边界中，它们只描述能力是否属于一个进程内应用组合。它们不得下载包、检查 registry、扫描文件系统、执行生命周期脚本或持久化插件状态。

## Decision / 决定

### 1. A capability unit is explicit assembly input / 能力单元是显式装配输入

A capability unit contains one business-module manifest, one implementation-package manifest, one profile, and the explicit providers needed by that module. Installing a unit first delegates to the existing core assembly contract. A failed assembly is not retained, and the lifecycle runtime does not create a second manifest interpreter.

能力单元包含一个业务模块 manifest、一个实现包 manifest、一个 profile，以及该模块需要的显式 provider。安装单元时首先委托既有 core 装配契约。装配失败的单元不会被保留，lifecycle runtime 也不创建第二套 manifest 解释器。

The host supplies all units directly. The runtime performs no registry or directory discovery, dynamic import, package resolution, fallback selection, remote configuration fetch, or global singleton registration.

所有单元都由宿主直接提供。runtime 不执行 registry 或目录发现、动态 import、包解析、fallback 选择、远程配置获取或全局 singleton 登记。

### 2. Installation and activation are separate / 安装与启用相互分离

Successful installation retains a validated unit in the `disabled` state. Enabling changes only its application-composition state and makes its declared invocation surface routable. Disabling prevents new routed calls but does not cancel or reinterpret a call already returned by a provider. Uninstalling removes only a disabled unit. A removed unit has no retained lifecycle entry.

安装成功后，已验证单元以 `disabled` 状态保留。启用只改变其应用组合状态，并使其已声明调用面可路由。停用会阻止新的路由调用，但不会取消或重新解释 provider 已经返回的调用。卸载只能移除已停用单元。已移除单元不保留 lifecycle 条目。

The business manifest’s `business.lifecycle` field remains a profile-selection classification (`required`, `optional`, or `profile-selected`); it is not an npm installation state and does not silently execute a transition. A profile or host may later reconcile a desired set, but this first runtime exposes explicit transitions only.

业务 manifest 的 `business.lifecycle` 字段仍是 profile 选择分类（`required`、`optional` 或 `profile-selected`）；它不是 npm 安装状态，也不会静默执行状态转换。profile 或宿主以后可以协调目标集合，但首个 runtime 只暴露显式转换。

### 3. Module dependencies and conflicts control enablement / 模块依赖与冲突控制启用

`dependencies` and `conflicts` are business-module relationships, not npm dependencies. A unit may be installed before its dependencies so hosts can prepare a composition in any order. It may be enabled only when every declared dependency is installed and enabled.

`dependencies` 与 `conflicts` 是业务模块关系，不是 npm 依赖。能力单元可以先于其依赖安装，使宿主能够按任意顺序准备组合；但只有全部已声明依赖都已安装且启用时，该单元才能启用。

A conflict is effective when either side declares the other. Enabling must fail if any installed enabled unit conflicts in either direction. This symmetric check prevents an older or incomplete declaration on one side from making a known conflict silently order-dependent.

任一方声明另一方时，冲突即生效。如果任何已安装且启用的单元在任一方向存在冲突，启用必须失败。该对称检查可避免一方较旧或不完整的声明使已知冲突悄然依赖操作顺序。

A module cannot be disabled while an enabled module depends on it. The host must disable dependents first. The runtime does not automatically enable, disable, download, replace, or reorder other units.

当仍有已启用模块依赖某模块时，该模块不能停用；宿主必须先停用依赖方。runtime 不会自动启用、停用、下载、替换或重排其他单元。

### 4. Ownership is unique within one runtime / 单个 runtime 内主责唯一

Each installed business-module ID has exactly one unit, and each installed implementation-package ID belongs to exactly one unit. A duplicate install is rejected before state changes. Replacing an implementation requires disabling and uninstalling the existing unit, then explicitly installing and enabling the replacement.

每个已安装业务模块 ID 只对应一个单元，每个已安装实现包 ID 也只属于一个单元。重复安装会在状态变化前被拒绝。替换实现时，必须先停用并卸载既有单元，再显式安装和启用替代项。

The runtime never reaches into another unit’s provider set. Cross-module behavior uses a declared module port or a higher application orchestration layer; implementation packages do not gain implicit private-provider access merely because they share one runtime.

runtime 不会深入访问另一单元的 provider 集合。跨模块行为通过已声明的模块 port 或更高层应用编排完成；实现包不会仅因共享一个 runtime 就隐式取得其他单元的私有 provider 访问权。

### 5. Transitions are atomic and diagnostics are public-safe / 转换原子化且诊断适合公开

Each install, enable, disable, or uninstall operation validates against the current state before committing one state change. A failed operation leaves the prior state unchanged. The first runtime is synchronous and process-local; concurrent or distributed transactions are outside this boundary.

每次安装、启用、停用或卸载操作都会先针对当前状态完成校验，再提交一次状态变化。操作失败时，先前状态保持不变。首个 runtime 是同步且进程内的；并发或分布式事务不属于本边界。

Operation results use stable diagnostic codes and bounded metadata such as a relevant module ID. Snapshots expose only stable module ID, implementation-package ID, state, dependencies, and conflicts in deterministic order. They do not expose manifests, profiles, provider functions, invocation input or output, raw exceptions, backend details, credentials, paths, environment values, or source bodies.

操作结果使用稳定诊断代码与受限元数据，例如相关 module ID。snapshot 只按确定顺序公开稳定的 module ID、实现包 ID、状态、依赖与冲突。它不公开 manifest、profile、provider 函数、调用输入或输出、原始异常、后端细节、凭据、路径、环境值或 source body。

### 6. Invocation is explicit and lifecycle hooks do not exist / 调用必须显式且不存在生命周期 hook

The host invokes a port with an explicit module ID and port ID. Only an enabled unit can receive a routed call. An unknown, disabled, or unregistered route fails with a stable lifecycle error that contains no input value. For a valid route, the lifecycle runtime delegates to the already assembled composition and preserves its canonical provider result.

宿主通过显式 module ID 与 port ID 调用 port。只有已启用单元可以接收路由调用。未知、已停用或未登记的路由会产生不含输入值的稳定 lifecycle 错误。对于合法路由，lifecycle runtime 委托给已经装配的 composition，并保留其规范化 provider result。

Capability units cannot provide executable install, enable, disable, or uninstall hooks in this first boundary. No lifecycle transition invokes a provider. Arbitrary scripts, remote code, hot updates, sandboxed plugins, migrations, and cleanup callbacks require separate security, rollback, compatibility, and platform decisions.

在首个边界中，能力单元不能提供可执行的 install、enable、disable 或 uninstall hook。任何生命周期转换都不会调用 provider。任意脚本、远程代码、热更新、沙箱插件、迁移和清理 callback 需要独立的安全、回退、兼容性与平台决定。

## Alternatives considered / 备选项

### Package-manager-backed installation / 由包管理器驱动安装

Running npm or resolving registry packages inside the application runtime would combine composition with supply-chain mutation and platform-specific I/O. It is outside the first lifecycle boundary.

在应用 runtime 内运行 npm 或解析 registry 包，会把组合与供应链变更及平台专项 I/O 混在一起。它不属于首个 lifecycle 边界。

### Executable lifecycle hooks / 可执行生命周期 hook

Hooks could make setup convenient, but they would introduce arbitrary effects, partial rollback, ordering hazards, and a new trust boundary before the declarative model is proven. They are deferred.

hook 可以让初始化更方便，但在声明式模型尚未验证前，它们会引入任意副作用、不完整回退、顺序风险和新的信任边界。因此暂缓采用。

### Automatic dependency activation / 自动启用依赖

Automatically enabling a dependency could hide profile intent and unexpectedly activate permissions or presentation. The first runtime requires explicit dependency-first enablement and returns actionable diagnostics instead.

自动启用依赖可能隐藏 profile 意图，并意外激活权限或呈现。首个 runtime 改为要求显式按依赖优先顺序启用，并返回可操作诊断。

## Consequences / 后果

- Applications can prepare several validated units in any installation order while activation remains explicit and auditable.
- 应用可以按任意安装顺序准备多个已验证单元，同时保持启用过程显式且可审计。

- Implementation replacement is deliberately multi-step; no invisible hot swap or fallback occurs.
- 实现替换被刻意设计为多步骤操作；不会发生不可见的热替换或 fallback。

- The first runtime cannot install third-party packages, persist plugin state, run migrations, or guarantee distributed concurrency.
- 首个 runtime 不能安装第三方包、持久化插件状态、运行迁移或保证分布式并发。

- Future profile reconciliation, package catalogs, lifecycle hooks, persistence, or remote extension delivery require separate versioned contracts and threat review.
- 未来的 profile 协调、包 catalog、生命周期 hook、持久化或远程扩展交付需要独立的版本化契约与威胁复审。

## Verification and review / 验证与复审

The first implementation must test invalid assembly, duplicate ownership, dependency-first enablement, symmetric conflicts, dependent-protected disable, enabled-unit uninstall rejection, deterministic redacted snapshots, explicit invocation, and unchanged state after every failed transition. It must also verify that lifecycle operations execute no provider or hook and perform no network, filesystem, environment, registry, credential, or storage access.

首个实现必须测试无效装配、重复主责、依赖优先启用、对称冲突、受依赖方保护的停用、拒绝卸载已启用单元、确定且脱敏的 snapshot、显式调用，以及每次失败转换后状态不变。还必须验证生命周期操作不执行 provider 或 hook，也不访问网络、文件系统、环境、registry、凭据或 storage。

Review this decision before adding batch reconciliation, async transition tracking, package discovery or installation, executable hooks, persistent lifecycle state, remote configuration, permissions, real identity, production adapters, or cross-process coordination.

在新增批量协调、异步转换跟踪、包发现或安装、可执行 hook、持久化 lifecycle 状态、远程配置、权限、真实身份、生产 adapter 或跨进程协调前，必须复审本决定。
