# Application-template contract / 应用模板契约

An application template describes how an already installed, explicit capability set may be integrated into one application shell. It is a versioned declarative manifest, not a source template, generator, package catalog, installer, or remote program.

application template 描述如何把一组已安装、显式提供的能力集成到一个 application shell。它是版本化声明式 manifest，不是源码模板、生成器、package catalog、installer 或远程程序。

## Artifact separation / 产物分离

| Artifact / 产物 | Owns / 主责 |
| --- | --- |
| Business-module manifest / 业务模块 manifest | Business responsibility, ports, dependencies, conflicts, and module configuration / 业务主责、port、依赖、冲突与 module 配置 |
| Implementation-package manifest / 实现包 manifest | Package identity, runtime surfaces, provided contracts, compatibility, provenance, and validation / package 身份、runtime surface、提供的 contract、兼容性、来源与验证 |
| Capability-adoption profile / 能力采用 profile | Exact desired module, implementation, state, and bounded presentation selection / 精确的 module、implementation、state 与受限呈现选择 |
| Application-template manifest / 应用模板 manifest | Required application slots, primary module, host allowlists, route projection, and screen policy / 必需应用 slot、primary module、宿主 allowlist、route projection 与 screen policy |
| Channel application profile / 渠道应用 profile | Application-owned source choice, initial query, and compiled presentation visibility/order / 应用拥有的 source 选择、初始 query 与已编译呈现的可见性/排序 |
| `package.json` | Engineering workspace, dependency, and script metadata only / 仅工程 workspace、依赖与 script metadata |

None of these artifacts substitutes for another.

这些产物互不替代。

## Manifest shape / Manifest 形态

The [Draft 7 schema](schemas/application-template.manifest.v1.schema.json) defines the public shape. A template contains:

[Draft 7 schema](schemas/application-template.manifest.v1.schema.json) 定义公开形态。template 包含：

- `manifestVersion`, `kind`, and `id`;
- `manifestVersion`、`kind` 与 `id`；
- the exact `adoptionProfileId` accepted by the template;
- template 接受的精确 `adoptionProfileId`；
- the `primaryModuleId` exposed to the application shell;
- 暴露给 application shell 的 `primaryModuleId`；
- unique `capabilitySlots`, each with a stable slot ID, module ID, required `enabled` state, and required implementation surface kinds;
- 唯一的 `capabilitySlots`，每项具有稳定 slot ID、module ID、必需 `enabled` 状态与必需 implementation surface kind；
- finite host allowlists for blocks, visibility values, and page sizes;
- 有限的宿主 block、visibility 与 page-size allowlist；
- static screens/actions and an explicit capability policy for every screen.
- 静态 screen/action，以及每个 screen 的显式 capability policy。

The schema checks local shape. The runtime additionally checks unique slot/module ownership, exact screen-policy correspondence, route references, primary-module membership, adoption-profile correspondence, desired states, complete units, implementation surface coverage, and bounded presentation. For this representative app, enabled compiled blocks and their declared order must be the same duplicate-free set; order remains metadata for fixed branches, not a source of component resolution.

schema 检查局部形态。runtime 还会检查唯一 slot/module 主责、screen-policy 精确对应、route 引用、primary-module 成员关系、adoption-profile 对应、期望状态、完整 units、implementation surface 覆盖与受限呈现。对于本代表性 app，enabled 的已编译区块与其声明排序必须是同一无重复集合；排序仍只是固定分支的 metadata，不是组件解析来源。

## Candidate validation / 候选校验

`createApplicationIntegrationRuntime({ template, profile, units })` validates in this order:

`createApplicationIntegrationRuntime({ template, profile, units })` 按以下顺序校验：

1. template root, slots, host policy, route projection, and screen policy;
2. template root、slots、host policy、route projection 与 screen policy；
3. adoption profile ID, exact module selection, and required state;
4. adoption profile ID、精确 module selection 与 required state；
5. complete explicit units and each selected implementation's required surfaces;
6. 完整显式 units 与每个已选 implementation 的 required surfaces；
7. candidate adoption through the existing adoption runtime;
8. 通过既有 adoption runtime 采用候选；
9. primary-module bridge and application-shell initialization.
10. primary-module bridge 与 application-shell 初始化。

Failure returns bounded bilingual diagnostics and no shell, unit, manifest, provider, profile, input, raw lower-layer diagnostic, path, environment value, credential, or source body.

失败只返回受限双语 diagnostics，不返回 shell、unit、manifest、provider、profile、input、下层 raw diagnostic、路径、环境值、credential 或 source body。

## Integration surface / 集成表面

Successful initialization exposes:

成功初始化暴露：

| Surface / 表面 | Responsibility / 主责 |
| --- | --- |
| `shell` | Existing application-shell state and commands for the declared primary module / 已声明 primary module 的既有 application-shell 状态与命令 |
| `receipt` | Detached receipt from initial candidate adoption / 初始候选采用的分离 receipt |
| `reconcile({ profile, units })` | Revalidates template slots and atomically adopts a complete replacement candidate / 重新校验 template slot 并原子采用完整替换候选 |
| `getTemplateSnapshot()` | Returns stable template metadata without route implementation objects or units / 返回稳定 template metadata，不含 route 实现对象或 units |
| `getAdoptionSnapshot()` | Returns the active lifecycle's redacted state / 返回活动 lifecycle 的脱敏状态 |
| `getPresentationSnapshot()` | Returns bounded active presentation metadata / 返回受限的活动呈现 metadata |

The shell bridge always invokes the active adoption runtime using the fixed primary module ID. A successful adapter replacement therefore changes the provider behind the same bridge; a failed replacement leaves the previous invocation path and snapshots active.

shell bridge 始终使用固定 primary module ID 调用活动 adoption runtime。因此成功 adapter replacement 会更换同一 bridge 背后的 provider；失败 replacement 保留先前 invocation path 与 snapshots。

## Adapter extension boundary / Adapter 扩展边界

A slot can require implementation surface kinds such as `adapter` or `mock-session`. The integration runtime checks only reviewed implementation-manifest metadata. It does not call a provider during validation and does not infer a package from an implementation ID.

slot 可以要求 `adapter`、`mock-session` 等 implementation surface kind。integration runtime 只检查已审阅 implementation-manifest metadata；它不会在校验时调用 provider，也不会从 implementation ID 推断 package。

The neutral template can therefore accept either the mandatory mock implementation or the existing injected-wire adapter extension when the caller supplies the corresponding complete unit explicitly. There is no implicit fallback between them.

因此，当调用方显式提供对应完整 unit 时，中性 template 可以接受必备 mock implementation 或现有 injected-wire adapter extension。二者之间不存在隐式 fallback。

## Deliberate limits / 刻意限制

The contract does not define optional/repeated slots, template inheritance, source copying, code generation, a CLI, filesystem loading, JSON/YAML parsing, package discovery, npm installation, dynamic import, scripts, expressions, component paths, URLs, connections, real backend or identity, credential handling, storage, writes, industry fields, deployment, or publication.

本契约不定义 optional/repeated slot、template inheritance、源码复制、代码生成、CLI、文件加载、JSON/YAML 解析、package discovery、npm 安装、动态 import、脚本、表达式、组件路径、URL、连接、真实 backend/identity、credential 处理、storage、写操作、行业字段、部署或发布。

These capabilities are not permanently excluded. Each requires a separate versioned contract, trust model, tests, rollback plan, and explicit adoption decision.

这些能力并非永久排除。每项能力都需要独立版本化契约、信任模型、测试、回退计划与显式采用决定。
