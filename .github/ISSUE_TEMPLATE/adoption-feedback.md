---
name: Adoption or migration feedback
about: Ask a bounded evaluation, documentation, or migration-boundary question
title: "[adoption] "
labels: "documentation"
---

## Goal / 目标

Describe one user-visible capability you are evaluating, not a whole application rewrite.

说明正在评估的一个用户可见 capability，而不是整个 application rewrite。

## Current and target boundary / 当前与目标边界

- Source framework family and version / Source framework family 和 version：
- Target platform / Target platform：
- Current non-sensitive input/output shape / 当前非敏感 input/output shape：
- Intended Biz boundary / 预期 Biz boundary：

## Evidence already run / 已运行证据

- [ ] `npm run doctor -- --json`
- [ ] `npm test`
- [ ] `npm run quality:release-candidate`

## Question / 问题

Ask for one documented boundary or next engineering step. Do not request an automatic conversion, data migration, production rollout, or a compatibility promise.

询问一个已文档化边界或下一项工程步骤。不要请求自动转换、data migration、production rollout 或 compatibility 承诺。

## Privacy checklist / 隐私检查

- [ ] No token, cookie, credential, personal data, production record, absolute path, or private repository URL is included.
- [ ] 未包含 token、cookie、credential、personal data、production record、绝对路径或 private repository URL。
- [ ] No unredacted transport payload, UI-source location, or large source archive is included.
- [ ] 未包含未脱敏 transport payload、UI-source location 或大型 source archive。
