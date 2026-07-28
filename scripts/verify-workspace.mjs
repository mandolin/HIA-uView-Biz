import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * 中文：初始化质量门禁的最小公开基线；业务实现开始后需补充类型、测试、打包和兼容性检查。
 * English: Minimal public baseline for the initialization quality gate; add type, test, package, and compatibility checks when business implementation starts.
 */
const requiredFiles = [
  'README.md',
  'AGENTS.md',
  'LICENSE',
  'packages/core/package.json',
  'docs/development.md',
  'docs/architecture.md'
];

/**
 * 中文：确认每个基线文件存在，避免未完成初始化被误当作可开发或可发布状态。
 * English: Confirm that every baseline file exists so an incomplete setup is not treated as development- or release-ready.
 * @returns {Promise<void>} 无返回值；缺失文件时抛出错误。 / Resolves without a value and throws when a file is missing.
 */
async function verifyRequiredFiles() {
  await Promise.all(requiredFiles.map((relativePath) => access(resolve(process.cwd(), relativePath))));
}

await verifyRequiredFiles();
console.log(`HIA-uView-Biz initialization gate passed (${requiredFiles.length} required files).`);
