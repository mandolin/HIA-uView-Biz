# ADR-0005: Explicit capability adoption and replacement / 显式能力采用与替换

Date / 日期：2026-07-30

Status / 状态：Accepted / 已接受

## Context / 背景

The capability lifecycle can validate, install, enable, disable, uninstall, and invoke one explicitly supplied capability unit at a time. An application still needs a bounded way to declare the complete desired set, preflight dependency and conflict relations, compare it with the active set, and replace one implementation without exposing a partially changed runtime.

能力生命周期已经可以逐个校验、安装、启用、停用、卸载和调用显式提供的能力单元。应用仍需要一种受限方式，用于声明完整期望集合、预检依赖与冲突关系、与活动集合比较，以及替换某项实现且不暴露部分变更的 runtime。

The words “install” and “upgrade” can be misleading in this context. The framework must not silently turn application composition into npm installation, registry discovery, remote-code loading, filesystem scanning, lifecycle hooks, or an online update system.

“安装”和“升级”在此处容易产生误解。框架不能悄然把应用组合变成 npm 安装、registry discovery、远程代码加载、文件系统扫描、lifecycle hook 或在线更新系统。

## Decision / 决定

### 1. Adoption profile / 采用 profile

An application owns a versioned adoption profile. It identifies the complete desired capability set by stable business-module ID, exact implementation-package ID, and desired `enabled` or `disabled` state. Presentation configuration may select only host-registered blocks, host-approved visibility values, and an approved page size.

应用拥有带版本的 adoption profile。它以稳定业务模块 ID、精确实现包 ID 和期望的 `enabled` 或 `disabled` 状态标识完整能力集合。呈现配置只能选择宿主已登记区块、宿主批准的 visibility 值和获准 page size。

The adoption profile remains separate from business-module manifests, implementation-package manifests, channel profiles, and `package.json`. It describes one application’s desired composition; it does not create business ownership or engineering distribution facts.

adoption profile 与业务模块 manifest、实现包 manifest、渠道 profile 及 `package.json` 保持分离。它描述一次应用期望组合；不会创建业务主责或工程分发事实。

### 2. Explicit unit supply / 显式提供单元

The caller supplies every candidate capability unit as an in-memory value. The adoption runtime performs no package discovery, file loading, environment lookup, dynamic import, network access, registry access, or fallback implementation selection. Every profile entry must match exactly one supplied unit after the existing core validates that unit.

调用方以进程内值显式提供每个候选 capability unit。adoption runtime 不执行 package discovery、文件加载、环境查询、动态 import、网络访问、registry 访问或 fallback 实现选择。既有 core 校验单元后，每个 profile 条目都必须精确匹配一个已提供单元。

### 3. Candidate-first reconciliation / 候选优先协调

Reconciliation constructs a separate candidate lifecycle runtime. It validates and installs the complete desired set, then enables requested capabilities in deterministic dependency order. Conflict, missing-dependency, duplicate-owner, invalid-unit, invalid-profile, or enablement failure rejects the candidate.

协调会构建一个独立候选 lifecycle runtime。它校验并安装完整期望集合，再以确定性的依赖顺序启用所需能力。冲突、缺失依赖、重复主责、无效单元、无效 profile 或启用失败都会拒绝候选。

Only a fully valid candidate becomes active. A failure leaves the prior active runtime, snapshot, presentation projection, and invocation path unchanged. Providers are not invoked during reconciliation.

只有完全合法的候选才会成为活动 runtime。失败会保持先前活动 runtime、snapshot、呈现投影和调用路径不变。协调期间不会调用 provider。

### 4. Replacement, not package installation / 替换而非包安装

When a desired entry keeps the same business-module ID but selects a different explicitly supplied implementation-package ID, the receipt reports `replace`. This is the initial meaning of an implementation upgrade.

当期望条目保持同一业务模块 ID，但选择另一个显式提供的实现包 ID 时，receipt 报告 `replace`。这是实现升级的首轮含义。

Replacement does not download, install, remove, migrate, or execute package code. It does not run setup, cleanup, data migration, compatibility conversion, or rollback hooks. A later capability that needs persistent migration or external state requires its own contract, threat analysis, consent, compatibility, and rollback design.

替换不会下载、安装、删除、迁移或执行 package code。它不运行 setup、cleanup、data migration、compatibility conversion 或 rollback hook。未来若某项能力需要持久化迁移或外部状态，必须建立独立契约、威胁分析、同意、兼容与回退设计。

### 5. Public-safe receipt / 可公开 receipt

A successful receipt lists deterministic `install`, `enable`, `disable`, `uninstall`, `replace`, or `retain` actions using stable module and implementation IDs. A failure returns bounded diagnostics. Neither surface contains manifests, profiles, providers, functions, invocation inputs or outputs, raw errors, credentials, paths, environment values, or source bodies.

成功 receipt 以稳定 module 与 implementation ID 列出确定性的 `install`、`enable`、`disable`、`uninstall`、`replace` 或 `retain` 动作。失败返回受限 diagnostics。两种表面都不包含 manifest、profile、provider、函数、调用输入或输出、原始错误、credential、路径、环境值或 source body。

## Initial capability set / 首批能力集合

The first composed fixture uses two neutral capabilities whose reference-data and catalog query/detail paths are read-only:

首个组合 fixture 使用两项中性能力；其 reference-data 和 catalog query/detail 路径均为只读：

- `example.reference-data` owns deterministic reference-option lookup for declared filters. It owns no industry dictionary or production fact.
- `example.reference-data` 拥有已声明 filter 的确定性 reference option 查询；不拥有行业字典或生产事实。
- `example.catalog-query-detail` owns read-only catalog query and entry detail behavior, a separately contracted instance-local acknowledgement mock command, and declares `example.reference-data` as a dependency.
- `example.catalog-query-detail` 拥有只读目录查询与 entry 详情行为、一个另行契约化的 instance-local 确认 mock command，并声明依赖 `example.reference-data`。

Presentation remains an application projection. Registered block selection does not become a third business module and does not grant a block ownership of catalog or reference data.

presentation 仍是应用投影。选择已登记区块不会形成第三个业务模块，也不会让区块取得 catalog 或 reference data 主责。

## Alternatives considered / 备选项

### Mutate the active runtime and undo on failure / 修改活动 runtime 并在失败时撤销

Undo would require retaining private units or executing rollback hooks and could expose a partially changed invocation surface. Rejected for the initial boundary.

撤销需要保留私有单元或执行 rollback hook，并可能暴露部分变更的调用表面。首轮边界不采用。

### Let the runtime discover packages / 让 runtime 发现包

Registry or filesystem discovery would combine composition with supply-chain, permission, and execution concerns. Rejected.

registry 或文件系统发现会把组合与供应链、权限及执行问题混为一体。未采用。

### Store adoption facts in `package.json` / 在 `package.json` 中保存采用事实

Engineering package metadata cannot represent one application’s complete desired business composition and must not replace versioned business contracts. Rejected.

工程包元数据不能表达一次应用的完整期望业务组合，也不能替代版本化业务契约。未采用。

## Consequences / 后果

- Reconciliation can be deterministic and failure-atomic because it switches a complete in-memory runtime reference.
- 协调可以保持确定性与失败原子性，因为它切换的是完整进程内 runtime 引用。
- A caller must provide the complete reviewed unit set on each reconciliation; there is no hidden global catalog.
- 调用方每次协调都必须提供完整的已审阅单元集合；不存在隐藏全局 catalog。
- Replacement proves composition compatibility only. It does not prove data migration, production upgrade safety, package publication, or remote rollback.
- 替换只证明组合兼容性；不证明数据迁移、生产升级安全、包发布或远程回退。

## Review conditions / 复审条件

Review this decision before adding filesystem or registry discovery, asynchronous or concurrent reconciliation, persistent lifecycle state, migration or cleanup hooks, remote configuration, real credentials, external writes, a package installer, or production upgrade claims.

在加入文件系统或 registry discovery、异步或并发协调、持久化 lifecycle state、migration/cleanup hook、远程配置、真实 credential、外部写入、package installer 或生产升级声明前，复审本决定。
