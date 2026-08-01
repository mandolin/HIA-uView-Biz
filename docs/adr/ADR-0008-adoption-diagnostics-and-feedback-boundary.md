# ADR-0008: Adoption, diagnostics, and feedback boundary / 采用、诊断与反馈边界

Status: Accepted

状态：已接受

## Context / 背景

HIA-uView-Biz has deterministic contracts, a representative `mp-weixin` fixture, and offline quality evidence. Its workspace packages and HIA-uView UI input are still private development assets rather than registry-release promises. A contributor therefore needs a clear way to begin evaluating the repository, distinguish engineering adoption from package installation, and report a reproducible problem without disclosing sensitive information.

HIA-uView-Biz 已具备确定性契约、代表性 `mp-weixin` fixture 和离线质量证据。其 workspace package 与 HIA-uView UI input 仍是私有开发资产，而非 registry release 承诺。因此贡献者需要清晰的方法来开始评估仓库、区分工程采用和 package 安装，并在不披露敏感信息的情况下报告可复现问题。

The framework also studies the uView ecosystem, but its current business contracts, explicit capability composition, local fixture integration, and backend-agnostic boundary are not a drop-in replacement for an existing uView application. Treating them as one would create misleading migration, compatibility, and release claims.

框架也研究 uView 生态，但其当前业务契约、显式能力组合、本地 fixture 集成和后端无关边界，并不是已有 uView 应用的 drop-in replacement。将二者视为同一事物会产生误导性的迁移、兼容性和发布声明。

## Decision / 决定

Publish four linked adoption surfaces:

发布四个相互关联的采用表面：

- an adoption guide for checkout-first engineering evaluation;
- 面向 checkout-first 工程评估的 adoption guide；
- a manual migration guide that separates business contracts, implementations, presentation, and verification;
- 把业务契约、implementation、呈现和验证分离的手工 migration guide；
- a read-only local `doctor` command with a bounded human or JSON report;
- 带受限 human 或 JSON report 的只读本地 `doctor` command；
- public support and feedback templates that ask for minimal, sanitized reproduction evidence.
- 要求最小、脱敏复现证据的公开 support 与 feedback template。

`doctor` reads only fixed metadata in the current repository and npm-script runtime metadata. It accepts no path, URL, profile, source, credential, or repair option; `--json` is its only supported argument. It neither installs, repairs, publishes, starts a service, reads an external UI checkout, nor accesses a network.

`doctor` 只读取当前仓的固定 metadata 和 npm-script runtime metadata。它不接受 path、URL、profile、source、credential 或 repair option；`--json` 是唯一支持的参数。它既不安装、不修复、不发布、不启动服务、不读取外部 UI checkout，也不访问网络。

Migration remains a manual, staged engineering exercise. The first step is to establish a neutral business contract and explicit implementation boundary; no tool converts uView component calls, Vue pages, HTTP/token conventions, Directus collections, industry fields, configuration, data, or production state. A rollback is therefore a source-control/application-deployment decision outside the in-memory runtime's replacement capability.

migration 仍是手工、分阶段的工程工作。第一步是建立中性业务契约和显式 implementation 边界；没有工具转换 uView component call、Vue page、HTTP/token convention、Directus collection、行业字段、配置、数据或生产状态。因此回退是 source-control/application-deployment 决策，位于内存 runtime replacement capability 之外。

Feedback is static repository intake only. It must never request or collect tokens, cookies, credentials, production records, absolute paths, or large unreviewed source dumps. Repository issue settings, private security handling, telemetry, and external support workflows are separate operational decisions.

feedback 只是静态仓库 intake。它绝不能要求或收集 token、cookie、credential、生产记录、绝对路径或大段未经审阅的 source dump。仓库 issue 设置、私有 security 处理、telemetry 和外部 support workflow 都是独立的运营决策。

## Consequences / 后果

- Contributors receive a concrete evaluation path without mistaking it for registry or production adoption.
- 贡献者获得具体评估路径，而不会将其误解为 registry 或生产采用。
- The `doctor` result can be attached to an issue without exposing a host path or external source identity.
- `doctor` 结果可附在 issue 中，而不会暴露 host path 或外部 source identity。
- Migration work is deliberately slower than a codemod, but every contract and implementation remains reviewable and reversible through ordinary source control.
- migration 工作有意比 codemod 慢，但每项契约和 implementation 都可通过普通 source control 审阅和回退。
- Static templates improve report consistency but do not create a support service-level agreement, automated triage, or guarantee that issue tracking is enabled.
- 静态 template 改善报告一致性，但不创建 support service-level agreement、自动分流或保证 issue tracking 已启用。

## Rejected alternatives / 未采用方案

### Present the workspace packages as installable releases / 将 workspace package 表述为可安装 release

Rejected because current packages are private and use development version `0.0.0`; no registry publication or consumer-installation evidence exists.

未采用，因为当前 package 是 private 且使用开发版本 `0.0.0`；不存在 registry publication 或 consumer-installation 证据。

### Provide a uView compatibility shim or codemod / 提供 uView compatibility shim 或 codemod

Rejected because current Biz contracts intentionally do not own existing page/component APIs, HTTP/token behavior, Directus schema, industry data, or production state.

未采用，因为当前 Biz contract 有意不拥有既有 page/component API、HTTP/token behavior、Directus schema、行业数据或生产状态。

### Make doctor discover local projects or repair dependencies / 让 doctor 发现本地项目或修复 dependency

Rejected because arbitrary path reading, source discovery, mutation, and package-manager action create trust, privacy, and rollback concerns beyond a local readiness report.

未采用，因为任意路径读取、source discovery、mutation 和 package-manager action 会带来超出本地 readiness report 的信任、隐私和回退问题。

### Collect feedback automatically / 自动收集 feedback

Rejected because telemetry, external transport, identity, data retention, and consent need their own privacy and operational decision.

未采用，因为 telemetry、外部 transport、identity、数据保留和 consent 需要独立的隐私和运营决策。

## Review triggers / 复审触发条件

Review this decision before publishing any package, claiming uView API compatibility, adding a codemod/scaffold/generator, reading arbitrary project files, validating a real migration, enabling issue automation or telemetry, defining a private security channel, or using doctor output as release approval.

在发布任何 package、声明 uView API compatibility、加入 codemod/scaffold/generator、读取任意 project file、验证真实 migration、启用 issue automation 或 telemetry、定义私有 security channel，或将 doctor output 用作 release approval 前，必须复审本决定。
