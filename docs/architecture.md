# Architecture overview / 架构概览

HIA-uView-Biz is a configurable, capability-composed UniApp business framework. Its first target is mini-program development, while its public contracts keep backend, identity, industry model, and presentation channel replaceable.

HIA-uView-Biz 是可配置、按能力组合的 UniApp 业务框架。其首要目标是小程序开发，同时其公开契约保持后端、身份、行业模型和呈现渠道可替换。

| Area / 区域 | Responsibility / 主责 | Boundary / 边界 |
| --- | --- | --- |
| `packages/core` | Composition rules, manifest validation, declared ports, and validation hooks / 组合规则、manifest 校验、已声明 port 与验证挂钩 | Does not own domain records, routes, transport, or credentials / 不拥有领域记录、路由、传输或凭据 |
| `packages/app-shell` | In-memory screen-state projection, action gate, mock capability gate, canonical failure presentation input, and retry command retention / 内存 screen-state 投影、action gate、mock capability gate、规范化 failure 呈现输入和 retry command 保留 | No Vue, UniApp, URL/router, platform navigation, storage, real identity, transport, or UI registration / 没有 Vue、UniApp、URL/router、平台导航、storage、真实身份、传输或 UI 注册 |
| `modules` | Capability-oriented business ownership and schemas / 面向能力的业务主责与 schema | Separates business semantics from package delivery / 与包交付事实分离 |
| `extensions` | Explicit adapters and other documented extension packages / 显式 adapter 与其他有文档的扩展包 | No hidden coupling to application internals / 不得隐式耦合应用内部实现 |
| `apps/example-catalog-query-detail-mp-weixin` | One controlled UniApp Vue 3 compiler fixture for the neutral catalog-query-detail projection / 中性目录—查询—详情投影的一个受控 UniApp Vue 3 compiler fixture | Compile-only `mp-weixin`; no dev server, router, real adapter, real identity, write flow, or release claim / 仅编译 `mp-weixin`；没有 dev server、router、真实 adapter、真实身份、写流程或发布声明 |
| HIA-uView | Presentational UI input to the controlled fixture / 受控 fixture 的呈现 UI 输入 | Uses a reviewed local source guard, one-use local link, named imports, and explicit style; no external `file:` package dependency / 使用已复审的本地 source guard、一次性本地 link、命名导入和显式样式；没有外部 `file:` package dependency |

The detailed decision is [ADR-0001: Business composition and contract boundaries](adr/ADR-0001-biz-composition-and-contract-boundaries.md). It defines the module/implementation manifest split, canonical adapter outcomes, profile and channel projection, and declarative dynamic-presentation boundary.

详细决定见 [ADR-0001：业务组合与契约边界](adr/ADR-0001-biz-composition-and-contract-boundaries.md)。该 ADR 定义模块/实现包 manifest 分离、adapter 规范化结果、profile 与渠道投影，以及声明式动态呈现边界。

The current runtime implements the core's explicit manifest/profile/port composition boundary, deterministic neutral mock, and pure application shell. The controlled fixture compiles one named-import HIA-uView composition for `mp-weixin` after it verifies an operator-provided local UI source. It still does not implement a backend adapter, real identity integration, industry package, write flow, URL/router, storage, dynamic executable configuration, or published UI dependency.

当前运行时实现了 core 的显式 manifest/profile/port 组合边界、确定性中性 mock 和纯应用 shell。受控 fixture 在校验操作者提供的本地 UI source 后，为 `mp-weixin` 编译一个命名导入的 HIA-uView 组合。它仍不实现后端 adapter、真实身份集成、行业包、写流程、URL/router、storage、动态可执行配置或已发布 UI dependency。

See [core API / core API](api/core.md), [application-shell API / 应用 shell API](api/app-shell.md), and [ADR-0002](adr/ADR-0002-local-hia-uview-consumption-and-shell-boundary.md) for the implemented surface and its deliberate limits.

实现的 API 及其刻意限制见 [core API](api/core.md)、[应用 shell API](api/app-shell.md)和 [ADR-0002](adr/ADR-0002-local-hia-uview-consumption-and-shell-boundary.md)。
