# ADR-0006: Application template and explicit adapter integration / 应用模板与显式 Adapter 集成

Status: Accepted

状态：已接受

## Context / 背景

HIA-uView-Biz already separates business-module manifests, implementation-package manifests, capability adoption profiles, application profiles, and engineering package metadata. It can adopt a complete explicit capability set atomically and project one composed capability through an application shell.

HIA-uView-Biz 已经分离 business-module manifest、implementation-package manifest、capability adoption profile、application profile 与工程 package metadata。它能够原子采用完整显式能力集合，并通过 application shell 投影一个已组合能力。

The representative mini-program currently proves the stack, but its application-owned fixture runtime still repeats module selection, adapter selection, lifecycle installation, dependency enablement, and shell bridging. Copying that assembly into another application would make every consumer reimplement the same safety boundary and could turn an example into an undocumented project generator.

现有代表性小程序已经证明完整 stack，但其应用自有 fixture runtime 仍重复 module 选择、adapter 选择、lifecycle 安装、依赖启用与 shell bridge。若其他应用复制这段装配，每个消费者都会重新实现同一安全边界，还可能把 example 误变成无契约的项目生成器。

## Decision / 决定

Introduce a versioned `application-template` manifest and a pure in-memory application-integration runtime.

引入版本化 `application-template` manifest 与纯内存 application-integration runtime。

The template manifest owns only application integration expectations:

template manifest 只拥有应用集成期望：

- a stable template ID and one required adoption-profile ID;
- 稳定 template ID 与一个必需 adoption-profile ID；
- one primary module used by the application shell;
- 一个供 application shell 使用的 primary module；
- a bounded list of capability slots, required states, and implementation surface kinds;
- 受限的 capability slot、期望状态与 implementation surface kind 列表；
- host-owned block, visibility, and page-size allowlists;
- 宿主拥有的 block、visibility 与 page-size allowlist；
- a static route projection and explicit per-screen mock-capability policy.
- 静态 route projection 与逐 screen 显式 mock-capability policy。

It does not own module ports, business facts, implementation IDs, providers, wire protocols, credentials, component paths, package locations, scripts, or external connections.

它不拥有 module port、业务事实、implementation ID、provider、wire protocol、credential、component path、package location、脚本或外部连接。

`@hia-uview/biz-app-integration` accepts an already parsed template, a complete adoption profile, and complete caller-supplied capability units. It validates the template and slot correspondence before creating an adoption candidate. It delegates candidate lifecycle and atomic replacement to `@hia-uview/biz-adoption-runtime`, then gives `@hia-uview/biz-app-shell` a bridge limited to the declared primary module.

`@hia-uview/biz-app-integration` 接受已解析 template、完整 adoption profile 与调用方提供的完整 capability units。它在创建 adoption candidate 前校验 template 与 slot 对应关系。它把候选 lifecycle 与原子替换委托给 `@hia-uview/biz-adoption-runtime`，随后只向 `@hia-uview/biz-app-shell` 提供受限于已声明 primary module 的 bridge。

The representative template supplies two explicit candidates: the mandatory neutral mock and the existing injected-wire adapter extension. Neither candidate is a fallback for the other. Selecting an adapter means supplying its reviewed implementation unit in code; a manifest string never loads or executes a package.

代表性 template 提供两个显式 candidate：必备的中性 mock 与现有 injected-wire adapter extension。二者互不构成 fallback。选择 adapter 表示由代码提供已审阅 implementation unit；manifest 字符串永远不会加载或执行 package。

## Consequences / 后果

- Applications can reuse one validation and shell-integration boundary without copying lifecycle internals.
- 应用可以复用同一校验与 shell 集成边界，无需复制 lifecycle 内部逻辑。
- A template remains declarative and reviewable while implementation units remain explicit executable code.
- template 保持声明式、可审阅，implementation unit 则继续是显式可执行代码。
- Adapter compatibility is checked from implementation-manifest metadata before adoption; providers and invocation payloads remain private.
- adapter 兼容性在采用前依据 implementation-manifest metadata 检查；provider 与调用 payload 保持私有。
- The same shell bridge can continue across a successful implementation replacement because it invokes the active adoption runtime rather than capturing one provider.
- 同一 shell bridge 可以跨越成功 implementation replacement，因为它调用活动 adoption runtime，而不是捕获某个 provider。
- The first template is private and example-only. It is not an npm publication promise, industry starter, generated application, or production recommendation.
- 首个 template 是 private、仅供 example 使用；它不是 npm 发布承诺、行业 starter、生成式应用或生产建议。

## Rejected alternatives / 未采用方案

### Copy the representative application directory / 复制代表性应用目录

Rejected because copied lifecycle and adapter assembly would drift and would not expose a versioned compatibility boundary.

未采用，因为复制出的 lifecycle 与 adapter 装配会产生漂移，而且没有版本化兼容边界。

### Put template fields in `package.json` / 把模板字段写入 `package.json`

Rejected because engineering distribution metadata must not replace application, adoption, business, or implementation manifests.

未采用，因为工程分发 metadata 不能替代 application、adoption、business 或 implementation manifest。

### Resolve implementation package names from the template / 从模板解析实现包名

Rejected because package discovery, installation, dynamic import, and remote code are separate trust and distribution problems.

未采用，因为 package discovery、安装、动态 import 与远程代码属于独立的信任和分发问题。

### Let presentation metadata choose component paths or callbacks / 让呈现 metadata 选择组件路径或回调

Rejected because the host must compile and register presentation code; metadata may select only stable allowlisted IDs and values.

未采用，因为宿主必须编译并登记呈现代码；metadata 只能选择稳定 allowlist ID 与值。

## Review triggers / 复审触发条件

Review this decision before adding optional or repeated slots, a template inheritance model, file copying or code generation, package discovery or installation, asynchronous integration, real backend or identity adapters, persistent rollout state, dynamic components, remote configuration, industry templates, or public template distribution.

在增加 optional/repeated slot、template inheritance、文件复制或代码生成、package discovery/安装、异步 integration、真实 backend/identity adapter、持久化 rollout state、动态组件、远程配置、行业模板或公开 template 分发前复审本决定。
