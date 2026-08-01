---
name: Deterministic bug report
about: Report a reproducible repository-local failure
title: "[bug] "
labels: "bug"
---

## Summary / 摘要

Describe one deterministic failure and the expected versus actual outcome.

说明一个确定性 failure，以及 expected 与 actual outcome。

## Safe environment facts / 安全环境事实

- Repository commit or release / Repository commit 或 release：
- Node version / Node 版本：
- npm version / npm 版本：
- Target platform / Target platform：
- Safe command / 安全 command：

## Minimal reproduction / 最小复现

List only the smallest non-sensitive steps and sanitized output required to reproduce the result.

只列出复现结果所需的最小非敏感步骤和脱敏 output。

## Expected and actual / 预期与实际

State the expected result and the actual result.

说明预期结果和实际结果。

## Privacy checklist / 隐私检查

- [ ] No token, cookie, credential, personal data, production record, absolute path, or private repository URL is included.
- [ ] 未包含 token、cookie、credential、personal data、production record、绝对路径或 private repository URL。
- [ ] No unredacted request/response body or large source archive is included.
- [ ] 未包含未脱敏 request/response body 或大型 source archive。
- [ ] `doctor --json` output is included only if it is relevant and unchanged.
- [ ] 仅在相关且未修改时包含 `doctor --json` output。
