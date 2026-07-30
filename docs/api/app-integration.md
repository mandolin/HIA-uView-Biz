# Application-integration API / 应用集成 API

`@hia-uview/biz-app-integration` validates one in-memory application-template manifest against one complete adoption profile and one complete caller-supplied capability-unit set. After validation, it delegates atomic candidate activation to `@hia-uview/biz-adoption-runtime` and creates an application shell fixed to the template's primary module.

`@hia-uview/biz-app-integration` 使用一个完整 adoption profile 与一组完整的调用方显式 capability units，校验一个内存 application-template manifest。校验通过后，它委托 `@hia-uview/biz-adoption-runtime` 原子启用候选，并创建固定到模板主模块的 application shell。

## `createApplicationIntegrationRuntime(options)`

`options` must have exactly three enumerable own fields:

`options` 必须精确具有三个 enumerable 自有字段：

```js
{
  template,
  profile,
  units
}
```

The factory validates the complete template shape, exact adoption-profile ID, exact slot/module correspondence, required state, selected implementation, and required implementation surfaces before candidate adoption. It then validates the complete candidate through the adoption runtime and creates the shell last. A failure returns only `ok: false` and bounded bilingual diagnostics; it never returns a partial shell, unit, provider, profile, raw lower-layer diagnostic, or source input.

该工厂在采用候选前校验完整模板 shape、精确 adoption-profile ID、精确 slot/module 对应、必需状态、所选实现与必需 implementation surfaces。随后它通过 adoption runtime 校验完整候选，并在最后创建 shell。失败只返回 `ok: false` 与受限双语 diagnostics；绝不返回 partial shell、unit、provider、profile、原始下层 diagnostic 或 source 输入。

A successful result exposes:

成功结果公开：

| Member / 成员 | Meaning / 含义 |
| --- | --- |
| `receipt` | Detached receipt from initial complete-set adoption / 首次完整集合采用的隔离 receipt |
| `shell` | Safe shell fixed to `template.primaryModuleId` / 固定到 `template.primaryModuleId` 的安全 shell |
| `reconcile({ profile, units })` | Validates the same template slots and atomically replaces only a fully valid complete candidate / 重新校验同一模板 slots，并且只原子替换完全合法的完整候选 |
| `getTemplateSnapshot()` | Detached declarative template metadata / 隔离的声明式模板 metadata |
| `getAdoptionSnapshot()` | Redacted active capability lifecycle state / 脱敏的活动 capability lifecycle 状态 |
| `getPresentationSnapshot()` | Detached allowlisted presentation selection / 隔离的已白名单化呈现选择 |

Replacement does not recreate the shell. If slot/surface validation or lower adoption fails, the previous runtime, presentation, and invocation path remain active.

替换不会重建 shell。slot/surface 校验或下层采用失败时，先前 runtime、presentation 与 invocation path 保持活动。

## Deliberate limits / 刻意限制

The API performs no JSON/YAML or file loading, package discovery, dependency installation, registry lookup, dynamic import, component loading, arbitrary-script execution, source fallback, network access, backend selection, identity handling, storage, persistence, migration, or external write.

该 API 不执行 JSON/YAML 或文件加载、package discovery、依赖安装、registry 查询、动态 import、组件加载、任意脚本执行、source fallback、网络访问、后端选择、身份处理、storage、持久化、migration 或外部写入。

Read this API together with the [application-template contract](../contracts/application-template.md), [capability-adoption contract](../contracts/capability-adoption.md), and [ADR-0006](../adr/ADR-0006-application-template-and-explicit-adapter-integration.md).

请将本 API 与 [application-template 契约](../contracts/application-template.md)、[能力采用契约](../contracts/capability-adoption.md)及 [ADR-0006](../adr/ADR-0006-application-template-and-explicit-adapter-integration.md)一并阅读。
