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
| `modules/example-catalog-query-detail/` | Deterministic neutral mock for catalog, query, detail, session, and route fixtures / 用于目录、查询、详情、session 与路由 fixture 的确定性中性 mock |
| `modules/example-reference-data/` | Deterministic neutral reference-option capability with explicit v1/v2 replacement fixtures / 带显式 v1/v2 替换 fixture 的确定性中性参考选项能力 |
| `apps/example-catalog-query-detail-mp-weixin/` | Representative UniApp Vue 3 `mp-weixin` slice with versioned profile, explicit mock/wire source, lifecycle-to-shell bridge, Node acceptance, and controlled compilation / 带版本 profile、显式 mock/wire source、lifecycle-to-shell bridge、Node 验收与受控编译的代表性 UniApp Vue 3 `mp-weixin` 纵切 |
| `modules/` | Optional, independently scoped business capability modules / 可选、独立定界的业务能力模块 |
| `extensions/` | Explicit extension points and extension packages / 显式扩展点与扩展包 |
| `docs/` | Public architecture, contracts, API, and development documentation / 公开架构、契约、API 与开发文档 |

The current runnable boundary contains a pure Node ESM core, an owned deterministic mock, a pure application shell, a backend-agnostic adapter runtime with one injected local wire fixture, an explicit process-local capability lifecycle, and a candidate-first adoption runtime. The first composed set adds neutral reference-data to catalog-query-detail, validates complete desired sets and bounded presentation, enables dependencies deterministically, and replaces an explicitly supplied implementation by switching only a fully valid in-memory candidate. The representative app explicitly installs and enables reference-data before its selected catalog mock or wire fixture, bridges enabled catalog invocation into shell, and projects only registered compiled blocks. Pure Node acceptance exercises query, detail, back, empty/failure, lifecycle, adoption, disablement, conflict, replacement rollback, and bounded observation; a controlled compiler verifies the explicit-SFC HIA-uView projection for `mp-weixin`. It does not discover or install packages, execute lifecycle/migration hooks, persist capability state, or connect to a real backend, storage, real identity provider, production data, or published HIA-uView package.

当前可运行边界包含纯 Node ESM core、自有确定性 mock、纯应用 shell、带一个注入式本地 wire fixture 的 backend-agnostic adapter runtime、显式进程内 capability lifecycle，以及候选优先 adoption runtime。首个组合集合为 catalog-query-detail 增加中性 reference-data，校验完整期望集合与受限呈现，以确定性顺序启用依赖，并通过只切换完全合法进程内候选来替换显式提供的实现。代表性 app 会在所选 catalog mock 或 wire fixture 前显式安装并启用 reference-data，把已启用 catalog 调用桥接给 shell，并且只投影已登记的已编译区块。纯 Node 验收执行 query、detail、返回、empty/failure、lifecycle、adoption、停用、冲突、替换回退与受限 observation；受控 compiler 校验 `mp-weixin` 的 HIA-uView 显式 SFC 导入投影。它不发现或安装包、不执行 lifecycle/migration hook、不持久化能力状态，也不连接真实后端、storage、真实身份提供方、生产数据或已发布 HIA-uView 包。

## Development / 开发

Requires Node.js 22 or later and npm 10 or later.

需要 Node.js 22 或更高版本，以及 npm 10 或更高版本。

```bash
npm test
```

`npm test` runs the workspace/ROP gates and deterministic Node contract fixtures. With dependencies already installed from the committed lockfile, it performs no install and does not create a lockfile. See the [development notes / 开发说明](docs/development.md), [architecture overview / 架构概览](docs/architecture.md), [representative slice contract / 代表性纵切契约](docs/contracts/representative-mp-weixin-slice.md), [contracts / 契约](docs/contracts/README.md), [core API / core API](docs/api/core.md), [application-shell API / 应用 shell API](docs/api/app-shell.md), [adapter-runtime API / Adapter runtime API](docs/api/adapter-runtime.md), [capability-runtime API / 能力 runtime API](docs/api/capability-runtime.md), and [adoption-runtime API / 采用 runtime API](docs/api/adoption-runtime.md).

`npm test` 运行 workspace/ROP 门禁和确定性 Node 契约 fixture。在已按 committed lockfile 安装依赖后，它不执行安装，也不创建 lockfile。详见[开发说明](docs/development.md)、[架构概览](docs/architecture.md)、[代表性纵切契约](docs/contracts/representative-mp-weixin-slice.md)、[契约](docs/contracts/README.md)、[core API](docs/api/core.md)、[应用 shell API](docs/api/app-shell.md)、[adapter-runtime API](docs/api/adapter-runtime.md)、[能力 runtime API](docs/api/capability-runtime.md)和[采用 runtime API](docs/api/adoption-runtime.md)。

## License / 许可证

HIA-uView-Biz is licensed under the [MIT License](LICENSE). Future commercial modules or extensions may use their own declared licenses and notices; they must not change the license of this framework repository.

HIA-uView-Biz 使用 [MIT License](LICENSE)。未来商业模块或扩展可以拥有自身声明的许可证和 NOTICE；它们不得改变本框架仓库的许可证。
