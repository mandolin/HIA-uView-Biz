# HIA-uView-Biz

HIA-uView-Biz is a configurable, capability-composed business framework for UniApp applications. It starts with mini-program-oriented contracts while keeping backend, identity, industry model, and presentation channel replaceable.

HIA-uView-Biz 是可配置、按能力组合的 UniApp 业务框架。它从面向小程序的契约开始，同时保持后端、身份、行业模型和呈现渠道可替换。

## Repository layout / 仓库结构

| Location / 位置 | Purpose / 用途 |
| --- | --- |
| `packages/core/` | Pure manifest validation, composition, diagnostics, and explicit port invocation / 纯 manifest 校验、组合、诊断与显式 port 调用 |
| `modules/example-catalog-query-detail/` | Deterministic neutral mock for catalog, query, detail, session, and route fixtures / 用于目录、查询、详情、session 与路由 fixture 的确定性中性 mock |
| `modules/` | Optional, independently scoped business capability modules / 可选、独立定界的业务能力模块 |
| `extensions/` | Explicit extension points and extension packages / 显式扩展点与扩展包 |
| `docs/` | Public architecture, contracts, API, and development documentation / 公开架构、契约、API 与开发文档 |

The current runnable boundary is a pure Node ESM core plus an owned deterministic mock. It validates explicitly supplied declarations and invokes explicitly registered ports; it does not connect to a backend, storage, identity provider, UI framework, UniApp runtime, or HIA-uView package.

当前可运行边界是纯 Node ESM core 加自有确定性 mock。它校验显式传入的声明并调用显式登记的 port；它不连接后端、存储、身份提供方、UI 框架、UniApp runtime 或 HIA-uView 包。

## Development / 开发

Requires Node.js 22 or later and npm 10 or later.

需要 Node.js 22 或更高版本，以及 npm 10 或更高版本。

```bash
npm test
```

`npm test` runs the workspace/ROP gates and the deterministic contract fixture. It installs no dependency and does not create a lockfile. See the [development notes / 开发说明](docs/development.md), [architecture overview / 架构概览](docs/architecture.md), [contracts / 契约](docs/contracts/README.md), and [core API / core API](docs/api/core.md).

`npm test` 运行 workspace/ROP 门禁和确定性契约 fixture。它不安装依赖，也不创建 lockfile。详见[开发说明](docs/development.md)、[架构概览](docs/architecture.md)、[契约](docs/contracts/README.md)和 [core API](docs/api/core.md)。

## License / 许可证

HIA-uView-Biz is licensed under the [MIT License](LICENSE). Future commercial modules or extensions may use their own declared licenses and notices; they must not change the license of this framework repository.

HIA-uView-Biz 使用 [MIT License](LICENSE)。未来商业模块或扩展可以拥有自身声明的许可证和 NOTICE；它们不得改变本框架仓库的许可证。
