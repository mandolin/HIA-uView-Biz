# Core API / Core API

`@hia-uview/biz-core` is a pure ESM package for explicit composition. Every function consumes caller-supplied in-memory values and returns a structured result or throws only for an invocation of a port that was not registered by a successful composition.

`@hia-uview/biz-core` 是用于显式组合的纯 ESM 包。每个函数消费调用方提供的内存值，并返回结构化结果；只有调用成功 composition 未登记的 port 时才会抛出异常。

## Constants / 常量

| Export / 导出 | Meaning / 含义 |
| --- | --- |
| `BIZ_CONTRACT_VERSION` | The only manifest/port version implemented by the current core / 当前 core 实现的唯一 manifest/port 版本 |
| `BUSINESS_MODULE_KIND` | The stable `business-module` kind / 稳定的 `business-module` kind |
| `IMPLEMENTATION_PACKAGE_KIND` | The stable `implementation-package` kind / 稳定的 `implementation-package` kind |

## `validateManifestPair(input)`

Pass an object containing `businessModule` and `implementationPackage`. The function checks the current core's minimum object shape, kind, version, IDs, required port declaration container, configuration container, implementation `provides` container, and module-to-implementation correspondence.

传入一个包含 `businessModule` 与 `implementationPackage` 的对象。该函数检查当前 core 的最小对象形状、kind、版本、ID、required port 声明容器、配置容器、实现包 `provides` 容器以及模块—实现包对应关系。

It returns `{ ok, diagnostics }`. Each diagnostic has a stable `code` and bilingual `message`; neither raw input nor backend wire data is included.

它返回 `{ ok, diagnostics }`。每个 diagnostic 都有稳定 `code` 与双语 `message`；其中不包含原始输入或后端 wire 数据。

## `assembleComposition(input)`

Pass `businessModule`, `implementationPackage`, `profile`, and `portProviders`. In addition to pair validation, the function checks that the profile explicitly selects the module and implementation, selects only registered blocks and visibility conditions, satisfies dependencies, avoids conflicts, keeps route actions between registered screens, and supplies every required port with the same contract.

传入 `businessModule`、`implementationPackage`、`profile` 与 `portProviders`。除 pair 校验外，该函数还检查 profile 是否显式选择模块和实现包、是否只选择已登记 block 与可见性条件、是否满足依赖、是否避免冲突、是否使 route action 位于已登记 screen 之间，以及是否以同一 contract 提供每个 required port。

On success it returns `{ ok: true, diagnostics: [], composition }`. `composition.invoke(portId, input)` delegates unchanged input to the explicitly registered provider and returns that provider's canonical result or failure. An unknown port throws `RangeError` without including the payload.

成功时它返回 `{ ok: true, diagnostics: [], composition }`。`composition.invoke(portId, input)` 将未改写的输入委托给显式登记 provider，并返回该 provider 的规范化结果或 failure。未知 port 会抛出不包含 payload 的 `RangeError`。

## Deliberate limits / 刻意限制

The core does not load files, parse JSON/YAML, implement all JSON Schema Draft 7 keywords, discover packages, run scripts, dynamic-import modules, connect HTTP/Directus, inject credentials, persist data, interpret URLs, or render UI. Those are separate concerns that require their own explicit contracts and validation.

core 不加载文件、不解析 JSON/YAML、不实现所有 JSON Schema Draft 7 keyword、不发现包、不运行脚本、不动态 import 模块、不连接 HTTP/Directus、不注入凭据、不持久化数据、不解释 URL，也不渲染 UI。这些是需要各自显式契约与验证的独立关注点。

For a runnable neutral fixture, see the [catalog-query-detail example](../contracts/catalog-query-detail.md) and its [module package](../../modules/example-catalog-query-detail/README.md).

如需可运行的中性 fixture，请参阅[目录—查询—详情示例](../contracts/catalog-query-detail.md)及其[模块包](../../modules/example-catalog-query-detail/README.md)。
