/**
 * <lang><zh-CN>Biz doctor 验收：通过独立 Node 进程固定 doctor 的受限 JSON readiness report。</zh-CN><en>Biz doctor acceptance: fixes the doctor's bounded JSON readiness report through an independent Node process.</en></lang>
 * @lang zh-CN 测试只运行当前仓的 doctor entry，不执行应用 runtime、不安装依赖、不连接网络，也不读取仓外 source。
 * @lang en The test runs only the doctor entry in the current repository; it executes no application runtime, installs no dependency, connects no network, and reads no external source.
 */

// <lang><zh-CN>使用独立子进程验证公开 command surface，而非通过 import 耦合 doctor 的内部 helper。</zh-CN><en>Use an independent child process to verify the public command surface rather than coupling this test to doctor internal helpers through import.</en></lang>
import { spawnSync } from 'node:child_process';

// <lang><zh-CN>使用严格断言防止非零 exit 或 JSON shape 漂移被默认为通过。</zh-CN><en>Use strict assertions so a nonzero exit or JSON-shape drift cannot be treated as a pass by default.</en></lang>
import assert from 'node:assert/strict';

// <lang><zh-CN>使用 Node 原生测试运行器，保持 doctor 验收没有新增测试 dependency。</zh-CN><en>Use the native Node test runner, keeping doctor acceptance free of an added test dependency.</en></lang>
import test from 'node:test';

/**
 * <lang><zh-CN>验证 doctor 的 JSON report 只暴露稳定 readiness metadata。</zh-CN><en>Verifies that the doctor's JSON report exposes only stable readiness metadata.</en></lang>
 *
 * @returns {void} <lang><zh-CN>子进程状态和 JSON shape 断言完成信号。</zh-CN><en>Completion signal for child-process status and JSON-shape assertions.</en></lang>
 * @lang zh-CN npm user agent 在测试中显式固定，避免 test 对运行器实际 npm 小版本或宿主路径产生隐式依赖。
 * @lang en The npm user agent is explicitly fixed in the test, avoiding an implicit dependency on runner npm patch version or host path.
 */
function assertDoctorJsonReport() {
  // <lang><zh-CN>为 npm-script metadata 提供最小可信文本；doctor 不接收 path、credential 或外部 source 输入。</zh-CN><en>Provide minimal trusted text for npm-script metadata; doctor accepts no path, credential, or external-source input.</en></lang>
  const doctorEnvironment = {
    ...process.env,
    npm_config_user_agent: 'npm/10.9.0 node/24.0.0 win32 x64'
  };

  // <lang><zh-CN>以当前 Node executable 调用唯一 machine-readable 参数，保持 command 测试不依赖 shell 解析。</zh-CN><en>Invoke the only machine-readable argument with current Node executable, keeping command test independent of shell parsing.</en></lang>
  const result = spawnSync(
    process.execPath,
    ['scripts/doctor.mjs', '--json'],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: doctorEnvironment
    }
  );

  // <lang><zh-CN>ready 当前仓应以零状态完成；stderr 或 stdout 会在失败时提供最小诊断。</zh-CN><en>The ready current repository must complete with status zero; stderr or stdout supplies minimal diagnostics on failure.</en></lang>
  assert.equal(result.status, 0, result.stderr || result.stdout);

  // <lang><zh-CN>解析 JSON 输出，以 shape 而非本机版本或绝对路径固定 doctor 的公开契约。</zh-CN><en>Parse JSON output and fix doctor public contract by shape rather than host version or absolute path.</en></lang>
  const report = JSON.parse(result.stdout);

  // <lang><zh-CN>contract version、总体状态和检查数组共同保证 consumer 可区分结构变化与普通检查结果。</zh-CN><en>Contract version, overall state, and check array together let a consumer distinguish structural change from an ordinary check result.</en></lang>
  assert.equal(report.contractVersion, '1.0');
  assert.equal(report.ready, true);
  assert.ok(Array.isArray(report.checks));
  assert.deepEqual(
    report.checks.map((check) => check.id),
    ['node-version', 'npm-version', 'root-lockfile', 'installed-dependencies', 'consumer-manifest', 'consumer-profile']
  );

  // <lang><zh-CN>每项检查只公开 ID、level 和文本建议，不公开 path、环境对象、dependency tree 或外部 source identity。</zh-CN><en>Each check exposes only ID, level, and textual guidance, not a path, environment object, dependency tree, or external source identity.</en></lang>
  for (const check of report.checks) {
    assert.equal(typeof check.id, 'string');
    assert.ok(['ok', 'warn', 'error'].includes(check.level));
    assert.equal(typeof check.message, 'string');
    assert.equal(Object.hasOwn(check, 'path'), false);
    assert.equal(Object.hasOwn(check, 'source'), false);
  }
}

/**
 * <lang><zh-CN>验证 doctor 拒绝未知 argument 且不回显调用方输入或 host path。</zh-CN><en>Verifies that doctor rejects an unknown argument without echoing caller input or a host path.</en></lang>
 *
 * @returns {void} <lang><zh-CN>子进程拒绝状态和受限 stderr 断言完成信号。</zh-CN><en>Completion signal for child-process rejection status and bounded stderr assertions.</en></lang>
 * @lang zh-CN 负向测试使用无意义固定 token；它不传递真实路径、credential、source 或业务数据。
 * @lang en Negative test uses a fixed meaningless token and passes no real path, credential, source, or business data.
 */
function assertDoctorRejectsUnknownArgumentSafely() {
  // <lang><zh-CN>以当前 Node executable 传入不支持 token，验证解析器不会将它解释为路径或修复命令。</zh-CN><en>Pass unsupported token with current Node executable, verifying parser does not interpret it as a path or repair command.</en></lang>
  const result = spawnSync(
    process.execPath,
    ['scripts/doctor.mjs', 'unrecognized-input'],
    {
      cwd: process.cwd(),
      encoding: 'utf8'
    }
  );

  // <lang><zh-CN>输入错误使用独立非零状态，且 stdout 保持为空，避免误把失败写成 machine-readable readiness report。</zh-CN><en>Input error uses separate nonzero status and keeps stdout empty, avoiding writing failure as machine-readable readiness report.</en></lang>
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');

  // <lang><zh-CN>stderr 只含固定使用说明，既不回显 token，也不泄露 Windows/UNC/file 路径。</zh-CN><en>stderr contains fixed usage guidance only and leaks neither token nor Windows/UNC/file path.</en></lang>
  assert.match(result.stderr, /doctor accepts no argument or --json only/);
  assert.doesNotMatch(result.stderr, /unrecognized-input|[A-Za-z]:[\\/]|file:\/\//);
}

// <lang><zh-CN>doctor 的 JSON report 是采用反馈可复现性的直接契约，必须独立验收。</zh-CN><en>The doctor JSON report is a direct contract for reproducible adoption feedback and must be accepted independently.</en></lang>
test('doctor emits a bounded ready JSON report', assertDoctorJsonReport);

// <lang><zh-CN>未知 argument 必须安全拒绝，不能扩大 doctor 的读取或修复表面。</zh-CN><en>An unknown argument must be rejected safely and cannot expand doctor read or repair surface.</en></lang>
test('doctor rejects an unknown argument without echoing it', assertDoctorRejectsUnknownArgumentSafely);
