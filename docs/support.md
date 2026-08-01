# Support and feedback / 支持与反馈

## Before opening a report / 提交报告前

Use the current checkout and first run the smallest relevant command:

使用当前 checkout，并先运行最小相关 command：

```bash
npm run doctor -- --json
npm test
npm run quality:release-candidate
```

For the optional representative `mp-weixin` compile/output path, run `npm run verify:fixture:mp-weixin` only with an explicitly supplied reviewed local UI source. Do not start a development server or attach output from untrusted input merely to prepare a report.

对于可选代表性 `mp-weixin` compile/output 路径，只能在显式提供已复审本地 UI source 时运行 `npm run verify:fixture:mp-weixin`。不要为了准备报告而启动 development server 或附加来自不可信 input 的 output。

## Choose a template / 选择模板

Use the repository's bug-report template for a deterministic failure, or the adoption-feedback template for a documentation, migration-boundary, or evaluation question. These templates are static repository files; they do not guarantee that an issue tracker, response time, triage automation, or support service is available.

对于确定性 failure，请使用仓库的 bug-report template；对于 documentation、migration-boundary 或 evaluation 问题，请使用 adoption-feedback template。这些 template 是静态 repository file；它们不保证 issue tracker、响应时间、triage automation 或 support service 可用。

## Include only minimal sanitized evidence / 只包含最小脱敏证据

Include the repository commit or release identifier, Node/npm versions, one target platform, the exact safe command, expected/actual outcome, and a short minimized reproduction. A `doctor --json` result may be included because it is designed to avoid host paths and external source identity.

请包含 repository commit 或 release identifier、Node/npm version、一个 target platform、精确且安全的 command、expected/actual outcome 以及简短最小复现。可以包含 `doctor --json` 结果，因为它被设计为避免 host path 和外部 source identity。

Do not include tokens, cookies, credentials, personal data, production records, private repository URLs, absolute paths, unredacted request/response bodies, UI-source locations, or large source archives. Do not use a public issue template for a suspected security vulnerability; obtain a private reporting channel from the project maintainer first.

不要包含 token、cookie、credential、personal data、production record、private repository URL、绝对路径、未脱敏 request/response body、UI-source location 或大型 source archive。不要使用公开 issue template 报告疑似 security vulnerability；请先从 project maintainer 获取私有报告 channel。

## Current support boundary / 当前支持边界

The project can currently evaluate deterministic contracts, the local doctor, quality gate, and the documented compile/output fixture boundary. It does not yet provide production migration assistance, real backend or identity support, package installation support, device debugging, data recovery, security incident response, or service-level commitments.

项目当前可以评估确定性 contract、本地 doctor、quality gate 和文档化的 compile/output fixture 边界。它尚不提供生产 migration 协助、真实 backend 或 identity 支持、package installation 支持、device debugging、data recovery、security incident response 或服务级承诺。
