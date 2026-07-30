/**
 * <lang><zh-CN>校验 Biz 临时 HIA JSDoc metadata output 不嵌入源码正文、绝对路径、路径遍历或 `sourcesContent`；它只读取受忽略 output，不生成、上传、删除或改写文档。</zh-CN><en>Validates that Biz temporary HIA JSDoc metadata output embeds no source body, absolute path, traversal, or `sourcesContent`; it only reads ignored output and generates, uploads, deletes, or rewrites no documentation.</en></lang>
 * @lang zh-CN 本检查只采用 metadata-only 文档模式，不声明 Vue extractor、独立输出协议、source reader、sidecar、网络 provider 或 host 写入能力。
 * @lang en This check uses metadata-only documentation mode only and declares no Vue extractor, independent-output protocol, source reader, sidecar, network provider, or host-write capability.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * <lang><zh-CN>HIA JSDoc integration 的固定临时 metadata output 路径。</zh-CN><en>Fixed temporary metadata-output path of HIA JSDoc integration.</en></lang>
 * @lang zh-CN 路径是仓库相对且由 config 固定；调用方无法提供任意读取位置。
 * @lang en Path is repository-relative and fixed by config; callers cannot provide arbitrary read location.
 */
const integrationOutputPath = 'temp/documentation/jsdoc/hia-integration.json';

/**
 * <lang><zh-CN>判断字符串是否含宿主绝对路径、UNC 路径、路径遍历或 file URL。</zh-CN><en>Determines whether a string contains host absolute path, UNC path, traversal, or file URL.</en></lang>
 * @param {string} value <lang><zh-CN>待检查的 metadata 字符串。</zh-CN><en>Metadata string to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>存在不安全路径形式时为 true。</zh-CN><en>`true` when an unsafe path form exists.</en></lang>
 * @lang zh-CN 只匹配固定泄露模式，不解析、规范化、访问或输出任何路径。
 * @lang en Matches fixed leak patterns only and parses, normalizes, accesses, or outputs no path.
 */
function hasUnsafePath(value) {
  // <lang><zh-CN>固定模式覆盖 Windows、UNC、traversal 与 file URL，保持检查器不依赖宿主目录布局。</zh-CN><en>Fixed patterns cover Windows, UNC, traversal, and file URL, keeping checker independent from host-directory layout.</en></lang>
  return /^[A-Za-z]:[\\/]/.test(value)
    || /^\\\\/.test(value)
    || /(?:^|[\\/])\.\.(?:[\\/]|$)/.test(value)
    || /file:\/\//i.test(value);
}

/**
 * <lang><zh-CN>递归检查 metadata JSON 的全部值，并收集隐私边界问题。</zh-CN><en>Recursively inspects every metadata-JSON value and collects privacy-boundary issues.</en></lang>
 * @param {unknown} value <lang><zh-CN>当前 JSON 值。</zh-CN><en>Current JSON value.</en></lang>
 * @param {string} jsonPath <lang><zh-CN>只用于稳定诊断的 JSON 路径。</zh-CN><en>JSON path used only for stable diagnostics.</en></lang>
 * @param {string[]} issues <lang><zh-CN>可变问题收集器。</zh-CN><en>Mutable issue collector.</en></lang>
 * @returns {void} <lang><zh-CN>无返回值；问题会加入 `issues`。</zh-CN><en>No return value; issues are added to `issues`.</en></lang>
 * @lang zh-CN 函数只遍历已解析 JSON，不读取源码文件、import module 或调用 output 中定义的内容。
 * @lang en Function traverses parsed JSON only and reads no source file, imports no module, or invokes content defined by output.
 */
function inspectMetadataValue(value, jsonPath, issues) {
  // <lang><zh-CN>数组逐项以索引路径检查，保留问题节点的稳定定位而不回显节点正文。</zh-CN><en>Inspect arrays item by item with indexed path, retaining stable problem location without echoing node body.</en></lang>
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectMetadataValue(item, `${jsonPath}[${index}]`, issues));
    return;
  }

  // <lang><zh-CN>普通 JSON 对象只遍历自身 entries；不调用 getter、原型或运行时 source 解析。</zh-CN><en>Ordinary JSON object traverses only own entries and invokes no getter, prototype, or runtime-source resolution.</en></lang>
  if (value !== null && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      // <lang><zh-CN>组合 JSON 风格诊断路径，避免错误中泄露本机文件系统位置。</zh-CN><en>Compose JSON-style diagnostic path, avoiding a local filesystem location leaked in errors.</en></lang>
      const nestedPath = `${jsonPath}.${key}`;

      // <lang><zh-CN>任何真值 sourcesContent 都代表源码正文嵌入，即使其他 metadata 字段看似合法也必须报告。</zh-CN><en>Any truthy sourcesContent represents source-body embedding and must be reported even when other metadata fields appear valid.</en></lang>
      if (key === 'sourcesContent' && nestedValue) {
        issues.push(`${nestedPath} must not embed source content.`);
      }

      // <lang><zh-CN>继续检查嵌套值，防止一个违规字段掩盖其他路径或 fragment 问题。</zh-CN><en>Continue inspection of nested value, preventing one violation from hiding other path or fragment issue.</en></lang>
      inspectMetadataValue(nestedValue, nestedPath, issues);
    }

    return;
  }

  // <lang><zh-CN>只有字符串可能泄露路径；其他 primitive 类型不产生路径风险。</zh-CN><en>Only strings may leak paths; other primitive types produce no path risk.</en></lang>
  if (typeof value === 'string' && hasUnsafePath(value)) {
    issues.push(`${jsonPath} contains an unsafe absolute or traversal path.`);
  }
}

/**
 * <lang><zh-CN>读取并验证当前仓临时 HIA JSDoc integration metadata。</zh-CN><en>Reads and validates temporary HIA JSDoc integration metadata in current repository.</en></lang>
 * @param {string} [rootDirectory=process.cwd()] <lang><zh-CN>调用方当前仓库绝对根，仅用于拼接固定相对 output 路径。</zh-CN><en>Caller's absolute repository root used only to join fixed relative output path.</en></lang>
 * @returns {Promise<string[]>} <lang><zh-CN>全部隐私问题；空数组表示通过。</zh-CN><en>All privacy issues; empty array means pass.</en></lang>
 * @lang zh-CN 不接收调用方 output 路径，也不创建、修改或删除 temporary output。
 * @lang en Accepts no caller output path and creates, modifies, or deletes no temporary output.
 */
export async function validateDocumentationOutput(rootDirectory = process.cwd()) {
  // <lang><zh-CN>只读取 config 固定的 metadata output；读取失败应使门禁失败而非被解释为无内容通过。</zh-CN><en>Read only metadata output fixed by config; read failure must fail gate rather than be interpreted as empty-content pass.</en></lang>
  const outputText = await readFile(resolve(rootDirectory, integrationOutputPath), 'utf8');

  // <lang><zh-CN>将文本解析为 JSON；畸形 output 不满足可审计 metadata contract。</zh-CN><en>Parse text as JSON; malformed output does not satisfy auditable metadata contract.</en></lang>
  const output = JSON.parse(outputText);

  // <lang><zh-CN>累积全部问题，使一次运行可以同时指出 contract、source fragment 与路径泄露。</zh-CN><en>Accumulate all issues so one run can identify contract, source-fragment, and path leaks together.</en></lang>
  const issues = [];

  // <lang><zh-CN>integration contract 与 mode 必须是当前 metadata-only integration 的固定标识，防止普通 JSON 误通过。</zh-CN><en>Integration contract and mode must be fixed identifiers of current metadata-only integration, preventing ordinary JSON from passing by mistake.</en></lang>
  if (output.contract !== 'hia-jsdoc-integration' || output.mode !== 'hiaIntegration') {
    issues.push('Integration output must declare the hia-jsdoc-integration contract and hiaIntegration mode.');
  }

  // <lang><zh-CN>顶层 sourceFragments 非空即为源码片段泄露，不能由节点级检查抵消。</zh-CN><en>A non-empty top-level sourceFragments is source-fragment leak and cannot be offset by node-level checks.</en></lang>
  if (Array.isArray(output.sourceFragments) && output.sourceFragments.length > 0) {
    issues.push('Integration output must not contain source fragments.');
  }

  // <lang><zh-CN>逐节点检查 metadata-only source 是否错误含有正文或 fragments；缺失 source 只按空对象处理。</zh-CN><en>Inspect every node for metadata-only source wrongly containing body or fragments; treat missing source as empty object only.</en></lang>
  for (const node of output.ir?.nodes ?? []) {
    // <lang><zh-CN>节点 source 只读取 output 声明值；不回读 JSDoc 源文件补全字段。</zh-CN><en>Node source reads only output-declared value and rereads no JSDoc source file to fill fields.</en></lang>
    const source = node.source ?? {};

    // <lang><zh-CN>primaryBlock 或非空 fragments 表示输出越过 metadata-only 边界，记录节点 ID 而非源码内容。</zh-CN><en>PrimaryBlock or non-empty fragments means output crossed metadata-only boundary; record node ID rather than source content.</en></lang>
    if (source.primaryBlock || (Array.isArray(source.fragments) && source.fragments.length > 0)) {
      issues.push(`Integration node ${node.id} must not embed a primary block or source fragment.`);
    }
  }

  // <lang><zh-CN>最后递归覆盖任意嵌套路径和 sourcesContent，避免只检查预期字段而漏掉插件新增字段。</zh-CN><en>Finally recurse through arbitrary nested path and sourcesContent, avoiding checking only expected fields while missing plugin-added field.</en></lang>
  inspectMetadataValue(output, '$', issues);
  return issues;
}

/**
 * <lang><zh-CN>运行只读 temporary output 隐私门禁。</zh-CN><en>Runs read-only temporary-output privacy gate.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>没有问题时 resolve；有问题时抛出。</zh-CN><en>Resolves when there is no issue and throws when there is an issue.</en></lang>
 * @lang zh-CN 错误只列稳定 JSON diagnostics，不输出完整 metadata JSON、源码文本或绝对路径。
 * @lang en Error lists stable JSON diagnostics only and outputs no complete metadata JSON, source text, or absolute path.
 */
async function runDocumentationOutputCheck() {
  // <lang><zh-CN>收集全部 output 问题，避免第一个泄露掩盖其余 metadata 边界违反。</zh-CN><en>Collect every output issue, preventing first leak from hiding remaining metadata-boundary violation.</en></lang>
  const issues = await validateDocumentationOutput();

  // <lang><zh-CN>任何问题都以非零失败，且不修复、重写或移除 output，以保留可审计诊断证据。</zh-CN><en>Fail nonzero on any issue and neither repair, rewrite, nor remove output, retaining auditable diagnostic evidence.</en></lang>
  if (issues.length > 0) {
    throw new Error(`HIA-uView-Biz documentation output privacy check failed:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
  }
}

// <lang><zh-CN>执行当前仓 metadata-only output 检查，不调用网络、source reader、sidecar 或 host 写入能力。</zh-CN><en>Execute current-repository metadata-only output check and call no network, source reader, sidecar, or host-write capability.</en></lang>
await runDocumentationOutputCheck();

// <lang><zh-CN>成功信息只报告稳定结论，供本地/CI 日志使用而不泄露 output 或宿主路径。</zh-CN><en>Success message reports stable conclusion only for local/CI log use and leaks no output or host path.</en></lang>
console.log('HIA-uView-Biz documentation metadata privacy check passed.');
