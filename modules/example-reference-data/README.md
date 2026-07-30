# Reference-data example capability / Reference-data 示例能力

`@hia-uview/biz-example-reference-data` provides deterministic, neutral `example.reference-data` capability units for local contract and adoption fixtures. It owns a read-only `reference-options` port and supplies two explicitly selected fixture implementations so atomic replacement can be tested without package discovery or external state.

`@hia-uview/biz-example-reference-data` 为本地契约与采用 fixture 提供确定性、中性的 `example.reference-data` capability unit。它拥有只读 `reference-options` port，并提供两个显式选择的 fixture 实现，从而无需 package discovery 或外部状态即可测试原子替换。

The option identifiers and bilingual labels are independently written test data. They are not an industry dictionary, production master data, user preference, CMS content, or a backend response. The package performs no network, file, environment, storage, credential, dynamic-import, lifecycle-hook, UI, or route operation.

option 标识与双语 label 均为独立编写的测试数据。它们不是行业字典、生产主数据、用户偏好、CMS 内容或后端响应。本包不执行网络、文件、环境、storage、credential、动态 import、lifecycle hook、UI 或 route 操作。

`fixture-v1` and `fixture-v2` implement the same `reference-data.options@1.0` contract. Selecting v2 demonstrates an explicitly supplied implementation replacement; it is not a published package upgrade or a persistent-data migration.

`fixture-v1` 与 `fixture-v2` 实现相同的 `reference-data.options@1.0` 契约。选择 v2 用于演示显式提供的实现替换；它不是已发布 package 升级或持久化数据迁移。
