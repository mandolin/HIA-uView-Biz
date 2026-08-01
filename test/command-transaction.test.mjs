/**
 * <lang><zh-CN>canonical acknowledge-entry command 与确定性 mock transaction 的纯 Node 验收：固定 receipt、幂等、冲突、失败回退与显式 composition port。</zh-CN><en>Pure-Node acceptance for canonical acknowledge-entry command and deterministic mock transaction: fixes receipt, idempotency, conflict, failure rollback, and explicit composition port.</en></lang>
 * @lang zh-CN 测试只构造仓内 plain-data mock；不读取网络、环境、storage、身份、真实时间、随机值或 UI。
 * @lang en Tests construct only checked-in plain-data mocks; they read no network, environment, storage, identity, real time, random value, or UI.
 */

// <lang><zh-CN>使用严格断言固定公开 receipt/failure 与隔离 state 的精确边界。</zh-CN><en>Use strict assertions to fix exact boundaries of public receipt/failure and isolated state.</en></lang>
import assert from 'node:assert/strict';

// <lang><zh-CN>使用 Node 原生测试运行器，避免为纯 transaction 验收增加依赖。</zh-CN><en>Use Node native test runner, avoiding a dependency for pure transaction acceptance.</en></lang>
import test from 'node:test';

// <lang><zh-CN>使用核心组合器验证 command 只能经已登记 required port 进入实现。</zh-CN><en>Use core assembler to verify command can reach implementation only through a registered required port.</en></lang>
import { assembleComposition } from '../packages/core/src/index.mjs';

// <lang><zh-CN>被测 module 同时拥有中性 manifest、默认 mock provider 与可单独观察的 transaction factory。</zh-CN><en>The module under test owns neutral manifests, default mock provider, and an independently observable transaction factory.</en></lang>
import {
  createCatalogQueryDetailMock,
  createEntryAcknowledgementMockTransaction,
  createExampleManifests
} from '../modules/example-catalog-query-detail/src/index.mjs';

/**
 * <lang><zh-CN>创建最小且完整的 canonical acknowledge-entry command。</zh-CN><en>Creates the smallest complete canonical acknowledge-entry command.</en></lang>
 *
 * @param {string} [commandId='acknowledge-001'] <lang><zh-CN>调用方自有的稳定 command ID。</zh-CN><en>Stable command ID owned by caller.</en></lang>
 * @param {string} [entryId='entry-001'] <lang><zh-CN>中性 mock 唯一拥有的 entry ID。</zh-CN><en>Only entry ID owned by neutral mock.</en></lang>
 * @returns {object} <lang><zh-CN>不含自由 payload、身份或 transport 参数的 command plain data。</zh-CN><en>Command plain data containing no free payload, identity, or transport parameter.</en></lang>
 * @lang zh-CN 每次返回新对象，使测试对 command 修改不会污染其他 invocation。
 * @lang en Return a new object each time so test command changes cannot contaminate another invocation.
 */
function createAcknowledgeCommand(commandId = 'acknowledge-001', entryId = 'entry-001') {
  // <lang><zh-CN>字段与顺序固定为公开契约最小形态，不给 mock 引入 patch、text 或任意 metadata。</zh-CN><en>Fix fields and order to the public-contract minimum shape, introducing no patch, text, or arbitrary metadata into mock.</en></lang>
  return {
    contractVersion: '1.0',
    kind: 'acknowledge-entry',
    commandId,
    entryId
  };
}

/**
 * <lang><zh-CN>验证首次成功、同 ID receipt 重放、不同 ID 不适用失败与 detached snapshot。</zh-CN><en>Verifies first success, same-ID receipt replay, different-ID not-applicable failure, and detached snapshots.</en></lang>
 * @lang zh-CN 幂等记录是 instance-local；测试不共享 transaction，避免把 mock 行为误当作持久系统。
 * @lang en Idempotency records are instance-local; tests share no transaction, avoiding treating mock behavior as a persistent system.
 */
function testAcknowledgementIdempotencyAndConflict() {
  // <lang><zh-CN>每个 test 创建独立 success transaction，初始 state 必须可审阅且 revision 为零。</zh-CN><en>Each test creates an independent success transaction whose initial state must be reviewable with revision zero.</en></lang>
  const transaction = createEntryAcknowledgementMockTransaction();
  assert.deepEqual(transaction.getSnapshot(), {
    entryId: 'entry-001',
    acknowledgement: 'pending',
    revision: 0
  });

  // <lang><zh-CN>第一次 command 只生成固定 receipt 并把 revision 从零推进到一。</zh-CN><en>The first command creates only a fixed receipt and advances revision from zero to one.</en></lang>
  const firstReceipt = transaction.invoke(createAcknowledgeCommand());
  assert.deepEqual(firstReceipt, {
    contractVersion: '1.0',
    kind: 'command-receipt',
    commandId: 'acknowledge-001',
    entryId: 'entry-001',
    outcome: 'acknowledged',
    revision: 1
  });
  assert.deepEqual(transaction.getSnapshot(), {
    entryId: 'entry-001',
    acknowledgement: 'acknowledged',
    revision: 1
  });

  // <lang><zh-CN>修改调用方 receipt 不得写回 transaction；同 ID retry 返回独立但等值 receipt，revision 不再增加。</zh-CN><en>Mutating caller receipt must not write back into transaction; same-ID retry returns detached equivalent receipt without another revision increase.</en></lang>
  firstReceipt.revision = 99;
  const replayReceipt = transaction.invoke(createAcknowledgeCommand());
  assert.deepEqual(replayReceipt, {
    contractVersion: '1.0',
    kind: 'command-receipt',
    commandId: 'acknowledge-001',
    entryId: 'entry-001',
    outcome: 'acknowledged',
    revision: 1
  });
  assert.notEqual(replayReceipt, firstReceipt);
  assert.equal(transaction.getSnapshot().revision, 1);

  // <lang><zh-CN>已确认 entry 的不同 command ID 明确失败，而不是伪造第二次成功或静默 no-op。</zh-CN><en>A different command ID for an acknowledged entry fails explicitly rather than fabricating a second success or silent no-op.</en></lang>
  const conflict = transaction.invoke(createAcknowledgeCommand('acknowledge-002'));
  assert.equal(conflict.kind, 'failure');
  assert.equal(conflict.code, 'command-not-applicable');
  assert.equal(conflict.retryable, false);
  assert.equal(conflict.scope, 'command');
  assert.equal(transaction.getSnapshot().revision, 1);
}

/**
 * <lang><zh-CN>验证不兼容 command ID 重用、未知/额外输入与 deterministic commit failure 均不产生 partial mutation 或输入回显。</zh-CN><en>Verifies incompatible command-ID reuse, unknown/extra input, and deterministic commit failure produce neither partial mutation nor input echo.</en></lang>
 * @lang zh-CN 失败只使用稳定 bilingual canonical envelope；没有 exception、payload 或底层状态泄露。
 * @lang en Failures use only stable bilingual canonical envelopes; no exception, payload, or lower state leaks.
 */
function testRejectsInvalidAndRollbackPaths() {
  // <lang><zh-CN>先成功提交一个 command，再以同 ID 但不同 entry 触发明确 command-ID conflict。</zh-CN><en>Commit one command first, then trigger explicit command-ID conflict with same ID but different entry.</en></lang>
  const transaction = createEntryAcknowledgementMockTransaction();
  transaction.invoke(createAcknowledgeCommand('acknowledge-003'));
  const identifierConflict = transaction.invoke(createAcknowledgeCommand('acknowledge-003', 'entry-002'));
  assert.equal(identifierConflict.kind, 'failure');
  assert.equal(identifierConflict.code, 'command-id-conflict');
  assert.equal(JSON.stringify(identifierConflict).includes('entry-002'), false);
  assert.deepEqual(transaction.getSnapshot(), {
    entryId: 'entry-001',
    acknowledgement: 'acknowledged',
    revision: 1
  });

  // <lang><zh-CN>额外字段与 script-like 值应在 mutation 前被拒绝，且 public failure 不回显它。</zh-CN><en>An extra field and script-like value must be rejected before mutation, and public failure must not echo it.</en></lang>
  const invalidTransaction = createEntryAcknowledgementMockTransaction();
  const invalidCommand = createAcknowledgeCommand('acknowledge-004');
  invalidCommand.payload = 'javascript:untrusted';
  const invalidResult = invalidTransaction.invoke(invalidCommand);
  assert.equal(invalidResult.kind, 'failure');
  assert.equal(invalidResult.code, 'invalid-command');
  assert.equal(JSON.stringify(invalidResult).includes('javascript:untrusted'), false);
  assert.deepEqual(invalidTransaction.getSnapshot(), {
    entryId: 'entry-001',
    acknowledgement: 'pending',
    revision: 0
  });

  // <lang><zh-CN>accessor 字段也必须在读取前被拒绝；这防止 command 校验把调用方 getter 变成隐式执行面。</zh-CN><en>An accessor field must also be rejected before reading, preventing command validation from turning a caller getter into an implicit execution surface.</en></lang>
  let getterRead = false;
  const accessorCommand = createAcknowledgeCommand('acknowledge-007');
  Object.defineProperty(accessorCommand, 'entryId', {
    enumerable: true,
    get() {
      getterRead = true;
      return 'entry-001';
    }
  });
  const accessorResult = invalidTransaction.invoke(accessorCommand);
  assert.equal(accessorResult.kind, 'failure');
  assert.equal(accessorResult.code, 'invalid-command');
  assert.equal(getterRead, false);
  assert.deepEqual(invalidTransaction.getSnapshot(), {
    entryId: 'entry-001',
    acknowledgement: 'pending',
    revision: 0
  });

  // <lang><zh-CN>commit-failure 是固定本地 transaction 模式；失败前后 snapshot 必须完全相同，不能靠重新初始化隐藏部分写入。</zh-CN><en>Commit-failure is a fixed local transaction mode; snapshots before and after failure must match exactly and cannot hide partial write through reinitialization.</en></lang>
  const failingTransaction = createEntryAcknowledgementMockTransaction({
    transactionMode: 'commit-failure'
  });
  const beforeFailure = failingTransaction.getSnapshot();
  const failure = failingTransaction.invoke(createAcknowledgeCommand('acknowledge-005'));
  assert.equal(failure.kind, 'failure');
  assert.equal(failure.code, 'command-transaction-failed');
  assert.equal(failure.retryable, false);
  assert.equal(failure.scope, 'transaction');
  assert.deepEqual(failingTransaction.getSnapshot(), beforeFailure);
}

/**
 * <lang><zh-CN>验证 module manifest/implementation/provider 把 command 作为 required port 显式组合，而不是测试直调隐藏 closure。</zh-CN><en>Verifies module manifest, implementation, and provider compose command as required port explicitly rather than tests directly calling a hidden closure.</en></lang>
 * @lang zh-CN 成功 composition 仅证明当前进程内已选实现可调用 command；不表示 solution grant、真实授权、HTTP 或持久化写入。
 * @lang en Successful composition proves only current-process selected implementation can invoke command; it does not represent solution grants, real authorization, HTTP, or persistent write.
 */
function testComposesExplicitAcknowledgementPort() {
  // <lang><zh-CN>同一次 fixture 创建的 manifest/profile/provider 必须精确对应，core 才能形成 composition。</zh-CN><en>Manifest/profile/provider from same fixture creation must correspond exactly before core can form composition.</en></lang>
  const manifests = createExampleManifests();
  const mock = createCatalogQueryDetailMock({ fixtureCase: 'first-page' });
  const assembly = assembleComposition({
    businessModule: manifests.businessModule,
    implementationPackage: manifests.implementationPackage,
    profile: manifests.profile,
    portProviders: mock.portProviders
  });
  assert.equal(assembly.ok, true);

  // <lang><zh-CN>command 仅通过稳定 port ID 进入组合；core 不知道 mock transaction 内部 state。</zh-CN><en>Command enters composition only through stable port ID; core knows no internal mock-transaction state.</en></lang>
  const receipt = assembly.composition.invoke(
    'entry-acknowledge',
    createAcknowledgeCommand('acknowledge-006')
  );
  assert.equal(receipt.kind, 'command-receipt');
  assert.equal(receipt.revision, 1);

  // <lang><zh-CN>移除 provider 后 assembly 必须在 invocation 前失败，证明 command 不是 optional hidden helper。</zh-CN><en>After removing provider, assembly must fail before invocation, proving command is not an optional hidden helper.</en></lang>
  const missingProviderMock = createCatalogQueryDetailMock({ fixtureCase: 'first-page' });
  delete missingProviderMock.portProviders['entry-acknowledge'];
  const missingAssembly = assembleComposition({
    businessModule: createExampleManifests().businessModule,
    implementationPackage: createExampleManifests().implementationPackage,
    profile: createExampleManifests().profile,
    portProviders: missingProviderMock.portProviders
  });
  assert.equal(missingAssembly.ok, false);
  assert.equal(
    missingAssembly.diagnostics.some((diagnostic) => diagnostic.code === 'composition.port.missing'),
    true
  );
}

// <lang><zh-CN>登记相互隔离的 transaction、rollback 与 composition 验收，不暴露私有周期编号。</zh-CN><en>Register isolated transaction, rollback, and composition acceptance without exposing private cycle numbers.</en></lang>
test('acknowledge-entry is idempotent and rejects a different command after success', testAcknowledgementIdempotencyAndConflict);
test('command validation and deterministic transaction failure preserve prior state', testRejectsInvalidAndRollbackPaths);
test('acknowledge-entry is available only through an explicit required composition port', testComposesExplicitAcknowledgementPort);
