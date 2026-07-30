/**
 * <lang><zh-CN>最小 ROP 注释门禁：确认受控 JS 文件具有中英节点标记与 inline 双语流程注释。</zh-CN><en>Minimum ROP-comment gate: confirms controlled JavaScript files contain bilingual node markers and inline bilingual flow comments.</en></lang>
 * @lang zh-CN 本脚本只检查显式自研文件的注释表面；它不解析或执行目标源码，也不替代人工 ROP 复核。
 * @lang en This script checks only comment surfaces of explicit independently written files; it neither parses nor executes target source and does not replace human ROP review.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * <lang><zh-CN>必须保留双语注释标记的自研 JS 文件。</zh-CN><en>Independently written JavaScript files that must retain bilingual comment markers.</en></lang>
 * @lang zh-CN 列表是显式 allowlist，避免扫描 node_modules、生成物、依赖或仓外文件。
 * @lang en The list is an explicit allowlist, avoiding scans of node_modules, generated output, dependencies, or files outside the repository.
 */
const documentedSourceFiles = [
  'scripts/verify-workspace.mjs',
  'scripts/check-rop.mjs',
  'packages/core/src/index.mjs',
  'modules/example-catalog-query-detail/src/index.mjs',
  'test/core-and-example.test.mjs'
];

/**
 * <lang><zh-CN>确认单个源文件含有当前要求的三类双语注释标记。</zh-CN><en>Confirms that one source file contains the three bilingual comment markers required at present.</en></lang>
 *
 * @param {string} relativePath 仓库相对源文件路径。 / Repository-relative source-file path.
 * @returns {Promise<void>} 标记齐全时 resolve，缺失时拒绝。 / Resolves when markers exist and rejects when one is missing.
 * @lang zh-CN 检查 `@lang zh-CN`、`@lang en` 与 `<lang>`；这是一道最低门禁，不宣称语义充分度可由字符串匹配完全证明。
 * @lang en Checks `@lang zh-CN`, `@lang en`, and `<lang>`; this is a minimum gate and does not claim string matching fully proves semantic sufficiency.
 */
async function verifyBilingualMarkers(relativePath) {
  // <lang><zh-CN>将 allowlisted 相对路径解析为当前 Biz 仓内路径，防止检查器越过仓库边界。</zh-CN><en>Resolve the allowlisted relative path within the current Biz repository, preventing the checker from crossing repository boundaries.</en></lang>
  const absolutePath = resolve(process.cwd(), relativePath);

  // <lang><zh-CN>以 UTF-8 读取源码文本；脚本不执行、import 或 eval 目标文件。</zh-CN><en>Read source text as UTF-8; the script does not execute, import, or eval the target file.</en></lang>
  const sourceText = await readFile(absolutePath, 'utf8');

  // <lang><zh-CN>三项布尔值分别记录节点中文、节点英文与流程双语标记是否出现。</zh-CN><en>The three Boolean values record whether node-level Chinese, node-level English, and flow-level bilingual markers appear.</en></lang>
  const hasChineseNodeMarker = sourceText.includes('@lang zh-CN');
  const hasEnglishNodeMarker = sourceText.includes('@lang en');
  const hasInlineBilingualMarker = sourceText.includes('<lang>');

  // <lang><zh-CN>缺少任一标记即失败；错误只写相对路径，不泄露源码内容。</zh-CN><en>Fail when any marker is missing; the error names only a relative path and leaks no source contents.</en></lang>
  if (!hasChineseNodeMarker || !hasEnglishNodeMarker || !hasInlineBilingualMarker) {
    // <lang><zh-CN>错误说明这是最低 ROP 标记门禁，提醒人工继续审阅节点与局部注释的实际语义。</zh-CN><en>The error states this is a minimum ROP-marker gate, reminding humans to continue reviewing the real semantics of node and local comments.</en></lang>
    throw new Error(`ROP marker gate failed for ${relativePath}.`);
  }
}

/**
 * <lang><zh-CN>并发检查所有显式受控的 JS 文件。</zh-CN><en>Checks all explicitly controlled JavaScript files concurrently.</en></lang>
 *
 * @returns {Promise<void>} 全部通过时 resolve，任一失败时拒绝。 / Resolves when all pass and rejects when any fails.
 * @lang zh-CN 文件集合保持很小且显式，避免把本检查器误用为全仓通用静态分析器。
 * @lang en The file set stays small and explicit, preventing misuse of this checker as a whole-repository static analyzer.
 */
async function verifyRopMarkers() {
  // <lang><zh-CN>为每个 allowlisted 文件建立独立只读检查任务。</zh-CN><en>Create an independent read-only check task for each allowlisted file.</en></lang>
  const verificationTasks = documentedSourceFiles.map((relativePath) => verifyBilingualMarkers(relativePath));

  // <lang><zh-CN>等待所有检查完成；任一任务拒绝会使 npm check 失败。</zh-CN><en>Await all checks; rejection from any task makes npm check fail.</en></lang>
  await Promise.all(verificationTasks);
}

// <lang><zh-CN>执行最低 ROP 标记门禁，不产生文件、缓存或外部输出。</zh-CN><en>Run the minimum ROP-marker gate and produce no file, cache, or external output.</en></lang>
await verifyRopMarkers();

// <lang><zh-CN>成功信息只报告受检文件数量，便于 CI/本地日志审计而不暴露路径内容。</zh-CN><en>The success message reports only the number of checked files, supporting CI/local-log audit without exposing path contents.</en></lang>
console.log(`HIA-uView-Biz ROP marker gate passed (${documentedSourceFiles.length} files).`);
