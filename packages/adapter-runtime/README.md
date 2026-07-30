# Adapter runtime / Adapter runtime

`@hia-uview/biz-adapter-runtime` is a private, pure ESM package for validating one explicit read-adapter declaration and projecting an injected exchange through request validation, wire conversion, failure redaction, and optional process-local memory cache.

`@hia-uview/biz-adapter-runtime` 是一个 private、纯 ESM package，用于校验一个显式 read-adapter declaration，并将注入的 exchange 经过 request validation、wire conversion、failure redaction 与可选进程内内存缓存投影为 port provider。

It performs no network, environment, file, storage, identity, credential, package-discovery, dynamic-import, Directus, or UI operation. The initial transport mode is `injected-fixture`, the only credential mode is `none`, and memory cache accepts only bounded TTL values.

它不执行网络、环境、文件、storage、identity、credential、package discovery、动态 import、Directus 或 UI 操作。初始 transport mode 是 `injected-fixture`，唯一 credential mode 是 `none`，内存缓存只接受受限 TTL。

See the [adapter boundary contract](../../docs/contracts/adapter-boundary.md) and [ADR-0003](../../docs/adr/ADR-0003-adapter-session-and-cache-boundary.md).

详见 [adapter 边界契约](../../docs/contracts/adapter-boundary.md)与 [ADR-0003](../../docs/adr/ADR-0003-adapter-session-and-cache-boundary.md)。
