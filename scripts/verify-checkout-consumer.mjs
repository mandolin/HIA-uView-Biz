/**
 * <lang><zh-CN>验证 checkout-first consumer fixture 的固定 manifest/profile、shell query/detail 与 provider-port evidence。</zh-CN><en>Verifies the fixed checkout-first consumer manifest/profile, shell query/detail, and provider-port evidence.</en></lang>
 * @lang zh-CN 本脚本只读取两个仓内 JSON，执行本地同步 mock；不访问网络、环境、外部 source、DevTools 或发布工具。
 * @lang en This script reads only two checked-in JSON files and executes local synchronous mocks; it accesses no network, environment, external source, DevTools, or publication tool.
 */

// <lang><zh-CN>使用 Node 原生断言，保持 consumer verification 不引入新测试依赖。</zh-CN><en>Use Node-native assertions so consumer verification adds no test dependency.</en></lang>
import assert from 'node:assert/strict';

// <lang><zh-CN>只使用标准文件 API 读取两个固定 profile 输入。</zh-CN><en>Use only standard file APIs to read the two fixed profile inputs.</en></lang>
import { readFile } from 'node:fs/promises';

// <lang><zh-CN>从 consumer factory 取得显式组合入口，不直接触及其内部 provider closure。</zh-CN><en>Obtain the explicit composition entry from the consumer factory without touching its internal provider closure.</en></lang>
import { createCheckoutFirstConsumerFixture } from '../apps/example-catalog-query-detail-consumer/src/index.mjs';

/**
 * <lang><zh-CN>读取一个固定仓内 JSON 文件。</zh-CN><en>Reads one fixed checked-in JSON file.</en></lang>
 * @param {URL} inputUrl <lang><zh-CN>模块相对固定 URL。</zh-CN><en>Module-relative fixed URL.</en></param>
 * @returns {Promise<object>} <lang><zh-CN>解析后的 plain JSON。</zh-CN><en>Parsed plain JSON.</en></lang>
 * @lang zh-CN URL 由本脚本常量构造，不接受命令行、环境或调用方覆盖。
 * @lang en The URL is constructed by this script's constants and accepts no command-line, environment, or caller override.
 */
async function readJson(inputUrl) {
  // <lang><zh-CN>以 UTF-8 读取，确保版本和中英标识不会受平台默认编码影响。</zh-CN><en>Read as UTF-8 so version and bilingual identifiers are not affected by platform-default encoding.</en></lang>
  const text = await readFile(inputUrl, 'utf8');

  // <lang><zh-CN>解析后的对象只作为显式 consumer input，不写回或缓存到外部状态。</zh-CN><en>The parsed object is only explicit consumer input and is neither written back nor cached in external state.</en></lang>
  return JSON.parse(text);
}

/**
 * <lang><zh-CN>执行一次完整 consumer 验收。</zh-CN><en>Runs one complete consumer acceptance.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>所有本地 contract 断言通过时 resolve。</zh-CN><en>Resolves when every local contract assertion passes.</en></lang>
 * @lang zh-CN 该验收覆盖 template/profile、query/detail、session/storage/read/write、rollback 与 observation redaction。
 * @lang en This acceptance covers template/profile, query/detail, session/storage/read/write, rollback, and observation redaction.
 */
async function verifyConsumer() {
  // <lang><zh-CN>路径只指向 consumer 自有的两个版本化 JSON，不搜索其他目录或 package。</zh-CN><en>Paths point only to the consumer's two versioned JSON files and search no other directory or package.</en></lang>
  const manifestUrl = new URL('../apps/example-catalog-query-detail-consumer/src/consumer.manifest.json', import.meta.url);
  const profileUrl = new URL('../apps/example-catalog-query-detail-consumer/src/consumer.profile.json', import.meta.url);
  const manifest = await readJson(manifestUrl);
  const profile = await readJson(profileUrl);

  // <lang><zh-CN>factory 必须接收调用方显式输入，不由 runtime 推断 profile 或 provider。</zh-CN><en>The factory must receive explicit caller input and infer neither profile nor provider at runtime.</en></lang>
  const fixture = createCheckoutFirstConsumerFixture({ manifest, profile });
  assert.equal(fixture.ok, true);

  // <lang><zh-CN>manifest/profile snapshot 只披露稳定 metadata，不回显任意连接字段。</zh-CN><en>Manifest/profile snapshots disclose stable metadata only and echo no connection field.</en></lang>
  assert.deepEqual(fixture.getManifestSnapshot(), {
    id: 'example.catalog-query-detail.consumer',
    templateId: 'example.catalog-query-detail',
    profileId: 'example.catalog-query-detail.consumer',
    providerContractVersion: '1.0',
    providerPortIds: ['session-state', 'local-preference', 'catalog-query', 'entry-update']
  });
  assert.equal(fixture.getProfileSnapshot().sourceMode, 'mock');

  // <lang><zh-CN>application shell 复跑既有目录 query/detail，不把 provider host 或 profile 原文暴露给页面。</zh-CN><en>The application shell reruns the existing catalog query/detail flow without exposing the provider host or raw profile to the page.</en></lang>
  const page = fixture.shell.query({ contractVersion: '1.0', filter: {}, page: 1, pageSize: 1 });
  assert.equal(page.kind, 'page');
  assert.equal(page.entries[0].id, 'entry-001');
  const detail = fixture.shell.selectEntry('entry-001');
  assert.equal(detail.kind, 'detail');
  assert.equal(detail.entry.id, 'entry-001');

  // <lang><zh-CN>session 与可选 storage 通过显式 host 调用，storage 状态只存在 fixture 内存 closure。</zh-CN><en>Session and optional storage use explicit host calls, with storage state existing only in the fixture memory closure.</en></lang>
  assert.equal(fixture.invokeProvider('session-state').value.subject, null);
  assert.equal(fixture.invokeProvider('local-preference', { action: 'set', key: 'theme', value: 'light' }).value.stored, true);
  assert.equal(fixture.invokeProvider('local-preference', { action: 'get', key: 'theme' }).value.value, 'light');

  // <lang><zh-CN>read provider 返回 canonical page；host 只复制 plain data 并记录计数。</zh-CN><en>The read provider returns a canonical page while the host copies plain data and records counts only.</en></lang>
  const providerPage = fixture.invokeProvider('catalog-query', { page: 1, pageSize: 1 });
  assert.equal(providerPage.kind, 'success');
  assert.equal(providerPage.value.entries[0].id, 'entry-001');

  // <lang><zh-CN>write success/cancel/unknown rollback 证明调用方可观察边界，不升级为真实事务。</zh-CN><en>Write success/cancel/unknown rollback prove the caller-observable boundary without elevating it to a real transaction.</en></lang>
  assert.equal(fixture.invokeProvider('entry-update', { mode: 'ok', entryId: 'entry-001' }).kind, 'success');
  const cancelled = fixture.invokeProvider('entry-update', { mode: 'cancel', entryId: 'entry-001' });
  assert.equal(cancelled.rollback, 'completed');
  const unknownRollback = fixture.invokeProvider('entry-update', { mode: 'unknown-rollback', entryId: 'entry-001' });
  assert.equal(unknownRollback.kind, 'failure');
  assert.equal(unknownRollback.rollback, 'unknown');

  // <lang><zh-CN>observation 只允许计数，不能包含输入、entry label、provider closure 或异常正文。</zh-CN><en>Observation permits counts only and contains no input, entry label, provider closure, or exception body.</en></lang>
  const observationText = JSON.stringify(fixture.getProviderObservation());
  assert.equal(observationText.includes('entry-001'), false);
  assert.equal(observationText.includes('light'), false);
}

try {
  // <lang><zh-CN>CLI 只输出稳定成功文本；失败不输出 host path 或 provider exception。</zh-CN><en>The CLI prints stable success text only; failures print no host path or provider exception.</en></lang>
  await verifyConsumer();
  console.log('HIA-uView-Biz checkout-first consumer contract passed.');
} catch {
  // <lang><zh-CN>将所有失败归并为固定诊断，避免把测试输入或本机路径写入公开日志。</zh-CN><en>Collapse every failure into a fixed diagnostic so test input or machine paths do not enter public logs.</en></lang>
  console.error('HIA-uView-Biz checkout-first consumer contract failed. / HIA-uView-Biz checkout-first consumer 契约验证失败。');
  process.exitCode = 1;
}
