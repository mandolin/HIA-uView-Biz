# ADR-0009: Local source trial and release boundary / 本地 source trial 与发布边界

Status: Accepted

状态：已接受

## Context / 背景

HIA-uView-Biz has a deterministic capability-composition suite, a representative `mp-weixin` fixture, an offline release-quality candidate gate, checkout-first adoption guidance, and a bounded local doctor. These are useful evidence for a maintainer evaluating a source checkout, but all current workspace packages remain private development packages at version `0.0.0`. No registry package, consumer installation, Git release, mini-program upload, or public trial has occurred.

HIA-uView-Biz 具有确定性 capability-composition suite、代表性 `mp-weixin` fixture、离线 release-quality candidate gate、checkout-first adoption guidance 和受限本地 doctor。这些内容可为维护者评估 source checkout 提供有用证据，但所有当前 workspace package 仍是版本 `0.0.0` 的 private development package。尚未发生 registry package、consumer installation、Git release、小程序 upload 或 public trial。

Calling a successful local command or simulator interaction a release would misstate the distribution, provenance, support, platform, and rollback properties that a real release requires. Conversely, retaining no named trial boundary would make local evaluation results hard to compare or report safely.

把成功的本地 command 或 simulator interaction 称为 release，会错误表述真实 release 所需的 distribution、provenance、support、platform 与 rollback 属性。反之，完全不保留命名的 trial boundary 会使本地评估结果难以比较或安全报告。

## Decision / 决定

Define the current candidate as a local source trial. A trial is identified by a reviewed Biz Git commit and, when the optional fixture is compiled, a separately reviewed local HIA-uView UI source. It is not identified by a SemVer package version and does not change any package from `private` or `0.0.0`.

将当前 candidate 定义为 local source trial。trial 由已复审的 Biz Git commit 标识；在编译 optional fixture 时，还由单独复审的 local HIA-uView UI source 标识。它不由 SemVer package version 标识，也不改变任何 package 的 `private` 或 `0.0.0` 状态。

The named `npm run trial:source` command runs only the local baseline: bounded doctor, deterministic Node/ROP/documentation checks, and the offline release-quality gate. It installs nothing, changes no package metadata, selects no UI source, starts no service, invokes no simulator, accesses no network, and creates no external release state.

命名的 `npm run trial:source` command 只运行 local baseline：受限 doctor、确定性 Node/ROP/documentation checks 与 offline release-quality gate。它不安装任何内容、不改变 package metadata、不选择 UI source、不启动 service、不调用 simulator、不访问 network，也不创建外部 release state。

The optional compiler and simulator steps remain explicit operator actions. A compiler run requires a reviewed local UI source, and a simulator rehearsal uses only the repository's deterministic mock or injected-wire fixture. Neither step authorizes preview, upload, submission, publication, real-user data processing, or a production deployment.

optional compiler 与 simulator 步骤仍是显式的 operator action。compiler run 需要已复审的 local UI source，simulator rehearsal 只使用 repository 的确定性 mock 或 injected-wire fixture。两者都不授权 preview、upload、submission、publication、真实用户数据处理或 production deployment。

Rollback of a local source trial is a source-control choice: stop the evaluation, retain only sanitized evidence, and select a previously reviewed commit. Generated fixture output is disposable local output. There is no package unpublish, registry rollback, mini-program rollback, or production data rollback in this decision.

local source trial 的 rollback 是 source-control choice：停止评估、只保留脱敏 evidence，并选择先前已复审的 commit。生成的 fixture output 是可丢弃的 local output。本决定中不存在 package unpublish、registry rollback、小程序 rollback 或 production data rollback。

## Consequences / 后果

- Maintainers can record comparable local evidence without presenting a repository checkout as a distributable package.
- 维护者可以记录可比较的 local evidence，而不会把 repository checkout 表述为可分发 package。
- The trial receipt identifies commits and bounded command outcomes, while excluding secrets, cookies, tokens, production data, absolute paths, full environment dumps, and external source contents.
- trial receipt 标识 commit 与受限 command outcome，同时排除 secret、cookie、token、production data、absolute path、完整 environment dump 和 external source contents。
- `trial:source` provides a stable local entry, but compiler and simulator results remain separately disclosed because they have different inputs and platform scope.
- `trial:source` 提供稳定 local entry，但 compiler 与 simulator result 仍须单独披露，因为它们具有不同输入与 platform scope。
- A successful trial does not claim package publication, consumer installation, release provenance, CI, security or accessibility certification, device compatibility, public support, or production readiness.
- 成功的 trial 不声明 package publication、consumer installation、release provenance、CI、安全或无障碍认证、device compatibility、public support 或 production readiness。

## Rejected alternatives / 未采用方案

### Publish a prerelease package now / 现在发布 prerelease package

Rejected because workspace packages are private `0.0.0` development packages and there is no approved package-version, registry-ownership, consumer-installation, provenance, support, or withdrawal decision.

未采用，因为 workspace package 是 private `0.0.0` development package，且尚无已批准的 package-version、registry-ownership、consumer-installation、provenance、support 或 withdrawal 决定。

### Treat the release-quality gate as a release approval / 将 release-quality gate 视为 release approval

Rejected because the gate is intentionally offline and static. It does not create a distribution artifact or prove platform, user, security, or operational properties.

未采用，因为该 gate 有意保持 offline 与 static。它不创建 distribution artifact，也不证明 platform、user、security 或 operational 属性。

### Make the trial command compile or control DevTools implicitly / 让 trial command 隐式编译或控制 DevTools

Rejected because a reviewed UI source and desktop-tool state are explicit local inputs. Discovering them implicitly would weaken privacy, reproducibility, and operator control.

未采用，因为已复审 UI source 与 desktop-tool state 都是显式 local input。隐式发现它们会削弱 privacy、reproducibility 与 operator control。

## Review triggers / 复审触发条件

Review this decision before introducing a SemVer package version, changing package visibility, publishing to a registry, creating a Git tag or release, producing a release provenance or SBOM, enabling external CI, offering a public or real-user trial, processing real data, uploading a mini-program, or defining deployment/withdrawal/support operations.

在引入 SemVer package version、改变 package visibility、发布到 registry、创建 Git tag 或 release、产生 release provenance 或 SBOM、启用 external CI、提供 public 或 real-user trial、处理真实 data、upload 小程序，或定义 deployment/withdrawal/support operation 前，必须复审本决定。
