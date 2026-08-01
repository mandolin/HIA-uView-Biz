# Transport-operation runtime API / Transport-operation runtime API

`@hia-uview/biz-transport-operation-runtime` is a pure ESM package for one selected adapter's static local read-operation dispatch. It validates an exact descriptor and a complete checked-in handler map, isolates adapter-private plain data, and exposes only a bounded local result plus count-only observation.

`@hia-uview/biz-transport-operation-runtime` 是供一个选定 adapter 的静态本地 read-operation dispatch 使用的纯 ESM package。它校验精确 descriptor 与完整 checked-in handler map，隔离 adapter-private plain data，并只暴露受限本地 result 加仅计数 observation。

## Exports / 导出

| Export / 导出 | Responsibility / 主责 |
| --- | --- |
| `TRANSPORT_OPERATION_CONTRACT_VERSION` | Fixed v1 descriptor/runtime contract version / 固定 v1 descriptor/runtime 契约版本 |
| `validateTransportOperationDescriptor(descriptor)` | Validates exact static descriptor shape, read operations, local-synchronous execution, and credential none / 校验精确静态 descriptor 形态、read operation、local-synchronous execution 与 credential none |
| `createStaticOperationTransport({ descriptor, handlers })` | Creates bounded `transport.invoke(operationId, input)` plus count-only `getObservation()` / 创建受限 `transport.invoke(operationId, input)` 加仅计数 `getObservation()` |

## Initialization / 初始化

The descriptor and initialization object have exact own data fields. The handler map is a plain object whose own data-property keys exactly equal the descriptor operation IDs and whose values are functions. The runtime snapshots handler references on successful initialization. It does not interpret JSON as code, discover handlers, load packages, or accept an optional fallback handler.

descriptor 与初始化对象具有精确自有 data 字段。handler map 是 plain object，其自有 data-property 键与 descriptor operation ID 精确相等，值为 function。runtime 在成功初始化时快照 handler reference。它不把 JSON 解释为代码、不发现 handler、不加载 package，也不接受 optional fallback handler。

Initialization failure returns only `{ ok: false, diagnostics }`; it contains no `transport` API. Diagnostics are bilingual stable code/message pairs and contain no descriptor body, handler, endpoint, credential, or source path.

初始化失败时只返回 `{ ok: false, diagnostics }`，不含 `transport` API。diagnostic 是中英双语稳定 code/message 对，不含 descriptor body、handler、endpoint、credential 或源码路径。

## Dispatch / Dispatch

`transport.invoke(operationId, input)` accepts a source-literal declared operation ID and adapter-private plain data. A successful result has `{ ok: true, outcome }`; `outcome` is a detached copy. Failure has `{ ok: false, failure }`, with only `transport-operation.operation-unavailable` or `transport-operation.input-invalid` local codes. The selected adapter must map failure inside its private exchange; it must never expose the envelope as a business port result.

`transport.invoke(operationId, input)` 接受源码字面已声明 operation ID 与 adapter-private plain data。成功结果为 `{ ok: true, outcome }`；`outcome` 是分离副本。失败为 `{ ok: false, failure }`，只使用 `transport-operation.operation-unavailable` 或 `transport-operation.input-invalid` 本地 code。选定 adapter 必须在其 private exchange 内映射 failure；不得把该 envelope 暴露为业务 port result。

Before handler invocation the runtime copies input. Before success return it copies the handler output. Accessor, sparse-array, cyclic/shared-reference, behavioral, unsupported, or throwing data causes a bounded local failure and never executes/returns a raw value through the adapter port.

runtime 在 handler 调用前复制 input，并在成功返回前复制 handler output。accessor、稀疏数组、循环/共享引用、带行为、不支持或抛错的数据都会导致受限本地 failure，且绝不会通过 adapter port 执行/返回 raw value。

## Limits / 限制

This package implements only synchronous instance-local read dispatch. It does not implement network I/O, HTTP vocabulary, backend SDK, identity/credential, storage, cache, async/Promise, retry, timeout, cancellation, command/write transport, persistence, dynamic loader, UI, telemetry export, deployment, or release.

本包只实现同步 instance-local read dispatch。它不实现 network I/O、HTTP 词汇、backend SDK、identity/credential、storage、cache、async/Promise、retry、timeout、cancellation、command/write transport、persistence、dynamic loader、UI、telemetry export、部署或发布。
