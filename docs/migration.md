# Migration guide / 迁移指南

## Current migration promise / 当前迁移承诺

HIA-uView-Biz currently provides no automatic migration, codemod, compatibility shim, project copier, data converter, or production-upgrade tool. This applies equally to applications based on uView, uView2, uView-Pro, uview-plus, custom UniApp code, Directus, or another backend.

HIA-uView-Biz 当前不提供自动 migration、codemod、compatibility shim、project copier、data converter 或 production-upgrade tool。这同样适用于基于 uView、uView2、uView-Pro、uview-plus、自定义 UniApp code、Directus 或其他 backend 的 application。

The framework is informed by the uView ecosystem at the presentation level, but it does not claim API, option, theme, routing, transport, session, data-model, or lifecycle compatibility with those projects.

框架在 presentation 层面受到 uView 生态启发，但不声明与这些项目的 API、option、theme、routing、transport、session、data-model 或 lifecycle compatibility。

Read the [lifecycle and selection-transition boundary](lifecycle-transition.md) before interpreting a contract version or an
in-memory candidate replacement as migration. They are separate concerns with different evidence and rollback meanings.

在把 contract version 或内存 candidate replacement 解释为 migration 前，请阅读[生命周期与选择过渡边界](lifecycle-transition.md)。
它们是具有不同证据和回退含义的独立事项。

## Use a staged manual path / 使用分阶段手工路径

1. Record the current application behavior, user-visible states, data ownership, failure modes, and rollback point before changing code.
2. 在改动 code 前，记录当前 application behavior、用户可见 state、data ownership、failure mode 和 rollback point。
3. Define a neutral business-module contract for one read-only capability. Keep industry fields, existing HTTP/token conventions, Directus collection details, and production data outside the first contract.
4. 为一个只读 capability 定义中性 business-module contract。将行业字段、现有 HTTP/token convention、Directus collection detail 和生产 data 排除在首个 contract 之外。
5. Supply one explicit local implementation and provider in reviewed code. Use the mandatory mock first; add an injected-wire implementation only after its adapter boundary is designed and tested.
6. 在已复审 code 中提供一个显式本地 implementation 和 provider。先使用必备 mock；只有在 adapter boundary 经过设计和测试后才加入 injected-wire implementation。
7. Declare adoption and application/template profiles separately. Do not put business semantics, package metadata, or executable behavior into one catch-all configuration file.
8. 分别声明 adoption 与 application/template profile。不要把 business semantic、package metadata 或 executable behavior 写入一个万能 configuration file。
9. Compile host presentation from explicit components and registered block IDs. Do not mechanically rename or copy existing uView pages/components into the Biz runtime.
10. 从显式 component 和已登记 block ID 编译 host presentation。不要机械重命名或复制既有 uView page/component 到 Biz runtime。
11. Run `npm test`, `npm run quality:release-candidate`, and the optional controlled `mp-weixin` compile/output verification before considering the next capability.
12. 在考虑下一个 capability 前运行 `npm test`、`npm run quality:release-candidate` 和可选的受控 `mp-weixin` compile/output verification。

The numbered sequence is a checklist, not a data-migration workflow. It reads and writes no existing project data.

以上编号顺序是 checklist，不是 data-migration workflow。它不会读取或写入已有 project data。

## Preserve a practical rollback / 保留可操作的回退方式

Keep the existing application deployment independent until the new capability has its own reviewed contract, source-control history, and verification evidence. The in-memory implementation replacement API proves only current-process composition replacement. It does not migrate persistent data, roll back an application deployment, reverse a package release, or recover production state.

在新 capability 拥有其独立的已复审 contract、source-control history 和 verification evidence 前，保持既有 application deployment 独立。内存 implementation replacement API 只证明当前进程的 composition replacement。它不会迁移 persistent data、回退 application deployment、撤销 package release 或恢复生产 state。

If migration would require credentials, personal/production data, remote writes, schema changes, persistent state, or downtime, stop this path and create a separately authorized design with explicit consent, security, validation, and rollback requirements.

如果 migration 需要 credential、personal/production data、remote write、schema change、persistent state 或 downtime，请停止该路径并建立获得单独授权的设计，其中应包含明确 consent、安全、validation 和 rollback 要求。

## What to include in a migration question / 迁移问题应包含什么

For a sanitized question, identify the source framework family and version, the single user-visible capability, the current non-sensitive input/output shape, target platform, and commands already run. Do not attach tokens, cookies, absolute paths, production records, or a large source dump. See the [support guide](support.md).

对于脱敏问题，请说明 source framework family 和 version、单个用户可见 capability、当前非敏感 input/output shape、target platform 以及已运行的 command。不要附加 token、cookie、绝对路径、production record 或大段 source dump。详见[support 指南](support.md)。
