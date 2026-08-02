# Checkout-first consumer contract / Checkout-first consumer 契约

This contract describes a source-checkout consumer that explicitly owns a manifest/profile and injects provider ports into the Biz runtime. It is a bounded adoption example for local evaluation; it is not registry installation, automatic scaffolding, an industry package, production authorization, or backend integration.

本契约描述一个从 source checkout 运行的 consumer：它显式拥有 manifest/profile，并向 Biz runtime 注入 provider port。它是受限的本地评估采用示例，不是 registry 安装、自动脚手架、行业包、生产授权或后端集成。

## Inputs / 输入

The consumer supplies parsed plain-data `manifest` and `profile` to `createCheckoutFirstConsumerFixture`. The manifest is fixed by [consumer manifest schema](schemas/consumer.manifest.v1.schema.json) and the profile uses the existing versioned application-profile shape. Neither input contains a URL, endpoint, token, credential reference, script, path, route, dependency specifier, or connection.

consumer 将解析后的 plain-data `manifest` 与 `profile` 传给 `createCheckoutFirstConsumerFixture`。manifest 由 [consumer manifest schema](schemas/consumer.manifest.v1.schema.json) 固定，profile 使用已有版本化 application-profile shape。两者都不包含 URL、endpoint、token、credential reference、script、path、route、dependency specifier 或 connection。

The consumer fixture owns four explicit P45 provider declarations: session, optional in-memory storage, read, and write. All providers are `injected-sync`, credential mode `none`, and local-only. A real identity, HTTP client, Directus adapter, persistent storage, or remote executor is outside this contract.

consumer fixture 自有四个显式 P45 provider declaration：session、可选内存 storage、read 和 write。所有 provider 均为 `injected-sync`、credential mode `none` 且仅限本地。真实身份、HTTP client、Directus adapter、持久化 storage 或 remote executor 不属于本契约。

## Evidence / 证据

The isolated fixture verifies template/profile correspondence before provider invocation, then exercises catalog query/detail through the application shell and session/storage/read/write through the provider host. Failure output is normalized and redacted; write rollback remains local and does not imply database transaction semantics.

隔离 fixture 在 provider 调用前验证 template/profile 对应关系，再通过 application shell 执行目录 query/detail，并通过 provider host 执行 session/storage/read/write。失败输出会归一化并脱敏；写回退仍是本地语义，不代表数据库事务。

Run `npm run verify:consumer` from the Biz checkout. The command reads only checked-in consumer JSON and emits stable success text. It does not create a server, open a network connection, start WeChat DevTools, upload, publish, or touch external project files.

在 Biz checkout 根目录运行 `npm run verify:consumer`。该命令只读取仓内 consumer JSON，并输出稳定成功文本。它不创建 server、打开网络连接、启动微信开发者工具、上传、发布或修改外部项目文件。
