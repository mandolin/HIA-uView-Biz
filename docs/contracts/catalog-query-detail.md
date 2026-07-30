# Catalog-query-detail contract / 目录—查询—详情契约

This document defines the first neutral contract example for the module identifier `example.catalog-query-detail`. Its object is always called `entry`. The contract proves composition boundaries with deterministic fixtures; it is not an industry module, a production API, a backend adapter, or a UI implementation.

本文档定义模块标识 `example.catalog-query-detail` 的首个中性契约示例。其对象始终称为 `entry`。该契约使用确定性 fixture 验证组合边界；它不是行业模块、生产 API、后端 adapter 或 UI 实现。

Read this document together with the [business-module manifest example](examples/example.catalog-query-detail.module.manifest.json), the [implementation-package manifest example](examples/example.catalog-query-detail.mock-implementation.manifest.json), and [ADR-0001](../adr/ADR-0001-biz-composition-and-contract-boundaries.md).

请与[业务模块 manifest 示例](examples/example.catalog-query-detail.module.manifest.json)、[实现包 manifest 示例](examples/example.catalog-query-detail.mock-implementation.manifest.json)和 [ADR-0001](../adr/ADR-0001-biz-composition-and-contract-boundaries.md)一并阅读本文档。

## Contract conventions / 契约约定

All examples use `contractVersion: "1.0"`. A module owns its filter schema and validates a request before its adapter port is invoked. An adapter converts its own wire protocol into the canonical results and failures below; the core and module never receive a raw HTTP response or a backend-specific envelope.

所有示例使用 `contractVersion: "1.0"`。模块拥有自己的 filter schema，并在调用 adapter port 前校验请求。adapter 将自己的 wire protocol 转换为下文的规范化结果和失败；core 与模块永不接收原始 HTTP 响应或后端专用 envelope。

Localized human-readable values use explicit `zh-Hans` and `en` properties. Contract identifiers, codes, and enum values remain language-neutral identifiers.

面向人的本地化值使用明确的 `zh-Hans` 与 `en` 属性。契约标识、代码和枚举值保持语言中立的标识形式。

## Reference-data dependency / Reference-data 依赖

The module declares `example.reference-data` as a business dependency. That neutral capability supplies declared filter-option metadata through its own `reference-options` port. The catalog module does not import a reference implementation or read its provider object; an application lifecycle or adoption runtime must explicitly install and enable the dependency before enabling catalog-query-detail.

该模块把 `example.reference-data` 声明为业务依赖。该中性能力通过自身 `reference-options` port 提供已声明 filter option metadata。catalog module 不 import reference 实现，也不读取其 provider 对象；应用 lifecycle 或 adoption runtime 必须先显式安装并启用该依赖，随后才能启用 catalog-query-detail。

The current query fixture still uses an empty filter. The dependency proves composition ownership and future declared-option readiness; it does not add an industry filter, user preference, implicit provider call, or backend lookup to the catalog contract.

当前 query fixture 仍使用空 filter。该依赖证明组合主责与未来已声明 option 的准备度；不会向 catalog contract 加入行业 filter、用户偏好、隐式 provider 调用或后端查询。

## Query port / 查询 port

The required `catalog-query` port receives a page-based query. `filter` is module-owned and may only contain fields accepted by the module's versioned filter schema. The neutral example deliberately declares no industry filter fields.

required `catalog-query` port 接收基于页码的 query。`filter` 归模块所有，只能包含该模块带版本 filter schema 接受的字段。中性示例刻意不声明任何行业筛选字段。

```json
{
  "contractVersion": "1.0",
  "filter": {},
  "page": 1,
  "pageSize": 20
}
```

| Field / 字段 | Rule / 规则 |
| --- | --- |
| `filter` | A JSON object validated by `catalog-query-detail.filter` version `1.0`; no adapter may add private filter syntax / 由 `catalog-query-detail.filter` 版本 `1.0` 校验的 JSON 对象；adapter 不得添加私有筛选语法 |
| `page` | Positive integer beginning at `1` / 从 `1` 开始的正整数 |
| `pageSize` | Positive integer within the module's declared limit / 位于模块声明上限内的正整数 |

The canonical page result is below. `entries` contain neutral display data only; no field represents an industry record or production authority.

下文为规范化页面结果。`entries` 只包含中性显示数据；没有任何字段代表行业记录或生产事实主责。

```json
{
  "contractVersion": "1.0",
  "kind": "page",
  "entries": [
    {
      "id": "entry-001",
      "label": {
        "zh-Hans": "示例条目 001",
        "en": "Example entry 001"
      }
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1,
  "hasNext": false
}
```

`page`, `pageSize`, and `total` describe the same result set. `hasNext` must agree with them. A page-capable adapter must not return cursor or offset fields as a substitute for this result.

`page`、`pageSize` 和 `total` 描述同一结果集。`hasNext` 必须与它们一致。具备 page 能力的 adapter 不能用 cursor 或 offset 字段替代此结果。

## Detail port / 详情 port

The required `entry-detail` port receives an `entryId` that came from a canonical query result or another declared module contract.

required `entry-detail` port 接收来自规范化 query 结果或其他已声明模块契约的 `entryId`。

```json
{
  "contractVersion": "1.0",
  "entryId": "entry-001"
}
```

The primary `entry` is independent from supplementary sections. A section failure is represented at section scope and must not turn a successfully loaded primary entry into a whole-detail failure.

主 `entry` 与附属 section 相互独立。section 失败在 section 范围表示，不得把已成功加载的主 entry 变成整个详情失败。

```json
{
  "contractVersion": "1.0",
  "kind": "detail",
  "entry": {
    "id": "entry-001",
    "label": {
      "zh-Hans": "示例条目 001",
      "en": "Example entry 001"
    }
  },
  "sections": [
    {
      "id": "primary",
      "state": "ready"
    },
    {
      "id": "supplementary",
      "state": "failure",
      "failure": {
        "code": "section-unavailable",
        "message": {
          "zh-Hans": "附属区块暂时不可用。",
          "en": "The supplementary section is temporarily unavailable."
        },
        "retryable": true,
        "scope": "section"
      }
    }
  ]
}
```

Permitted section states are `loading`, `ready`, `empty`, and `failure`. Only a `failure` section has a `failure` member; a `ready` or `empty` section must not include a failure object.

允许的 section 状态是 `loading`、`ready`、`empty` 与 `failure`。只有 `failure` section 才有 `failure` 成员；`ready` 或 `empty` section 不得包含 failure 对象。

## Canonical failure / 规范化失败

Every port failure uses this envelope. The `code` is stable for programmatic branching; the localized `message` is suitable for presentation after a channel projection applies its UX policy.

每个 port 失败都使用该 envelope。`code` 用于稳定的程序分支；渠道投影应用自身 UX 策略后，可以呈现本地化的 `message`。

```json
{
  "contractVersion": "1.0",
  "kind": "failure",
  "code": "invalid-query",
  "message": {
    "zh-Hans": "查询条件不符合该模块的 schema。",
    "en": "The query does not satisfy this module's schema."
  },
  "retryable": false,
  "scope": "request"
}
```

| Code / 代码 | Scope / 范围 | Meaning / 含义 |
| --- | --- | --- |
| `invalid-query` | `request` | The request failed module validation / 请求未通过模块校验 |
| `adapter-unavailable` | `adapter` | The declared adapter cannot currently serve its port / 已声明 adapter 当前无法提供其 port |
| `not-found` | `request` | The requested `entryId` has no result in the selected adapter / 所选 adapter 中没有该 `entryId` 的结果 |
| `section-unavailable` | `section` | A non-primary detail section failed independently / 非主详情 section 独立失败 |
| `session-not-capable` | `session` | The declared session state lacks a required capability / 已声明 session 状态缺少所需能力 |

An adapter can retain HTTP status, a `{ code, message, data }` envelope, Directus errors, or other backend facts in its own diagnostics. Those values do not extend this canonical failure without a new contract version.

adapter 可以在自己的诊断信息中保留 HTTP status、`{ code, message, data }` envelope、Directus 错误或其他后端事实。没有新的契约版本，这些值不能扩展本规范化失败。

## Mock session port / Mock session port

The required `session-state` port starts with an anonymous or mock session. It contains no account profile, credential, token, cookie, or identity-provider protocol.

required `session-state` port 从匿名或 mock session 开始。它不包含账户 profile、凭据、token、cookie 或身份提供方协议。

```json
{
  "contractVersion": "1.0",
  "mode": "mock",
  "subject": null,
  "capabilities": []
}
```

`mode` is either `anonymous` or `mock`. A module must request a declared capability through this port rather than infer identity from a transport header, storage key, or route parameter.

`mode` 只能为 `anonymous` 或 `mock`。模块必须通过此 port 请求已声明的 capability，不能从传输 header、存储键或路由参数推断身份。

## Adapter capabilities / Adapter 能力

An adapter publishes a capability declaration beside its implementation manifest. The neutral mock declaration is shown below; it has no real transport or backend connection.

adapter 在其实现 manifest 旁发布能力声明。下方为中性 mock 声明；它没有真实传输或后端连接。

```json
{
  "contractVersion": "1.0",
  "port": "catalog-query",
  "pagination": {
    "modes": ["page"],
    "pageJump": true
  },
  "transport": "mock"
}
```

An adapter that uses cursor or offset internally may expose `page` only when it can preserve the request and result semantics without loss. Otherwise it declares only its actual mode and sets `pageJump` to `false`; the core must not invent a simulated page number.

内部使用 cursor 或 offset 的 adapter 只有在可以无损保留请求与结果语义时，才可以暴露 `page`。否则它只能声明实际模式，并将 `pageJump` 设为 `false`；core 不得虚构模拟页码。

## Route projection / 路由投影

A mini-program route projection maps declared intents to registered screens and registered block identifiers. It does not put a backend path, arbitrary URL, component import path, or untrusted data source in the manifest.

小程序路由投影把已声明 intent 映射为已登记 screen 和已登记区块标识。它不把后端路径、任意 URL、组件导入路径或不可信数据源放进 manifest。

```json
{
  "contractVersion": "1.0",
  "channel": "mp-weixin",
  "screens": [
    {
      "intent": "catalog",
      "screenId": "catalog-list",
      "blocks": ["catalog-list"]
    },
    {
      "intent": "entry-detail",
      "screenId": "entry-detail",
      "blocks": ["entry-detail"]
    }
  ],
  "actions": [
    {
      "id": "select-entry",
      "from": "catalog-list",
      "to": "entry-detail"
    }
  ]
}
```

The profile may order or hide registered blocks only within the module manifest's allowlist and declared visibility conditions. It cannot introduce a new screen, block, URL, dependency, or executable condition.

profile 只能在模块 manifest 的 allowlist 与已声明可见性条件内排序或隐藏已登记区块。它不能引入新的 screen、block、URL、依赖或可执行条件。

## Deterministic fixture matrix / 确定性 fixture 矩阵

The first implementation must provide fixtures for each case below. Fixture identifiers are stable test labels, not production records or copied business data.

首个实现必须为下列每种情况提供 fixture。fixture 标识是稳定的测试标签，不是生产记录或复制的业务数据。

| Fixture case / Fixture 情形 | Port or projection / Port 或投影 | Expected canonical observation / 预期规范化观察 |
| --- | --- | --- |
| `first-page` | `catalog-query` | A `page` result with a positive `total` and a consistent `hasNext` / 具有正 `total` 且 `hasNext` 一致的 `page` 结果 |
| `last-page` | `catalog-query` | A valid page result with `hasNext: false` / `hasNext: false` 的有效 page 结果 |
| `empty-query` | `catalog-query` | A valid page result with `entries: []` and `total: 0` / `entries: []` 且 `total: 0` 的有效 page 结果 |
| `invalid-query` | module validation | A non-retryable `failure` with `scope: request` before adapter invocation / 在调用 adapter 前得到 `scope: request` 的不可重试 `failure` |
| `adapter-failure` | `catalog-query` or `entry-detail` | A retryable `adapter-unavailable` failure without raw wire details / 没有原始 wire 细节的可重试 `adapter-unavailable` 失败 |
| `detail-section-failure` | `entry-detail` | A `detail` result whose primary `entry` is ready and whose supplementary section is a `section-unavailable` failure / 主 `entry` 已就绪、附属 section 为 `section-unavailable` 失败的 `detail` 结果 |
| `mock-session` | `session-state` | `mode: mock`, no subject, no capability, credential, or token / `mode: mock`，没有 subject、capability、凭据或 token |
| `catalog-to-detail` | route projection | `select-entry` maps only between registered IDs / `select-entry` 只在已登记 ID 之间映射 |

## Non-goals / 非目标

This contract does not define a real HTTP request, Directus collection, token transport, write operation, preference store, rich-text policy, industry field, CMS layout, published package, or HIA-uView component API.

本契约不定义真实 HTTP 请求、Directus collection、token 传输、写操作、偏好存储、富文本策略、行业字段、CMS 布局、已发布包或 HIA-uView 组件 API。
