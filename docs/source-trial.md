# Local source trial / 本地 source trial

## Current status / 当前状态

HIA-uView-Biz currently offers a local source trial, not a published package release. Every workspace package is a private development package at version `0.0.0`. A trial identifies the reviewed Git commit being evaluated; it does not create a SemVer release, registry package, consumer-installation promise, Git release, or mini-program publication.

HIA-uView-Biz 当前提供 local source trial，而不是已发布的 package release。每个 workspace package 都是版本 `0.0.0` 的 private development package。trial 标识正在评估的已复审 Git commit；它不会创建 SemVer release、registry package、consumer-installation promise、Git release 或小程序 publication。

Use this guide only for a trusted local checkout and deterministic fixture data. Do not provide secrets, cookies, tokens, production records, absolute paths, or external source contents in a trial receipt or feedback report.

本指南只适用于 trusted local checkout 与确定性 fixture data。不得在 trial receipt 或 feedback report 中提供 secret、cookie、token、production record、absolute path 或 external source content。

## 1. Record the candidate / 记录 candidate

Start from a clean checkout on the reviewed commit. Record the commit identifier privately or in a sanitized feedback report together with the Node and npm versions; do not substitute a package version for the commit identity.

从已复审 commit 的 clean checkout 开始。将 commit identifier 与 Node、npm version 一同记录在私有资料或脱敏 feedback report 中；不要用 package version 代替 commit identity。

## 2. Run the local baseline / 运行 local baseline

Use Node.js 22 or later and npm 10 or later. Install the committed graph without lifecycle scripts, then run the named trial command:

使用 Node.js 22 或更高版本与 npm 10 或更高版本。以不执行 lifecycle script 的方式安装 committed graph，然后运行命名的 trial command：

```bash
npm ci --ignore-scripts
npm run trial:source
```

`trial:source` runs `doctor`, the deterministic Node/ROP/documentation suite, and the offline release-quality gate. It does not install during the command, modify package metadata, select a UI source, start a service, access a network, control a simulator, publish a package, or create another external state.

`trial:source` 运行 `doctor`、确定性 Node/ROP/documentation suite 与 offline release-quality gate。该 command 不会在运行中安装内容、修改 package metadata、选择 UI source、启动 service、访问 network、控制 simulator、发布 package 或创建其他外部状态。

## 3. Optionally verify the fixture compilation / 可选验证 fixture compilation

Compilation is separate because it needs an operator-supplied, reviewed local HIA-uView UI source. Set the source only in the current shell and run the documented verifier:

由于 compilation 需要 operator-supplied、已复审的 local HIA-uView UI source，因此它是独立步骤。只在当前 shell 中设置该 source，然后运行文档化 verifier：

```powershell
$env:HIA_UVIEW_UI_ROOT = 'path-to-reviewed-ui-package'
npm run verify:fixture:mp-weixin
```

The verifier performs one controlled build and validates its documented output. It does not discover a sibling repository, start a development server, open WeChat DevTools, preview, upload, submit, publish, or connect a backend.

verifier 执行一次受控 build 并校验其文档化 output。它不发现 sibling repository、不启动 development server、不打开微信开发者工具、不 preview、不 upload、不 submit、不 publish，也不连接 backend。

## 4. Optional simulator rehearsal / 可选 simulator rehearsal

If WeChat DevTools is already available and the operator explicitly chooses to use it, import the generated `mp-weixin` output as a local project. Use only the representative deterministic fixture and verify the documented query → detail → back flow. Record whether the simulator reports a new application error or warning after clearing prior tool logs; tool SDK or system messages must be distinguished from application messages.

如果微信开发者工具已经可用且 operator 明确选择使用它，可以将生成的 `mp-weixin` output 作为 local project 导入。只使用代表性确定性 fixture，并验证文档化的 query → detail → back 流程。清除先前 tool log 后，记录 simulator 是否报告新的 application error 或 warning；必须区分 tool SDK/system message 与 application message。

Do not use this step to preview, upload, submit, publish, connect a real backend, sign in a real user, or enter real business data. Simulator success is limited to the recorded local interaction; it does not prove device behavior, review acceptance, accessibility, performance, security, or production readiness.

不得使用该步骤 preview、upload、submit、publish、连接真实 backend、登录真实用户或输入真实业务 data。simulator success 仅限已记录的 local interaction；它不证明 device behavior、review acceptance、accessibility、performance、security 或 production readiness。

## 5. Record a sanitized receipt / 记录脱敏 receipt

Record the following bounded facts:

记录以下受限事实：

| Record / 记录项 | Include / 应包含 | Exclude / 不得包含 |
| --- | --- | --- |
| Candidate | Biz commit identifier; clean/dirty result | absolute checkout path; unrelated branch history |
| Baseline | Node/npm major versions; command pass/fail summaries | full environment dump; credentials; dependency-cache paths |
| Optional compiler | reviewed UI source commit and verifier result | UI source path; source contents; unrelated repository metadata |
| Optional simulator | fixture mode, query/detail/back result, new application error/warning status | screenshots containing sensitive data; tool account data; personal identifiers |
| Feedback | minimal sanitized reproduction and known limitations | cookie, token, secret, production record, large source dump |

Use the [support guide](support.md) and its static issue templates only when external feedback is appropriate. They define an intake shape; they do not guarantee that an issue workflow, response time, or security channel is available.

仅在适合 external feedback 时使用[支持指南](support.md)及其 static issue template。它们定义 intake shape；不保证 issue workflow、response time 或 security channel 可用。

## Stop and rollback / 停止与回退

Stop the trial if a baseline check fails, the reviewed UI source cannot be verified, an application error appears in the controlled simulator flow, or the work would require package publication, real data, a real backend, user identity, deployment, or an external service.

如果 baseline check 失败、已复审 UI source 无法验证、受控 simulator flow 出现 application error，或工作将需要 package publication、真实 data、真实 backend、用户 identity、deployment 或 external service，应停止 trial。

Because this is a source trial, rollback means selecting a previously reviewed Git commit and discarding or regenerating local build output. There is no package unpublish, registry rollback, mini-program rollback, database rollback, or production-data cleanup in this guide.

由于这是 source trial，rollback 是选择先前已复审的 Git commit，并丢弃或重新生成 local build output。本指南中不存在 package unpublish、registry rollback、小程序 rollback、database rollback 或 production-data cleanup。

For the complete decision boundary, see [ADR-0009](adr/ADR-0009-local-source-trial-and-release-boundary.md). For first-time checkout evaluation, see the [adoption guide](adoption.md) and [doctor reference](doctor.md).

完整 decision boundary 参见 [ADR-0009](adr/ADR-0009-local-source-trial-and-release-boundary.md)。首次 checkout evaluation 参见[采用指南](adoption.md)和 [doctor reference](doctor.md)。
