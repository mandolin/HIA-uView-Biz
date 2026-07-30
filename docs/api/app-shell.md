# Application-shell API / 应用 shell API

`@hia-uview/biz-app-shell` is a pure ESM projection layer between a successful Biz composition and an application-owned presentation. It does not import Vue, UniApp, HIA-uView UI, HTTP tooling, storage, or identity SDKs.

`@hia-uview/biz-app-shell` 是成功 Biz composition 与应用自有呈现层之间的纯 ESM 投影层。它不导入 Vue、UniApp、HIA-uView UI、HTTP 工具、storage 或身份 SDK。

## `createApplicationShell(input)`

Pass three explicit in-memory values:

传入三个显式内存值：

| Input / 输入 | Responsibility / 主责 |
| --- | --- |
| `composition` | A successful `@hia-uview/biz-core` composition exposing `invoke(portId, input)` / 一个暴露 `invoke(portId, input)` 的成功 `@hia-uview/biz-core` composition |
| `routeProjection` | Static registered `screens` and `actions`; it contains no URL, component path, or host router / 静态已登记 `screens` 与 `actions`；它不含 URL、组件路径或 host router |
| `screenCapabilityPolicy` | An explicit string-array policy for every registered screen / 每个已登记 screen 的显式字符串数组 policy |

The function returns `{ ok: true, diagnostics: [], shell }` on success. Invalid input returns `{ ok: false, diagnostics }`; diagnostics use stable codes and bilingual localized messages without raw caller payload.

成功时函数返回 `{ ok: true, diagnostics: [], shell }`。输入无效时返回 `{ ok: false, diagnostics }`；diagnostics 使用稳定 code 和中英本地化 message，不包含原始调用方 payload。

Every registered screen needs an explicit policy entry. An empty array explicitly permits the mock anonymous path; a non-empty array requires every named mock capability from the composition's `session-state` port. This is a first-fixture capability gate, not real authentication or authorization.

每个已登记 screen 都需要显式 policy entry。空数组显式允许 mock anonymous path；非空数组要求 composition 的 `session-state` port 具备每个命名 mock capability。这是首个 fixture 的 capability gate，不是真实认证或授权。

## Shell methods / Shell 方法

| Method / 方法 | Result / 结果 |
| --- | --- |
| `getSnapshot()` | Returns an isolated plain-data snapshot containing `screenId`, `selectedEntryId`, `page`, `detail`, and `failure` / 返回包含 `screenId`、`selectedEntryId`、`page`、`detail` 和 `failure` 的隔离 plain-data snapshot |
| `query(request)` | Invokes only the registered catalog-query port and projects canonical `page` or `failure` / 只调用已登记 catalog-query port，并投影规范化 `page` 或 `failure` |
| `navigate(actionId, input)` | Allows only registered action IDs from the current screen and validates target capability before provider invocation / 只允许当前 screen 的已登记 action ID，并在 provider 调用前校验目标 capability |
| `selectEntry(entryId)` | Convenience call for the registered `select-entry` action; it does not bypass route policy / 已登记 `select-entry` action 的便捷调用；它不绕过 route policy |
| `showCatalog()` | Explicitly returns the single-page state projection to catalog and clears detail presentation state / 显式将单页状态投影返回 catalog，并清理详情呈现状态 |
| `retry()` | Replays only a command saved from a canonical retryable failure / 只重放从规范化可重试 failure 保存的 command |

An unknown action, wrong action source, unsupported target, invalid entry ID, or unavailable retry becomes a stable request-scope failure. A missing mock capability becomes `session-not-capable` with `scope: "session"`; shell does not call the detail provider in that denial path.

未知 action、错误 action source、不支持 target、无效 entry ID 或不可用 retry 都会成为稳定的 request-scope failure。缺失 mock capability 会成为 `scope: "session"` 的 `session-not-capable`；在该拒绝路径中 shell 不会调用 detail provider。

## State rules / 状态规则

A canonical `page` is success even when `entries` is empty. A canonical detail may retain a ready primary `entry` and an independently failed supplementary section. Shell keeps that section failure inside detail data instead of converting it into a whole-detail failure.

规范化 `page` 即使 `entries` 为空也是成功。规范化详情可以保留已就绪的主 `entry` 与独立失败的附属 section。shell 将该 section failure 保留在详情数据中，而不会将其转化为整条详情 failure。

Shell never derives a filter, a capability, a URL, a component import, a retry command, or a default selected entry from presentation data. The module owns query schema and canonical outcomes; the application owns visible copy and channel-specific UX policy.

shell 绝不从呈现数据推导 filter、capability、URL、组件 import、retry command 或默认 selected entry。模块拥有 query schema 和规范化结果；应用拥有可见文案和渠道专属 UX policy。

## Deliberate limits / 刻意限制

This package performs no file loading, JSON/YAML parsing, URL/router operation, history operation, `uni.navigate*` call, Vue rendering, UI registration, HTTP or Directus integration, token/cookie/header handling, storage, real session, account lookup, write operation, dynamic import, executable condition, or online configuration.

本包不执行文件加载、JSON/YAML 解析、URL/router 操作、历史操作、`uni.navigate*` 调用、Vue 渲染、UI 注册、HTTP 或 Directus 集成、token/cookie/header 处理、storage、真实 session、账户查询、写操作、动态 import、可执行 condition 或在线配置。
