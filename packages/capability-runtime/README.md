# `@hia-uview/biz-capability-runtime`

Pure ESM, process-local runtime for explicitly supplied and already reviewable HIA-uView-Biz capability units.

面向显式提供且可审阅的 HIA-uView-Biz 能力单元的纯 ESM、进程内 runtime。

It reuses `@hia-uview/biz-core` assembly, then provides explicit `install`, `enable`, `disable`, `uninstall`, `invoke`, and redacted `snapshot` operations. Installation means membership in this runtime; it does not run npm, discover packages, execute lifecycle hooks, or persist state.

它复用 `@hia-uview/biz-core` 装配，再提供显式的 `install`、`enable`、`disable`、`uninstall`、`invoke` 与脱敏 `snapshot` 操作。安装只表示属于当前 runtime；它不运行 npm、不发现包、不执行生命周期 hook，也不持久化状态。

See the [capability lifecycle contract](../../docs/contracts/capability-lifecycle.md) and [ADR-0004](../../docs/adr/ADR-0004-capability-composition-and-lifecycle.md).

详见[能力生命周期契约](../../docs/contracts/capability-lifecycle.md)与 [ADR-0004](../../docs/adr/ADR-0004-capability-composition-and-lifecycle.md)。
