/**
 * <lang><zh-CN>Biz workspace 的公开文件存在性门禁：确认 core、example、契约文档和测试入口没有因局部编辑而丢失。</zh-CN><en>Public file-existence gate for the Biz workspace: confirms core, example, contract docs, and test entry are not lost through a local edit.</en></lang>
 * @lang zh-CN 本脚本只读取当前仓库的显式相对路径；不安装依赖、不执行项目代码，也不访问网络。
 * @lang en This script reads only explicit relative paths in the current repository; it installs no dependency, executes no project code, and accesses no network.
 */

import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * <lang><zh-CN>初始化与当前最小纵切必须存在的公开文件。</zh-CN><en>Public files that must exist for initialization and the current minimum vertical slice.</en></lang>
 * @lang zh-CN 列表使用仓库相对路径，避免质量门禁依赖父工作区或私有 WorkZone。
 * @lang en The list uses repository-relative paths, keeping the quality gate independent of the parent workspace or private WorkZone.
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
  'modules/example-catalog-query-detail/package.json',
  'modules/example-catalog-query-detail/src/index.mjs',
  'docs/development.md',
  'docs/architecture.md',
  'docs/contracts/catalog-query-detail.md',
  'test/core-and-example.test.mjs',
  'test/app-shell.test.mjs'
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
