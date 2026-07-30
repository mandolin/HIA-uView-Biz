# Capability adoption runtime / 能力采用 runtime

`@hia-uview/biz-adoption-runtime` reconciles a complete versioned adoption profile and a complete explicitly supplied capability-unit set into one active process-local runtime. It validates bounded presentation metadata, preflights the whole candidate, enables dependencies deterministically, and switches the active runtime only after complete success.

`@hia-uview/biz-adoption-runtime` 把完整版本化 adoption profile 与完整显式 capability-unit 集合协调为一个活动进程内 runtime。它校验受限呈现 metadata、预检完整候选、以确定性顺序启用依赖，并且只有完全成功后才切换活动 runtime。

Implementation replacement means selecting a different explicitly supplied implementation-package ID for the same business-module ID. The runtime builds a fresh candidate and atomically switches an in-memory reference. It does not discover, download, install, import, migrate, clean up, or execute package code.

实现替换表示为同一业务模块 ID 选择另一个显式提供的 implementation-package ID。runtime 会构建全新候选并原子切换进程内引用。它不会发现、下载、安装、import、迁移、清理或执行 package code。

See the [capability adoption contract](../../docs/contracts/capability-adoption.md) and [ADR-0005](../../docs/adr/ADR-0005-explicit-capability-adoption-and-replacement.md).

详见[能力采用契约](../../docs/contracts/capability-adoption.md)与 [ADR-0005](../../docs/adr/ADR-0005-explicit-capability-adoption-and-replacement.md)。
