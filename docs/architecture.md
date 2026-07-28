# Architecture overview

HIA-uView-Biz will provide a UniApp business-framework core plus optional modules and extensions.

| Area | Responsibility | Boundary |
| --- | --- | --- |
| `packages/core` | Application composition, configuration and extension contracts | No runtime contract has been finalized. |
| `modules` | Capability-oriented optional business modules | Must remain independently configurable and documented. |
| `extensions` | Explicit extension packages and adapters | Must not use hidden coupling to application code. |
| HIA-uView | UI and supporting-tool dependency | Consumed through an explicit, versioned or documented local integration contract. |

The initial focus is mini-program development. Any data model, enterprise-capability mapping, extension API, backend boundary or platform compatibility policy must be validated through planning and architecture decisions before it becomes a stable public contract.
