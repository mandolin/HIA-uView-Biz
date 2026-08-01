/**
 * <lang><zh-CN>离线发布质量候选门禁：只读检查当前 Biz 仓的公开 package 形态、文本边界、asset policy 与 runtime capability 边界。</zh-CN><en>Offline release-quality candidate gate: read-only checks the current Biz repository's public package shape, text boundary, asset policy, and runtime-capability boundary.</en></lang>
 * @lang zh-CN 本脚本不安装依赖、不执行应用 runtime、不创建 archive、不发布 package、不上传小程序，也不访问网络或父工作区。
 * @lang en This script installs no dependency, executes no application runtime, creates no archive, publishes no package, uploads no mini-program, and accesses neither network nor parent workspace.
 */

// <lang><zh-CN>只从 Node 标准库读取受控文本与目录 metadata；没有 project-code import。</zh-CN><en>Read controlled text and directory metadata only from the Node standard library; there is no project-code import.</en></lang>
import { lstat, readdir, readFile } from 'node:fs/promises';

// <lang><zh-CN>路径工具仅用于固定仓内相对路径；调用方不能传入任意检查根。</zh-CN><en>Path utilities are used only for fixed repository-relative paths; callers cannot supply an arbitrary inspection root.</en></lang>
import { extname, relative, resolve, sep } from 'node:path';

/**
 * <lang><zh-CN>当前 root workspace 的显式一层目录与其 package 形态。</zh-CN><en>Explicit single-level directories of the current root workspace and their package shapes.</en></lang>
 * @lang zh-CN 该清单与 root `workspaces` 一一对应，避免递归发现任意 package 或依赖目录。
 * @lang en This list corresponds one-to-one with root `workspaces`, avoiding recursive discovery of arbitrary packages or dependency directories.
 */
const workspaceGroups = [
  { relativePath: 'packages', packageShape: 'library' },
  { relativePath: 'modules', packageShape: 'library' },
  { relativePath: 'extensions', packageShape: 'library' },
  { relativePath: 'templates', packageShape: 'library' },
  { relativePath: 'apps', packageShape: 'application' }
];

/**
 * <lang><zh-CN>可读取的受控文本根；它们均位于当前公开仓内。</zh-CN><en>Controlled text roots that may be read; all are within the current public repository.</en></lang>
 * @lang zh-CN 不扫描脚本、测试、安装目录、生成目录或父工作区，确保门禁不把自身 policy 字符串或本机状态当作应用文本。
 * @lang en Do not scan scripts, tests, install directories, generated directories, or parent workspace, keeping the gate from treating its own policy strings or host state as application text.
 */
const publicTextRoots = [
  'README.md',
  'docs',
  'packages',
  'modules',
  'extensions',
  'templates',
  'apps'
];

/**
 * <lang><zh-CN>框架 runtime 的受限 source 根；Vite 配置和 build script 不属于该 runtime 边界。</zh-CN><en>Restricted source roots of the framework runtime; Vite configuration and build scripts are outside this runtime boundary.</en></lang>
 * @lang zh-CN app 只纳入其 `src`，以允许受控 compiler 配置读取本地 source metadata 而不把它误判为业务 runtime I/O。
 * @lang en Include only app `src`, allowing controlled compiler configuration to read local source metadata without misclassifying it as business-runtime I/O.
 */
const runtimeSourceRoots = [
  'packages',
  'modules',
  'extensions',
  'templates',
  'apps/example-catalog-query-detail-mp-weixin/src'
];

/**
 * <lang><zh-CN>递归读取时跳过的安装、生成和临时目录名。</zh-CN><en>Installation, generated, and temporary directory names skipped during recursive reads.</en></lang>
 * @lang zh-CN 这些名称只限制读取范围；它们的存在并不被解释为发布或运行时成功。
 * @lang en These names limit read scope only; their presence is not interpreted as publication or runtime success.
 */
const ignoredDirectoryNames = new Set([
  '.git',
  'node_modules',
  'coverage',
  'dist',
  'output',
  'temp',
  'unpackage'
]);

/**
 * <lang><zh-CN>当前公开 package 不允许出现的二进制与字体 asset 扩展名。</zh-CN><en>Binary and font asset extensions not allowed in current public packages.</en></lang>
 * @lang zh-CN 首轮只允许 text/source package；需要 asset 时必须先建立来源、license、性能和包内容的独立审阅。
 * @lang en The first round permits text/source packages only; an asset requires a separate prior review of origin, license, performance, and package contents.
 */
const prohibitedAssetExtensions = new Set([
  '.eot',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.mp3',
  '.mp4',
  '.otf',
  '.pdf',
  '.png',
  '.svg',
  '.ttf',
  '.wav',
  '.webm',
  '.webp',
  '.woff',
  '.woff2'
]);

/**
 * <lang><zh-CN>受控文本中不得出现的私有过程或机器路径标记。</zh-CN><en>Private-process or machine-path markers that must not appear in controlled text.</en></lang>
 * @lang zh-CN marker 只用于静态泄露检测；诊断不会回显匹配内容或绝对路径。
 * @lang en Markers are used only for static leak detection; diagnostics echo neither matched content nor absolute paths.
 */
const prohibitedPublicTextMarkers = [
  { name: 'Windows absolute path', expression: /[A-Za-z]:[\\/]/ },
  { name: 'UNC path', expression: /\\\\[^\\/]+[\\/]/ },
  { name: 'file URL', expression: /file:\/\//i },
  { name: 'private process record', expression: new RegExp('(?:^|[^A-Za-z])(?:W|C)-uv-' + 'P\\d+', 'i') },
  { name: 'private workspace label', expression: new RegExp(['work', 'zone'].join('[- ]'), 'i') },
  { name: 'private chat log label', expression: new RegExp(['chat', 'log'].join(''), 'i') },
  { name: 'private guide label', expression: /项目引导/ },
  { name: 'private documentation label', expression: new RegExp(['HIA', 'SYS', 'DOC'].join('_'), 'i') },
  { name: 'private documentation label', expression: new RegExp(['HIA', 'SYS', 'DOC'].join('-'), 'i') }
];

/**
 * <lang><zh-CN>framework runtime 中禁止的 capability 模式。</zh-CN><en>Capability patterns prohibited in framework runtime.</en></lang>
 * @lang zh-CN 这是首轮边界检查，不取代语义审查；它只拒绝当前不应出现在 pure/injected runtime 内的显式导入或调用模式。
 * @lang en This is a first-boundary check, not a substitute for semantic review; it rejects only explicit import or call patterns that must not currently occur in the pure/injected runtime.
 */
const prohibitedRuntimeCapabilities = [
  {
    name: 'host I/O or process module import',
    expression: /from\s+['"]node:(?:child_process|dgram|fs|http|https|net|tls|worker_threads)['"]/u
  },
  {
    name: 'network request call',
    expression: /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/u
  },
  {
    name: 'dynamic execution call',
    expression: /\b(?:eval|Function)\s*\(/u
  },
  {
    name: 'dynamic module loading',
    expression: /\b(?:import|require)\s*\(/u
  },
  {
    name: 'process launch or environment access',
    expression: /\bprocess\.(?:argv|chdir|cwd|env|exec|exit|spawn)\b/u
  }
];

/**
 * <lang><zh-CN>确认相对路径解析后仍位于当前仓根之内。</zh-CN><en>Confirms that a resolved relative path remains inside the current repository root.</en></lang>
 *
 * @param {string} relativePath <lang><zh-CN>受控仓库相对路径。</zh-CN><en>Controlled repository-relative path.</en></lang>
 * @returns {string} <lang><zh-CN>已验证的绝对路径。</zh-CN><en>Validated absolute path.</en></lang>
 * @lang zh-CN 函数只接受本脚本内的固定路径；边界断言避免未来编辑误把递归读取扩展到父目录。
 * @lang en The function accepts only fixed paths in this script; the boundary assertion prevents a future edit from extending recursive reads to a parent directory.
 */
function resolveRepositoryPath(relativePath) {
  // <lang><zh-CN>以当前工作目录作为唯一仓根，不尝试推断同级仓或用户目录。</zh-CN><en>Use the current working directory as the sole repository root and do not infer sibling repositories or user directories.</en></lang>
  const repositoryRoot = resolve(process.cwd());

  // <lang><zh-CN>解析目标路径并保留相对关系，供后续边界判断使用。</zh-CN><en>Resolve target path and retain its relative relation for the subsequent boundary check.</en></lang>
  const absolutePath = resolve(repositoryRoot, relativePath);
  const pathFromRoot = relative(repositoryRoot, absolutePath);

  // <lang><zh-CN>空相对路径仅表示根本身；其他结果不得以父级标记或盘符开头。</zh-CN><en>An empty relative path denotes only the root itself; other results must not begin with a parent marker or drive separator.</en></lang>
  if (
    pathFromRoot.startsWith(`..${sep}`)
    || pathFromRoot === '..'
    || pathFromRoot.includes(`..${sep}`)
    || resolve(pathFromRoot) === pathFromRoot
  ) {
    // <lang><zh-CN>抛出稳定相对标识，不回显绝对路径或宿主目录布局。</zh-CN><en>Throw a stable relative identifier and do not echo an absolute path or host-directory layout.</en></lang>
    throw new Error(`Repository-boundary violation for ${relativePath}.`);
  }

  return absolutePath;
}

/**
 * <lang><zh-CN>递归列出一个受控文件或目录内的普通文件。</zh-CN><en>Recursively lists regular files inside one controlled file or directory.</en></lang>
 *
 * @param {string} relativePath <lang><zh-CN>当前仓内受控路径。</zh-CN><en>Controlled path inside current repository.</en></lang>
 * @returns {Promise<string[]>} <lang><zh-CN>仓库相对普通文件路径。</zh-CN><en>Repository-relative regular-file paths.</en></lang>
 * @lang zh-CN 目录链接被跳过，防止门禁沿 junction/symlink 读取仓外内容；失败时由调用方得到明确拒绝。
 * @lang en Directory links are skipped to keep the gate from reading external content through a junction or symlink; a failure is reported clearly to the caller.
 */
async function listControlledFiles(relativePath) {
  // <lang><zh-CN>解析并检查根路径；后续所有子项都从该已验证根派生。</zh-CN><en>Resolve and check root path; every later child derives from this validated root.</en></lang>
  const absolutePath = resolveRepositoryPath(relativePath);
  const entryMetadata = await lstat(absolutePath);

  // <lang><zh-CN>普通文件直接返回；这用于根 README 等单一文本入口。</zh-CN><en>Return a regular file directly; this supports single-text entries such as the root README.</en></lang>
  if (entryMetadata.isFile()) {
    return [relativePath];
  }

  // <lang><zh-CN>符号链接和非目录/非文件对象不进入检查范围，避免跨边界跟随或设备读取。</zh-CN><en>Symbolic links and non-directory/non-file objects do not enter inspection scope, avoiding cross-boundary traversal or device reads.</en></lang>
  if (!entryMetadata.isDirectory() || entryMetadata.isSymbolicLink()) {
    throw new Error(`Controlled path must be a regular file or directory: ${relativePath}.`);
  }

  /** @type {string[]} */
  const discoveredFiles = [];

  /**
   * <lang><zh-CN>以深度优先方式读取固定根下的目录项。</zh-CN><en>Reads directory entries depth-first below the fixed root.</en></lang>
   *
   * @param {string} nestedRelativePath <lang><zh-CN>当前受控子目录的仓库相对路径。</zh-CN><en>Repository-relative path of the current controlled child directory.</en></lang>
   * @returns {Promise<void>} <lang><zh-CN>子目录完成读取时 resolve。</zh-CN><en>Resolves when child directory reading completes.</en></lang>
   * @lang zh-CN 只加入普通文件；目录与链接均先检查类型，避免由路径字符串本身决定边界。
   * @lang en Add regular files only; check directory and link types first, avoiding boundary decisions based on path strings alone.
   */
  async function visitDirectory(nestedRelativePath) {
    // <lang><zh-CN>目录条目按名称排序，使成功摘要前的检查顺序稳定且便于复现问题。</zh-CN><en>Sort directory entries by name, making the check order before summary stable and easier to reproduce.</en></lang>
    const directoryEntries = await readdir(
      resolveRepositoryPath(nestedRelativePath),
      { withFileTypes: true }
    );
    directoryEntries.sort((left, right) => left.name.localeCompare(right.name));

    for (const directoryEntry of directoryEntries) {
      // <lang><zh-CN>忽略安装与生成目录，不把它们的内容误认为受控 package/source 输入。</zh-CN><en>Ignore installation and generated directories and do not mistake their contents for controlled package/source input.</en></lang>
      if (directoryEntry.isDirectory() && ignoredDirectoryNames.has(directoryEntry.name)) {
        continue;
      }

      // <lang><zh-CN>子路径由当前已验证路径和 directory entry 名组成，而非外部输入。</zh-CN><en>Build child path from the current validated path and directory-entry name rather than external input.</en></lang>
      const childRelativePath = `${nestedRelativePath}/${directoryEntry.name}`;

      // <lang><zh-CN>链接一律跳过，防止读取入口被链接到仓外、设备或不受控树。</zh-CN><en>Skip all links, preventing a read entry from being linked to an external, device, or uncontrolled tree.</en></lang>
      if (directoryEntry.isSymbolicLink()) {
        continue;
      }

      // <lang><zh-CN>普通文件以仓库相对路径记录，便于后续统一只读读取。</zh-CN><en>Record regular files as repository-relative paths for subsequent uniform read-only access.</en></lang>
      if (directoryEntry.isFile()) {
        discoveredFiles.push(childRelativePath);
        continue;
      }

      // <lang><zh-CN>仅递归普通目录；其他文件系统对象不属于质量门禁的输入。</zh-CN><en>Recurse into ordinary directories only; other filesystem objects are not inputs to the quality gate.</en></lang>
      if (directoryEntry.isDirectory()) {
        await visitDirectory(childRelativePath);
      }
    }
  }

  // <lang><zh-CN>从已验证根开始读取，函数不接受调用方 callback、filter 或路径覆盖。</zh-CN><en>Read from the validated root; the function accepts no caller callback, filter, or path override.</en></lang>
  await visitDirectory(relativePath);
  return discoveredFiles;
}

/**
 * <lang><zh-CN>读取并解析一个固定仓内 JSON 文件。</zh-CN><en>Reads and parses one fixed JSON file inside the repository.</en></lang>
 *
 * @param {string} relativePath <lang><zh-CN>受控 JSON 的仓库相对路径。</zh-CN><en>Repository-relative path of controlled JSON.</en></lang>
 * @returns {Promise<Record<string, unknown>>} <lang><zh-CN>已解析的普通 JSON 对象。</zh-CN><en>Parsed ordinary JSON object.</en></lang>
 * @lang zh-CN JSON 只作为静态 metadata 读取，不被解释为可执行配置或动态模块定义。
 * @lang en JSON is read only as static metadata and is not interpreted as executable configuration or dynamic-module definition.
 */
async function readJsonObject(relativePath) {
  // <lang><zh-CN>以 UTF-8 只读文本；不使用 require/import，因此不会执行 JSON 外任何代码。</zh-CN><en>Read UTF-8 text only; do not use require/import, so no code outside JSON is executed.</en></lang>
  const sourceText = await readFile(resolveRepositoryPath(relativePath), 'utf8');
  const parsedValue = JSON.parse(sourceText);

  // <lang><zh-CN>只接受非数组对象，避免 metadata 检查把任意 JSON primitive 当作 manifest。</zh-CN><en>Accept only non-array objects, keeping metadata checks from treating an arbitrary JSON primitive as a manifest.</en></lang>
  if (parsedValue === null || Array.isArray(parsedValue) || typeof parsedValue !== 'object') {
    throw new Error(`Expected a JSON object in ${relativePath}.`);
  }

  return parsedValue;
}

/**
 * <lang><zh-CN>将一个问题加入稳定问题列表。</zh-CN><en>Adds one issue to the stable issue list.</en></lang>
 *
 * @param {string[]} issues <lang><zh-CN>本次运行的问题收集器。</zh-CN><en>Issue collector for this run.</en></lang>
 * @param {string} message <lang><zh-CN>不含绝对路径或文件正文的稳定问题消息。</zh-CN><en>Stable issue message with no absolute path or file body.</en></lang>
 * @returns {void} <lang><zh-CN>无返回值；问题追加到列表。</zh-CN><en>No return value; the issue is appended to list.</en></lang>
 * @lang zh-CN 使用集中收集可以在一次静态运行中报告多个独立边界违反，不产生修复或外部副作用。
 * @lang en Central collection can report multiple independent boundary violations in one static run and produces neither repair nor external side effect.
 */
function addIssue(issues, message) {
  // <lang><zh-CN>去重保持诊断紧凑，且不影响同一规则对不同相对路径的独立可见性。</zh-CN><en>Deduplicate diagnostics while keeping separate relative paths visible for the same rule.</en></lang>
  if (!issues.includes(message)) {
    issues.push(message);
  }
}

/**
 * <lang><zh-CN>检查 root package 和 workspace package 的固定 metadata 形态。</zh-CN><en>Checks fixed metadata shape of root package and workspace packages.</en></lang>
 *
 * @param {string[]} issues <lang><zh-CN>本次运行的问题收集器。</zh-CN><en>Issue collector for this run.</en></lang>
 * @returns {Promise<number>} <lang><zh-CN>已读取的 workspace package 数量。</zh-CN><en>Number of workspace packages read.</en></lang>
 * @lang zh-CN 检查只读取已经声明的 package metadata；不调用 package-manager、安装器或 archive 工具。
 * @lang en The check reads declared package metadata only and invokes no package manager, installer, or archive tool.
 */
async function verifyPackageMetadata(issues) {
  // <lang><zh-CN>root metadata 固定仓的 workspace 边界和基础 license/engine 承诺。</zh-CN><en>Root metadata fixes workspace boundaries and base license/engine commitments of the repository.</en></lang>
  const rootPackage = await readJsonObject('package.json');

  // <lang><zh-CN>root 是 orchestration package，不允许意外变为可发布或非 MIT 包。</zh-CN><en>The root is an orchestration package and must not accidentally become publishable or non-MIT.</en></lang>
  if (rootPackage.private !== true || rootPackage.license !== 'MIT') {
    addIssue(issues, 'Root package must remain private and MIT-licensed.');
  }

  // <lang><zh-CN>workspace 列表必须等于本门禁的显式组，避免新增目录未经审阅即被 npm 接纳。</zh-CN><en>Workspace list must equal the gate's explicit groups, avoiding an unreviewed new directory being accepted by npm.</en></lang>
  const expectedWorkspacePatterns = workspaceGroups.map(({ relativePath }) => `${relativePath}/*`);
  if (
    !Array.isArray(rootPackage.workspaces)
    || rootPackage.workspaces.length !== expectedWorkspacePatterns.length
    || rootPackage.workspaces.some(
      (workspacePattern, index) => workspacePattern !== expectedWorkspacePatterns[index]
    )
  ) {
    addIssue(issues, 'Root workspaces must match the reviewed explicit workspace groups.');
  }

  // <lang><zh-CN>root Node engine 是所有 local quality command 的共同最低版本。</zh-CN><en>The root Node engine is the shared minimum version for all local quality commands.</en></lang>
  if (rootPackage.engines?.node !== '>=22.0.0') {
    addIssue(issues, 'Root package must declare Node >=22.0.0.');
  }

  const packageEntries = [];

  for (const workspaceGroup of workspaceGroups) {
    // <lang><zh-CN>直接读取一层 workspace child，匹配 `directory/*` 而不是递归猜测 package 树。</zh-CN><en>Read direct workspace children, matching `directory/*` rather than recursively guessing a package tree.</en></lang>
    const childEntries = await readdir(resolveRepositoryPath(workspaceGroup.relativePath), {
      withFileTypes: true
    });
    childEntries.sort((left, right) => left.name.localeCompare(right.name));

    for (const childEntry of childEntries) {
      // <lang><zh-CN>只有普通 workspace 子目录可声明 package；链接或文件不会被当作 package 接纳。</zh-CN><en>Only ordinary workspace child directories may declare a package; links or files are not accepted as packages.</en></lang>
      if (!childEntry.isDirectory() || childEntry.isSymbolicLink()) {
        continue;
      }

      packageEntries.push({
        relativePath: `${workspaceGroup.relativePath}/${childEntry.name}/package.json`,
        packageShape: workspaceGroup.packageShape
      });
    }
  }

  for (const packageEntry of packageEntries) {
    // <lang><zh-CN>每个 workspace manifest 必须存在且是 JSON object；读取失败即为质量问题而非忽略。</zh-CN><en>Each workspace manifest must exist and be a JSON object; read failure is a quality failure rather than being ignored.</en></lang>
    const manifest = await readJsonObject(packageEntry.relativePath);
    const packageName = manifest.name;

    // <lang><zh-CN>所有当前 workspace 都是 Biz 私有 package；未来公共 package 需要独立 ADR 与 metadata policy 更新。</zh-CN><en>All current workspaces are private Biz packages; a future public package needs a separate ADR and metadata-policy update.</en></lang>
    if (
      typeof packageName !== 'string'
      || !packageName.startsWith('@hia-uview/biz-')
      || manifest.private !== true
      || manifest.license !== 'MIT'
      || manifest.type !== 'module'
      || manifest.version !== '0.0.0'
      || manifest.engines?.node !== '>=22.0.0'
    ) {
      addIssue(issues, `Workspace metadata is invalid: ${packageEntry.relativePath}.`);
    }

    // <lang><zh-CN>library package 只能分发 `src`、导出单一入口且声明无副作用，避免 package content 漂移。</zh-CN><en>A library package may distribute only `src`, export one entry, and declare no side effects, avoiding package-content drift.</en></lang>
    if (packageEntry.packageShape === 'library') {
      const hasExpectedFiles = Array.isArray(manifest.files)
        && manifest.files.length === 1
        && manifest.files[0] === 'src';
      const hasExpectedExport = manifest.exports?.['.'] === './src/index.mjs';

      if (!hasExpectedFiles || !hasExpectedExport || manifest.sideEffects !== false) {
        addIssue(issues, `Library package content policy is invalid: ${packageEntry.relativePath}.`);
      }
    }

    // <lang><zh-CN>application package 不带 library export/files policy，避免把受控 fixture 误表示为可发布 library。</zh-CN><en>An application package carries no library export/files policy, avoiding presentation of a controlled fixture as a publishable library.</en></lang>
    if (
      packageEntry.packageShape === 'application'
      && (Object.hasOwn(manifest, 'exports') || Object.hasOwn(manifest, 'files'))
    ) {
      addIssue(issues, `Application package must not declare library distribution fields: ${packageEntry.relativePath}.`);
    }

    // <lang><zh-CN>依赖版本形态独立检查，防止 metadata 看似正确却引入路径或远程 source。</zh-CN><en>Check dependency-version shape independently, preventing correct-looking metadata from introducing path or remote source.</en></lang>
    verifyDependencyShape(manifest, packageEntry.relativePath, issues);
  }

  // <lang><zh-CN>root 也需要同一依赖形态限制，但允许已锁定的开发工具 package 名称。</zh-CN><en>The root also needs the same dependency-shape restriction while allowing its locked development-tool package names.</en></lang>
  verifyDependencyShape(rootPackage, 'package.json', issues);
  return packageEntries.length;
}

/**
 * <lang><zh-CN>检查一个 package manifest 的 dependency 版本形态。</zh-CN><en>Checks dependency-version shape of one package manifest.</en></lang>
 *
 * @param {Record<string, unknown>} manifest <lang><zh-CN>已解析 package metadata。</zh-CN><en>Parsed package metadata.</en></lang>
 * @param {string} relativePath <lang><zh-CN>manifest 的仓库相对路径。</zh-CN><en>Repository-relative path of manifest.</en></lang>
 * @param {string[]} issues <lang><zh-CN>本次运行的问题收集器。</zh-CN><en>Issue collector for this run.</en></lang>
 * @returns {void} <lang><zh-CN>无返回值；违反会追加到 `issues`。</zh-CN><en>No return value; violations are appended to `issues`.</en></lang>
 * @lang zh-CN 不解析 registry、lockfile 或网络版本；只限制本仓 manifest 中可审阅的 specifier 语法。
 * @lang en Do not resolve registry, lockfile, or network versions; constrain only reviewable specifier syntax in repository manifests.
 */
function verifyDependencyShape(manifest, relativePath, issues) {
  // <lang><zh-CN>当前 package manager 支持的四类 dependency metadata 都适用同一静态限制。</zh-CN><en>The same static restriction applies to the four dependency metadata kinds currently supported by the package manager.</en></lang>
  const dependencyFields = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies'
  ];

  for (const dependencyField of dependencyFields) {
    const dependencies = manifest[dependencyField];

    // <lang><zh-CN>缺少字段即为空对象；非对象字段是 metadata 形态错误。</zh-CN><en>A missing field is an empty object; a non-object field is a metadata-shape error.</en></lang>
    if (dependencies === undefined) {
      continue;
    }
    if (dependencies === null || Array.isArray(dependencies) || typeof dependencies !== 'object') {
      addIssue(issues, `Dependency metadata must be an object: ${relativePath}#${dependencyField}.`);
      continue;
    }

    for (const [dependencyName, dependencySpecifier] of Object.entries(dependencies)) {
      // <lang><zh-CN>specifier 必须是普通字符串；对象、数组或空值不能表达已复审来源。</zh-CN><en>A specifier must be an ordinary string; object, array, or null cannot express a reviewed source.</en></lang>
      if (typeof dependencySpecifier !== 'string') {
        addIssue(issues, `Dependency specifier must be a string: ${relativePath}#${dependencyName}.`);
        continue;
      }

      // <lang><zh-CN>拒绝本地路径、workspace alias、远程 URL、Git/SSH 与链接协议，保持普通 clone 不依赖外部 source 位置。</zh-CN><en>Reject local paths, workspace aliases, remote URLs, Git/SSH, and link protocols, keeping an ordinary clone independent from external source locations.</en></lang>
      if (/^(?:\.{1,2}[\\/]|file:|git\+|git:|github:|https?:|link:|ssh:|workspace:)/iu.test(dependencySpecifier)) {
        addIssue(issues, `Unsupported dependency source in ${relativePath}#${dependencyName}.`);
      }

      // <lang><zh-CN>内部 Biz dependency 必须保持当前精确版本；它不是 workspace resolver 或隐式本地 link。</zh-CN><en>An internal Biz dependency must keep the current exact version; it is not a workspace resolver or implicit local link.</en></lang>
      if (
        dependencyName.startsWith('@hia-uview/biz-')
        && dependencySpecifier !== '0.0.0'
      ) {
        addIssue(issues, `Internal Biz dependency must use version 0.0.0: ${relativePath}#${dependencyName}.`);
      }
    }
  }
}

/**
 * <lang><zh-CN>检查受控 package 文件中不存在当前不允许的 asset 或 CSS remote loading。</zh-CN><en>Checks controlled package files for currently disallowed assets or CSS remote loading.</en></lang>
 *
 * @param {string[]} issues <lang><zh-CN>本次运行的问题收集器。</zh-CN><en>Issue collector for this run.</en></lang>
 * @returns {Promise<number>} <lang><zh-CN>已检查的受控 package 文件数量。</zh-CN><en>Number of controlled package files checked.</en></lang>
 * @lang zh-CN 文件扩展名和 CSS 文本均只读检查；门禁不会下载、解码、转码或移除任何 asset。
 * @lang en File extensions and CSS text are checked read-only; the gate downloads, decodes, transcodes, or removes no asset.
 */
async function verifyAssetPolicy(issues) {
  // <lang><zh-CN>聚合所有 workspace 根的普通文件，跳过安装与生成目录。</zh-CN><en>Aggregate regular files under every workspace root while skipping installation and generated directories.</en></lang>
  const fileGroups = await Promise.all(
    workspaceGroups.map(({ relativePath }) => listControlledFiles(relativePath))
  );
  const controlledFiles = fileGroups.flat();

  for (const relativePath of controlledFiles) {
    // <lang><zh-CN>扩展名使用小写比较，确保大小写变化不能绕过二进制/font policy。</zh-CN><en>Compare extension names in lowercase, ensuring a case change cannot bypass binary/font policy.</en></lang>
    const extension = extname(relativePath).toLowerCase();
    if (prohibitedAssetExtensions.has(extension)) {
      addIssue(issues, `Disallowed binary or font asset: ${relativePath}.`);
      continue;
    }

    // <lang><zh-CN>只有可能含 CSS URL 的文本格式才读取，避免将普通代码或 JSON 误作 stylesheet 解析。</zh-CN><en>Read only text formats that may contain CSS URLs, avoiding treatment of ordinary code or JSON as stylesheets.</en></lang>
    if (!['.css', '.scss', '.vue'].includes(extension)) {
      continue;
    }

    const sourceText = await readFile(resolveRepositoryPath(relativePath), 'utf8');
    const hasRemoteUrl = /url\(\s*['"]?\s*(?:https?:|\/\/)/iu.test(sourceText);
    const hasRemoteImport = /@import\s+(?:url\(\s*)?['"]?\s*(?:https?:|\/\/)/iu.test(sourceText);

    // <lang><zh-CN>CSS remote URL/import 会绕过本地 asset source 与 license 审阅，因此首轮直接拒绝。</zh-CN><en>A CSS remote URL/import bypasses local asset-source and license review, so the first round rejects it directly.</en></lang>
    if (hasRemoteUrl || hasRemoteImport) {
      addIssue(issues, `Remote CSS asset loading is not allowed: ${relativePath}.`);
    }
  }

  return controlledFiles.length;
}

/**
 * <lang><zh-CN>检查公开文档和受控 source 不泄露私有过程或机器路径标记。</zh-CN><en>Checks public documentation and controlled source for no private-process or machine-path marker leaks.</en></lang>
 *
 * @param {string[]} issues <lang><zh-CN>本次运行的问题收集器。</zh-CN><en>Issue collector for this run.</en></lang>
 * @returns {Promise<number>} <lang><zh-CN>已检查的公开文本文件数量。</zh-CN><en>Number of public text files checked.</en></lang>
 * @lang zh-CN 只读取 source 与 Markdown 文本；版本化 JSON contract 仍由对应 schema/test 和 manifest metadata 检查处理，避免把 schema 自身的路径防护正则误作泄露。
 * @lang en Read source and Markdown text only; versioned JSON contracts remain handled by their schema/test and manifest-metadata checks, avoiding treatment of a schema's own path-defense regex as a leak.
 */
async function verifyPublicTextBoundary(issues) {
  // <lang><zh-CN>收集 public roots 的文件；README 是单文件，其余 root 允许目录读取。</zh-CN><en>Collect files under public roots; README is a single file and remaining roots allow directory reads.</en></lang>
  const fileGroups = await Promise.all(publicTextRoots.map(listControlledFiles));
  const publicFiles = fileGroups.flat();
  const textExtensions = new Set(['.css', '.html', '.js', '.md', '.mjs', '.scss', '.vue', '']);

  for (const relativePath of publicFiles) {
    // <lang><zh-CN>README 无扩展名仍是文本；其他不认识的扩展名不以 UTF-8 强读。</zh-CN><en>README without an extension remains text; other unknown extensions are not forced through UTF-8 reading.</en></lang>
    if (!textExtensions.has(extname(relativePath).toLowerCase())) {
      continue;
    }

    const sourceText = await readFile(resolveRepositoryPath(relativePath), 'utf8');

    for (const prohibitedMarker of prohibitedPublicTextMarkers) {
      // <lang><zh-CN>regex 每次检查前重置状态，确保未来新增 global pattern 时也保持确定性。</zh-CN><en>Reset regex state before each check, retaining determinism even if a future pattern gains the global flag.</en></lang>
      prohibitedMarker.expression.lastIndex = 0;
      if (prohibitedMarker.expression.test(sourceText)) {
        addIssue(issues, `Public-text boundary violation (${prohibitedMarker.name}): ${relativePath}.`);
      }
    }
  }

  return publicFiles.length;
}

/**
 * <lang><zh-CN>检查 framework runtime source 中不存在当前禁止的主机、网络或动态执行 capability。</zh-CN><en>Checks framework runtime source for no currently prohibited host, network, or dynamic-execution capability.</en></lang>
 *
 * @param {string[]} issues <lang><zh-CN>本次运行的问题收集器。</zh-CN><en>Issue collector for this run.</en></lang>
 * @returns {Promise<number>} <lang><zh-CN>已检查的 runtime source 文件数量。</zh-CN><en>Number of runtime source files checked.</en></lang>
 * @lang zh-CN 只检查 `.mjs`、`.js` 与 `.vue` runtime source；test/build/documentation scripts 不属于这个 product runtime capability claim。
 * @lang en Check only `.mjs`, `.js`, and `.vue` runtime source; test/build/documentation scripts are outside this product-runtime capability claim.
 */
async function verifyRuntimeCapabilityBoundary(issues) {
  // <lang><zh-CN>各 root 同时进行只读枚举，结果随后按源文件逐项检查。</zh-CN><en>Enumerate each root read-only in parallel, then inspect results file by file.</en></lang>
  const fileGroups = await Promise.all(runtimeSourceRoots.map(listControlledFiles));
  const runtimeFiles = fileGroups
    .flat()
    .filter((relativePath) => ['.js', '.mjs', '.vue'].includes(extname(relativePath).toLowerCase()));

  for (const relativePath of runtimeFiles) {
    // <lang><zh-CN>读取 source 文本只作模式检查；不 import、transpile、mount 或执行组件。</zh-CN><en>Read source text only for pattern checks; do not import, transpile, mount, or execute components.</en></lang>
    const sourceText = await readFile(resolveRepositoryPath(relativePath), 'utf8');

    for (const prohibitedCapability of prohibitedRuntimeCapabilities) {
      // <lang><zh-CN>复位 regex 状态以保持逐文件检查独立，并只报告 capability 名称与公开相对路径。</zh-CN><en>Reset regex state to keep per-file checks independent and report only capability name and public relative path.</en></lang>
      prohibitedCapability.expression.lastIndex = 0;
      if (prohibitedCapability.expression.test(sourceText)) {
        addIssue(issues, `Runtime capability violation (${prohibitedCapability.name}): ${relativePath}.`);
      }
    }
  }

  return runtimeFiles.length;
}

/**
 * <lang><zh-CN>检查仓内 package script 与可选 workflow 文本不存在自动外部发布控制。</zh-CN><en>Checks repository package scripts and optional workflow text for no automatic external publication control.</en></lang>
 *
 * @param {string[]} issues <lang><zh-CN>本次运行的问题收集器。</zh-CN><en>Issue collector for this run.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>检查完成时 resolve。</zh-CN><en>Resolves when check completes.</en></lang>
 * @lang zh-CN 仅扫描本仓声明的 command text；不启动 CI、shell、release CLI 或任何上传动作。
 * @lang en Scan declared command text in this repository only; start no CI, shell, release CLI, or upload action.
 */
async function verifyNoAutomaticPublicationControls(issues) {
  // <lang><zh-CN>root scripts 是当前唯一声明的顶层自动 command surface。</zh-CN><en>Root scripts are the only currently declared top-level automatic command surface.</en></lang>
  const rootPackage = await readJsonObject('package.json');
  const scripts = rootPackage.scripts;
  const prohibitedAutomation = /(?:\bnpm\s+(?:publish|version)\b|\b(?:pnpm|yarn)\s+publish\b|\bgh\s+release\b|\b(?:wechat|miniprogram)\b.*\b(?:publish|upload)\b)/iu;

  // <lang><zh-CN>非对象 scripts 视为 metadata 形态错误；空对象仍满足“无自动发布”的当前边界。</zh-CN><en>A non-object scripts field is metadata-shape error; an empty object still satisfies the current no-automatic-publication boundary.</en></lang>
  if (scripts === undefined) {
    return;
  }
  if (scripts === null || Array.isArray(scripts) || typeof scripts !== 'object') {
    addIssue(issues, 'Root package scripts must be an object.');
    return;
  }

  for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
    // <lang><zh-CN>命令必须是字符串；这也阻止非标准 metadata 被静默忽略。</zh-CN><en>A command must be a string; this also prevents non-standard metadata from being silently ignored.</en></lang>
    if (typeof scriptCommand !== 'string') {
      addIssue(issues, `Root script must be a string: ${scriptName}.`);
      continue;
    }

    // <lang><zh-CN>只拒绝明确发布/upload 动作；本地 build/verify/test 命令仍可由各自边界单独声明。</zh-CN><en>Reject explicit publish/upload actions only; local build/verify/test commands may remain declared by their own boundaries.</en></lang>
    if (prohibitedAutomation.test(scriptCommand)) {
      addIssue(issues, `Automatic publication control is not allowed: ${scriptName}.`);
    }
  }

  // <lang><zh-CN>workflow 目录可选；不存在时不创建，也不把缺失解释为 CI 结论。</zh-CN><en>The workflow directory is optional; do not create it when absent or interpret its absence as a CI conclusion.</en></lang>
  const workflowDirectory = '.github/workflows';
  try {
    const workflowFiles = await listControlledFiles(workflowDirectory);
    for (const relativePath of workflowFiles) {
      // <lang><zh-CN>只检查 YAML 文本中的明确发布/upload 语义，不执行 workflow 或解析 action。</zh-CN><en>Check explicit publish/upload semantics in YAML text only and execute no workflow or parse no action.</en></lang>
      if (!['.yaml', '.yml'].includes(extname(relativePath).toLowerCase())) {
        continue;
      }
      const workflowText = await readFile(resolveRepositoryPath(relativePath), 'utf8');
      if (prohibitedAutomation.test(workflowText)) {
        addIssue(issues, `Automatic publication control is not allowed: ${relativePath}.`);
      }
    }
  } catch (error) {
    // <lang><zh-CN>仅忽略不存在的可选 workflow 目录；任何其他读取错误仍应中止门禁以避免假阳性通过。</zh-CN><en>Ignore only an absent optional workflow directory; any other read error must still abort the gate to avoid a false-positive pass.</en></lang>
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
}

/**
 * <lang><zh-CN>运行完整离线发布质量候选检查并在全部 policy 通过后输出受限摘要。</zh-CN><en>Runs the complete offline release-quality candidate check and prints a bounded summary only after every policy passes.</en></lang>
 *
 * @returns {Promise<void>} <lang><zh-CN>全部 policy 通过时 resolve；任一问题时抛出。</zh-CN><en>Resolves when all policies pass and throws when any issue exists.</en></lang>
 * @lang zh-CN 检查器只读且不产生缓存、报告文件、archive、网络请求或发布状态；错误不包含源文本和绝对路径。
 * @lang en The checker is read-only and produces no cache, report file, archive, network request, or publication state; errors contain no source text or absolute paths.
 */
async function runReleaseQualityCandidateGate() {
  /** @type {string[]} */
  const issues = [];

  // <lang><zh-CN>先检查 manifest，再检查文件边界；所有独立检查完成后统一给出可审阅问题列表。</zh-CN><en>Check manifests first and file boundaries next; present one reviewable issue list only after all independent checks complete.</en></lang>
  const packageCount = await verifyPackageMetadata(issues);
  const assetFileCount = await verifyAssetPolicy(issues);
  const publicTextFileCount = await verifyPublicTextBoundary(issues);
  const runtimeFileCount = await verifyRuntimeCapabilityBoundary(issues);
  await verifyNoAutomaticPublicationControls(issues);

  // <lang><zh-CN>任何问题都以非零结果失败，且不尝试自动修复、重写 metadata 或删除文件。</zh-CN><en>Fail nonzero on any issue and attempt no automatic repair, metadata rewrite, or file deletion.</en></lang>
  if (issues.length > 0) {
    throw new Error(
      `HIA-uView-Biz release-quality candidate gate failed:\n${issues.map((issue) => `- ${issue}`).join('\n')}`
    );
  }

  // <lang><zh-CN>成功摘要仅报告稳定计数；它不声称发布、设备、网络、安全或无障碍结论。</zh-CN><en>Success summary reports stable counts only; it claims no publication, device, network, security, or accessibility conclusion.</en></lang>
  console.log(
    `HIA-uView-Biz release-quality candidate gate passed (${packageCount} packages, ${assetFileCount} controlled files, ${publicTextFileCount} public text files, ${runtimeFileCount} runtime files).`
  );
}

// <lang><zh-CN>执行只读候选门禁；没有 command-line 输入、网络 provider 或发布入口。</zh-CN><en>Execute read-only candidate gate; there is no command-line input, network provider, or publication entry point.</en></lang>
await runReleaseQualityCandidateGate();
