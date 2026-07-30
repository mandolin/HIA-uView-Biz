# Development / 开发

## Prerequisites / 前置条件

- Node.js 22 or later / Node.js 22 或更高版本
- npm 10 or later / npm 10 或更高版本

## Commands / 命令

```bash
npm run check
npm test
```

`npm run check` verifies required workspace files and the minimum bilingual ROP markers in controlled JavaScript files. `npm test` runs that gate first and then executes the deterministic Node contract fixture.

`npm run check` 校验必需 workspace 文件和受控 JavaScript 文件的最低双语 ROP 标记。`npm test` 先运行该门禁，再执行确定性的 Node 契约 fixture。

Both commands use only Node built-ins. They install no dependency, create no lockfile, start no service, access no network, and use no production data.

两个命令都只使用 Node 内置能力。它们不安装依赖、不创建 lockfile、不启动服务、不访问网络，也不使用生产数据。

## Current runtime boundary / 当前运行时边界

The current core consumes already parsed in-memory manifests and explicit port providers. Its deterministic example validates composition, page query, detail, canonical failure, mock session, and restricted route action. It is not a JSON/YAML loader, complete JSON Schema engine, backend adapter, application generator, or UniApp application.

当前 core 消费已解析的内存 manifest 和显式 port provider。其确定性示例验证组合、页码 query、详情、规范化 failure、mock session 与受限 route action。它不是 JSON/YAML loader、完整 JSON Schema engine、后端 adapter、应用生成器或 UniApp 应用。

## Integration boundary / 集成边界

HIA-uView is a separate repository. Consume it only through a released versioned package, documented local link, explicit fixture, or dedicated integration script. Do not create a shared root lockfile or import files across repository roots.

HIA-uView 是独立仓库。只能通过已发布且带版本的包、已文档化的本地链接、显式 fixture 或专用集成脚本来消费它。不得创建共享根 lockfile，也不得跨仓根目录 import 文件。
