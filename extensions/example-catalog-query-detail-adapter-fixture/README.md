# Catalog-query-detail adapter fixture / 目录—查询—详情 Adapter fixture

`@hia-uview/biz-example-catalog-query-detail-adapter-fixture` is a private, deterministic implementation package for the neutral `example.catalog-query-detail` module. It injects local query/detail wire exchanges, converts them to the existing canonical contracts, provides the existing mock session shape, and optionally enables a bounded query memory cache.

`@hia-uview/biz-example-catalog-query-detail-adapter-fixture` 是中性 `example.catalog-query-detail` module 的 private、确定性 implementation package。它注入本地 query/detail wire exchange，将其转换为现有 canonical contract，提供现有 mock session shape，并可选择启用受限 query 内存缓存。

The fixture performs no network, environment, file, storage, credential, identity-provider, Directus, dynamic-import, UI, or route operation. Its wire fields and entries are independently written neutral test data and are not copied from a backend or business project.

该 fixture 不执行网络、环境、文件、storage、credential、identity provider、Directus、动态 import、UI 或 route 操作。其 wire 字段与 entry 是独立编写的中性测试数据，并非从后端或业务项目复制。

See the [adapter boundary contract](../../docs/contracts/adapter-boundary.md) for ownership, conversion, failure-redaction, pagination, session, and cache rules.

主责、转换、failure 脱敏、分页、会话与缓存规则见 [adapter 边界契约](../../docs/contracts/adapter-boundary.md)。
