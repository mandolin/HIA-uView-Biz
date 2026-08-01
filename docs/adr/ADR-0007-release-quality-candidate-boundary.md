# ADR-0007: Offline release-quality candidate boundary / 离线发布质量候选边界

Status: Accepted

状态：已接受

## Context / 背景

The first representative `mp-weixin` slice now has deterministic Node acceptance and a controlled local compiler verification path. Those facts are useful quality evidence, but they do not by themselves prove that a package is ready to publish, that a mini-program has passed device verification, or that a vulnerability assessment is complete.

首个代表性 `mp-weixin` 纵切现在具备确定性 Node 验收和受控本地 compiler 验证路径。这些事实是有价值的质量证据，但其本身不能证明包已可发布、小程序已经通过设备验证，或漏洞评估已经完成。

The repository also needs a repeatable way to check public package shape, controlled asset policy, public-text boundary, and runtime capability restrictions without requiring network access, an external service, or a local UI-source checkout.

仓库还需要一种可重复的方式，在不要求网络访问、外部服务或本地 UI source checkout 的情况下，检查公开 package 形态、受控 asset policy、公开文本边界和 runtime capability 限制。

## Decision / 决定

Introduce an offline `release-quality candidate` gate. Its result is a local evidence point, not a release decision.

引入离线 `release-quality candidate` 门禁。其结果只是本地证据点，而非发布决定。

The gate reads only the current repository and checks these bounded facts:

门禁只读取当前仓库，并检查以下受限事实：

- root and workspace package metadata remain private, MIT-licensed, ESM-oriented, and Node-version bounded as declared by this repository;
- root 与 workspace package metadata 保持为本仓声明的 private、MIT、ESM 导向与 Node 版本受限状态；
- workspace dependency declarations do not introduce local-path, remote-URL, Git, or unreviewed workspace protocol references;
- workspace dependency 声明不引入本地路径、远程 URL、Git 或未经审阅的 workspace protocol 引用；
- controlled package contents do not introduce binary/font assets or CSS remote-asset loading;
- 受控 package 内容不引入二进制/字体 asset 或 CSS 远程 asset 加载；
- public documentation and controlled source do not contain machine-specific paths or private process records;
- 公开文档与受控 source 不包含机器特定路径或私有过程记录；
- runtime source keeps file I/O, process launch, network transport, dynamic execution, and dynamic module loading out of the framework runtime boundary;
- runtime source 将文件 I/O、进程启动、网络 transport、动态执行与动态模块加载排除在框架 runtime 边界之外；
- repository publication controls contain no automatic publish, release, upload, or external CI action.
- 仓库发布控制不包含自动 publish、release、upload 或外部 CI action。

The gate is deterministic, static, and offline. It neither installs dependencies nor executes application runtime code. Deterministic Node acceptance and the optional controlled compiler verification remain separate commands, so each result states precisely what was checked.

该门禁是确定性的、静态的、离线的。它既不安装依赖，也不执行应用 runtime code。确定性 Node 验收与可选受控 compiler 验证仍是独立命令，使每个结果精确说明所检查的内容。

## Consequences / 后果

- Contributors get one transparent local command for a bounded package-quality review before discussing a release.
- 贡献者在讨论发布前获得一个透明的本地命令，用于进行受限的 package-quality 复核。
- The command can catch accidental public-boundary, asset, dependency-shape, and capability-scope regressions early.
- 该命令可以及早捕获意外的公开边界、asset、依赖形态与 capability scope 回归。
- Passing the gate does not grant permission to publish, upload to WeChat, claim security compliance, claim accessibility conformance, or claim browser/device compatibility.
- 通过门禁并不授予 publish、上传微信、声明安全合规、声明无障碍合规或声明浏览器/设备兼容性的权限。
- The gate intentionally uses explicit, reviewable policy rather than a general security scanner or an unbounded source-analysis engine.
- 门禁有意采用显式、可复核的 policy，而不是通用 security scanner 或无边界 source-analysis engine。

## Rejected alternatives / 未采用方案

### Treat compiler success as release approval / 将 compiler 成功视为发布批准

Rejected because compile-only verification cannot demonstrate device behavior, WeChat submission acceptance, production security, or distribution correctness.

未采用，因为仅编译验证无法证明设备行为、微信提交接受度、生产安全或分发正确性。

### Run a networked scanner or publishing workflow in the gate / 在门禁中运行联网扫描器或发布工作流

Rejected because this first quality boundary must remain repeatable for trusted local development and must not create external state. Scanner and release evidence may be added later through separately reviewed workflows.

未采用，因为首个质量边界必须保持为可在受信任本地开发中重复执行，且不能创建外部状态。scanner 与 release evidence 可以在后续通过单独复审的 workflow 加入。

### Infer quality from package-manager defaults / 从 package-manager 默认行为推断质量

Rejected because package-manager defaults do not express this repository's public-text, asset, runtime-capability, or no-publication policies.

未采用，因为 package-manager 默认行为无法表达本仓的公开文本、asset、runtime capability 或禁止发布 policy。

## Review triggers / 复审触发条件

Review this decision before adding publication automation, a public distributable package, binary/font assets, remote assets, external CI, a real transport adapter, browser/device acceptance, a security scanner, an SBOM, a release provenance format, or a changed dependency risk disposition.

在加入发布自动化、公开可分发 package、二进制/字体 asset、远程 asset、外部 CI、真实 transport adapter、浏览器/设备验收、security scanner、SBOM、release provenance 格式或改变依赖风险处置前，必须复审本决定。
