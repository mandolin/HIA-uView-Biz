# Modules / 模块

This directory contains optional business capability modules. Each module must have its own package metadata, public contract, configuration boundary, dependency audit, and validation evidence before it joins a default distribution path.

本目录包含可选业务能力模块。每个模块在进入默认分发路径前，都必须具有自己的包元数据、公开契约、配置边界、依赖审计和验证证据。

The current initial set contains the [neutral reference-data example](example-reference-data/README.md) and [neutral catalog-query-detail example](example-catalog-query-detail/README.md). Reference-data provides deterministic read-only options and explicit v1/v2 replacement fixtures; catalog-query-detail declares it as a business dependency. Both are fixture-only and claim no industry model, production data owner, backend, or published package.

当前首批集合包含[中性 reference-data 示例](example-reference-data/README.md)与[中性目录—查询—详情示例](example-catalog-query-detail/README.md)。reference-data 提供确定性只读 option 与显式 v1/v2 替换 fixture；catalog-query-detail 将其声明为业务依赖。两者都仅供 fixture 使用，不主张行业模型、生产数据主责、后端或已发布 package。
