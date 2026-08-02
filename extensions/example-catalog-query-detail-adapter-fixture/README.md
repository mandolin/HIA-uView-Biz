# Catalog-query-detail adapter fixture / 目录—查询—详情 Adapter fixture

`@hia-uview/biz-example-catalog-query-detail-adapter-fixture` is a private, deterministic implementation package for the neutral `example.catalog-query-detail` module. It maps canonical query/detail to local wire, dispatches only two literal declared read operations through a static local transport-operation runtime, converts outcomes to existing canonical contracts, provides the existing mock session shape, and optionally enables a bounded query memory cache.

`@hia-uview/biz-example-catalog-query-detail-adapter-fixture` 是中性 `example.catalog-query-detail` module 的 private、确定性 implementation package。它把 canonical query/detail 映射为本地 wire，通过静态本地 transport-operation runtime 只 dispatch 两个字面已声明 read operation，再将 outcome 转换为现有 canonical contract，提供现有 mock session shape，并可选择启用受限 query 内存缓存。

The fixture performs no network, HTTP, URL, endpoint, environment, file, storage, credential, identity-provider, Directus, async/retry/timeout/cancellation, command transport, dynamic-import, UI, or route operation. Its wire fields and entries are independently written neutral test data and are not copied from a backend or business project.

该 fixture 不执行网络、HTTP、URL、endpoint、环境、文件、storage、credential、identity provider、Directus、async/retry/timeout/cancellation、command transport、动态 import、UI 或 route 操作。其 wire 字段与 entry 是独立编写的中性测试数据，并非从后端或业务项目复制。

## Bounded asynchronous query seam / 受限异步查询 seam

The subpath `@hia-uview/biz-example-catalog-query-detail-adapter-fixture/async-query-fixture` is a deliberately small, project-oriented adapter seam for the later asynchronous-provider contract. It accepts only an explicitly supplied in-memory source policy/provider map (or its checked-in local default), maps a safe runtime terminal envelope to a canonical catalog page or canonical provider failure, and exposes only public source metadata. It is not registered in the existing synchronous core, does not alter provider-port v1, and does not make the example application asynchronous.

子路径 `@hia-uview/biz-example-catalog-query-detail-adapter-fixture/async-query-fixture` 是面向后续异步 provider 契约、有意保持很小的项目适配器 seam。它只接受显式提供的内存 source policy/provider map（或仓内 local 默认值），把安全 runtime terminal envelope 映射为 canonical 目录页或 canonical provider failure，并仅公开允许的 source metadata。它不注册到既有同步 core、不改变 provider-port v1，也不令示例应用变为异步。

See the [adapter boundary contract](../../docs/contracts/adapter-boundary.md) and [static transport-operation contract](../../docs/contracts/transport-operation.md) for ownership, conversion, local dispatch, failure-redaction, pagination, session, and cache rules.

主责、转换、本地 dispatch、failure 脱敏、分页、会话与缓存规则见 [adapter 边界契约](../../docs/contracts/adapter-boundary.md)与[静态 transport-operation 契约](../../docs/contracts/transport-operation.md)。
