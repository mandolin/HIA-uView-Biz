# HIA-uView-Biz

HIA-uView-Biz is a configurable, capability-composed business framework for UniApp applications. It starts with mini-program-oriented contracts while keeping backend, identity, industry model, and presentation channel replaceable.

HIA-uView-Biz 是可配置、按能力组合的 UniApp 业务框架。它从面向小程序的契约开始，同时保持后端、身份、行业模型和呈现渠道可替换。

## Repository layout / 仓库结构

| Location / 位置 | Purpose / 用途 |
| --- | --- |
| `packages/core/` | Pure manifest validation, composition, diagnostics, and explicit port invocation / 纯 manifest 校验、组合、诊断与显式 port 调用 |
| `packages/app-shell/` | Pure declarative application state projection, route gate, mock capability gate, and retry state / 纯声明式应用状态投影、route gate、mock capability gate 与 retry 状态 |
| `packages/adapter-runtime/` | Backend-agnostic injected read-adapter lifecycle, redaction, and bounded memory-cache policy / 后端无关的注入式 read-adapter lifecycle、脱敏与受限内存缓存策略 |
| `packages/capability-runtime/` | Explicit process-local capability install/enable/disable/uninstall, dependencies/conflicts, routing, and snapshots / 显式进程内能力安装/启用/停用/卸载、依赖/冲突、路由与 snapshot |
| `packages/adoption-runtime/` | Candidate-first complete-set reconciliation, bounded presentation, public receipts, and atomic in-memory implementation replacement / 候选优先完整集合协调、受限呈现、公开 receipt 与原子进程内实现替换 |
| `packages/app-integration/` | Application-template validation, exact slot/surface gating, adoption delegation, and fixed-primary-module shell bridge / 应用模板校验、精确 slot/surface 门禁、采用委托与固定主模块 shell bridge |
| `modules/example-catalog-query-detail/` | Deterministic neutral mock for catalog, query, detail, session, and route fixtures / 用于目录、查询、详情、session 与路由 fixture 的确定性中性 mock |
| `modules/example-reference-data/` | Deterministic neutral reference-option capability with explicit v1/v2 replacement fixtures / 带显式 v1/v2 替换 fixture 的确定性中性参考选项能力 |
| `templates/example-catalog-query-detail-mp-weixin/` | Private reusable application-template package that assembles complete explicit mock/wire candidates; not a generator or published app / 装配完整显式 mock/wire 候选的私有可复用应用模板包；不是生成器或已发布应用 |
| `apps/example-catalog-query-detail-mp-weixin/` | Representative UniApp Vue 3 `mp-weixin` slice consuming the template through a versioned app profile, with Node acceptance and controlled compilation / 通过版本化 app profile 消费模板、带 Node 验收与受控编译的代表性 UniApp Vue 3 `mp-weixin` 纵切 |
| `modules/` | Optional, independently scoped business capability modules / 可选、独立定界的业务能力模块 |
| `extensions/` | Explicit extension points and extension packages / 显式扩展点与扩展包 |
| `docs/` | Public architecture, contracts, API, and development documentation / 公开架构、契约、API 与开发文档 |

The current runnable boundary also contains a versioned application-template contract and generic application-integration runtime. The first private template package assembles complete explicit reference-data plus catalog candidates for either the mandatory mock or injected-wire fixture. The representative app validates its own profile, hands the explicit candidate to the integration runtime, and consumes the resulting fixed-primary-module shell without duplicating lifecycle/provider assembly. Pure Node acceptance exercises template validation, slot/surface gating, mock/wire integration, atomic replacement rollback, query, detail, back, empty/failure, and bounded observation; a controlled compiler verifies the explicit-SFC HIA-uView projection for `mp-weixin`. The template is reusable integration metadata and assembly, not a generator, copied scaffold, package installer, remote catalog, published app, or industry preset.

当前可运行边界还包含版本化 application-template 契约与通用 application-integration runtime。首个私有模板包为必备 mock 或 injected-wire fixture 装配完整显式 reference-data 加 catalog 候选。代表性 app 校验自身 profile，把显式候选交给 integration runtime，并消费生成的固定主模块 shell，不再重复 lifecycle/provider 装配。纯 Node 验收执行模板校验、slot/surface 门禁、mock/wire 集成、原子替换回退、query、detail、返回、empty/failure 与受限 observation；受控 compiler 校验 `mp-weixin` 的 HIA-uView 显式 SFC 导入投影。模板是可复用集成 metadata 与装配，而不是生成器、复制式脚手架、包安装器、远端目录、已发布应用或行业预置。

## Development / 开发

Requires Node.js 22 or later and npm 10 or later.

需要 Node.js 22 或更高版本，以及 npm 10 或更高版本。

```bash
npm test
```

`npm test` runs the workspace/ROP gates and deterministic Node contract fixtures. With dependencies already installed from the committed lockfile, it performs no install and does not create a lockfile. See the [adoption guide / 采用指南](docs/adoption.md), [migration guide / 迁移指南](docs/migration.md), [doctor reference / Doctor 参考](docs/doctor.md), [support guide / 支持与反馈](docs/support.md), [development notes / 开发说明](docs/development.md), [release-quality candidate / 发布质量候选](docs/quality.md), [architecture overview / 架构概览](docs/architecture.md), [representative slice contract / 代表性纵切契约](docs/contracts/representative-mp-weixin-slice.md), [application-template contract / 应用模板契约](docs/contracts/application-template.md), [contracts / 契约](docs/contracts/README.md), and [application-integration API / 应用集成 API](docs/api/app-integration.md).

`npm test` 运行 workspace/ROP 门禁和确定性 Node 契约 fixture。在已按 committed lockfile 安装依赖后，它不执行安装，也不创建 lockfile。详见[采用指南](docs/adoption.md)、[迁移指南](docs/migration.md)、[Doctor 参考](docs/doctor.md)、[支持与反馈](docs/support.md)、[开发说明](docs/development.md)、[发布质量候选](docs/quality.md)、[架构概览](docs/architecture.md)、[代表性纵切契约](docs/contracts/representative-mp-weixin-slice.md)、[应用模板契约](docs/contracts/application-template.md)、[契约](docs/contracts/README.md)和[应用集成 API](docs/api/app-integration.md)。

## License / 许可证

HIA-uView-Biz is licensed under the [MIT License](LICENSE). Future commercial modules or extensions may use their own declared licenses and notices; they must not change the license of this framework repository.

HIA-uView-Biz 使用 [MIT License](LICENSE)。未来商业模块或扩展可以拥有自身声明的许可证和 NOTICE；它们不得改变本框架仓库的许可证。
