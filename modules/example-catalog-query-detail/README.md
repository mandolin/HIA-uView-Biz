# Catalog-query-detail example / 目录—查询—详情示例

`@hia-uview/biz-example-catalog-query-detail` is a private, fixture-only ESM package. It provides deterministic local behavior for the neutral `example.catalog-query-detail` capability and its `entry` object.

`@hia-uview/biz-example-catalog-query-detail` 是私有、仅供 fixture 使用的 ESM 包。它为中性 `example.catalog-query-detail` 能力及其 `entry` 对象提供确定性的本地行为。

## Exports / 导出

| Export / 导出 | Responsibility / 主责 |
| --- | --- |
| `createExampleManifests()` | Returns new business-module, implementation-package, and restricted profile declarations / 返回新的业务模块、实现包与受限 profile 声明 |
| `createCatalogQueryDetailMock(options)` | Returns explicit query/detail/acknowledge/session port providers, route projection, and route-action resolver / 返回显式 query/detail/acknowledge/session port provider、路由投影和路由 action 解析器 |
| `createEntryAcknowledgementMockTransaction(options)` | Returns isolated deterministic acknowledgement invoke/snapshot API for contract evidence / 返回用于契约证据的隔离确定性确认 invoke/snapshot API |

The supported fixture cases are `first-page`, `last-page`, `empty-query`, `adapter-failure`, and `detail-section-failure`. Invalid query, mock session, and catalog-to-detail route behavior are deterministic parts of those cases.

支持的 fixture 情形为 `first-page`、`last-page`、`empty-query`、`adapter-failure` 和 `detail-section-failure`。无效 query、mock session 与目录到详情的 route 行为是这些情形中的确定性组成部分。

## Boundary / 边界

The package owns only neutral test entries, canonical fixture results, and one instance-local acknowledgement transaction. It reads no network, file, environment variable, storage, account, token, cookie, backend envelope, Directus collection, UI component, or HIA-uView dependency.

本包只拥有中性测试 entry、规范化 fixture 结果和一个 instance-local 确认事务。它不读取网络、文件、环境变量、存储、账户、token、cookie、后端 envelope、Directus collection、UI 组件或 HIA-uView 依赖。

The business-module manifest declares `example.reference-data` as a dependency for declared filter-option readiness. The package does not import or call a reference-data implementation directly; the application lifecycle or adoption runtime must explicitly provide and enable that capability first.

业务模块 manifest 将 `example.reference-data` 声明为依赖，用于准备已声明 filter option。本包不直接 import 或调用 reference-data 实现；应用 lifecycle 或 adoption runtime 必须先显式提供并启用该能力。

See the [public example contract / 公开示例契约](../../docs/contracts/catalog-query-detail.md) and [acknowledgement command contract / 确认命令契约](../../docs/contracts/entry-acknowledgement.md).

详见[公开示例契约](../../docs/contracts/catalog-query-detail.md)与[确认命令契约](../../docs/contracts/entry-acknowledgement.md)。
