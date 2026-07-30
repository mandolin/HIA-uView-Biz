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
| `modules/example-catalog-query-detail/` | Deterministic neutral mock for catalog, query, detail, session, and route fixtures / 用于目录、查询、详情、session 与路由 fixture 的确定性中性 mock |
| `apps/example-catalog-query-detail-mp-weixin/` | Representative UniApp Vue 3 `mp-weixin` slice with versioned profile, explicit mock/wire source, lifecycle-to-shell bridge, Node acceptance, and controlled compilation / 带版本 profile、显式 mock/wire source、lifecycle-to-shell bridge、Node 验收与受控编译的代表性 UniApp Vue 3 `mp-weixin` 纵切 |
| `modules/` | Optional, independently scoped business capability modules / 可选、独立定界的业务能力模块 |
| `extensions/` | Explicit extension points and extension packages / 显式扩展点与扩展包 |
| `docs/` | Public architecture, contracts, API, and development documentation / 公开架构、契约、API 与开发文档 |

The current runnable boundary contains a pure Node ESM core, an owned deterministic mock, a pure application shell, a backend-agnostic adapter runtime with one injected local wire fixture, and an explicit process-local capability lifecycle runtime. The representative app validates a versioned declarative profile, selects the wire fixture or mandatory mock explicitly without fallback, installs and enables the selected unit, bridges enabled invocation into shell, and projects only registered compiled blocks. Pure Node acceptance exercises query, detail, back, empty/failure, lifecycle, and bounded observation; a controlled compiler verifies the explicit-SFC HIA-uView projection for `mp-weixin`. It does not discover or install packages, execute lifecycle hooks, persist capability state, or connect to a real backend, storage, real identity provider, production data, or published HIA-uView package.

当前可运行边界包含纯 Node ESM core、自有确定性 mock、纯应用 shell、带一个注入式本地 wire fixture 的 backend-agnostic adapter runtime，以及显式进程内 capability lifecycle runtime。代表性 app 校验带版本声明式 profile，显式且无回退地选择 wire fixture 或必备 mock，安装并启用所选单元，将已启用调用桥接给 shell，并且只投影已登记的已编译区块。纯 Node 验收执行 query、detail、返回、empty/failure、lifecycle 与受限 observation；受控 compiler 校验 `mp-weixin` 的 HIA-uView 显式 SFC 导入投影。它不发现或安装包、不执行 lifecycle hook、不持久化能力状态，也不连接真实后端、storage、真实身份提供方、生产数据或已发布 HIA-uView 包。

## Development / 开发

Requires Node.js 22 or later and npm 10 or later.

需要 Node.js 22 或更高版本，以及 npm 10 或更高版本。

```bash
npm test
```

`npm test` runs the workspace/ROP gates and deterministic Node contract fixtures. With dependencies already installed from the committed lockfile, it performs no install and does not create a lockfile. See the [development notes / 开发说明](docs/development.md), [architecture overview / 架构概览](docs/architecture.md), [representative slice contract / 代表性纵切契约](docs/contracts/representative-mp-weixin-slice.md), [contracts / 契约](docs/contracts/README.md), [core API / core API](docs/api/core.md), [application-shell API / 应用 shell API](docs/api/app-shell.md), [adapter-runtime API / Adapter runtime API](docs/api/adapter-runtime.md), and [capability-runtime API / 能力 runtime API](docs/api/capability-runtime.md).

`npm test` 运行 workspace/ROP 门禁和确定性 Node 契约 fixture。在已按 committed lockfile 安装依赖后，它不执行安装，也不创建 lockfile。详见[开发说明](docs/development.md)、[架构概览](docs/architecture.md)、[代表性纵切契约](docs/contracts/representative-mp-weixin-slice.md)、[契约](docs/contracts/README.md)、[core API](docs/api/core.md)、[应用 shell API](docs/api/app-shell.md)、[adapter-runtime API](docs/api/adapter-runtime.md)和[能力 runtime API](docs/api/capability-runtime.md)。

## License / 许可证

HIA-uView-Biz is licensed under the [MIT License](LICENSE). Future commercial modules or extensions may use their own declared licenses and notices; they must not change the license of this framework repository.

HIA-uView-Biz 使用 [MIT License](LICENSE)。未来商业模块或扩展可以拥有自身声明的许可证和 NOTICE；它们不得改变本框架仓库的许可证。
