# Catalog application template / 目录应用模板

`@hia-uview/biz-example-catalog-query-detail-template` is the private workspace package for the neutral `mp-weixin` application template. It returns a versioned declarative template and a complete, explicit adoption candidate for either the mandatory mock or the injected-wire fixture.

`@hia-uview/biz-example-catalog-query-detail-template` 是中性 `mp-weixin` 应用模板的私有工作区包。它返回版本化声明式模板，以及面向必备 mock 或 injected-wire fixture 的完整显式采用候选。

The factory performs no package discovery, file loading, network access, backend selection, credential handling, dynamic import, script execution, or source fallback. The caller must explicitly supply the same enabled compiled blocks and their duplicate-free complete order; the factory carries only that bounded metadata into its presentation profile. Its output remains separate from the representative app profile and from all business/implementation manifests.

该工厂不执行 package discovery、文件加载、网络访问、后端选择、credential 处理、动态 import、脚本执行或 source fallback。调用方必须显式提供同一批 enabled 已编译区块及其无重复完整排序；工厂只把这份受限 metadata 带入 presentation profile。其输出与代表性 app profile 以及所有 business/implementation manifest 保持分离。

See the [application-template contract](../../docs/contracts/application-template.md) and [ADR-0006](../../docs/adr/ADR-0006-application-template-and-explicit-adapter-integration.md).

详见 [application-template 契约](../../docs/contracts/application-template.md)与 [ADR-0006](../../docs/adr/ADR-0006-application-template-and-explicit-adapter-integration.md)。
