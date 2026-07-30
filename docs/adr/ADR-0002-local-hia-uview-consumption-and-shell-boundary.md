# ADR-0002: Local HIA-uView consumption and application-shell boundary / 本地 HIA-uView 消费与应用 shell 边界

## Status / 状态

Accepted for the private, development-only integration fixture.

已接受，适用于 private、仅开发期的集成 fixture。

## Context / 背景

`@hia-uview/biz-core` composes caller-supplied declarations and ports without a presentation dependency. `@hia-uview/ui` currently supplies private, unpublished UniApp Vue components at version `0.0.0`; it is not a registry-installable or versioned external dependency yet. An application shell is needed to project the neutral catalog-query-detail contract into a small mini-program interface without letting UI, routing, identity, or backend details enter the core or business module.

`@hia-uview/biz-core` 在没有呈现层依赖的前提下组合调用方提供的声明和 port。`@hia-uview/ui` 当前以 `0.0.0` 提供 private、未发布的 UniApp Vue 组件；它尚不是可从 registry 安装或具备版本化外部承诺的依赖。需要一个应用 shell，把中性目录—查询—详情契约投影为小型小程序界面，同时不让 UI、路由、身份或后端细节进入 core 或业务模块。

## Decision / 决定

1. The application shell is a separate Biz package and has no Vue, UniApp, transport, storage, or identity-provider dependency. It consumes only a successful Biz composition, a declared route projection, a caller-provided mock session, and a declarative screen-capability policy.
2. Navigation is an in-memory screen-state projection. Only declared screens and actions may change it. The shell creates no URL, deep link, router history, `uni.navigate*` call, global store, persisted state, or dynamic screen/block import.
3. Permission is a mock capability check. It consumes declared capability strings and returns a stable allow or deny observation; it neither infers identity nor implements accounts, tokens, cookies, WeChat, enterprise identity, or authorization protocols.
4. The UniApp fixture consumes HIA-uView through named imports and an explicit style entry only. It does not install the global `UView` plugin, auto-register components, inject styles, or create a UI global service.
5. The fixture resolves `@hia-uview/ui` only during an explicit local build. The operator supplies a trusted local source root; the build verifies package identity, package version, license, and a recorded Git commit before Vite resolves the import. The public Biz manifest has no external `file:` dependency or machine path, so a normal clone does not silently require an adjacent HIA-uView checkout.
6. The supported fixture target is compile-only UniApp Vue 3 `mp-weixin`. Its compiler and documentation dependencies are exact development dependencies with a committed lockfile and explicit risk disclosure. No development server, watch process, external CI/service, release, device, accessibility-tree, App, H5, or other platform support follows from this fixture.

1. 应用 shell 是独立 Biz 包，不依赖 Vue、UniApp、传输、存储或身份提供方。它只消费成功的 Biz composition、已声明 route projection、调用方提供的 mock session 与声明式 screen-capability policy。
2. 导航是内存 screen-state 投影。只有已声明 screen 和 action 可以改变它。shell 不创建 URL、deep link、router history、`uni.navigate*` 调用、global store、持久状态或动态 screen/block import。
3. 权限是 mock capability 检查。它消费已声明 capability 字符串并返回稳定 allow 或 deny 观察；它不推断身份，也不实现账户、token、cookie、微信、企业身份或授权协议。
4. UniApp fixture 只通过 named import 和显式 style entry 消费 HIA-uView。它不安装全局 `UView` plugin、不自动注册组件、不注入样式，也不创建 UI global service。
5. fixture 仅在显式本地构建时解析 `@hia-uview/ui`。operator 提供受信任的 local source root；build 在 Vite 解析 import 前校验 package identity、package version、license 和已记录 Git commit。公开 Biz manifest 不含仓外 `file:` dependency 或机器路径，因此普通 clone 不会静默要求相邻 HIA-uView checkout。
6. 受支持 fixture target 是 compile-only UniApp Vue 3 `mp-weixin`。其 compiler 与 documentation dependency 是具有 committed lockfile 和明确风险披露的精确 development dependency。该 fixture 不推出 development server、watch process、external CI/service、release、device、accessibility tree、App、H5 或其他平台支持。

## Consequences / 后果

The fixture remains reproducible only when its documented trusted local UI source is present at the recorded commit. A changed UI commit, package identity, local-source protocol, compiler/documentation dependency, or request for a published UI package requires a new review and an ADR update. The application remains backend-agnostic: real adapters and identity remain outside this decision.

fixture 只有在其文档化的 trusted local UI source 以已记录 commit 存在时才可复现。UI commit、package identity、local-source protocol、compiler/documentation dependency 的变化，或对已发布 UI package 的请求，都需要新的审查与 ADR 更新。应用仍保持 backend-agnostic：真实 adapter 与身份不属于本决定。

## Rejected alternatives / 未采用方案

- A public `file:` dependency to an adjacent workspace: it would make ordinary clones depend on an undocumented machine layout.
- Copying HIA-uView components into Biz: it would duplicate UI ownership and bypass the package-consumption boundary.
- A global plugin, automatic style injection, router, or persisted store: each would introduce hidden lifecycle or platform behavior before its own contract exists.
- Treating compiler output as runtime, device, accessibility, security, or release evidence: compilation proves only the constrained compiler path.

- 公开 `file:` dependency 指向相邻工作区：它会让普通 clone 依赖未文档化的机器布局。
- 将 HIA-uView 组件复制进 Biz：它会重复 UI 所有权并绕过 package-consumption 边界。
- 全局 plugin、自动 style injection、router 或持久 store：它们都会在自身契约存在前引入隐藏 lifecycle 或平台行为。
- 将 compiler output 当作 runtime、device、accessibility、安全或 release 证据：编译只证明受限 compiler path。
