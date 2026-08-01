/**
 * <lang><zh-CN>本地 source-trial 命令验收：固定其只编排既有受限本地门禁，而不隐式扩展为编译、模拟器或发布入口。</zh-CN><en>Local source-trial command acceptance: fixes that it orchestrates only existing bounded local gates and does not implicitly expand into a compiler, simulator, or publication entry.</en></lang>
 * @lang zh-CN 测试只读取本仓 root package metadata；不执行 package script、不安装依赖、不访问网络，也不创建外部状态。
 * @lang en This test reads only root package metadata in this repository; it executes no package script, installs no dependency, accesses no network, and creates no external state.
 */

// <lang><zh-CN>读取固定 root package metadata，避免 test 依赖 shell、registry 或任意调用方路径。</zh-CN><en>Read fixed root package metadata, keeping the test independent from shell, registry, or an arbitrary caller path.</en></lang>
import { readFile } from 'node:fs/promises';

// <lang><zh-CN>使用严格断言，使缺失或漂移的 trial command 成为明确的验收失败。</zh-CN><en>Use strict assertions so a missing or drifted trial command becomes an explicit acceptance failure.</en></lang>
import assert from 'node:assert/strict';

// <lang><zh-CN>使用 Node 原生 test runner，保持 source-trial 不引入新的测试依赖。</zh-CN><en>Use the native Node test runner, keeping the source trial free of a new testing dependency.</en></lang>
import test from 'node:test';

/**
 * <lang><zh-CN>source-trial 允许的固定本地 baseline command。</zh-CN><en>The fixed local baseline command allowed for the source trial.</en></lang>
 * @lang zh-CN 顺序先报告 readiness，再运行完整确定性验收，最后运行离线质量门禁；不包含 compiler、DevTools、网络或发布子命令。
 * @lang en The order reports readiness first, runs full deterministic acceptance second, and runs the offline quality gate last; it includes no compiler, DevTools, network, or publication subcommand.
 */
const expectedSourceTrialCommand = 'npm run doctor && npm test && npm run quality:release-candidate';

/**
 * <lang><zh-CN>读取并解析当前仓固定 root `package.json`。</zh-CN><en>Reads and parses the fixed root `package.json` in the current repository.</en></lang>
 *
 * @returns {Promise<Record<string, unknown>>} <lang><zh-CN>已解析的 root package metadata。</zh-CN><en>Parsed root package metadata.</en></lang>
 * @lang zh-CN 文件位置由 test module 的 URL 固定，不接受调用方路径，也不读取 workspace package 或外部 package metadata。
 * @lang en The file location is fixed by this test module URL, accepts no caller path, and reads neither a workspace package nor external package metadata.
 */
async function readRootPackageMetadata() {
  // <lang><zh-CN>使用相对本测试文件的固定 URL 定位 root metadata，避免测试依赖当前 shell 工作目录。</zh-CN><en>Use a fixed URL relative to this test file to locate root metadata, avoiding a dependency on the current shell working directory.</en></lang>
  const packageUrl = new URL('../package.json', import.meta.url);

  // <lang><zh-CN>只以 UTF-8 文本读取固定 metadata；读取失败必须传播为 trial contract 失败。</zh-CN><en>Read fixed metadata only as UTF-8 text; a read failure must propagate as a trial-contract failure.</en></lang>
  const packageText = await readFile(packageUrl, 'utf8');

  // <lang><zh-CN>将 JSON 文本解析为 metadata 对象；无效 JSON 不可作为可执行 trial command 的可信来源。</zh-CN><en>Parse JSON text into a metadata object; invalid JSON cannot be a trusted source for an executable trial command.</en></lang>
  return JSON.parse(packageText);
}

/**
 * <lang><zh-CN>验证 `trial:source` 只串联已批准的本地证据命令。</zh-CN><en>Verifies that `trial:source` chains only approved local evidence commands.</en></lang>
 *
 * @returns {Promise<void>} <lang><zh-CN>命令完全匹配时 resolve；缺失或扩域时拒绝。</zh-CN><en>Resolves when the command matches exactly and rejects when it is absent or widened.</en></lang>
 * @lang zh-CN 精确字符串契约有意拒绝隐式 compiler、UI source discovery、DevTools、network、install 或 publish 行为。
 * @lang en The exact-string contract intentionally rejects implicit compiler, UI-source discovery, DevTools, network, install, or publish behavior.
 */
async function assertBoundedSourceTrialCommand() {
  // <lang><zh-CN>读取当前仓 root metadata，获取 package script 的唯一声明来源。</zh-CN><en>Read current-repository root metadata to obtain the single declared source of package scripts.</en></lang>
  const packageMetadata = await readRootPackageMetadata();

  // <lang><zh-CN>只将 scripts 视为普通对象；缺失时以空对象处理，使断言报告稳定的 command 缺失而非访问错误。</zh-CN><en>Treat scripts only as a plain object; handle absence as an empty object so the assertion reports a stable missing command rather than an access error.</en></lang>
  const scripts = packageMetadata.scripts ?? {};

  // <lang><zh-CN>精确固定 source-trial 的顺序与边界，不允许本地便利性悄然演变为外部状态或隐式输入。</zh-CN><en>Fix the source-trial order and boundary exactly, preventing local convenience from silently evolving into external state or implicit input.</en></lang>
  assert.equal(scripts['trial:source'], expectedSourceTrialCommand);
}

// <lang><zh-CN>source-trial 是公开 developer entry，必须通过独立 Node acceptance 固定其无外部状态的编排边界。</zh-CN><en>The source trial is a public developer entry and must have independent Node acceptance fixing its no-external-state orchestration boundary.</en></lang>
test(
  'source trial command chains only bounded local evidence',
  assertBoundedSourceTrialCommand
);
