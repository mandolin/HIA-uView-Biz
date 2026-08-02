/**
 * <lang><zh-CN>Biz 采用 readiness doctor：只读检查当前仓固定的 Node/npm/lockfile/安装树前置条件，并输出受限 report。</zh-CN><en>Biz adoption-readiness doctor: read-only checks fixed current-repository Node/npm/lockfile/install-tree prerequisites and emits a bounded report.</en></lang>
 * @lang zh-CN 本脚本不接收路径、URL、profile、source、credential 或修复参数；不安装、更新、删除、发布、联网、启动服务或执行应用 runtime。
 * @lang en This script accepts no path, URL, profile, source, credential, or repair argument; it installs, updates, removes, publishes, networks, starts no service, and executes no application runtime.
 */

// <lang><zh-CN>只从 Node 标准库读取当前仓固定 metadata；没有项目 runtime import 或外部 source 读取。</zh-CN><en>Read fixed current-repository metadata only from the Node standard library; there is no project-runtime import or external-source read.</en></lang>
import { access, readFile } from 'node:fs/promises';

// <lang><zh-CN>路径工具仅将固定相对文件名解析到当前仓根，不接受调用方路径输入。</zh-CN><en>Path utility resolves fixed relative filenames only to current repository root and accepts no caller path input.</en></lang>
import { resolve } from 'node:path';

/**
 * <lang><zh-CN>doctor JSON report 的固定 contract version。</zh-CN><en>Fixed contract version of the doctor JSON report.</en></lang>
 * @lang zh-CN 版本只描述 report shape；它不表示 package、application 或 migration 版本。
 * @lang en Version describes report shape only; it does not represent a package, application, or migration version.
 */
const DOCTOR_CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>doctor 支持的唯一 machine-readable argument。</zh-CN><en>Only machine-readable argument supported by doctor.</en></lang>
 * @lang zh-CN 不提供 path、repair、source 或 network option，防止诊断 command 扩大为项目发现或 mutation 工具。
 * @lang en Provide no path, repair, source, or network option, preventing diagnostic command from expanding into a project-discovery or mutation tool.
 */
const JSON_ARGUMENT = '--json';

/**
 * <lang><zh-CN>检查结果允许的稳定 level。</zh-CN><en>Stable levels allowed in a check result.</en></lang>
 * @lang zh-CN level 只表达本地 prerequisite 状态，不表达安全、兼容、发布或设备成熟度。
 * @lang en A level expresses local prerequisite state only, not security, compatibility, release, or device maturity.
 */
const CHECK_LEVELS = new Set(['ok', 'warn', 'error']);

/**
 * <lang><zh-CN>解析仅包含 `--json` 或无参数的 command line。</zh-CN><en>Parses a command line containing only `--json` or no argument.</en></lang>
 *
 * @param {string[]} commandArguments <lang><zh-CN>Node 传入的 doctor argument 列表。</zh-CN><en>Doctor argument list supplied by Node.</en></lang>
 * @returns {boolean} <lang><zh-CN>请求 JSON report 时为 `true`。</zh-CN><en>`true` when JSON report is requested.</en></lang>
 * @lang zh-CN 不接受未知 argument，以避免用户输入被解释为路径、命令、配置或修复请求。
 * @lang en Reject unknown arguments, keeping user input from being interpreted as a path, command, configuration, or repair request.
 */
function parseOutputMode(commandArguments) {
  // <lang><zh-CN>没有 argument 时输出面向人的双语摘要。</zh-CN><en>Emit human-oriented bilingual summary when there is no argument.</en></lang>
  if (commandArguments.length === 0) {
    return false;
  }

  // <lang><zh-CN>只有精确单个 `--json` 才进入 machine-readable 模式。</zh-CN><en>Enter machine-readable mode only for exactly one `--json` argument.</en></lang>
  if (commandArguments.length === 1 && commandArguments[0] === JSON_ARGUMENT) {
    return true;
  }

  // <lang><zh-CN>错误不回显 argument 值，避免将潜在敏感输入写入 terminal 或 issue copy-paste。</zh-CN><en>Do not echo argument values in error, avoiding potential sensitive input written to terminal or issue copy-paste.</en></lang>
  throw new Error('doctor accepts no argument or --json only.');
}

/**
 * <lang><zh-CN>从 semver-like 文本读取 major version。</zh-CN><en>Reads a major version from semver-like text.</en></lang>
 *
 * @param {string | undefined} versionText <lang><zh-CN>待解析的版本或 version-range 文本。</zh-CN><en>Version or version-range text to parse.</en></lang>
 * @returns {number | null} <lang><zh-CN>有效 major version；无法确定时为 `null`。</zh-CN><en>Valid major version, or `null` when it cannot be determined.</en></lang>
 * @lang zh-CN 只需要当前最低 major 前置条件，不实现完整 semver parser 或 range resolver。
 * @lang en Only current minimum-major prerequisite is needed; do not implement a full semver parser or range resolver.
 */
function parseMajorVersion(versionText) {
  // <lang><zh-CN>非字符串或没有数字前缀/范围数字时不能形成可靠 prerequisite 结论。</zh-CN><en>A non-string or text without a leading/range number cannot form a reliable prerequisite conclusion.</en></lang>
  if (typeof versionText !== 'string') {
    return null;
  }

  // <lang><zh-CN>接受当前 engine `>=22.0.0`、Node `24.0.0` 和 npm user-agent 中的普通 major 形式。</zh-CN><en>Accept current engine `>=22.0.0`, Node `24.0.0`, and ordinary major forms in npm user agent.</en></lang>
  const versionMatch = versionText.match(/(?:^|[^0-9])(\d+)(?:\.\d+)?(?:\.\d+)?/u);
  if (!versionMatch) {
    return null;
  }

  // <lang><zh-CN>转换为 number 后再验证整数和非负性，防止畸形文本被当作可用版本。</zh-CN><en>After conversion to number, validate integer and non-negativity so malformed text cannot become an acceptable version.</en></lang>
  const majorVersion = Number(versionMatch[1]);
  return Number.isInteger(majorVersion) && majorVersion >= 0
    ? majorVersion
    : null;
}

/**
 * <lang><zh-CN>从 npm-script user-agent 文本读取 npm version。</zh-CN><en>Reads npm version from npm-script user-agent text.</en></lang>
 *
 * @param {string | undefined} userAgent <lang><zh-CN>npm script 环境提供的 user-agent 文本。</zh-CN><en>User-agent text supplied by npm-script environment.</en></lang>
 * @returns {string | null} <lang><zh-CN>解析出的 npm version；缺失或畸形时为 `null`。</zh-CN><en>Parsed npm version, or `null` when missing or malformed.</en></lang>
 * @lang zh-CN 不启动 `npm --version` 子进程，避免 doctor 为诊断引入额外 command execution。
 * @lang en Do not launch an `npm --version` subprocess, avoiding extra command execution for diagnosis.
 */
function parseNpmVersion(userAgent) {
  // <lang><zh-CN>只有 npm script 提供的普通字符串才可参与版本判断。</zh-CN><en>Only ordinary string supplied by npm script may participate in version determination.</en></lang>
  if (typeof userAgent !== 'string') {
    return null;
  }

  // <lang><zh-CN>提取第一个 `npm/x.y.z` token；其余 user-agent 字段不进入 report。</zh-CN><en>Extract first `npm/x.y.z` token; remaining user-agent fields do not enter report.</en></lang>
  const npmMatch = userAgent.match(/(?:^|\s)npm\/(\d+(?:\.\d+){0,2})(?:\s|$)/u);
  return npmMatch ? npmMatch[1] : null;
}

/**
 * <lang><zh-CN>构造不含 host path 或外部 identity 的稳定 doctor check。</zh-CN><en>Constructs a stable doctor check containing no host path or external identity.</en></lang>
 *
 * @param {string} id <lang><zh-CN>公开稳定检查标识。</zh-CN><en>Public stable check identifier.</en></lang>
 * @param {'ok'|'warn'|'error'} level <lang><zh-CN>本地 prerequisite level。</zh-CN><en>Local prerequisite level.</en></lang>
 * @param {string} message <lang><zh-CN>面向用户的双语短建议。</zh-CN><en>Short bilingual user-facing guidance.</en></lang>
 * @returns {object} <lang><zh-CN>受限公开检查对象。</zh-CN><en>Bounded public check object.</en></lang>
 * @lang zh-CN 创建点强制固定 shape；不接受任意 metadata 透传进 JSON report。
 * @lang en Creation point enforces fixed shape and accepts no arbitrary metadata passthrough into JSON report.
 */
function createCheck(id, level, message) {
  // <lang><zh-CN>开发期断言保护 source 修改时的 level 拼写；不会向 report 输出内部细节。</zh-CN><en>Development assertion protects level spelling during source modification and outputs no internal detail into report.</en></lang>
  if (!CHECK_LEVELS.has(level)) {
    throw new Error('doctor attempted to create an unsupported check level.');
  }

  return { id, level, message };
}

/**
 * <lang><zh-CN>只读加载 root package 的 engines metadata。</zh-CN><en>Read-only loads engines metadata from root package.</en></lang>
 *
 * @returns {Promise<{node: string | null, npm: string | null}>} <lang><zh-CN>受限 Node/npm requirement。</zh-CN><en>Bounded Node/npm requirements.</en></lang>
 * @lang zh-CN 固定读取当前仓 `package.json`；不会读取 consumer project、workspace child 或父目录。
 * @lang en Read fixed current-repository `package.json`; do not read a consumer project, workspace child, or parent directory.
 */
async function readRootEngineRequirements() {
  // <lang><zh-CN>以当前工作目录为仓根拼接固定 metadata 路径，不依赖环境变量或 sibling discovery。</zh-CN><en>Join fixed metadata path under current working directory as repository root without environment variable or sibling discovery.</en></lang>
  const packagePath = resolve(process.cwd(), 'package.json');
  const packageText = await readFile(packagePath, 'utf8');
  const packageMetadata = JSON.parse(packageText);

  // <lang><zh-CN>只返回两个 string requirement；其余 package metadata 不进入 doctor 输出或逻辑。</zh-CN><en>Return only two string requirements; remaining package metadata enters neither doctor output nor logic.</en></lang>
  return {
    node: typeof packageMetadata.engines?.node === 'string'
      ? packageMetadata.engines.node
      : null,
    npm: typeof packageMetadata.engines?.npm === 'string'
      ? packageMetadata.engines.npm
      : null
  };
}

/**
 * <lang><zh-CN>确认当前仓固定 prerequisite 路径是否存在。</zh-CN><en>Confirms whether a fixed prerequisite path exists in the current repository.</en></lang>
 *
 * @param {string} relativePath <lang><zh-CN>固定仓库相对 prerequisite 路径。</zh-CN><en>Fixed repository-relative prerequisite path.</en></lang>
 * @returns {Promise<boolean>} <lang><zh-CN>存在时为 `true`，缺失时为 `false`。</zh-CN><en>`true` when present and `false` when absent.</en></lang>
 * @lang zh-CN 只把缺失视为 false；其他读取错误继续抛出，避免权限/设备问题被误表述为普通未安装。
 * @lang en Treat only absence as false; rethrow other read errors so permission/device issue is not misreported as ordinary absence.
 */
async function hasRequiredPath(relativePath) {
  // <lang><zh-CN>固定路径只在当前仓根解析；调用方不能借此传递上级或外部路径。</zh-CN><en>Resolve fixed path only under current repository root; callers cannot pass parent or external path through this helper.</en></lang>
  const absolutePath = resolve(process.cwd(), relativePath);

  try {
    // <lang><zh-CN>只检查可访问性，不读取目录内容、不跟随外部 source、不创建任何路径。</zh-CN><en>Check accessibility only; do not read directory content, follow external source, or create any path.</en></lang>
    await access(absolutePath);
    return true;
  } catch (error) {
    // <lang><zh-CN>ENOENT 是唯一可恢复的缺失状态；其他 error 保留给上层失败处理。</zh-CN><en>ENOENT is the only recoverable absence state; preserve other errors for upper-level failure handling.</en></lang>
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/**
 * <lang><zh-CN>在不执行项目 code 的条件下评估当前仓的采用 readiness。</zh-CN><en>Evaluates current repository adoption readiness without executing project code.</en></lang>
 *
 * @returns {Promise<object>} <lang><zh-CN>稳定、JSON-safe 的 doctor report。</zh-CN><en>Stable JSON-safe doctor report.</en></lang>
 * @lang zh-CN report 只包含固定 check；不公开 host path、完整环境、dependency tree、外部 UI source 或业务数据。
 * @lang en Report contains fixed checks only and exposes no host path, complete environment, dependency tree, external UI source, or business data.
 */
async function evaluateReadiness() {
  // <lang><zh-CN>读取受限 engine metadata，供本机 Node/npm 前置条件与仓声明进行比较。</zh-CN><en>Read bounded engine metadata to compare local Node/npm prerequisite against repository declaration.</en></lang>
  const requirements = await readRootEngineRequirements();

  // <lang><zh-CN>当前 Node version 只用于本地比较，不写入 report，避免把运行器差异固定为公共数据契约。</zh-CN><en>Use current Node version for local comparison only and do not write it into report, avoiding elevation of runner difference into public data contract.</en></lang>
  const currentNodeMajor = parseMajorVersion(process.versions.node);
  const requiredNodeMajor = parseMajorVersion(requirements.node);

  // <lang><zh-CN>npm version 仅从 npm script environment 的已知 token 读取，不启动额外 command 或收集环境对象。</zh-CN><en>Read npm version only from known token in npm script environment and launch no extra command or collect environment object.</en></lang>
  const currentNpmVersion = parseNpmVersion(process.env.npm_config_user_agent);
  const currentNpmMajor = parseMajorVersion(currentNpmVersion ?? undefined);
  const requiredNpmMajor = parseMajorVersion(requirements.npm);

  // <lang><zh-CN>固定检查两个当前仓 prerequisite 文件/目录；不枚举 node_modules 或读取 lock 内容。</zh-CN><en>Check two fixed current-repository prerequisite file/directories and enumerate no node_modules or read lock content.</en></lang>
  const hasLockfile = await hasRequiredPath('package-lock.json');
  const hasInstalledDependencies = await hasRequiredPath('node_modules');
  // <lang><zh-CN>checkout-first consumer 的 manifest/profile 是当前采用验证的固定输入；doctor 只检查存在性，不执行其 runtime。</zh-CN><en>The checkout-first consumer manifest/profile are fixed inputs for adoption verification; doctor checks presence only and executes no consumer runtime.</en></lang>
  const hasConsumerManifest = await hasRequiredPath('apps/example-catalog-query-detail-consumer/src/consumer.manifest.json');
  const hasConsumerProfile = await hasRequiredPath('apps/example-catalog-query-detail-consumer/src/consumer.profile.json');

  const checks = [];

  // <lang><zh-CN>Node requirement 缺失或不满足时不能安全运行当前 baseline，因此标记为 error。</zh-CN><en>When Node requirement is missing or unsatisfied, current baseline cannot run safely, so mark it error.</en></lang>
  checks.push(
    currentNodeMajor !== null
      && requiredNodeMajor !== null
      && currentNodeMajor >= requiredNodeMajor
      ? createCheck('node-version', 'ok', 'Node prerequisite is satisfied. / Node 前置条件已满足。')
      : createCheck('node-version', 'error', 'Use the Node version declared by this repository before continuing. / 请先使用本仓声明的 Node 版本。')
  );

  // <lang><zh-CN>npm 必须来自 npm script environment 且满足 engine；无法识别时不猜测 host 的安装状态。</zh-CN><en>npm must come from npm-script environment and satisfy engine; do not guess host installation state when it cannot be recognized.</en></lang>
  checks.push(
    currentNpmMajor !== null
      && requiredNpmMajor !== null
      && currentNpmMajor >= requiredNpmMajor
      ? createCheck('npm-version', 'ok', 'npm prerequisite is satisfied. / npm 前置条件已满足。')
      : createCheck('npm-version', 'error', 'Run doctor through npm with the repository-required npm version. / 请使用本仓要求的 npm 版本并通过 npm 运行 doctor。')
  );

  // <lang><zh-CN>缺少 lockfile 时安装图无法按已提交事实复现，因此拒绝将本地状态表述为 ready。</zh-CN><en>Without lockfile, dependency graph cannot be reproduced from committed fact, so do not present local state as ready.</en></lang>
  checks.push(
    hasLockfile
      ? createCheck('root-lockfile', 'ok', 'Committed root lockfile is present. / 已提交 root lockfile 存在。')
      : createCheck('root-lockfile', 'error', 'Restore the committed root lockfile before continuing. / 请先恢复已提交的 root lockfile。')
  );

  // <lang><zh-CN>缺少安装树时只建议显式 `npm ci --ignore-scripts`；doctor 自身绝不代为安装或修复。</zh-CN><en>When install tree is absent, advise explicit `npm ci --ignore-scripts` only; doctor never installs or repairs on caller behalf.</en></lang>
  checks.push(
    hasInstalledDependencies
      ? createCheck('installed-dependencies', 'ok', 'Local installed dependency directory is present. / 本地已安装 dependency directory 存在。')
      : createCheck('installed-dependencies', 'error', 'Run npm ci --ignore-scripts manually before continuing. / 请先手工运行 npm ci --ignore-scripts。')
  );

  // <lang><zh-CN>缺失 consumer manifest 时不能复现 checkout-first 输入；该检查不读取 JSON 内容或外部项目。</zh-CN><en>Without the consumer manifest, checkout-first input cannot be reproduced; this check reads neither JSON content nor an external project.</en></lang>
  checks.push(
    hasConsumerManifest
      ? createCheck('consumer-manifest', 'ok', 'Checkout-first consumer manifest is present. / Checkout-first consumer manifest 已存在。')
      : createCheck('consumer-manifest', 'error', 'Restore the checked-in consumer manifest before continuing. / 请先恢复已提交的 consumer manifest。')
  );

  // <lang><zh-CN>缺失 consumer profile 时不把 starter 表述为可复现；doctor 不尝试生成或修复 profile。</zh-CN><en>Without the consumer profile, do not describe the starter as reproducible; doctor neither generates nor repairs the profile.</en></lang>
  checks.push(
    hasConsumerProfile
      ? createCheck('consumer-profile', 'ok', 'Checkout-first consumer profile is present. / Checkout-first consumer profile 已存在。')
      : createCheck('consumer-profile', 'error', 'Restore the checked-in consumer profile before continuing. / 请先恢复已提交的 consumer profile。')
  );

  // <lang><zh-CN>只有全部固定 prerequisite 为 ok 才声明 ready；warn 预留给未来非阻断受限信息，当前不降低任何必要条件。</zh-CN><en>Declare ready only when every fixed prerequisite is ok; reserve warn for future non-blocking bounded information and do not lower a required condition today.</en></lang>
  const ready = checks.every((check) => check.level === 'ok');

  return {
    contractVersion: DOCTOR_CONTRACT_VERSION,
    ready,
    checks
  };
}

/**
 * <lang><zh-CN>以面向人的稳定双语摘要输出 doctor report。</zh-CN><en>Prints doctor report as a stable bilingual human-oriented summary.</en></lang>
 *
 * @param {object} report <lang><zh-CN>已验证 report。</zh-CN><en>Validated report.</en></lang>
 * @returns {void} <lang><zh-CN>无返回值；只写受限 terminal 摘要。</zh-CN><en>No return value; writes bounded terminal summary only.</en></lang>
 * @lang zh-CN 不输出 report 未包含的环境、路径、外部 source 或依赖树细节。
 * @lang en Output no environment, path, external source, or dependency-tree detail absent from report.
 */
function printHumanReport(report) {
  // <lang><zh-CN>总体状态先输出，便于人类调用方立即判断是否继续执行后续本地命令。</zh-CN><en>Print overall state first so human caller can immediately decide whether to continue with later local commands.</en></lang>
  console.log(
    report.ready
      ? 'HIA-uView-Biz doctor: ready / 已就绪。'
      : 'HIA-uView-Biz doctor: prerequisites need attention / 前置条件需要处理。'
  );

  for (const check of report.checks) {
    // <lang><zh-CN>每一行只使用 stable ID、level 与受控 message，适合人工复制而不泄露 host details。</zh-CN><en>Each line uses only stable ID, level, and controlled message, suitable for human copy without leaking host details.</en></lang>
    console.log(`- [${check.level}] ${check.id}: ${check.message}`);
  }
}

/**
 * <lang><zh-CN>运行 doctor 并以选定格式返回可用于进程 exit 的 readiness 状态。</zh-CN><en>Runs doctor and returns readiness state usable for process exit in selected format.</en></lang>
 *
 * @returns {Promise<boolean>} <lang><zh-CN>全部 prerequisite 就绪时为 `true`。</zh-CN><en>`true` when every prerequisite is ready.</en></lang>
 * @lang zh-CN 入口不接收任意 function、路径或配置；只组合固定解析、固定 metadata 和受限输出。
 * @lang en Entry accepts no arbitrary function, path, or configuration; it composes fixed parsing, fixed metadata, and bounded output only.
 */
async function runDoctor() {
  // <lang><zh-CN>先确定输出模式；未知 argument 在任何文件读取前安全失败。</zh-CN><en>Determine output mode first; unknown argument fails safely before any file read.</en></lang>
  const wantsJson = parseOutputMode(process.argv.slice(2));

  // <lang><zh-CN>读取并评估固定本地 prerequisite；不会 import、build 或执行目标 application。</zh-CN><en>Read and evaluate fixed local prerequisites; do not import, build, or execute target application.</en></lang>
  const report = await evaluateReadiness();

  // <lang><zh-CN>JSON 模式只序列化固定 report shape；人类模式保留相同事实的双语摘要。</zh-CN><en>JSON mode serializes fixed report shape only; human mode retains a bilingual summary of same facts.</en></lang>
  if (wantsJson) {
    console.log(JSON.stringify(report));
  } else {
    printHumanReport(report);
  }

  return report.ready;
}

// <lang><zh-CN>执行只读 doctor；非 ready 以非零状态提示调用方手工处理前置条件，不执行自动修复。</zh-CN><en>Execute read-only doctor; use nonzero status for non-ready state so caller handles prerequisite manually and no automatic repair executes.</en></lang>
try {
  // <lang><zh-CN>仅在正常解析与固定 metadata 读取成功后取得 readiness；不把异常 stack、绝对路径或输入值输出给调用方。</zh-CN><en>Obtain readiness only after normal parsing and fixed-metadata read succeed; do not output exception stack, absolute path, or input value to caller.</en></lang>
  const isReady = await runDoctor();

  // <lang><zh-CN>非 ready 仅使用 exit code 表示本地 prerequisite 未满足，调用方仍需手工修正。</zh-CN><en>Use exit code only for non-ready local prerequisite; caller must still correct it manually.</en></lang>
  if (!isReady) {
    process.exitCode = 1;
  }
} catch (error) {
  // <lang><zh-CN>唯一可预期的输入错误使用固定文本；它不回显调用方传入的未知 argument。</zh-CN><en>The only expected input error uses fixed text and does not echo an unknown argument supplied by caller.</en></lang>
  if (error instanceof Error && error.message === 'doctor accepts no argument or --json only.') {
    console.error(error.message);
  } else {
    // <lang><zh-CN>其余 metadata/read 错误归并为受限诊断，避免 terminal 或 issue copy-paste 泄露 host path 或内部异常细节。</zh-CN><en>Collapse remaining metadata/read errors into bounded diagnostic, avoiding host path or internal exception detail leaked through terminal or issue copy-paste.</en></lang>
    console.error('doctor could not evaluate local prerequisites. / doctor 无法评估本地前置条件。');
  }

  process.exitCode = 2;
}
