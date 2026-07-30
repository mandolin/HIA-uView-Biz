# Application shell / 应用 shell

`@hia-uview/biz-app-shell` is a pure ESM state projection for a Biz application. It accepts an already assembled composition, a declarative route projection, and an explicit mock screen-capability policy. It returns observable catalog/detail state and canonical failures without importing Vue or UniApp.

`@hia-uview/biz-app-shell` 是 Biz 应用的纯 ESM 状态投影。它接收已装配 composition、声明式 route projection 与显式 mock screen-capability policy；它返回可观察的目录/详情状态和规范化 failure，不导入 Vue 或 UniApp。

## API / API

Use `createApplicationShell({ composition, routeProjection, screenCapabilityPolicy })`. A successful result contains a shell with `getSnapshot()`, `query(request)`, `selectEntry(entryId)`, `navigate(actionId, input)`, `showCatalog()`, and `retry()`.

使用 `createApplicationShell({ composition, routeProjection, screenCapabilityPolicy })`。成功结果包含一个 shell，提供 `getSnapshot()`、`query(request)`、`selectEntry(entryId)`、`navigate(actionId, input)`、`showCatalog()` 和 `retry()`。

The detailed contract, diagnostics, and deliberate limits are in the [application-shell API document / 应用 shell API 文档](../../docs/api/app-shell.md).

详细契约、diagnostics 与刻意限制见[应用 shell API 文档](../../docs/api/app-shell.md)。

## Boundary / 边界

The shell owns neither component rendering nor platform navigation. It creates no URL, router history, `uni.navigate*` call, storage, real identity integration, token/cookie handling, HTTP request, backend adapter, dynamic import, or executable configuration.

shell 不拥有组件渲染或平台导航。它不创建 URL、router history、`uni.navigate*` 调用、storage、真实身份集成、token/cookie 处理、HTTP 请求、后端 adapter、动态 import 或可执行配置。

The first fixture treats capability only as an explicit mock string allowlist. It is not a role model, account system, WeChat login, enterprise identity protocol, or production authorization implementation.

首个 fixture 只把 capability 作为显式 mock 字符串 allowlist。它不是角色模型、账户系统、微信登录、企业身份协议或生产授权实现。
