# Lifecycle and selection-transition boundary / 生命周期与选择过渡边界

## Current promise / 当前承诺

HIA-uView-Biz distinguishes three similarly named but different concerns: contract compatibility versions, process-local
candidate replacement, and manual source-checkout migration. The current repository implements the first two only within
their explicit boundaries. It provides no persistent profile/package/data migration engine, project copier, codemod,
package-manager action, hot update, or production-upgrade workflow.

HIA-uView-Biz 区分三个名称相近但主责不同的事项：契约兼容版本、进程内候选替换与人工 source-checkout migration。当前
仓库只在各自明确的边界内实现前两项；不提供持久 profile/package/data migration engine、project copier、codemod、
package-manager action、hot update 或 production-upgrade workflow。

## Three boundaries / 三类边界

| Concern / 事项 | Current behavior / 当前行为 | It is not / 它不是 |
| --- | --- | --- |
| Contract version / 契约版本 | `solutionProfileVersion`、`adoptionVersion` 与 application `profileVersion` currently require exact `1.0` shape compatibility. An incompatible shape needs an explicit new contract version and review. / `solutionProfileVersion`、`adoptionVersion` 与 application `profileVersion` 当前要求精确的 `1.0` 形态兼容；不兼容形态需要明确的新契约版本与复审。 | A release revision, an automatically converted old JSON file, a durable upgrade checkpoint, or a package SemVer release / release revision、自动转换的旧 JSON 文件、持久升级检查点或 package SemVer release。 |
| Candidate replacement / 候选替换 | `adoptionRuntime.reconcile()` and `applicationIntegration.reconcile()` preflight a complete explicit unit set and atomically replace only the active in-memory lifecycle/presentation after success. Their receipt reports bounded install, enable, disable, uninstall, replace, or retain actions. / `adoptionRuntime.reconcile()` 与 `applicationIntegration.reconcile()` 预检完整显式 unit set，成功后才原子替换活动内存 lifecycle/presentation；receipt 只报告受限的 install、enable、disable、uninstall、replace 或 retain 动作。 | Persistent application state migration, data conversion, provider hook, package download, runtime profile loader, or a user-visible reconfiguration feature / 持久 application state migration、数据转换、provider hook、package 下载、运行时 profile loader 或用户可见的重配功能。 |
| Source-checkout migration / Source-checkout 迁移 | A maintainer changes reviewed source declarations, records the Git candidate, runs the named local evidence, and selects a prior reviewed Git commit to roll back. / 维护者修改已复审 source declaration、记录 Git candidate、运行指定本地证据，并通过选择先前已复审 Git commit 回退。 | Reading or writing another project, converting production records, rolling back a deployment, unpublishing a package, or recovering backend data / 读取或写入其他项目、转换生产记录、回退部署、撤销 package 发布或恢复 backend data。 |

## Static selection change / 静态选择变更

For one reviewed host application, an implementation selection can change only through an explicit complete candidate in
reviewed code. The same application template verifies slot and surface correspondence before adoption. The candidate-first
runtime creates an isolated lifecycle, checks dependencies and conflicts, creates a bounded receipt, and swaps the active
in-memory candidate only after all checks succeed. A rejected candidate leaves the existing shell bridge and invocation
path unchanged.

对于一个已复审宿主 application，implementation selection 只能通过已复审 code 中的完整显式 candidate 变更。同一
application template 会在 adoption 前校验 slot 与 surface 对应。candidate-first runtime 创建隔离 lifecycle、检查依赖和
冲突、创建受限 receipt，并且只在全部检查成功后替换活动内存 candidate。被拒绝的 candidate 保持既有 shell bridge 与
invocation path 不变。

The representative `mp-weixin` fixture intentionally does not expose a profile/package reconfiguration API. It validates
one checked-in application profile and one static solution selection at initialization, then projects only fixed compiled
blocks. This keeps profile metadata declarative and avoids treating a running fixture as a generic dynamic-configuration
or migration surface.

代表性 `mp-weixin` fixture 有意不公开 profile/package reconfiguration API。它在初始化时校验一个 checked-in application
profile 与一个静态 solution selection，之后只投影固定已编译区块。这保持 profile metadata 的声明式属性，并避免把运行中
fixture 变成通用 dynamic-configuration 或 migration 表面。

## Evidence and rollback / 证据与回退

Evaluate a reviewed static selection change in a clean source checkout. The deterministic Node suite covers complete
candidate replacement, retained shell invocation, and rejected-candidate rollback. `npm run trial:source` additionally
runs the doctor, workspace/ROP/documentation checks, Node contracts, and offline release-quality gate. The separate
controlled `mp-weixin` compiler/output verifier checks that the unchanged fixed application surface still compiles with a
reviewed local HIA-uView UI input.

请在 clean source checkout 中评估已复审静态 selection change。确定性 Node suite 覆盖完整 candidate replacement、保留的
shell invocation 与被拒绝 candidate 的回退。`npm run trial:source` 还运行 doctor、workspace/ROP/documentation checks、
Node contracts 与 offline release-quality gate。独立的受控 `mp-weixin` compiler/output verifier 检查未改变的固定
application 表面仍可使用已复审本地 HIA-uView UI 输入进行编译。

The only current rollback is source-control selection: return to a previously reviewed commit and regenerate or discard
local build output. A passing Node or compiler result does not prove a device, simulator, real data migration, real
backend/identity, deployment rollback, accessibility certification, security certification, or publication.

当前唯一的回退是 source-control selection：返回先前已复审的 commit，并重新生成或丢弃本地 build output。Node 或 compiler
通过不证明 device、simulator、真实数据迁移、真实 backend/identity、部署回退、无障碍认证、安全认证或发布。

## When to stop / 何时停止

Stop this path and create a separately authorized design if a change needs a prior persistent profile, data record,
filesystem/database/backend write, credential, identity/authorization decision, source conversion, asynchronous recovery,
package installation, remote registry, user-visible runtime reconfiguration, or production downtime. Such work needs an
explicit source of truth, compatibility matrix, privacy/trust review, failure and recovery semantics, rollback plan, tests,
and platform evidence.

若变更需要先前持久 profile、数据记录、filesystem/database/backend write、credential、identity/authorization 决定、
source conversion、asynchronous recovery、package installation、remote registry、用户可见运行时重配或生产 downtime，请
停止本路径并建立单独授权的设计。此类工作需要明确 source of truth、compatibility matrix、privacy/trust review、failure
与 recovery 语义、rollback plan、tests 和平台证据。
