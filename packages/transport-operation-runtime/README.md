# Transport-operation runtime / Transport-operation runtime

`@hia-uview/biz-transport-operation-runtime` is a pure Node boundary for reviewed static local operation dispatch used by a selected Biz adapter. It validates a versioned descriptor and a complete handler map, then isolates adapter-private plain-data input and output for one declared `read` operation.

`@hia-uview/biz-transport-operation-runtime` 是供选定 Biz adapter 使用的、已审阅静态本地 operation dispatch 的 pure Node 边界。它校验版本化 descriptor 与完整 handler map，再为一个已声明的 `read` operation 隔离 adapter-private plain-data 输入与输出。

It owns neither canonical module conversion nor business failure semantics. A selected adapter owns canonical-to-wire mapping, calls this runtime with one literal declared operation ID, converts its private outcome, and maps local transport failure to the existing canonical adapter failure.

它不拥有 canonical module 转换或业务 failure 语义。选定 adapter 拥有 canonical-to-wire mapping，以一个字面已声明 operation ID 调用本 runtime，转换其 private outcome，并把本地 transport failure 映射为既有 canonical adapter failure。

The first contract permits only `local-synchronous` execution, `credential.mode: "none"`, exact static descriptor fields, and a complete checked-in handler map. It performs no network, HTTP, Directus, URL, endpoint, header, token, identity, storage, async, retry, timeout, cancellation, dynamic loading, command transport, or persistence.

首个契约只允许 `local-synchronous` execution、`credential.mode: "none"`、精确静态 descriptor 字段与完整 checked-in handler map。它不执行 network、HTTP、Directus、URL、endpoint、header、token、identity、storage、async、retry、timeout、cancellation、dynamic loading、command transport 或 persistence。

See [the public contract](../../docs/contracts/transport-operation.md) for descriptor, failure, and ownership rules.

descriptor、failure 与主责规则见[公开契约](../../docs/contracts/transport-operation.md)。
