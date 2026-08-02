# Async provider runtime / 异步 provider runtime

`@hia-uview/biz-async-provider-runtime` is a pure, private ESM package for an explicitly injected asynchronous project-provider boundary. It validates a declared source policy, returns a cancellable Promise handle, isolates plain data, and emits a bounded source envelope.

`@hia-uview/biz-async-provider-runtime` 是一个 pure、private ESM package，用于显式注入的异步项目 provider 边界。它校验声明式 source policy，返回可取消的 Promise handle，隔离 plain data，并输出受限 source envelope。

Read operations may use an explicitly declared source sequence and visibly degrade to a later injected source. A write operation selects one authority before it starts; timeout or cancellation after start never falls back to another source and never claims that no side effect occurred.

读取操作可使用显式声明的 source 序列，并可见地降级到后续注入 source。写操作在开始前选择一个 authority；启动后的 timeout 或取消绝不回退到其他 source，也不声称没有副作用。

The package opens no network and implements no HTTP, Directus, URL, credential, identity, persistent storage, dynamic discovery, real transaction, BP page, or business DTO. A caller supplies every source implementation in memory.

本 package 不打开网络，也不实现 HTTP、Directus、URL、credential、身份、持久 storage、动态发现、真实 transaction、BP 页面或业务 DTO。调用方在内存中提供每一个 source 实现。

See the [async-provider contract](../../docs/contracts/async-provider.md) and [API guide](../../docs/api/async-provider-runtime.md).

详见 [async-provider 契约](../../docs/contracts/async-provider.md)与 [API 指南](../../docs/api/async-provider-runtime.md)。
