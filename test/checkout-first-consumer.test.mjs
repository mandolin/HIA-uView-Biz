/**
 * <lang><zh-CN>checkout-first consumer fixture 验收：固定显式 manifest/profile、shell flow、provider host 与安全失败边界。</zh-CN><en>Checkout-first consumer fixture acceptance: fixes explicit manifest/profile, shell flow, provider host, and safe failure boundaries.</en></lang>
 * @lang zh-CN 测试只读取仓内 consumer JSON 并执行同步 mock，不访问网络、环境、DevTools 或真实项目。
 * @lang en The test reads only checked-in consumer JSON and executes synchronous mocks; it accesses no network, environment, DevTools, or real project.
 */

// <lang><zh-CN>使用 Node 原生 assertion/test，保持验收无新增测试依赖。</zh-CN><en>Use Node-native assertion/test so acceptance adds no test dependency.</en></lang>
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// <lang><zh-CN>导入 consumer 的公开 factory 与 manifest/profile validator，不导入内部 provider closure。</zh-CN><en>Import the consumer's public factory and validators without importing internal provider closures.</en></lang>
import {
  createCheckoutFirstConsumerFixture,
  validateConsumerManifest,
  validateConsumerProfile
} from '../apps/example-catalog-query-detail-consumer/src/index.mjs';

/**
 * <lang><zh-CN>读取固定 consumer JSON 输入。</zh-CN><en>Reads fixed consumer JSON input.</en></lang>
 * @param {string} relativePath <lang><zh-CN>相对测试模块的固定路径。</zh-CN><en>Fixed path relative to this test module.</en></param>
 * @returns {Promise<object>} <lang><zh-CN>解析后的 plain JSON。</zh-CN><en>Parsed plain JSON.</en></lang>
 * @lang zh-CN 测试路径是仓内常量，不接受环境或命令行覆盖。
 * @lang en The test path is a repository constant and accepts no environment or command-line override.
 */
async function readFixtureJson(relativePath) {
  // <lang><zh-CN>UTF-8 读取确保 profile 标识和中英数据稳定。</zh-CN><en>Read UTF-8 to keep profile identifiers and bilingual data stable.</en></lang>
  const text = await readFile(new URL(relativePath, import.meta.url), 'utf8');

  // <lang><zh-CN>每次 parse 返回独立输入，避免负向测试改变仓内默认 fixture。</zh-CN><en>Each parse returns independent input so negative tests cannot change the checked-in default fixture.</en></lang>
  return JSON.parse(text);
}

/**
 * <lang><zh-CN>验证默认 consumer 完成 template、shell 与 provider flow。</zh-CN><en>Verifies the default consumer completes template, shell, and provider flows.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>验收断言完成信号。</zh-CN><en>Acceptance assertion completion signal.</en></lang>
 * @lang zh-CN 测试覆盖目录 query/detail、session/storage/read/write 与 rollback 计数。
 * @lang en The test covers catalog query/detail, session/storage/read/write, and rollback counts.
 */
async function assertDefaultConsumerFlow() {
  // <lang><zh-CN>读取 consumer 自有 manifest/profile，不让 factory 读取文件或发现 package。</zh-CN><en>Read the consumer-owned manifest/profile and keep the factory from reading files or discovering packages.</en></lang>
  const manifest = await readFixtureJson('../apps/example-catalog-query-detail-consumer/src/consumer.manifest.json');
  const profile = await readFixtureJson('../apps/example-catalog-query-detail-consumer/src/consumer.profile.json');
  assert.equal(validateConsumerManifest(manifest).ok, true);
  assert.equal(validateConsumerProfile(profile).ok, true);

  // <lang><zh-CN>初始化必须形成完整 shell 与 provider host，且不暴露 candidate/manifest 原始对象。</zh-CN><en>Initialization must form a complete shell and provider host without exposing candidate or raw manifest objects.</en></lang>
  const fixture = createCheckoutFirstConsumerFixture({ manifest, profile });
  assert.equal(fixture.ok, true);
  assert.deepEqual(Object.keys(fixture).sort(), [
    'diagnostics',
    'getAdoptionSnapshot',
    'getManifestSnapshot',
    'getProfileSnapshot',
    'getProviderObservation',
    'getTemplateSnapshot',
    'invokeProvider',
    'ok',
    'shell'
  ]);

  // <lang><zh-CN>shell query/detail 仍通过既有 application integration contract，不复制 module provider。</zh-CN><en>Shell query/detail still use the existing application integration contract and do not copy the module provider.</en></lang>
  const page = fixture.shell.query({ contractVersion: '1.0', filter: {}, page: 1, pageSize: 1 });
  assert.equal(page.entries[0].id, 'entry-001');
  assert.equal(fixture.shell.selectEntry('entry-001').entry.id, 'entry-001');

  // <lang><zh-CN>provider host 只返回 plain outcomes，并记录失败 rollback 而非外部事务状态。</zh-CN><en>The provider host returns plain outcomes and records rollback failure rather than external transaction state.</en></lang>
  assert.equal(fixture.invokeProvider('session-state').value.mode, 'mock');
  assert.equal(fixture.invokeProvider('catalog-query', { page: 1, pageSize: 1 }).value.total, 1);
  assert.equal(fixture.invokeProvider('entry-update', { mode: 'cancel', entryId: 'entry-001' }).rollback, 'completed');
  assert.equal(fixture.invokeProvider('entry-update', { mode: 'unknown-rollback', entryId: 'entry-001' }).rollback, 'unknown');
  assert.equal(fixture.getProviderObservation().failures.rollback, 1);
}

/**
 * <lang><zh-CN>验证额外连接字段、未知 source 与坏 manifest 不会被默认或回显。</zh-CN><en>Verifies extra connection fields, unknown source, and malformed manifest are neither defaulted nor echoed.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>负向断言完成信号。</zh-CN><en>Negative assertion completion signal.</en></lang>
 * @lang zh-CN 负向输入使用固定无意义值，不含真实 secret、URL 或项目数据。
 * @lang en Negative inputs use fixed meaningless values and contain no real secret, URL, or project data.
 */
async function assertSafeConsumerFailure() {
  // <lang><zh-CN>读取独立对象，确保本测试破坏的字段不会污染成功 flow。</zh-CN><en>Read independent objects so fields broken by this test cannot contaminate the success flow.</en></lang>
  const manifest = await readFixtureJson('../apps/example-catalog-query-detail-consumer/src/consumer.manifest.json');
  const profile = await readFixtureJson('../apps/example-catalog-query-detail-consumer/src/consumer.profile.json');
  manifest.endpoint = 'https://secret.invalid/endpoint';
  profile.sourceMode = 'automatic-secret-source';

  // <lang><zh-CN>validator 只返回固定 code，不回显额外字段、URL 或 source value。</zh-CN><en>Validators return fixed codes only and echo neither extra fields, URL, nor source value.</en></lang>
  const failure = createCheckoutFirstConsumerFixture({ manifest, profile });
  assert.equal(failure.ok, false);
  const serialized = JSON.stringify(failure);
  assert.equal(serialized.includes('secret.invalid'), false);
  assert.equal(serialized.includes('automatic-secret-source'), false);
  assert.equal(serialized.includes('endpoint'), false);
}

test('checkout-first consumer completes the local catalog and provider flow', assertDefaultConsumerFlow);
test('checkout-first consumer rejects unsafe input without echo', assertSafeConsumerFailure);
