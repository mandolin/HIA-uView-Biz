/**
 * <lang><zh-CN>校验由操作者显式提供的 HIA-uView UI 本地源码输入；此模块只服务受控 fixture 编译，既不下载依赖，也不把本机路径写入公开产物。</zh-CN><en>Validates the HIA-uView UI local-source input explicitly provided by an operator; this module serves only controlled fixture compilation, downloads no dependency, and writes no machine path into public output.</en></lang>
 * @lang zh-CN 输入必须是已知 UI package 目录及其固定 Git commit；不能以 registry、父目录猜测或跨仓 `file:` 依赖替代。
 * @lang en Input must be the known UI-package directory at its fixed Git commit; registry lookup, parent-directory guessing, and cross-repository `file:` dependencies cannot substitute for it.
 */

import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * <lang><zh-CN>本 fixture 当前接受的私有 UI package identity。</zh-CN><en>The private UI-package identity currently accepted by this fixture.</en></lang>
 * @lang zh-CN 名称是构建期输入校验，不等于公开 registry 可安装性或未来发布承诺。
 * @lang en The name is a build-input check and is neither public registry installability nor a future release promise.
 */
const EXPECTED_UI_PACKAGE_NAME = '@hia-uview/ui';

/**
 * <lang><zh-CN>本 fixture 当前接受的 UI package 精确开发版本。</zh-CN><en>The exact UI-package development version currently accepted by this fixture.</en></lang>
 * @lang zh-CN 固定版本使 UI 变更不能在没有显式复审时悄然进入 Biz compiler 输入。
 * @lang en The fixed version prevents a UI change from silently entering Biz compiler input without explicit review.
 */
const EXPECTED_UI_PACKAGE_VERSION = '0.0.0';

/**
 * <lang><zh-CN>本 fixture 所要求的 UI package 许可证标识。</zh-CN><en>The UI-package license identifier required by this fixture.</en></lang>
 * @lang zh-CN 这是 package metadata 的最小门槛，不能替代完整许可证、NOTICE 或上游审计。
 * @lang en This is the minimum package-metadata gate and does not replace complete license, NOTICE, or upstream review.
 */
const EXPECTED_UI_PACKAGE_LICENSE = 'MIT';

/**
 * <lang><zh-CN>本 fixture 已复核的 UI Git commit。</zh-CN><en>The UI Git commit reviewed for this fixture.</en></lang>
 * @lang zh-CN 仅接受此精确提交，避免相同 package metadata 下的未审阅源码漂移。
 * @lang en Only this exact commit is accepted, preventing unreviewed source drift under identical package metadata.
 */
const EXPECTED_UI_COMMIT = 'a774a8948d29c21951eea3073a5ce17d121b2de4';

/**
 * <lang><zh-CN>以不暴露操作者路径的受控错误停止本地 compiler fixture。</zh-CN><en>Stops the local compiler fixture with a controlled error that exposes no operator path.</en></lang>
 * @param {string} message <lang><zh-CN>可安全呈现的固定错误说明。</zh-CN><en>Fixed error explanation safe for presentation.</en></lang>
 * @returns {never} <lang><zh-CN>始终抛出，不返回。</zh-CN><en>Always throws and never returns.</en></lang>
 * @lang zh-CN 错误不包含环境变量原始值、绝对路径、Git 输出或 package 文件内容。
 * @lang en The error contains no raw environment value, absolute path, Git output, or package-file content.
 */
function failUiSourceValidation(message) {
  // <lang><zh-CN>抛出固定前缀的 Error，使调用方知道是受控输入拒绝而不是尝试继续或回退到其他来源。</zh-CN><en>Throw an Error with a fixed prefix so callers know this is controlled-input rejection rather than an attempt to continue or fall back to another source.</en></lang>
  throw new Error(`HIA-uView UI source validation failed: ${message}`);
}

/**
 * <lang><zh-CN>运行一个固定 Git 只读命令并返回修剪后的标准输出。</zh-CN><en>Runs one fixed read-only Git command and returns trimmed standard output.</en></lang>
 * @param {string[]} argumentsList <lang><zh-CN>不含用户拼接内容的固定 Git 参数。</zh-CN><en>Fixed Git arguments containing no user-concatenated content.</en></lang>
 * @returns {string} <lang><zh-CN>成功时的非空 Git 标识文本。</zh-CN><en>Non-empty Git identifier text on success.</en></lang>
 * @lang zh-CN 该 helper 只用于 `rev-parse`；不执行 checkout、fetch、commit、push 或任何变更仓库状态的 Git 操作。
 * @lang en This helper serves only `rev-parse`; it performs no checkout, fetch, commit, push, or Git operation that changes repository state.
 */
function readGitIdentifier(argumentsList) {
  // <lang><zh-CN>同步启动固定 git executable，使 Vite config 加载阶段可以在解析 alias 前完成确定性本地校验。</zh-CN><en>Synchronously start the fixed git executable so Vite-config loading can complete deterministic local validation before resolving aliases.</en></lang>
  const gitResult = spawnSync('git', argumentsList, {
    encoding: 'utf8',
    shell: false,
    windowsHide: true
  });

  // <lang><zh-CN>非零状态、启动错误或非字符串 stdout 均拒绝，不能把不可验证的 source 当作受信任输入。</zh-CN><en>Reject a nonzero status, launch error, or non-string stdout; unverifiable source cannot be treated as trusted input.</en></lang>
  if (gitResult.status !== 0 || gitResult.error || typeof gitResult.stdout !== 'string') {
    failUiSourceValidation('the supplied directory is not a verifiable local Git input.');
  }

  // <lang><zh-CN>只保留 Git 标识文本本身，避免换行参与后续精确 commit 比较。</zh-CN><en>Keep only the Git identifier text itself, avoiding newline participation in later exact-commit comparison.</en></lang>
  const identifier = gitResult.stdout.trim();

  // <lang><zh-CN>空 Git 输出同样无法证明 package provenance，必须拒绝。</zh-CN><en>An empty Git output likewise cannot prove package provenance and must be rejected.</en></lang>
  if (identifier.length === 0) {
    failUiSourceValidation('the supplied directory returned no Git identity.');
  }

  // <lang><zh-CN>返回已验证的最小标识，调用方仅用于内部路径或 commit 比较，不写入产物。</zh-CN><en>Return the verified minimum identifier; callers use it only for internal path or commit comparison and never write it into output.</en></lang>
  return identifier;
}

/**
 * <lang><zh-CN>读取并校验操作者提供的 UI package source root。</zh-CN><en>Reads and validates the UI-package source root provided by the operator.</en></lang>
 * @returns {{sourceRoot: string, runtimeEntry: string, styleEntry: string}} <lang><zh-CN>仅供当前本机构建使用的已验证绝对输入路径。</zh-CN><en>Verified absolute input paths for the current local build only.</en></lang>
 * @lang zh-CN 返回路径只存在于构建进程内；调用者不得把它们写入 Git、文档、诊断或生成文件。
 * @lang en Returned paths exist only inside the build process; callers must not write them to Git, documentation, diagnostics, or generated files.
 */
export function resolveVerifiedHiaUViewUiSource() {
  // <lang><zh-CN>读取唯一允许的操作者显式输入；不搜索父目录、用户目录、registry 或其他环境变量。</zh-CN><en>Read the sole allowed explicit operator input; search no parent directory, user directory, registry, or other environment variable.</en></lang>
  const configuredRoot = process.env.HIA_UVIEW_UI_ROOT;

  // <lang><zh-CN>空缺或空白配置不能安全推断为任何默认位置，因此直接拒绝。</zh-CN><en>A missing or whitespace-only configuration cannot safely infer any default location and is therefore rejected directly.</en></lang>
  if (typeof configuredRoot !== 'string' || configuredRoot.trim().length === 0) {
    failUiSourceValidation('set HIA_UVIEW_UI_ROOT to the trusted local UI package directory.');
  }

  // <lang><zh-CN>解析操作者提供的单一路径以供本进程校验；该绝对值不会被记录或输出。</zh-CN><en>Resolve the single operator-provided path for in-process validation; this absolute value is neither recorded nor emitted.</en></lang>
  const sourceRoot = resolve(configuredRoot);

  // <lang><zh-CN>package metadata、runtime entry 与显式样式 entry 都必须存在，防止 alias 指向部分目录或任意文件。</zh-CN><en>Package metadata, runtime entry, and explicit style entry must all exist, preventing aliases from pointing at a partial directory or arbitrary file.</en></lang>
  const packageManifestPath = resolve(sourceRoot, 'package.json');
  const runtimeEntry = resolve(sourceRoot, 'src/index.mjs');
  const styleEntry = resolve(sourceRoot, 'src/style.css');

  // <lang><zh-CN>任何必需输入缺失都拒绝；不从 `node_modules`、父仓或网络寻找替代文件。</zh-CN><en>Reject when any required input is absent; look for no substitute file in `node_modules`, a parent repository, or the network.</en></lang>
  if (!existsSync(packageManifestPath) || !existsSync(runtimeEntry) || !existsSync(styleEntry)) {
    failUiSourceValidation('the supplied directory is missing required UI package files.');
  }

  // <lang><zh-CN>读取固定 package manifest 并限定为 JSON metadata；不执行 manifest 中的任何 script 或配置字段。</zh-CN><en>Read the fixed package manifest and constrain it to JSON metadata; execute no script or configuration field from the manifest.</en></lang>
  let packageMetadata;

  try {
    // <lang><zh-CN>同步读取只让 Vite config 在 alias 解析前完成校验；内容只用于三个精确字符串比较。</zh-CN><en>Read synchronously only so Vite config completes validation before alias resolution; contents serve only three exact-string comparisons.</en></lang>
    packageMetadata = JSON.parse(readFileSync(packageManifestPath, 'utf8'));
  } catch {
    // <lang><zh-CN>解析失败不暴露原始 package 内容或路径，保持 build 诊断可公开复制。</zh-CN><en>Do not expose raw package contents or path on parse failure, keeping build diagnostics safe to copy publicly.</en></lang>
    failUiSourceValidation('the supplied UI package metadata is not valid JSON.');
  }

  // <lang><zh-CN>名称、版本和许可证必须同时精确匹配；任一差异都需要新的人工复审，而非自动接受。</zh-CN><en>Name, version, and license must all exactly match; any difference requires new human review rather than automatic acceptance.</en></lang>
  if (
    packageMetadata?.name !== EXPECTED_UI_PACKAGE_NAME
    || packageMetadata?.version !== EXPECTED_UI_PACKAGE_VERSION
    || packageMetadata?.license !== EXPECTED_UI_PACKAGE_LICENSE
  ) {
    failUiSourceValidation('the supplied UI package identity, version, or license does not match this fixture.');
  }

  // <lang><zh-CN>先定位 source 所属 Git worktree 根，随后只读取得其当前 HEAD；不依赖 UI package 目录是否恰好是仓库根。</zh-CN><en>First locate the Git worktree root owning the source and then read only its current HEAD; do not depend on UI package directory being the repository root.</en></lang>
  const gitRoot = readGitIdentifier(['-C', sourceRoot, 'rev-parse', '--show-toplevel']);
  const gitCommit = readGitIdentifier(['-C', gitRoot, 'rev-parse', 'HEAD']);

  // <lang><zh-CN>精确提交不一致时停止，不接受 branch 名称、短 SHA、dirty diff 或版本号近似值。</zh-CN><en>Stop on an exact-commit mismatch; accept no branch name, short SHA, dirty diff, or approximate version value.</en></lang>
  if (gitCommit !== EXPECTED_UI_COMMIT) {
    failUiSourceValidation('the supplied UI Git commit is not the reviewed fixture input.');
  }

  // <lang><zh-CN>冻结返回对象，防止同一 build process 内的普通调用方修改 alias 输入路径。</zh-CN><en>Freeze the return object, preventing ordinary callers in the same build process from changing alias input paths.</en></lang>
  return Object.freeze({ sourceRoot, runtimeEntry, styleEntry });
}
