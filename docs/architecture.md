# Architecture overview / 架构概览

HIA-uView-Biz is a configurable, capability-composed UniApp business framework. Its first target is mini-program development, while its public contracts keep backend, identity, industry model, and presentation channel replaceable.

HIA-uView-Biz 是可配置、按能力组合的 UniApp 业务框架。其首要目标是小程序开发，同时其公开契约保持后端、身份、行业模型和呈现渠道可替换。

| Area / 区域 | Responsibility / 主责 | Boundary / 边界 |
| --- | --- | --- |
| `packages/core` | Composition rules, manifest validation, declared ports, and validation hooks / 组合规则、manifest 校验、已声明 port 与验证挂钩 | Does not own domain records, routes, transport, or credentials / 不拥有领域记录、路由、传输或凭据 |
| `modules` | Capability-oriented business ownership and schemas / 面向能力的业务主责与 schema | Separates business semantics from package delivery / 与包交付事实分离 |
| `extensions` | Explicit adapters and other documented extension packages / 显式 adapter 与其他有文档的扩展包 | No hidden coupling to application internals / 不得隐式耦合应用内部实现 |
| HIA-uView | Presentational UI dependency / 呈现层 UI 依赖 | Uses an explicit versioned package, local link, fixture, or integration script / 通过显式版本包、本地链接、fixture 或集成脚本接入 |

The detailed decision is [ADR-0001: Business composition and contract boundaries](adr/ADR-0001-biz-composition-and-contract-boundaries.md). It defines the module/implementation manifest split, canonical adapter outcomes, profile and channel projection, and declarative dynamic-presentation boundary.

详细决定见 [ADR-0001：业务组合与契约边界](adr/ADR-0001-biz-composition-and-contract-boundaries.md)。该 ADR 定义模块/实现包 manifest 分离、adapter 规范化结果、profile 与渠道投影，以及声明式动态呈现边界。

No runtime API, backend adapter, real identity integration, industry package, or HIA-uView dependency is implemented by this documentation.

本说明不实现运行时 API、后端 adapter、真实身份集成、行业包或 HIA-uView 依赖。
