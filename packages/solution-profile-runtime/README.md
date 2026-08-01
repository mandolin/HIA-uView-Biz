# Solution-profile runtime / Solution profile runtime

`@hia-uview/biz-solution-profile-runtime` resolves one versioned solution profile against an explicit, checked-in capability-package registry and an anonymous mock-session grant set. It returns only dependency-first capability availability, required business-module IDs, and safe solution metadata.

`@hia-uview/biz-solution-profile-runtime` 将一个带版本 solution profile 与显式、仓内固定的 capability-package registry 和 anonymous mock-session grant 集合进行解析。它只返回依赖优先的 capability 可用性、所需业务 module ID 与安全的 solution metadata。

It is a pure data resolver. It does not discover, read, install, import, or execute packages; access a filesystem, network, environment, storage, credential, provider, component, template, script, or backend; or implement real identity, authorization, token handling, tenancy, persistence, writes, deployment, or release behavior.

它是纯数据 resolver。它不发现、读取、安装、import 或执行 package；不访问文件系统、网络、环境、storage、credential、provider、组件、模板、脚本或后端；也不实现真实身份、授权、token 处理、租户、持久化、写操作、部署或发布行为。

See the [solution-profile contract](../../docs/contracts/solution-profile.md) for artifact ownership and bounded mock-session semantics.

详见 [solution-profile 契约](../../docs/contracts/solution-profile.md)，了解产物主责与受限 mock-session 语义。
