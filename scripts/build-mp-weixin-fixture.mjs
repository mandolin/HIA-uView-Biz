/**
 * <lang><zh-CN>构建 Biz 的受控 `mp-weixin` 应用 fixture；它只运行锁定本地 compiler，不启动 dev server、watch、DevTools、网络服务、预览或发布。</zh-CN><en>Builds Biz's controlled `mp-weixin` application fixture; it runs only the locked local compiler and starts no dev server, watch, DevTools, network service, preview, or release.</en></lang>
 * @lang zh-CN 构建前必须校验操作者显式提供的 UI source identity 与 commit，避免 normal clone 获得隐式跨仓依赖。
 * @lang en The operator-provided UI source identity and commit must be validated before build, preventing a normal clone from acquiring an implicit cross-repository dependency.
 */

import { existsSync } from 'node:fs';
import { lstat, rm, symlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveVerifiedHiaUViewUiSource } from './resolve-hia-uview-ui-source.mjs';

/**
 * <lang><zh-CN>当前脚本所在目录，用于计算仓库内固定相对输入。</zh-CN><en>Directory containing the current script, used to calculate fixed repository-relative inputs.</en></lang>
 * @lang zh-CN 该值来自模块 URL，而非调用方 cwd，避免操作者从其他目录运行命令时改变 compiler 选择。
 * @lang en This value comes from the module URL rather than caller cwd, preventing compiler selection from changing when an operator runs the command elsewhere.
 */
const scriptsDirectory = dirname(fileURLToPath(import.meta.url));

/**
 * <lang><zh-CN>Biz 仓库根目录。</zh-CN><en>Biz repository root directory.</en></lang>
 * @lang zh-CN 只由本脚本位置推导，不接受环境或命令行覆盖。
 * @lang en Derived only from this script location and accepts no environment or command-line override.
 */
const repositoryDirectory = resolve(scriptsDirectory, '..');

/**
 * <lang><zh-CN>受控应用 fixture 的 package 目录。</zh-CN><en>Package directory of the controlled application fixture.</en></lang>
 * @lang zh-CN 此目录保留 fixture 自有 Vite config 与 package metadata，不包含 UI source copy。
 * @lang en This directory retains the fixture's own Vite config and package metadata and contains no UI-source copy.
 */
const fixtureDirectory = resolve(repositoryDirectory, 'apps/example-catalog-query-detail-mp-weixin');

/**
 * <lang><zh-CN>fixture 的 UniApp 源码输入目录。</zh-CN><en>UniApp source-input directory of the fixture.</en></lang>
 * @lang zh-CN 该路径传给 compiler 的 `UNI_INPUT_DIR`，确保 app 自己而非 UI package 成为生成目标。
 * @lang en This path is passed to compiler as `UNI_INPUT_DIR`, ensuring the app rather than UI package becomes the generation target.
 */
const fixtureSourceDirectory = resolve(fixtureDirectory, 'src');

/**
 * <lang><zh-CN>编译期间位于 fixture 输入树内的一次性 UI source directory link。</zh-CN><en>One-use UI-source directory link located inside fixture input tree during compilation.</en></lang>
 * @lang zh-CN link 不是 source copy、Git tracked 文件或发布物；它只让官方 compiler 以输入树内的稳定词法路径读取经核验的 source。
 * @lang en The link is not source copy, Git-tracked file, or release artifact; it only lets official compiler read verified source through a stable lexical path inside input tree.
 */
const uiSourceLinkDirectory = resolve(fixtureSourceDirectory, 'hia-uview-ui-source');

/**
 * <lang><zh-CN>已锁定官方 UniApp Vite compiler 的本仓入口。</zh-CN><en>Repository-local entry of the locked official UniApp Vite compiler.</en></lang>
 * @lang zh-CN 不使用全局 CLI、网络下载或调用方 PATH 中的替代 compiler。
 * @lang en Uses no global CLI, network download, or alternate compiler from caller PATH.
 */
const compilerEntry = resolve(repositoryDirectory, 'node_modules/@dcloudio/vite-plugin-uni/bin/uni.js');

/**
 * <lang><zh-CN>以固定参数启动一次 `mp-weixin` compiler 进程。</zh-CN><en>Starts one `mp-weixin` compiler process with fixed arguments.</en></lang>
 * @returns {Promise<number>} <lang><zh-CN>compiler 的原始退出码。</zh-CN><en>Raw compiler exit code.</en></lang>
 * @lang zh-CN 不转发命令行参数；没有 dev、watch、preview、publish、proxy 或外部 service 模式。
 * @lang en Forwards no command-line parameter; there is no dev, watch, preview, publish, proxy, or external-service mode.
 */
function buildFixture() {
  // <lang><zh-CN>返回受控 Promise，使 signal、启动错误与退出码由本脚本明确处理，而不是隐式吞掉。</zh-CN><en>Return a controlled Promise so signals, launch errors, and exit codes are explicitly handled by this script rather than implicitly swallowed.</en></lang>
  return new Promise((resolveExitCode, rejectBuild) => {
    // <lang><zh-CN>只传递 fixture source 与已验证 UI root 两个必要环境输入；不继承令 compiler 读取未声明环境行为的完整环境集合。</zh-CN><en>Pass only the two necessary environment inputs, fixture source and verified UI root; do not inherit a full environment that lets compiler read undeclared behavior.</en></lang>
    const compilerEnvironment = {
      UNI_INPUT_DIR: fixtureSourceDirectory,
      HIA_UVIEW_UI_ROOT: process.env.HIA_UVIEW_UI_ROOT
    };

    // <lang><zh-CN>以当前 Node、固定 compiler entry、固定 target 执行；stdio 继承仅显示官方 compiler 的本地诊断。</zh-CN><en>Execute with current Node, fixed compiler entry, and fixed target; inherited stdio only displays official compiler local diagnostics.</en></lang>
    const compilerProcess = spawn(
      process.execPath,
      [compilerEntry, 'build', '-p', 'mp-weixin'],
      {
        cwd: fixtureDirectory,
        env: compilerEnvironment,
        stdio: 'inherit',
        shell: false,
        windowsHide: true
      }
    );

    // <lang><zh-CN>启动失败直接拒绝，避免将缺失 compiler 误报为已生成小程序输出。</zh-CN><en>Reject immediately on launch failure, avoiding a missing compiler being reported as generated Mini Program output.</en></lang>
    compilerProcess.once('error', rejectBuild);

    // <lang><zh-CN>收到 signal 时形成明确错误；普通退出则原样返回数值退出码给 npm。</zh-CN><en>Turn a received signal into an explicit error; on ordinary exit return the numeric exit code unchanged to npm.</en></lang>
    compilerProcess.once('exit', (exitCode, signal) => {
      // <lang><zh-CN>signal 代表没有完成可审计 compile-only 结果，不能静默归零。</zh-CN><en>A signal represents no completed auditable compile-only result and cannot silently become zero.</en></lang>
      if (signal !== null) {
        rejectBuild(new Error(`mp-weixin fixture compiler ended from signal ${signal}.`));
        return;
      }

      // <lang><zh-CN>保留 compiler 的实际退出码；空码按失败处理，避免不完整进程被当作成功。</zh-CN><en>Retain the compiler's actual exit code; treat an empty code as failure, preventing an incomplete process from being treated as success.</en></lang>
      resolveExitCode(exitCode ?? 1);
    });
  });
}

/**
 * <lang><zh-CN>创建一次性 directory junction，使已核验 UI source 以 fixture 输入树内的词法路径供 compiler 读取。</zh-CN><en>Creates a one-use directory junction so compiler can read verified UI source through a lexical path inside fixture input tree.</en></lang>
 * @param {string} verifiedSourceRoot <lang><zh-CN>source guard 返回的已核验 UI package root。</zh-CN><en>Verified UI-package root returned by source guard.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>link 创建成功时 resolve。</zh-CN><en>Resolves when link is created successfully.</en></lang>
 * @lang zh-CN 若目标已存在则拒绝，绝不覆盖、复用或删除操作者可能放入 source tree 的文件/链接。
 * @lang en Rejects when target already exists and never overwrites, reuses, or deletes a file/link an operator may have placed in source tree.
 */
async function createUiSourceLink(verifiedSourceRoot) {
  // <lang><zh-CN>先只读检查精确目标；存在时停止，避免把 cleanup 权限扩大到未知对象。</zh-CN><en>First inspect exact target read-only; stop when it exists, avoiding expansion of cleanup authority to an unknown object.</en></lang>
  try {
    await lstat(uiSourceLinkDirectory);
    throw new Error('The controlled UI source-link location already exists; remove only the known generated link before retrying.');
  } catch (error) {
    // <lang><zh-CN>仅 ENOENT 表示可安全创建；其他文件系统错误（包括权限）原样阻止 build。</zh-CN><en>Only ENOENT means creation is safe; every other filesystem error, including permission, blocks build unchanged.</en></lang>
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  // <lang><zh-CN>创建 Windows junction 而非复制目录内容；source target 仍由前置 metadata/commit guard 明确核验。</zh-CN><en>Create a Windows junction rather than copying directory contents; preceding metadata/commit guard explicitly verified source target.</en></lang>
  await symlink(verifiedSourceRoot, uiSourceLinkDirectory, 'junction');
}

/**
 * <lang><zh-CN>删除本次 build 确认创建的一次性 UI source link。</zh-CN><en>Removes the one-use UI-source link confirmed as created by this build.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>link 移除完成时 resolve。</zh-CN><en>Resolves when link removal completes.</en></lang>
 * @lang zh-CN 调用方必须在自己的 created flag 为真时调用；函数不扫描、递归删除 fixture source tree 或触及 link 目标。
 * @lang en Caller must invoke only when its own created flag is true; function scans no fixture source tree, recursively deletes no source tree, and touches no link target.
 */
async function removeCreatedUiSourceLink() {
  // <lang><zh-CN>移除精确 junction 路径；Node 对 junction 的移除只删除 link 本身，不删除其经核验的外部 target。</zh-CN><en>Remove exact junction path; Node removal of junction deletes the link itself and not its verified external target.</en></lang>
  await rm(uiSourceLinkDirectory, { recursive: true, force: false, maxRetries: 2 });
}

// <lang><zh-CN>先验证本仓 compiler entry，避免 UI source guard 成功后才发现本机缺少已锁定的 compiler 文件。</zh-CN><en>Validate the repository-local compiler entry first, avoiding a later discovery that the locked compiler file is missing after UI-source guard succeeds.</en></lang>
if (!existsSync(compilerEntry)) {
  throw new Error('The locked UniApp compiler entry is unavailable; install the committed development dependencies before building the fixture.');
}

// <lang><zh-CN>先执行 UI metadata/commit guard，并保留仅供本次 junction 创建的已验证 root；Vite config 会在 alias 解析前再次执行同一 guard。</zh-CN><en>Run UI metadata/commit guard first and retain verified root only for this junction creation; Vite config reruns same guard before alias resolution.</en></lang>
const verifiedUiSource = resolveVerifiedHiaUViewUiSource();

// <lang><zh-CN>只在本脚本成功创建 junction 后允许 finally 清理，避免删除任何预存操作者文件。</zh-CN><en>Permit finally cleanup only after this script successfully creates junction, avoiding deletion of any preexisting operator file.</en></lang>
let didCreateUiSourceLink = false;

try {
  // <lang><zh-CN>将已核验 source 以临时 lexical path 置于 compiler 输入树内；不复制、修改或提交 UI source。</zh-CN><en>Place verified source under temporary lexical path inside compiler input tree; do not copy, modify, or commit UI source.</en></lang>
  await createUiSourceLink(verifiedUiSource.sourceRoot);
  didCreateUiSourceLink = true;

  // <lang><zh-CN>只在两个固定本地输入和一次性 link 均已通过时启动一次 compiler；不创建 server 或 watcher。</zh-CN><en>Start one compiler only after two fixed local inputs and one-use link pass; create no server or watcher.</en></lang>
  const compilerExitCode = await buildFixture();

  // <lang><zh-CN>将 compiler 退出状态交还 npm；脚本本身不把编译通过升级为 DevTools、真机、无障碍或发布证据。</zh-CN><en>Return compiler exit status to npm; the script itself does not elevate compilation to DevTools, device, accessibility, or release evidence.</en></lang>
  process.exitCode = compilerExitCode;
} finally {
  // <lang><zh-CN>仅清理本次明确创建的 link；无论 compiler 成功或失败，外部 UI source 与 fixture 其他文件都不被触及。</zh-CN><en>Clean only link explicitly created in this run; whether compiler succeeds or fails, external UI source and every other fixture file remain untouched.</en></lang>
  if (didCreateUiSourceLink) {
    await removeCreatedUiSourceLink();
  }
}
