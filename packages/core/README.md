# HIA-uView-Biz Core

`@hia-uview/biz-core` is a pure ESM composition package. It validates explicitly supplied business-module and implementation-package manifests, checks restricted profile and port relations, and returns either diagnostics or an I/O-free composition invocation surface.

`@hia-uview/biz-core` 是纯 ESM 组合包。它校验显式传入的业务模块与实现包 manifest，检查受限 profile 和 port 关系，并返回诊断或无 I/O 的 composition 调用面。

## Public API / 公开 API

| Export / 导出 | Responsibility / 主责 |
| --- | --- |
| `BIZ_CONTRACT_VERSION` | The only manifest/port contract version implemented by the current core / 当前 core 实现的唯一 manifest/port 契约版本 |
| `BUSINESS_MODULE_KIND`, `IMPLEMENTATION_PACKAGE_KIND` | Stable manifest kind identifiers / 稳定的 manifest kind 标识 |
| `validateManifestPair(input)` | Validates the current minimum manifest shapes and module-to-implementation correspondence / 校验当前最小 manifest 形状及模块—实现包对应关系 |
| `assembleComposition(input)` | Validates profile/configuration/port relations and returns an explicit `invoke(portId, input)` boundary only on success / 校验 profile/配置/port 关系，并只在成功时返回显式 `invoke(portId, input)` 边界 |

See [core API details / core API 详情](../../docs/api/core.md).

详见 [core API 详情](../../docs/api/core.md)。

## Boundary / 边界

The core accepts already parsed in-memory declarations. It does not read JSON or YAML files, implement the complete JSON Schema Draft 7 specification, discover packages, load remote configuration, execute scripts, access the network, transform HTTP envelopes, handle tokens, or own route paths.

core 接受已解析的内存声明。它不读取 JSON 或 YAML 文件、不实现完整 JSON Schema Draft 7 规范、不发现包、不加载远程配置、不执行脚本、不访问网络、不转换 HTTP envelope、不处理 token，也不拥有路由路径。
