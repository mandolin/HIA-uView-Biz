/**
 * <lang><zh-CN>Biz workspace 的公开文件存在性门禁：确认 core、example、契约文档和测试入口没有因局部编辑而丢失。</zh-CN><en>Public file-existence gate for the Biz workspace: confirms core, example, contract docs, and test entry are not lost through a local edit.</en></lang>
 * @lang zh-CN 本脚本只读取当前仓库的显式相对路径；不安装依赖、不执行项目代码，也不访问网络。
 * @lang en This script reads only explicit relative paths in the current repository; it installs no dependency, executes no project code, and accesses no network.
 */

import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * <lang><zh-CN>初始化与当前最小纵切必须存在的公开文件。</zh-CN><en>Public files that must exist for initialization and the current minimum vertical slice.</en></lang>
 * @lang zh-CN 列表使用仓库相对路径，避免质量门禁依赖父工作区或任何私有仓上下文。
 * @lang en The list uses repository-relative paths, keeping the quality gate independent of the parent workspace or any private-repository context.
 */
const requiredFiles = [
  'README.md',
  'AGENTS.md',
  'LICENSE',
  'package.json',
  'packages/core/package.json',
  'packages/core/src/index.mjs',
  'packages/app-shell/package.json',
  'packages/app-shell/src/index.mjs',
  'packages/adapter-runtime/package.json',
  'packages/adapter-runtime/src/index.mjs',
  'packages/adapter-runtime/README.md',
  // <lang><zh-CN>能力生命周期 runtime 必须以独立 package、源码和公开说明存在。</zh-CN><en>The capability-lifecycle runtime must exist as an independent package, source file, and public guide.</en></lang>
  'packages/capability-runtime/package.json',
  'packages/capability-runtime/src/index.mjs',
  'packages/capability-runtime/README.md',
  'extensions/example-catalog-query-detail-adapter-fixture/package.json',
  'extensions/example-catalog-query-detail-adapter-fixture/src/index.mjs',
  'extensions/example-catalog-query-detail-adapter-fixture/README.md',
  'apps/example-catalog-query-detail-mp-weixin/package.json',
  'apps/example-catalog-query-detail-mp-weixin/index.html',
  'apps/example-catalog-query-detail-mp-weixin/vite.config.mjs',
  'apps/example-catalog-query-detail-mp-weixin/src/main.js',
  'apps/example-catalog-query-detail-mp-weixin/src/App.vue',
  'apps/example-catalog-query-detail-mp-weixin/src/uni.scss',
  'apps/example-catalog-query-detail-mp-weixin/src/pages.json',
  'apps/example-catalog-query-detail-mp-weixin/src/manifest.json',
  // <lang><zh-CN>代表性应用必须以仓内版本化 profile 驱动 app-owned pure fixture runtime。</zh-CN><en>The representative app must drive its app-owned pure fixture runtime from a checked-in versioned profile.</en></lang>
  'apps/example-catalog-query-detail-mp-weixin/src/representative.profile.json',
  'apps/example-catalog-query-detail-mp-weixin/src/fixture-runtime.mjs',
  'apps/example-catalog-query-detail-mp-weixin/src/pages/index/index.vue',
  'scripts/resolve-hia-uview-ui-source.mjs',
  'scripts/build-mp-weixin-fixture.mjs',
  'scripts/verify-mp-weixin-fixture.mjs',
  'scripts/verify-documentation-output.mjs',
  'modules/example-catalog-query-detail/package.json',
  'modules/example-catalog-query-detail/src/index.mjs',
  'docs/development.md',
  'docs/architecture.md',
  'docs/api/app-shell.md',
  'docs/api/adapter-runtime.md',
  // <lang><zh-CN>能力生命周期公开 API 文档必须与 runtime package 同步存在。</zh-CN><en>The public capability-lifecycle API guide must exist alongside the runtime package.</en></lang>
  'docs/api/capability-runtime.md',
  'docs/adr/ADR-0003-adapter-session-and-cache-boundary.md',
  // <lang><zh-CN>能力组合状态机必须由公开 ADR 与 contract 固定。</zh-CN><en>The capability-composition state machine must be fixed by a public ADR and contract.</en></lang>
  'docs/adr/ADR-0004-capability-composition-and-lifecycle.md',
  'docs/jsdoc.config.json',
  'docs/contracts/adapter-boundary.md',
  'docs/contracts/capability-lifecycle.md',
  'docs/contracts/catalog-query-detail.md',
  // <lang><zh-CN>代表性小程序纵切必须同时具备公开验收契约、受限 profile schema 与默认 profile 示例。</zh-CN><en>The representative mini-program slice must have a public acceptance contract, bounded profile schema, and default profile example together.</en></lang>
  'docs/contracts/representative-mp-weixin-slice.md',
  'docs/contracts/schemas/representative-mp-weixin.profile.v1.schema.json',
  'docs/contracts/examples/example.catalog-query-detail.representative-mp-weixin.profile.json',
  'test/core-and-example.test.mjs',
  'test/app-shell.test.mjs',
  'test/adapter-runtime.test.mjs',
  // <lang><zh-CN>能力生命周期测试固定多单元组合、依赖/冲突与无 hook 边界。</zh-CN><en>The capability-lifecycle test fixes multi-unit composition, dependency/conflict, and no-hook boundaries.</en></lang>
  'test/capability-runtime.test.mjs',
  // <lang><zh-CN>端到端纯 Node 测试固定 profile、显式 source、lifecycle、shell 与脱敏 observation。</zh-CN><en>The end-to-end pure-Node test fixes profile, explicit source, lifecycle, shell, and redacted observation.</en></lang>
  'test/representative-mp-weixin-slice.test.mjs'
];

/**
 * <lang><zh-CN>确认每个最小公开文件在当前仓库存在。</zh-CN><en>Confirms that every minimum public file exists in the current repository.</en></lang>
 *
 * @returns {Promise<void>} 文件齐全时 resolve，缺失时拒绝。 / Resolves when files exist and rejects when one is missing.
 * @lang zh-CN 只验证存在性；运行时行为、注释和契约由独立测试与 ROP 门禁验证。
 * @lang en This validates existence only; runtime behavior, comments, and contracts are checked by separate tests and the ROP gate.
 */
async function verifyRequiredFiles() {
  // <lang><zh-CN>将每个仓库相对路径解析为当前进程工作目录下的绝对路径，避免跨根目录读取。</zh-CN><en>Resolve every repository-relative path under the current process working directory, avoiding reads across repository roots.</en></lang>
  const absolutePaths = requiredFiles.map((relativePath) => resolve(process.cwd(), relativePath));

  // <lang><zh-CN>并发执行只读存在性检查；任一缺失都会使质量门禁失败。</zh-CN><en>Run read-only existence checks concurrently; any missing file fails the quality gate.</en></lang>
  await Promise.all(absolutePaths.map((absolutePath) => access(absolutePath)));
}

// <lang><zh-CN>在输出成功信息前完成所有文件检查，避免不完整 workspace 被误表述为可测试状态。</zh-CN><en>Complete all file checks before printing success, avoiding a claim that an incomplete workspace is test-ready.</en></lang>
await verifyRequiredFiles();

// <lang><zh-CN>成功信息只报告稳定文件数量，不列出本机绝对路径或私有上下文。</zh-CN><en>The success message reports only a stable file count and lists no local absolute path or private context.</en></lang>
console.log(`HIA-uView-Biz workspace gate passed (${requiredFiles.length} required files).`);
