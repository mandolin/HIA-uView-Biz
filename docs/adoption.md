# Adoption guide / 采用指南

## Who this is for / 适用对象

HIA-uView-Biz currently supports maintainers and secondary developers who want to evaluate its explicit capability-composition model from a source checkout. It is not yet a registry-installable framework, a production starter, or a promise that an existing UniApp project can be converted automatically.

HIA-uView-Biz 当前面向希望从 source checkout 评估其显式能力组合模型的维护者和二次开发者。它尚不是可从 registry 安装的框架、生产 starter，也不承诺可自动转换已有 UniApp 项目。

All current workspace packages are private development packages at `0.0.0`. The representative application and its application template are engineering fixtures, not generated applications or published industry packages.

所有当前 workspace package 都是版本 `0.0.0` 的 private 开发 package。代表性 application 和 application template 是工程 fixture，不是生成的 application 或已发布的行业 package。

## Start with the baseline / 从基线开始

Use Node.js 22 or later and npm 10 or later. From a checkout of this repository, install the committed dependency graph without lifecycle scripts and run the deterministic evidence:

使用 Node.js 22 或更高版本和 npm 10 或更高版本。在本仓 checkout 中，以不执行 lifecycle script 的方式安装已提交 dependency graph，并运行确定性证据：

```bash
npm ci --ignore-scripts
npm run doctor
npm test
npm run quality:release-candidate
```

`doctor` reports local readiness only. `npm test` runs workspace, bilingual ROP, documentation-privacy, and deterministic Node contracts. `quality:release-candidate` is a static local policy check. A passing result from any command is not package publication, consumer-installation, security certification, accessibility certification, or device compatibility evidence.

`doctor` 只报告本地 readiness。`npm test` 运行 workspace、双语 ROP、文档隐私和确定性 Node contract。`quality:release-candidate` 是静态本地 policy 检查。任一 command 的通过结果都不是 package publication、consumer-installation、安全认证、无障碍认证或设备兼容性证据。

## Evaluate the representative fixture / 评估代表性 fixture

The only current UniApp integration surface is `apps/example-catalog-query-detail-mp-weixin/`. It consumes a versioned application template, mandatory mock or explicit injected-wire candidate, and an operator-provided local HIA-uView UI source. The source is checked for package identity, version, license, and reviewed commit before compilation.

当前唯一的 UniApp 集成表面是 `apps/example-catalog-query-detail-mp-weixin/`。它消费版本化 application template、必备 mock 或显式 injected-wire candidate，以及由操作者提供的本地 HIA-uView UI source。该 source 会在 compilation 前核验 package identity、version、license 和已复审 commit。

To run the optional compile/output verification, explicitly set `HIA_UVIEW_UI_ROOT` to the reviewed UI package directory in the current shell, then run:

要运行可选 compile/output verification，请在当前 shell 中显式将 `HIA_UVIEW_UI_ROOT` 设置为已复审的 UI package directory，然后运行：

```powershell
$env:HIA_UVIEW_UI_ROOT = 'path-to-reviewed-ui-package'
npm run verify:fixture:mp-weixin
```

The command builds once and checks documented output files. It does not start a development server, open WeChat DevTools, run a simulator or device, preview, upload, publish, connect a backend, or inspect a sibling repository automatically.

该 command 只构建一次并检查文档化的 output file。它不启动 development server、不打开微信开发者工具、不运行 simulator 或 device、不 preview、不 upload、不 publish、不连接 backend，也不自动检查同级 repository。

## Choose the next engineering boundary / 选择下一项工程边界

Begin a new application by keeping four artifacts separate: a business-module contract, an implementation package, an adoption profile, and an application/template profile. Supply providers and capability units explicitly in reviewed code. Keep presentation code compiled and registered by the host; use stable allowlisted IDs in metadata rather than component paths, package names, callbacks, or executable configuration.

开始新 application 时，保持四类 artifact 分离：business-module contract、implementation package、adoption profile 与 application/template profile。在已复审 code 中显式提供 provider 和 capability unit。保持 presentation code 由 host 编译和注册；在 metadata 中使用稳定 allowlisted ID，而不是 component path、package name、callback 或可执行 configuration。

The current framework does not supply real transport, identity, storage, write flow, router/deep-link, dynamic component, remote configuration, package discovery, installer, generator, or migration engine. Design each such boundary separately before adding it.

当前框架不提供真实 transport、identity、storage、write flow、router/deep-link、dynamic component、remote configuration、package discovery、installer、generator 或 migration engine。加入这些边界前必须分别设计。

An explicit candidate replacement is limited to one current process: it is not a package upgrade or a persistent migration.
Use the [lifecycle and selection-transition boundary](lifecycle-transition.md) to distinguish contract shape versions,
in-memory replacement receipts, and manual source-checkout rollback.

显式 candidate replacement 仅限于当前进程：它不是 package upgrade 或 persistent migration。请使用[生命周期与选择过渡边界]
(lifecycle-transition.md) 区分 contract shape version、内存 replacement receipt 与人工 source-checkout rollback。

Continue with the [migration guide](migration.md), [doctor reference](doctor.md), [support guide](support.md), and [development notes](development.md).

接下来请阅读[migration 指南](migration.md)、[doctor 参考](doctor.md)、[support 指南](support.md)和[开发说明](development.md)。
