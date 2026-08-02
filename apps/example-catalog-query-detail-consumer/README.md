# Checkout-first consumer fixture / Checkout-first consumer fixture

This isolated private workspace app demonstrates how a consumer can own a versioned manifest/profile and explicitly inject local provider ports while consuming the existing application-template and integration contracts. It is a source-checkout acceptance fixture, not a published package, generator, automatic migration, industry starter, production adapter, or real identity example.

这个隔离的私有 workspace app 用于演示 consumer 如何拥有版本化 manifest/profile，并在消费既有 application-template 与 integration 契约时显式注入本地 provider port。它是 source-checkout 验收 fixture，不是已发布包、生成器、自动迁移工具、行业 starter、生产 adapter 或真实身份示例。

The consumer owns `src/consumer.manifest.json` and `src/consumer.profile.json`. The runtime receives these parsed plain-data values explicitly; it does not discover files, packages, routes, URLs, scripts, credentials, or backend settings. Provider declarations and mock implementations are also owned by the consumer fixture and remain synchronous, in-process, and deterministic.

consumer 自有 `src/consumer.manifest.json` 与 `src/consumer.profile.json`。runtime 必须显式接收解析后的 plain-data，不发现文件、package、route、URL、脚本、credential 或后端设置。provider declaration 与 mock implementation 也由 consumer fixture 自有，并保持同步、进程内和确定性。

## Verification / 验证

From the Biz source checkout, run:

在 Biz source checkout 根目录运行：

```text
npm run verify:consumer
```

The command reads only the two checked-in JSON inputs, executes the local consumer fixture, and verifies query/detail, provider success/failure, write rollback, and redacted observations. It creates no server, network request, DevTools session, device connection, upload, release, or persistent state.

该命令只读取两个仓内 JSON 输入，执行本地 consumer fixture，并验证 query/detail、provider success/failure、写回退和脱敏 observation。它不创建 server、网络请求、DevTools 会话、设备连接、上传、发布或持久状态。

The existing controlled `mp-weixin` compiler fixture remains a separate compile-only evidence path. Passing this consumer check does not prove DevTools import, device behavior, accessibility conformance, real backend integration, or production readiness.

已有受控 `mp-weixin` compiler fixture 仍是独立的 compile-only 证据路径。consumer 检查通过不证明 DevTools 导入、设备行为、无障碍符合性、真实后端集成或生产就绪。
