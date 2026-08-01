/**
 * <lang><zh-CN>离线发布质量候选门禁验收：以独立 Node 进程验证检查器可在当前仓内只读运行。</zh-CN><en>Offline release-quality candidate gate acceptance: verifies in a separate Node process that the checker can run read-only in this repository.</en></lang>
 * @lang zh-CN 测试不执行应用 runtime、不安装依赖，也不连接网络；它只检查门禁的稳定成功结果与受限摘要。
 * @lang en The test executes no application runtime, installs no dependency, and connects to no network; it checks only the gate's stable success result and bounded summary.
 */

// <lang><zh-CN>使用同步子进程隔离门禁入口，避免测试通过 import 获得检查器内部实现细节。</zh-CN><en>Use a synchronous child process to isolate the gate entry point and avoid giving the test implementation details through import.</en></lang>
import { spawnSync } from 'node:child_process';

// <lang><zh-CN>使用严格断言确认门禁失败时会使验收失败。</zh-CN><en>Use strict assertions so a gate failure also fails this acceptance.</en></lang>
import assert from 'node:assert/strict';

// <lang><zh-CN>使用 Node 原生测试运行器，保持仓库无新增测试依赖。</zh-CN><en>Use the native Node test runner, keeping the repository free of an added test dependency.</en></lang>
import test from 'node:test';

/**
 * <lang><zh-CN>验证发布质量候选检查器能完成其离线静态检查。</zh-CN><en>Verifies that the release-quality candidate checker completes its offline static checks.</en></lang>
 *
 * @returns {void} <lang><zh-CN>子进程退出状态和摘要断言完成信号。</zh-CN><en>Completion signal for child-process status and summary assertions.</en></lang>
 * @lang zh-CN 工作目录显式继承当前仓根；测试不接受调用方提供的路径、参数或环境覆盖。
 * @lang en The working directory explicitly inherits the current repository root; the test accepts no caller-provided path, argument, or environment override.
 */
function assertReleaseQualityCandidateGate() {
  // <lang><zh-CN>以当前 Node 可执行文件运行静态检查器，避免依赖 shell 或 package-manager 行为。</zh-CN><en>Run the static checker with the current Node executable, avoiding a dependency on shell or package-manager behavior.</en></lang>
  const result = spawnSync(
    process.execPath,
    ['scripts/verify-release-quality.mjs'],
    {
      cwd: process.cwd(),
      encoding: 'utf8'
    }
  );

  // <lang><zh-CN>成功状态是门禁可作为本地候选证据的最低条件。</zh-CN><en>A successful status is the minimum condition for the gate to serve as local candidate evidence.</en></lang>
  assert.equal(result.status, 0, result.stderr || result.stdout);

  // <lang><zh-CN>只断言稳定摘要前缀，避免把文件数量等实现细节固化为公开契约。</zh-CN><en>Assert only a stable summary prefix, avoiding the elevation of details such as file counts into public contract.</en></lang>
  assert.match(
    result.stdout,
    /HIA-uView-Biz release-quality candidate gate passed/,
  );
}

// <lang><zh-CN>门禁本身是独立的公开质量边界，必须有直接 Node 验收。</zh-CN><en>The gate itself is an independent public quality boundary and must have direct Node acceptance.</en></lang>
test(
  'release-quality candidate gate completes offline static checks',
  assertReleaseQualityCandidateGate
);
