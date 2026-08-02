# Provider-port runtime API / Provider-port runtime API

## `validateProviderPortDeclaration`

Validates one versioned consumer-owned provider declaration without invoking provider code or reading external state.

校验一份版本化 consumer-owned provider declaration，不调用 provider code，也不读取外部状态。

## `validateProviderPortDeclarations`

Validates a non-empty declaration set and rejects duplicate `providerId` or `portId` values.

校验非空 declaration 集合，并拒绝重复的 `providerId` 或 `portId`。

## `createProviderPortHost`

Creates a host only when declarations and the exact provider map pass validation. The returned `host.invoke(portId, input)` copies input, calls only the explicitly injected provider, redacts exceptions and unsafe output, and returns isolated success/failure results. `host.getObservation()` returns count-only local evidence.

只有 declarations 与 exact provider map 通过校验时才创建 host。返回的 `host.invoke(portId, input)` 会复制 input，只调用显式注入 provider，脱敏异常和不安全 output，并返回隔离的 success/failure 结果。`host.getObservation()` 返回仅计数的本地证据。

The package owns no canonical module field semantics. A consumer-owned provider or selected adapter must map its own canonical request/result before crossing this host.

该 package 不拥有 canonical module 字段语义。consumer-owned provider 或 selected adapter 必须在跨越 host 前完成自己的 canonical request/result mapping。
