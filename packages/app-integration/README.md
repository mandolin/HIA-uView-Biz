# Application integration / 应用集成

`@hia-uview/biz-app-integration` validates one versioned application-template manifest, one complete adoption profile, and one complete caller-supplied capability-unit set. It adopts the candidate through the existing adoption runtime and exposes a shell bridge fixed to the template's primary module.

`@hia-uview/biz-app-integration` 校验一个版本化 application-template manifest、一个完整 adoption profile 与一组完整的调用方显式 capability units。它通过既有 adoption runtime 采用候选，并暴露固定到 template primary module 的 shell bridge。

The package performs no file or package discovery, JSON/YAML loading, npm installation, dynamic import, network, environment, storage, credential, component loading, code generation, or template copying.

本包不执行文件或 package discovery、JSON/YAML 加载、npm 安装、动态 import、网络、环境、storage、credential、组件加载、代码生成或模板复制。

See the [application-template contract](../../docs/contracts/application-template.md) and [ADR-0006](../../docs/adr/ADR-0006-application-template-and-explicit-adapter-integration.md).

详见 [application-template 契约](../../docs/contracts/application-template.md)与 [ADR-0006](../../docs/adr/ADR-0006-application-template-and-explicit-adapter-integration.md)。
