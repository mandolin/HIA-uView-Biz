# Contract artifacts / 契约产物

These files define data contracts for HIA-uView-Biz composition. They are reviewable JSON Schema and example manifests, not runtime code, a package release, a backend adapter, or a generated project template.

这些文件定义 HIA-uView-Biz 组合所使用的数据契约。它们是可审阅的 JSON Schema 与示例 manifest，不是运行时代码、包发布、后端 adapter 或生成式项目模板。

## Artifact map / 产物地图

| Artifact / 产物 | Purpose / 用途 |
| --- | --- |
| [Business-module manifest schema / 业务模块 manifest schema](schemas/business-module.manifest.v1.schema.json) | Declares business ownership, ports, schemas, and permitted presentation configuration / 声明业务主责、port、schema 和允许的呈现配置 |
| [Implementation-package manifest schema / 实现包 manifest schema](schemas/implementation-package.manifest.v1.schema.json) | Declares installed engineering delivery facts for one module / 声明一个模块的已安装工程交付事实 |
| [Module example / 模块示例](examples/example.catalog-query-detail.module.manifest.json) | A neutral `entry` catalog, query, detail, and bounded acknowledge-command capability / 中性的 `entry` 目录、查询、详情与受限确认命令能力 |
| [Implementation example / 实现示例](examples/example.catalog-query-detail.mock-implementation.manifest.json) | A fixture-only mock implementation declaration / 仅供 fixture 使用的 mock 实现声明 |
| [Catalog-query-detail contract / 目录—查询—详情契约](catalog-query-detail.md) | Canonical query, detail, outcome, mock-session, adapter, route-projection, and fixture behavior / 规范化 query、detail、结果、mock session、adapter、路由投影与 fixture 行为 |
| [Adapter boundary contract / Adapter 边界契约](adapter-boundary.md) | Backend-agnostic port ownership, wire conversion, failure redaction, session, cache, pagination, and Directus migration rules / 后端无关的 port 主责、wire 转换、failure 脱敏、会话、缓存、分页与 Directus 迁移规则 |
| [Capability lifecycle contract / 能力生命周期契约](capability-lifecycle.md) | Explicit in-memory install, enable, disable, uninstall, dependency, conflict, ownership, invocation, and snapshot rules / 显式内存安装、启用、停用、卸载、依赖、冲突、主责、调用与 snapshot 规则 |
| [Capability adoption contract / 能力采用契约](capability-adoption.md) | Candidate-first complete-set reconciliation, bounded presentation, public-safe receipts, and explicit atomic implementation replacement / 候选优先完整集合协调、受限呈现、可公开 receipt 与显式原子实现替换 |
| [Capability adoption profile schema / 能力采用 profile schema](schemas/capability-adoption.profile.v1.schema.json) | Restricts desired module/implementation/state selections and presentation metadata / 限制期望 module/implementation/state 选择与呈现 metadata |
| [Initial adoption profile / 初始采用 profile](examples/example.catalog-composed.adoption.profile.json) | Enables neutral reference-data and catalog capabilities with registered blocks / 启用中性 reference-data 与 catalog 能力及已登记区块 |
| [Replacement profile / 替换 profile](examples/example.catalog-composed.replacement.profile.json) | Selects an explicitly supplied replacement implementation and adjusted bounded presentation / 选择显式提供的替代实现及调整后的受限呈现 |
| [Application-template contract / 应用模板契约](application-template.md) | Separates application slots, primary-module bridging, host policy, route projection, and explicit adapter-unit integration / 分离应用 slot、primary-module bridge、宿主 policy、route projection 与显式 adapter-unit 集成 |
| [Application-template manifest schema / 应用模板 manifest schema](schemas/application-template.manifest.v1.schema.json) | Restricts template identity, capability slots, implementation surfaces, host allowlists, routes, and screen policy / 限制 template 身份、capability slot、implementation surface、宿主 allowlist、route 与 screen policy |
| [Application-template example / 应用模板示例](examples/example.catalog-query-detail.mp-weixin.template.manifest.json) | Neutral `mp-weixin` template requiring reference-data and catalog-adapter slots / 要求 reference-data 与 catalog-adapter slot 的中性 `mp-weixin` template |
| [Entry acknowledgement command / Entry 确认命令](entry-acknowledgement.md) | Canonical command/receipt, idempotency, deterministic mock rollback, and explicit port boundary / 规范化命令/receipt、幂等、确定性 mock 回退与显式 port 边界 |
| [Acknowledgement command schema / 确认命令 schema](schemas/entry-acknowledgement.command.v1.schema.json) | Restricts the four-field `acknowledge-entry` input / 限制四字段 `acknowledge-entry` 输入 |
| [Acknowledgement command example / 确认命令示例](examples/example.catalog-query-detail.acknowledge-entry.command.json) | Minimal neutral command plain data / 最小中性命令 plain data |
| [Acknowledgement receipt example / 确认 receipt 示例](examples/example.catalog-query-detail.acknowledge-entry.receipt.json) | Detached success metadata after first mock commit / 首次 mock 提交后的分离成功 metadata |
| [Solution-profile contract / 解决方案 profile 契约](solution-profile.md) | Static package composition, anonymous mock-session availability, and the pure resolver boundary / 静态 package 组合、匿名 mock-session availability 与纯 resolver 边界 |
| [Solution-profile schema / 解决方案 profile schema](schemas/solution-profile.v1.schema.json) | Restricts solution identity, target channel profile, and explicit top-level static package selections / 限制 solution 身份、目标渠道 profile 与显式顶层静态 package 选择 |
| [Neutral solution example / 中性 solution 示例](examples/example.catalog-query-detail.neutral.solution.profile.json) | Selects the neutral catalog read package for the representative channel / 为代表性渠道选择中性目录读取 package |
| [Representative `mp-weixin` slice / 代表性 `mp-weixin` 纵切](representative-mp-weixin-slice.md) | Versioned app profile, explicit local source selection, full-stack acceptance path, registered presentation visibility/order, and layer ownership / 带版本 app profile、显式本地数据源选择、完整 stack 验收路径、已登记呈现区块可见性/排序与分层主责 |
| [Representative profile schema / 代表性 profile schema](schemas/representative-mp-weixin.profile.v1.schema.json) | Restricts source mode, initial page values, compiled presentation block IDs, and their complete bounded order / 限制数据源模式、初始分页值、已编译呈现区块 ID 及其完整受限排序 |
| [Representative profile example / 代表性 profile 示例](examples/example.catalog-query-detail.representative-mp-weixin.profile.json) | Default checked-in `wire-fixture` selection for the neutral application fixture / 中性应用 fixture 的默认仓内 `wire-fixture` 选择 |
| [Application-shell API / 应用 shell API](../api/app-shell.md) | In-memory projection of declared screens/actions and mock capabilities; it is an API contract rather than a manifest artifact / 已声明 screens/actions 与 mock capabilities 的内存投影；它是 API 契约而非 manifest 产物 |
| [Adapter-runtime API / Adapter runtime API](../api/adapter-runtime.md) | Executable declaration/lifecycle/redaction/memory-cache surface for injected read-adapter fixtures / 注入式 read-adapter fixture 的可执行声明、lifecycle、脱敏与内存缓存表面 |
| [Adoption-runtime API / 采用 runtime API](../api/adoption-runtime.md) | Executable complete-set reconciliation, bounded presentation, receipt, invocation, and atomic replacement surface / 可执行完整集合协调、受限呈现、receipt、调用与原子替换表面 |

## Two manifest responsibilities / 两类 manifest 的主责

The business-module manifest answers **what capability is owned**: business responsibility, lifecycle, permissions, required or provided ports, domain contract references, and the configuration that may select registered presentation blocks. It must not describe a backend-specific route, HTTP envelope, credential, or package distribution detail.

业务模块 manifest 回答**拥有哪项能力**：业务主责、生命周期、权限、required 或 provided port、领域契约引用，以及可选择已登记呈现区块的配置。它不能描述后端专用路由、HTTP envelope、凭据或包分发细节。

The implementation-package manifest answers **how an installed engineering package supplies a capability**: package identity and distribution status, runtime target and surface, supplied port implementation, compatibility, provenance, and planned or verified evidence. It must not silently create business ownership or turn `package.json` into a business manifest.

实现包 manifest 回答**已安装工程包如何提供能力**：包身份与分发状态、运行时目标与表面、所提供的 port 实现、兼容性、来源，以及计划中或已验证的证据。它不能悄然创建业务主责，也不能把 `package.json` 变成业务 manifest。

## Configuration boundary / 配置边界

The module schema permits only identifiers for registered blocks, declared pagination modes, declared visibility conditions, and a profile-controlled or fixed ordering policy. A manifest cannot introduce a script, dependency, unknown component, arbitrary URL, arbitrary connection, or undeclared private-data read.

模块 schema 只允许已登记区块的标识、已声明的分页模式、已声明的可见性条件，以及由 profile 控制或固定的排序策略。manifest 不能引入脚本、依赖、未知组件、任意 URL、任意连接或未声明的私有数据读取。

## JSON and language notes / JSON 与语言说明

JSON does not support comments. The schemas therefore use bilingual `title` and `description` metadata, and this Markdown explains every public responsibility in Chinese and English. Example display and responsibility text uses the explicit `zh-Hans` and `en` fields.

JSON 不支持注释。因此 schema 使用中英双语的 `title` 与 `description` 元数据，本 Markdown 以中英文解释每项公开主责。示例的显示文本与主责文本使用明确的 `zh-Hans` 和 `en` 字段。

The schema files use JSON Schema Draft 7 so they can be checked without adding a runtime dependency in this repository. The draft choice is a validation-tooling boundary, not a claim that the manifests are already a stable runtime API.

schema 文件使用 JSON Schema Draft 7，因此可以在本仓不新增运行时依赖的情况下检查。选择该 draft 是验证工具边界，并不表示 manifest 已经是稳定的运行时 API。

The current core accepts already parsed manifest objects and implements only the minimum relationship checks documented in the [core API](../api/core.md). It does not load JSON/YAML, interpret arbitrary Draft 7 keywords, or replace schema validation with runtime guessing.

当前 core 接受已解析的 manifest 对象，并且只实现 [core API](../api/core.md) 中记录的最小关系校验。它不加载 JSON/YAML、不解释任意 Draft 7 keyword，也不以运行时猜测替代 schema 校验。
