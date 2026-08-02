# Provider-port runtime / Provider-port runtime

`@hia-uview/biz-provider-port-runtime` is a pure, private ESM package for explicit consumer-owned provider ports. It validates versioned declarations and a complete provider map, then isolates plain-data calls for `session`, optional `storage`, `read`, and `write` ports.

`@hia-uview/biz-provider-port-runtime` 是一个 pure、private ESM package，用于显式的业务项目自有 provider port。它校验版本化 declaration 与完整 provider map，并为 `session`、可选 `storage`、`read`、`write` port 隔离 plain-data 调用。

The runtime provides no network, HTTP, Directus, token, identity acquisition, persistent storage, dynamic discovery, async lifecycle, or rollback protocol. A write provider can report only the bounded local rollback state it owns; `completed` is not a database or distributed-transaction claim.

runtime 不提供网络、HTTP、Directus、token、身份获取、持久 storage、动态发现、异步生命周期或 rollback protocol。write provider 只能报告自己拥有的受限本地 rollback 状态；`completed` 不代表数据库或分布式事务回退。

See the [provider-port contract](../../docs/contracts/provider-port.md) and [API guide](../../docs/api/provider-port-runtime.md).

详见 [provider-port 契约](../../docs/contracts/provider-port.md)与 [API 指南](../../docs/api/provider-port-runtime.md)。
