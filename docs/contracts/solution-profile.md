# Solution-profile contract / 解决方案 profile 契约

A solution profile selects reviewed, static capability packages for one declared channel application profile. It is a versioned JSON artifact and a pure local resolver input; it is not a package catalog, dependency installer, dynamic presentation program, identity record, token container, backend connection, or industry-field definition.

solution profile 为一个已声明的渠道应用 profile 选择已审阅的静态 capability package。它是版本化 JSON 产物和纯本地 resolver 输入；它不是 package catalog、依赖安装器、动态呈现程序、身份记录、token 容器、后端连接或行业字段定义。

## Public artifacts / 公开产物

| Artifact / 产物 | Responsibility / 主责 |
| --- | --- |
| [Solution-profile schema / solution-profile schema](schemas/solution-profile.v1.schema.json) | Local JSON shape for solution identity, target channel profile, and top-level package selections / solution 身份、目标渠道 profile 与顶层 package 选择的本地 JSON 形态 |
| [Neutral catalog solution example / 中性目录 solution 示例](examples/example.catalog-query-detail.neutral.solution.profile.json) | Selects the neutral read-only catalog package for the representative `mp-weixin` channel / 为代表性 `mp-weixin` 渠道选择中性只读目录 package |
| `@hia-uview/biz-solution-profile-runtime` | Pure resolver for supplied profile/session plain data and reviewed static host descriptors / 针对提供的 profile/session plain data 与已审阅静态宿主描述符的纯 resolver |

## Shape and ownership / 形态与主责

The Draft 7 [schema](schemas/solution-profile.v1.schema.json) requires exactly `solutionProfileVersion`, `kind`, `id`, `channelProfileId`, and unique `capabilityPackageIds`. The profile selects only known top-level package IDs. The host owns the reviewed descriptor registry, including each package's `dependsOn`, `requiredModuleIds`, and `requiredGrantIds`; those descriptor fields are not copied into the public solution JSON.

Draft 7 [schema](schemas/solution-profile.v1.schema.json) 精确要求 `solutionProfileVersion`、`kind`、`id`、`channelProfileId` 与唯一的 `capabilityPackageIds`。profile 只选择已知顶层 package ID。宿主拥有已审阅描述符登记表，包括每个 package 的 `dependsOn`、`requiredModuleIds` 与 `requiredGrantIds`；这些描述符字段不会复制到公开 solution JSON。

The resolver validates the static registry once, then validates an explicit profile and anonymous mock session before application-template candidate or provider creation. It resolves dependencies in fixed dependency-first order and returns only stable solution metadata, package availability state, required module IDs, and bounded bilingual diagnostics. A failure returns diagnostics only. It does not return raw profiles, sessions, grants, registries, descriptors, providers, manifests, paths, environment values, or partial application surfaces.

resolver 先校验静态登记表，再在 application-template candidate 或 provider 创建前校验显式 profile 与匿名 mock session。它以固定依赖优先顺序解析依赖，只返回稳定 solution metadata、package availability state、required module ID 与受限中英双语 diagnostics。失败时只返回 diagnostics；不会返回原始 profile、session、grant、登记表、描述符、provider、manifest、路径、环境值或 partial application 表面。

## Anonymous mock-session boundary / 匿名 mock-session 边界

The first slice supplies an anonymous mock session solely to test local availability. It contains no subject, user, tenant, role, token, cookie, storage key, expiry, backend credential, transport, or persistence. Its local grant IDs are not a real authorization system and do not bind WeChat or enterprise identity.

首轮只提供匿名 mock session 来测试本地 availability。它不含 subject、用户、租户、角色、token、cookie、storage key、过期时间、后端凭据、transport 或持久化。其本地 grant ID 不是实际授权系统，也不绑定微信或企业身份。

The representative neutral solution selects `example.catalog-query-detail.read`. Its reviewed static closure also requires `example.reference-data.read`; the anonymous mock session supplies the two bounded grants necessary for that closure. The app still delegates actual module/implementation candidate assembly, lifecycle, and shell creation to the existing template/adoption/integration layers.

代表性中性 solution 选择 `example.catalog-query-detail.read`。其已审阅静态闭包还要求 `example.reference-data.read`；匿名 mock session 提供该闭包所需的两个受限 grant。应用仍把实际 module/implementation candidate 装配、lifecycle 与 shell 创建委托给既有 template/adoption/integration 层。

## Deliberate limits and future direction / 刻意限制与后续方向

This first contract has no package discovery, loading, installation, dynamic import, arbitrary script, arbitrary dependency, remote configuration, URL, backend connection, HTTP, storage, real authentication, identity binding, role/tenant policy, write operation, industry profile, or dynamic component/template/style interpretation. Declarative dynamic presentation remains a future product capability, but any expansion must use a versioned contract and fixed compiled boundaries rather than executable configuration.

此首轮契约不包含 package discovery、加载、安装、动态 import、任意脚本、任意依赖、远端配置、URL、后端连接、HTTP、storage、真实认证、身份绑定、角色/租户 policy、写操作、行业 profile 或动态 component/template/style 解释。声明式动态呈现仍是未来产品能力，但任何扩展都必须使用版本化契约与固定已编译边界，而非可执行配置。

These capabilities are temporarily not adopted, not permanently excluded. A later adoption requires a reviewed trust model, versioned contract, tests, rollback plan, and explicit product decision.

这些能力目前暂不采用，并非永久排除。后续采用需要已审阅信任模型、版本化契约、测试、回退计划与明确产品决策。
