# Release-quality candidate / 发布质量候选

## Purpose / 目的

`npm run quality:release-candidate` is an offline static gate for the current repository. It records a bounded release-quality candidate result; it is not a release, publication, upload, compliance certificate, or production-security conclusion.

`npm run quality:release-candidate` 是当前仓库的离线静态门禁。它记录一个受限的发布质量候选结果；它不是 release、publication、upload、合规证书或生产安全结论。

Run it after the baseline Node acceptance:

在基线 Node 验收后运行：

```bash
npm test
npm run quality:release-candidate
```

The gate reads package metadata and controlled repository text only. It does not install dependencies, start a service, execute application runtime, access a network service, create an archive, publish an npm package, upload a mini-program, or invoke an external CI system.

该门禁只读取 package metadata 与受控仓库文本。它不安装依赖、不启动服务、不执行应用 runtime、不访问网络服务、不创建 archive、不发布 npm package、不上传小程序，也不调用外部 CI 系统。

## Checked boundary / 检查边界

The current gate verifies declared package metadata and dependency shape, controlled package-content policy, absence of disallowed binary/font or CSS remote assets, public-text boundary markers, prohibited runtime capabilities, and absence of automatic publication controls. Its policies are explicit in the checked-in script and are deliberately narrow enough for human review.

当前门禁验证已声明的 package metadata 与 dependency shape、受控 package-content policy、禁止的二进制/字体或 CSS remote asset 缺失、公开文本边界标记、被禁止的 runtime capability，以及自动 publication control 缺失。其 policy 明确写在已提交脚本中，并刻意保持足够窄以便人工复核。

`npm test` remains the deterministic contract suite. `npm run verify:fixture:mp-weixin` remains an optional local compiler check and requires an operator-supplied, reviewed local UI source. Compiler success confirms only the explicitly documented compile/output checks.

`npm test` 仍是确定性契约套件。`npm run verify:fixture:mp-weixin` 仍是可选的本地 compiler 检查，并要求操作者提供已复审的本地 UI source。compiler 成功只确认文档中明确列出的 compile/output 检查。

## Current limitations / 当前限制

This repository has not yet performed publication, WeChat upload, device/simulator validation, browser acceptance, external CI execution, runtime penetration testing, formal accessibility audit, SBOM publication, or release-provenance verification. Do not imply any of those results from a passing local gate.

本仓尚未执行 publication、微信上传、设备/模拟器验证、浏览器验收、外部 CI 执行、runtime 渗透测试、正式无障碍审计、SBOM 发布或 release-provenance 验证。不得从本地门禁通过推断出任何上述结果。

The committed development dependency graph has accepted development-only advisories for trusted local, compile-only work. It must not process untrusted input, and any compiler, lockfile, package metadata, vulnerability, license, or UI-source change requires renewed review. Do not use unreviewed `npm audit fix` commands as a repair mechanism.

已提交开发 dependency graph 对受信任本地、仅编译工作存在已接受的仅开发期 advisory。它不得处理不可信输入；任何 compiler、lockfile、package metadata、vulnerability、license 或 UI-source 变化都需要重新复审。不得使用未经复审的 `npm audit fix` 命令作为修复机制。

See [ADR-0007](adr/ADR-0007-release-quality-candidate-boundary.md) and the [development notes](development.md) for the boundary and current commands.

有关边界与当前命令，参见 [ADR-0007](adr/ADR-0007-release-quality-candidate-boundary.md) 和[开发说明](development.md)。
