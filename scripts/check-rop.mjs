/**
 * <lang><zh-CN>最小 ROP 注释门禁：确认受控自研 JS/Vue/CSS 源具有适用的中英节点标记与 inline 双语流程注释。</zh-CN><en>Minimum ROP-comment gate: confirms controlled independently written JS, Vue, and CSS source has applicable bilingual node markers and inline bilingual flow comments.</en></lang>
 * @lang zh-CN 本脚本只检查显式自研文件的注释表面；它不解析或执行目标源码，也不替代人工 ROP 复核。
 * @lang en This script checks only comment surfaces of explicit independently written files; it neither parses nor executes target source and does not replace human ROP review.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * <lang><zh-CN>必须保留双语注释标记的自研源文件及其节点注释要求。</zh-CN><en>Independently written source files that must retain bilingual comment markers and their node-comment requirements.</en></lang>
 * @lang zh-CN 列表是显式 allowlist，避免扫描 node_modules、生成物、依赖或仓外文件；CSS 只要求合法 `<lang>` 注释。
 * @lang en The list is an explicit allowlist, avoiding scans of node_modules, generated output, dependencies, or files outside the repository; CSS requires only legal `<lang>` comments.
 */
const documentedSourceFiles = [
  { relativePath: 'scripts/verify-workspace.mjs', requiresNodeMarkers: true },
  { relativePath: 'scripts/check-rop.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>Biz doctor 是新增自研只读诊断源码，必须进入严格双语 ROP 最低门禁。</zh-CN><en>Biz doctor is new independently written read-only diagnostic source and must enter the strict bilingual ROP minimum gate.</en></lang>
  { relativePath: 'scripts/doctor.mjs', requiresNodeMarkers: true },
  { relativePath: 'scripts/resolve-hia-uview-ui-source.mjs', requiresNodeMarkers: true },
  { relativePath: 'scripts/build-mp-weixin-fixture.mjs', requiresNodeMarkers: true },
  { relativePath: 'scripts/verify-mp-weixin-fixture.mjs', requiresNodeMarkers: true },
  { relativePath: 'scripts/verify-documentation-output.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>离线发布质量候选门禁只读检查多种公开边界，必须进入严格双语 ROP 最低门禁。</zh-CN><en>The offline release-quality candidate gate read-checks multiple public boundaries and must enter the strict bilingual ROP minimum gate.</en></lang>
  { relativePath: 'scripts/verify-release-quality.mjs', requiresNodeMarkers: true },
  { relativePath: 'packages/core/src/index.mjs', requiresNodeMarkers: true },
  { relativePath: 'packages/app-shell/src/index.mjs', requiresNodeMarkers: true },
  { relativePath: 'packages/adapter-runtime/src/index.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>provider-port runtime 承担 consumer-owned provider host 与 failure/rollback boundary，必须进入严格 ROP 门禁。</zh-CN><en>The provider-port runtime owns the consumer-owned provider host and failure/rollback boundary and must enter the strict ROP gate.</en></lang>
  { relativePath: 'packages/provider-port-runtime/src/index.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>能力生命周期 runtime 是新自研源码，必须进入严格双语 ROP 最低门禁。</zh-CN><en>The capability-lifecycle runtime is new independently written source and must enter the strict bilingual ROP minimum gate.</en></lang>
  { relativePath: 'packages/capability-runtime/src/index.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>采用 runtime 承担 profile validation、候选预检、原子切换与 receipt，必须进入严格 ROP 门禁。</zh-CN><en>The adoption runtime owns profile validation, candidate preflight, atomic switching, and receipts and must enter the strict ROP gate.</en></lang>
  { relativePath: 'packages/adoption-runtime/src/index.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>应用模板集成 runtime 承担 template/slot/surface 校验、采用与 shell bridge，必须进入严格 ROP 门禁。</zh-CN><en>The application-template integration runtime owns template, slot, and surface validation, adoption, and the shell bridge and must enter the strict ROP gate.</en></lang>
  { relativePath: 'packages/app-integration/src/index.mjs', requiresNodeMarkers: true },
  { relativePath: 'modules/example-catalog-query-detail/src/index.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>中性 reference-data capability 是自研业务源码，必须保留节点/流程双语注释。</zh-CN><en>The neutral reference-data capability is independently written business source and must retain bilingual node/flow comments.</en></lang>
  { relativePath: 'modules/example-reference-data/src/index.mjs', requiresNodeMarkers: true },
  { relativePath: 'extensions/example-catalog-query-detail-adapter-fixture/src/index.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>应用模板工厂承担完整显式候选装配，必须保留节点与流程双语注释。</zh-CN><en>The application-template factory owns complete explicit candidate assembly and must retain bilingual node and flow comments.</en></lang>
  { relativePath: 'templates/example-catalog-query-detail-mp-weixin/src/index.mjs', requiresNodeMarkers: true },
  { relativePath: 'test/core-and-example.test.mjs', requiresNodeMarkers: true },
  { relativePath: 'test/app-shell.test.mjs', requiresNodeMarkers: true },
  { relativePath: 'test/adapter-runtime.test.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>provider-port acceptance 固定 provider injection、session/storage/read/write 与隐私隔离，必须进入严格 ROP 门禁。</zh-CN><en>The provider-port acceptance fixes provider injection, session/storage/read/write, and privacy isolation and must enter the strict ROP gate.</en></lang>
  { relativePath: 'test/provider-port-runtime.test.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>新能力生命周期测试也必须维持节点级和流程级双语 ROP 标记。</zh-CN><en>The new capability-lifecycle test must also retain node-level and flow-level bilingual ROP markers.</en></lang>
  { relativePath: 'test/capability-runtime.test.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>完整采用/替换 acceptance 同样适用严格双语 ROP。</zh-CN><en>The complete adoption/replacement acceptance is also subject to strict bilingual ROP.</en></lang>
  { relativePath: 'test/capability-adoption.test.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>应用模板与集成 acceptance 同样适用严格双语 ROP。</zh-CN><en>The application-template and integration acceptance is also subject to strict bilingual ROP.</en></lang>
  { relativePath: 'test/application-template.test.mjs', requiresNodeMarkers: true },
  { relativePath: 'apps/example-catalog-query-detail-mp-weixin/vite.config.mjs', requiresNodeMarkers: true },
  { relativePath: 'apps/example-catalog-query-detail-mp-weixin/index.html', requiresNodeMarkers: true },
  { relativePath: 'apps/example-catalog-query-detail-mp-weixin/src/main.js', requiresNodeMarkers: true },
  { relativePath: 'apps/example-catalog-query-detail-mp-weixin/src/App.vue', requiresNodeMarkers: true },
  // <lang><zh-CN>app-owned fixture runtime 承担 profile/source/lifecycle/shell 边界，必须进入严格节点与流程注释门禁。</zh-CN><en>The app-owned fixture runtime owns profile, source, lifecycle, and shell boundaries and must enter the strict node and flow comment gate.</en></lang>
  { relativePath: 'apps/example-catalog-query-detail-mp-weixin/src/fixture-runtime.mjs', requiresNodeMarkers: true },
  { relativePath: 'apps/example-catalog-query-detail-mp-weixin/src/pages/index/index.vue', requiresNodeMarkers: true },
  { relativePath: 'apps/example-catalog-query-detail-mp-weixin/src/uni.scss', requiresNodeMarkers: false },
  // <lang><zh-CN>隔离 consumer runtime 承担 manifest/profile、template 与 provider-host 边界，必须进入严格 ROP 门禁。</zh-CN><en>The isolated consumer runtime owns manifest/profile, template, and provider-host boundaries and must enter the strict ROP gate.</en></lang>
  { relativePath: 'apps/example-catalog-query-detail-consumer/src/index.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>代表性纵切测试也必须保留严格双语节点与流程说明。</zh-CN><en>The representative-slice test must also retain strict bilingual node and flow explanations.</en></lang>
  { relativePath: 'test/representative-mp-weixin-slice.test.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>checkout-first consumer acceptance 固定显式输入、shell/provider flow 与脱敏失败，必须进入严格 ROP 门禁。</zh-CN><en>The checkout-first consumer acceptance fixes explicit inputs, shell/provider flow, and redacted failure and must enter the strict ROP gate.</en></lang>
  { relativePath: 'test/checkout-first-consumer.test.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>consumer verifier 固定 CLI 输出与本地 mock 边界，必须进入严格 ROP 门禁。</zh-CN><en>The consumer verifier fixes CLI output and local-mock boundaries and must enter the strict ROP gate.</en></lang>
  { relativePath: 'scripts/verify-checkout-consumer.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>候选质量门禁测试通过独立 Node 进程验证入口，必须保留严格双语节点与流程说明。</zh-CN><en>The candidate quality-gate test verifies the entry through an independent Node process and must retain strict bilingual node and flow explanations.</en></lang>
  { relativePath: 'test/release-quality.test.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>doctor acceptance 固定受限 JSON report，必须保留严格双语节点与流程说明。</zh-CN><en>Doctor acceptance fixes bounded JSON report and must retain strict bilingual node and flow explanations.</en></lang>
  { relativePath: 'test/doctor.test.mjs', requiresNodeMarkers: true },
  // <lang><zh-CN>source-trial acceptance 固定本地 command 的无外部状态编排边界，必须保留严格双语节点与流程说明。</zh-CN><en>Source-trial acceptance fixes no-external-state orchestration boundary of the local command and must retain strict bilingual node and flow explanations.</en></lang>
  { relativePath: 'test/source-trial.test.mjs', requiresNodeMarkers: true }
];

/**
 * <lang><zh-CN>确认单个源文件含有其当前要求的双语注释标记。</zh-CN><en>Confirms that one source file contains its currently required bilingual comment markers.</en></lang>
 *
 * @param {{relativePath: string, requiresNodeMarkers: boolean}} sourceFile <lang><zh-CN>仓库相对路径与节点注释要求。</zh-CN><en>Repository-relative path and node-comment requirement.</en></lang>
 * @returns {Promise<void>} 标记齐全时 resolve，缺失时拒绝。 / Resolves when markers exist and rejects when one is missing.
 * @lang zh-CN JS/Vue 检查 `@lang zh-CN`、`@lang en` 与 `<lang>`；CSS 检查合法 `<lang>`，这是一道最低门禁，不宣称语义充分度可由字符串匹配完全证明。
 * @lang en JS/Vue checks `@lang zh-CN`, `@lang en`, and `<lang>`; CSS checks legal `<lang>`. This is a minimum gate and does not claim string matching fully proves semantic sufficiency.
 */
async function verifyBilingualMarkers(sourceFile) {
  // <lang><zh-CN>解构显式 allowlist 条目，使路径与其语种节点规则在同一局部范围内审阅。</zh-CN><en>Destructure explicit allowlist entry so path and its language-node rule are reviewed in the same local scope.</en></lang>
  const { relativePath, requiresNodeMarkers } = sourceFile;

  // <lang><zh-CN>将 allowlisted 相对路径解析为当前 Biz 仓内路径，防止检查器越过仓库边界。</zh-CN><en>Resolve the allowlisted relative path within the current Biz repository, preventing the checker from crossing repository boundaries.</en></lang>
  const absolutePath = resolve(process.cwd(), relativePath);

  // <lang><zh-CN>以 UTF-8 读取源码文本；脚本不执行、import 或 eval 目标文件。</zh-CN><en>Read source text as UTF-8; the script does not execute, import, or eval the target file.</en></lang>
  const sourceText = await readFile(absolutePath, 'utf8');

  // <lang><zh-CN>三项布尔值分别记录节点中文、节点英文与流程双语标记是否出现。</zh-CN><en>The three Boolean values record whether node-level Chinese, node-level English, and flow-level bilingual markers appear.</en></lang>
  const hasChineseNodeMarker = sourceText.includes('@lang zh-CN');
  const hasEnglishNodeMarker = sourceText.includes('@lang en');
  const hasInlineBilingualMarker = sourceText.includes('<lang>');

  // <lang><zh-CN>CSS 只强制合法 inline `<lang>` 注释；其他 source 同时要求节点中英标记和 inline 流程标记。</zh-CN><en>CSS enforces only legal inline `<lang>` comments; other source also requires node-level Chinese-English markers and inline flow marker.</en></lang>
  const hasRequiredMarkers = requiresNodeMarkers
    ? hasChineseNodeMarker && hasEnglishNodeMarker && hasInlineBilingualMarker
    : hasInlineBilingualMarker;

  // <lang><zh-CN>缺少适用标记即失败；错误只写相对路径，不泄露源码内容。</zh-CN><en>Fail when an applicable marker is missing; the error names only a relative path and leaks no source contents.</en></lang>
  if (!hasRequiredMarkers) {
    // <lang><zh-CN>错误说明这是最低 ROP 标记门禁，提醒人工继续审阅节点与局部注释的实际语义。</zh-CN><en>The error states this is a minimum ROP-marker gate, reminding humans to continue reviewing the real semantics of node and local comments.</en></lang>
    throw new Error(`ROP marker gate failed for ${relativePath}.`);
  }
}

/**
 * <lang><zh-CN>并发检查所有显式受控的自研源文件。</zh-CN><en>Checks all explicitly controlled independently written source files concurrently.</en></lang>
 *
 * @returns {Promise<void>} 全部通过时 resolve，任一失败时拒绝。 / Resolves when all pass and rejects when any fails.
 * @lang zh-CN 文件集合保持很小且显式，避免把本检查器误用为全仓通用静态分析器。
 * @lang en The file set stays small and explicit, preventing misuse of this checker as a whole-repository static analyzer.
 */
async function verifyRopMarkers() {
  // <lang><zh-CN>为每个 allowlisted 文件建立独立只读检查任务。</zh-CN><en>Create an independent read-only check task for each allowlisted file.</en></lang>
  const verificationTasks = documentedSourceFiles.map((sourceFile) => verifyBilingualMarkers(sourceFile));

  // <lang><zh-CN>等待所有检查完成；任一任务拒绝会使 npm check 失败。</zh-CN><en>Await all checks; rejection from any task makes npm check fail.</en></lang>
  await Promise.all(verificationTasks);
}

// <lang><zh-CN>执行最低 ROP 标记门禁，不产生文件、缓存或外部输出。</zh-CN><en>Run the minimum ROP-marker gate and produce no file, cache, or external output.</en></lang>
await verifyRopMarkers();

// <lang><zh-CN>成功信息只报告受检文件数量，便于 CI/本地日志审计而不暴露路径内容。</zh-CN><en>The success message reports only the number of checked files, supporting CI/local-log audit without exposing path contents.</en></lang>
console.log(`HIA-uView-Biz ROP marker gate passed (${documentedSourceFiles.length} files).`);
