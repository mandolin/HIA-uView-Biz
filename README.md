# HIA-uView-Biz

HIA-uView-Biz is a configurable, capability-composed business framework for UniApp applications. It starts with mini-program-oriented contracts while keeping backend, identity, industry model, and presentation channel replaceable.

HIA-uView-Biz 是可配置、按能力组合的 UniApp 业务框架。它从面向小程序的契约开始，同时保持后端、身份、行业模型和呈现渠道可替换。

## Repository layout / 仓库结构

| Location / 位置 | Purpose / 用途 |
| --- | --- |
| `packages/core/` | Pure manifest validation, composition, diagnostics, and explicit port invocation / 纯 manifest 校验、组合、诊断与显式 port 调用 |
| `packages/app-shell/` | Pure declarative application state projection, route gate, mock capability gate, and retry state / 纯声明式应用状态投影、route gate、mock capability gate 与 retry 状态 |
| `modules/example-catalog-query-detail/` | Deterministic neutral mock for catalog, query, detail, session, and route fixtures / 用于目录、查询、详情、session 与路由 fixture 的确定性中性 mock |
| `apps/example-catalog-query-detail-mp-weixin/` | Controlled compile-only UniApp Vue 3 `mp-weixin` integration fixture / 受控的仅编译 UniApp Vue 3 `mp-weixin` 集成 fixture |
| `modules/` | Optional, independently scoped business capability modules / 可选、独立定界的业务能力模块 |
| `extensions/` | Explicit extension points and extension packages / 显式扩展点与扩展包 |
| `docs/` | Public architecture, contracts, API, and development documentation / 公开架构、契约、API 与开发文档 |

The current runnable boundary contains a pure Node ESM core, an owned deterministic mock, and a pure application shell. A separate controlled fixture compiles the neutral catalog-query-detail projection through named HIA-uView UI imports for `mp-weixin`. It validates explicitly supplied declarations and invokes explicitly registered ports; it does not connect to a backend, storage, real identity provider, production data, or published HIA-uView package.

当前可运行边界包含纯 Node ESM core、自有确定性 mock 和纯应用 shell。独立的受控 fixture 通过命名 HIA-uView UI 导入，为 `mp-weixin` 编译中性目录—查询—详情投影。它校验显式传入的声明并调用显式登记的 port；它不连接后端、真实身份提供方、生产数据或已发布 HIA-uView 包。

## Development / 开发

Requires Node.js 22 or later and npm 10 or later.

需要 Node.js 22 或更高版本，以及 npm 10 或更高版本。

```bash
npm test
```

`npm test` runs the workspace/ROP gates and deterministic Node contract fixtures. With dependencies already installed from the committed lockfile, it performs no install and does not create a lockfile. See the [development notes / 开发说明](docs/development.md), [architecture overview / 架构概览](docs/architecture.md), [contracts / 契约](docs/contracts/README.md), [core API / core API](docs/api/core.md), and [application-shell API / 应用 shell API](docs/api/app-shell.md).

`npm test` 运行 workspace/ROP 门禁和确定性 Node 契约 fixture。在已按 committed lockfile 安装依赖后，它不执行安装，也不创建 lockfile。详见[开发说明](docs/development.md)、[架构概览](docs/architecture.md)、[契约](docs/contracts/README.md)、[core API](docs/api/core.md)和[应用 shell API](docs/api/app-shell.md)。

## License / 许可证

HIA-uView-Biz is licensed under the [MIT License](LICENSE). Future commercial modules or extensions may use their own declared licenses and notices; they must not change the license of this framework repository.

HIA-uView-Biz 使用 [MIT License](LICENSE)。未来商业模块或扩展可以拥有自身声明的许可证和 NOTICE；它们不得改变本框架仓库的许可证。
