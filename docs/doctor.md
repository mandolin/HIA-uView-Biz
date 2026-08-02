# Doctor reference / Doctor 参考

## Command / 命令

Run the local readiness report from the repository root:

在 repository root 运行本地 readiness report：

```bash
npm run doctor
npm run doctor -- --json
```

The default report is intended for people. `--json` emits a versioned, JSON-safe report for a sanitized issue or local automation. It accepts no other argument.

默认 report 面向人。`--json` 输出版本化、JSON-safe 的 report，可用于脱敏 issue 或本地 automation。它不接受其他 argument。

## What it checks / 检查内容

`doctor` checks the current Node version, the npm version supplied by the npm-script environment, the committed root lockfile, the local `node_modules` directory, and the checked-in checkout-first consumer manifest/profile. It reports a stable check ID, severity, and short remediation direction without returning an absolute path, dependency tree, credential, external source identity, or application data. It only checks the two consumer inputs for presence; it does not execute the consumer.

`doctor` 检查当前 Node version、npm-script environment 提供的 npm version、已提交 root lockfile、本地 `node_modules` directory 和仓内 checkout-first consumer manifest/profile。它报告稳定 check ID、severity 和简短 remediation direction，不返回绝对路径、dependency tree、credential、外部 source identity 或 application data。它只检查两个 consumer 输入是否存在，不执行 consumer。

A failing report means only that the local prerequisite check failed. It does not install, repair, remove, update, publish, build, start a service, connect a backend, inspect an external HIA-uView checkout, or execute application runtime code.

失败 report 只表示本地 prerequisite 检查失败。它不安装、不修复、不删除、不更新、不 publish、不 build、不启动 service、不连接 backend、不检查外部 HIA-uView checkout，也不执行 application runtime code。

## Follow-up / 后续步骤

For a ready report, run `npm run verify:consumer` and the deterministic evidence in [development notes](development.md). To include an optional UI fixture compile/output check, follow the explicit local-source procedure in the [adoption guide](adoption.md); doctor intentionally does not discover or read that source.

对 ready report，请运行 `npm run verify:consumer` 和[开发说明](development.md)中的确定性证据。若要加入可选 UI fixture compile/output 检查，请遵循[采用指南](adoption.md)中的显式 local-source 流程；doctor 有意不发现或读取该 source。

For a failing report, correct the local prerequisite manually and rerun doctor. Do not interpret doctor output as a release decision, package-installation proof, device validation, security certification, or compatibility guarantee.

对于失败 report，请手工修正本地 prerequisite 后重新运行 doctor。不要将 doctor output 解释为 release decision、package-installation proof、device validation、安全认证或 compatibility guarantee。
