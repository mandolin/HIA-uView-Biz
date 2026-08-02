/**
 * <lang><zh-CN>Provider-port runtime contract tests：验证 consumer-owned session、storage、read、write provider 的显式注入、plain-data 隔离、failure redaction 与 rollback boundary。</zh-CN><en>Provider-port runtime contract tests: verify explicit injection, plain-data isolation, failure redaction, and rollback boundaries for consumer-owned session, storage, read, and write providers.</en></lang>
 * @lang zh-CN 所有 provider 都是测试进程内的 mock；本文件不打开网络、不读取环境/文件/storage，不含真实身份、token、endpoint 或后端 DTO。
 * @lang en Every provider is an in-process test mock; this file opens no network, reads no environment/file/storage, and contains no real identity, token, endpoint, or backend DTO.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PROVIDER_PORT_CONTRACT_VERSION,
  createProviderPortHost,
  validateProviderPortDeclaration,
  validateProviderPortDeclarations
} from '@hia-uview/biz-provider-port-runtime';

/**
 * <lang><zh-CN>创建 P45 四类 provider 的稳定声明。</zh-CN><en>Creates stable declarations for the four P45 provider categories.</en></lang>
 * @returns {object[]} <lang><zh-CN>session、storage、read、write declarations。</zh-CN><en>Session, storage, read, and write declarations.</en></lang>
 * @lang zh-CN declaration 只包含 contract/owner/execution/credential/rollback，不携带 URL、token 或连接配置。
 * @lang en Declarations contain only contract, owner, execution, credential, and rollback fields and carry no URL, token, or connection configuration.
 */
function createDeclarations() {
  // <lang><zh-CN>用固定 contract ID 区分四个 port，便于测试 provider map 的 exact correspondence。</zh-CN><en>Use fixed contract IDs for four ports so provider-map exact correspondence can be tested.</en></lang>
  return [
    {
      providerContractVersion: PROVIDER_PORT_CONTRACT_VERSION,
      providerId: 'example.consumer.session',
      portId: 'session-state',
      owner: 'example-consumer',
      kind: 'session',
      contract: { id: 'catalog-query-detail.session', version: '1.0' },
      execution: 'injected-sync',
      credential: { mode: 'none' },
      optional: false,
      rollback: 'not-applicable'
    },
    {
      providerContractVersion: PROVIDER_PORT_CONTRACT_VERSION,
      providerId: 'example.consumer.storage',
      portId: 'local-preference',
      owner: 'example-consumer',
      kind: 'storage',
      contract: { id: 'example.consumer.storage', version: '1.0' },
      execution: 'injected-sync',
      credential: { mode: 'none' },
      optional: true,
      rollback: 'not-applicable'
    },
    {
      providerContractVersion: PROVIDER_PORT_CONTRACT_VERSION,
      providerId: 'example.consumer.read',
      portId: 'catalog-query',
      owner: 'example-consumer',
      kind: 'read',
      contract: { id: 'catalog-query-detail.query', version: '1.0' },
      execution: 'injected-sync',
      credential: { mode: 'none' },
      optional: false,
      rollback: 'not-applicable'
    },
    {
      providerContractVersion: PROVIDER_PORT_CONTRACT_VERSION,
      providerId: 'example.consumer.write',
      portId: 'entry-update',
      owner: 'example-consumer',
      kind: 'write',
      contract: { id: 'example.consumer.entry-update', version: '1.0' },
      execution: 'injected-sync',
      credential: { mode: 'none' },
      optional: false,
      rollback: 'local-no-partial-mutation'
    }
  ];
}

/**
 * <lang><zh-CN>创建显式 provider map；所有结果都是 runtime 要求的内部 success/failure shape。</zh-CN><en>Creates an explicit provider map whose outcomes use the internal success/failure shape required by the runtime.</en></lang>
 * @param {{readMode?: string}} [options] <lang><zh-CN>测试控制项。</zh-CN><en>Test controls.</en></param>
 * @returns {object} <lang><zh-CN>按 portId 索引的 provider map。</zh-CN><en>Provider map indexed by portId.</en></lang>
 * @lang zh-CN provider 自己拥有 canonical mapping；host 只负责复制、校验和脱敏，不读取外部状态。
 * @lang en Providers own canonical mapping; the host only copies, validates, and redacts and reads no external state.
 */
function createProviders(options = {}) {
  // <lang><zh-CN>storage state 仅存在测试 closure，模拟可选的 consumer-owned memory provider。</zh-CN><en>Storage state exists only in the test closure, simulating an optional consumer-owned memory provider.</en></lang>
  const storage = new Map();

  return {
    'session-state': {
      contract: { id: 'catalog-query-detail.session', version: '1.0' },
      invoke: (input) => {
        // <lang><zh-CN>无参数 session 调用会由 host 投影为 null，provider 不获取任何身份。</zh-CN><en>A no-argument session call is projected to null by the host, and the provider acquires no identity.</en></lang>
        assert.equal(input, null);
        return {
          kind: 'success',
          value: {
            contractVersion: '1.0',
            mode: 'mock',
            subject: null,
            capabilities: []
          }
        };
      }
    },
    'local-preference': {
      contract: { id: 'example.consumer.storage', version: '1.0' },
      invoke: (input) => {
        // <lang><zh-CN>storage 只接受调用方已经约束的 action/key/value plain data，不读取系统 storage。</zh-CN><en>Storage accepts only caller-constrained action/key/value plain data and reads no system storage.</en></lang>
        if (input.action === 'set') {
          storage.set(input.key, input.value);
          return { kind: 'success', value: { stored: true } };
        }
        return { kind: 'success', value: { value: storage.get(input.key) ?? null } };
      }
    },
    'catalog-query': {
      contract: { id: 'catalog-query-detail.query', version: '1.0' },
      invoke: (input) => {
        // <lang><zh-CN>read provider 返回中性 canonical page，不构造 HTTP/DTO envelope。</zh-CN><en>The read provider returns a neutral canonical page and constructs no HTTP/DTO envelope.</en></lang>
        if (options.readMode === 'failure') {
          return { kind: 'failure', code: 'provider-unavailable', retryable: true };
        }
        return {
          kind: 'success',
          value: {
            contractVersion: '1.0',
            kind: 'page',
            page: input.page,
            pageSize: input.pageSize,
            total: 1,
            hasNext: false,
            entries: [{ id: 'entry-001', label: { 'zh-Hans': '示例', en: 'Example' } }]
          }
        };
      }
    },
    'entry-update': {
      contract: { id: 'example.consumer.entry-update', version: '1.0' },
      invoke: (input) => {
        // <lang><zh-CN>测试 provider 故意修改其隔离 input，证明 host 不把调用方引用交给 provider。</zh-CN><en>The test provider intentionally mutates its isolated input to prove the host does not give the caller reference to a provider.</en></lang>
        input.seenByProvider = true;
        if (input.mode === 'cancel') {
          return { kind: 'failure', code: 'write-cancelled', retryable: true, rollback: 'completed' };
        }
        if (input.mode === 'unknown-rollback') {
          return { kind: 'failure', code: 'write-failed', retryable: false, rollback: 'unknown' };
        }
        return { kind: 'success', value: { updated: true, entryId: input.entryId } };
      }
    }
  };
}

/**
 * <lang><zh-CN>验证 declaration 与集合校验拒绝 credential、额外字段和重复 port。</zh-CN><en>Verifies declaration and set validation reject credentials, extra fields, and duplicate ports.</en></lang>
 * @returns {void} <lang><zh-CN>断言完成信号。</zh-CN><en>Assertion completion signal.</en></lang>
 * @lang zh-CN 诊断只检查稳定 code，不回显 secret、endpoint 或输入对象正文。
 * @lang en Assertions inspect stable codes only and never echo secret, endpoint, or input-object bodies.
 */
function testValidatesProviderDeclarations() {
  // <lang><zh-CN>合法 declaration 通过最小 contract gate。</zh-CN><en>A valid declaration passes the minimum contract gate.</en></lang>
  const valid = validateProviderPortDeclaration(createDeclarations()[0]);
  assert.equal(valid.ok, true);

  // <lang><zh-CN>credential reference 与隐藏 endpoint 都必须被拒绝。</zh-CN><en>A credential reference and hidden endpoint must both be rejected.</en></lang>
  const invalidDeclaration = {
    ...createDeclarations()[0],
    credential: { mode: 'reference', value: 'secret-token' },
    endpoint: 'https://raw-endpoint.invalid'
  };
  const invalid = validateProviderPortDeclaration(invalidDeclaration);
  assert.equal(invalid.ok, false);
  assert.equal(invalid.diagnostics.some((diagnostic) => diagnostic.code === 'provider.declaration.fields.invalid'), true);
  assert.equal(invalid.diagnostics.some((diagnostic) => diagnostic.code === 'provider.credential.unsupported'), true);
  assert.equal(JSON.stringify(invalid).includes('secret-token'), false);
  assert.equal(JSON.stringify(invalid).includes('raw-endpoint'), false);

  // <lang><zh-CN>重复 declaration portId 是装配歧义，不能静默选择第一个 provider。</zh-CN><en>A duplicate declaration portId is an assembly ambiguity and cannot silently select the first provider.</en></lang>
  const declarations = createDeclarations();
  declarations.push({ ...declarations[2], providerId: 'example.consumer.read-duplicate' });
  const duplicate = validateProviderPortDeclarations(declarations);
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.diagnostics.some((diagnostic) => diagnostic.code === 'provider.port.duplicate'), true);
}

/**
 * <lang><zh-CN>验证 host 对 session、storage 与 read success 进行隔离复制。</zh-CN><en>Verifies the host isolates and copies session, storage, and read success results.</en></lang>
 * @returns {void} <lang><zh-CN>断言完成信号。</zh-CN><en>Assertion completion signal.</en></lang>
 * @lang zh-CN 本测试不证明真实身份或持久 storage，仅证明显式本地 provider contract。
 * @lang en This test proves only explicit local provider contracts and proves neither real identity nor persistent storage.
 */
function testHostSuccessAndIsolation() {
  // <lang><zh-CN>用四份声明和完整 provider map 创建 host，初始化阶段不调用任何 provider。</zh-CN><en>Create a host with four declarations and a complete provider map; initialization invokes no provider.</en></lang>
  const initialization = createProviderPortHost({ declarations: createDeclarations(), providers: createProviders() });
  assert.equal(initialization.ok, true);
  assert.deepEqual(initialization.host.getObservation(), {
    invocations: 0,
    successes: 0,
    failures: { input: 0, provider: 0, output: 0, rollback: 0 }
  });

  // <lang><zh-CN>session 调用只返回 mock canonical shape，不含 subject/credential。</zh-CN><en>The session call returns only the mock canonical shape and contains no subject/credential.</en></lang>
  const session = initialization.host.invoke('session-state');
  assert.equal(session.kind, 'success');
  assert.equal(session.value.mode, 'mock');
  assert.equal(session.value.subject, null);

  // <lang><zh-CN>storage set/get 都通过同一个显式内存 provider，不调用平台 storage。</zh-CN><en>Storage set/get use the same explicit memory provider and call no platform storage.</en></lang>
  const stored = initialization.host.invoke('local-preference', { action: 'set', key: 'theme', value: 'light' });
  const loaded = initialization.host.invoke('local-preference', { action: 'get', key: 'theme' });
  assert.equal(stored.value.stored, true);
  assert.equal(loaded.value.value, 'light');

  // <lang><zh-CN>read result 修改不应污染 provider 或下一次调用的 outcome。</zh-CN><en>Mutating a read result must not contaminate the provider or the next invocation outcome.</en></lang>
  const page = initialization.host.invoke('catalog-query', { page: 1, pageSize: 10 });
  page.value.entries[0].label.en = 'mutated';
  const secondPage = initialization.host.invoke('catalog-query', { page: 1, pageSize: 10 });
  assert.equal(secondPage.value.entries[0].label.en, 'Example');
  assert.equal(initialization.host.getObservation().successes, 5);
}

/**
 * <lang><zh-CN>验证 write success、cancel/retry 与 rollback unknown 的受限语义。</zh-CN><en>Verifies bounded semantics for write success, cancel/retry, and unknown rollback.</en></lang>
 * @returns {void} <lang><zh-CN>断言完成信号。</zh-CN><en>Assertion completion signal.</en></lang>
 * @lang zh-CN completed 只来自 test-owned local no-partial-mutation 声明，不被解释为数据库回退。
 * @lang en `completed` comes only from the test-owned local no-partial-mutation declaration and is not interpreted as database rollback.
 */
function testHostWriteBoundary() {
  // <lang><zh-CN>创建独立 host，避免与 success/read test 共享 observation 或 closure state。</zh-CN><en>Create an independent host so observation and closure state are not shared with the success/read test.</en></lang>
  const initialization = createProviderPortHost({ declarations: createDeclarations(), providers: createProviders() });
  const request = { mode: 'ok', entryId: 'entry-001' };
  const success = initialization.host.invoke('entry-update', request);
  assert.equal(success.kind, 'success');
  assert.equal(request.seenByProvider, undefined);

  // <lang><zh-CN>cancel failure 保留 retryable 与 completed rollback，供调用方决定是否重新发起。</zh-CN><en>Cancel failure retains retryable and completed rollback so the caller decides whether to retry.</en></lang>
  const cancelled = initialization.host.invoke('entry-update', { mode: 'cancel', entryId: 'entry-001' });
  assert.equal(cancelled.kind, 'failure');
  assert.equal(cancelled.code, 'write-cancelled');
  assert.equal(cancelled.retryable, true);
  assert.equal(cancelled.rollback, 'completed');

  // <lang><zh-CN>unknown rollback 只能得到 write-failed，不能伪装成成功或已回退。</zh-CN><en>Unknown rollback can only produce write-failed and cannot pretend to be successful or rolled back.</en></lang>
  const unknownRollback = initialization.host.invoke('entry-update', { mode: 'unknown-rollback', entryId: 'entry-001' });
  assert.equal(unknownRollback.kind, 'failure');
  assert.equal(unknownRollback.code, 'write-failed');
  assert.equal(unknownRollback.rollback, 'unknown');
  assert.equal(initialization.host.getObservation().failures.rollback, 1);
}

/**
 * <lang><zh-CN>验证 provider exception、unsafe output 与 exact map 缺口被脱敏拒绝。</zh-CN><en>Verifies provider exceptions, unsafe output, and incomplete exact maps are redacted or rejected.</en></lang>
 * @returns {void} <lang><zh-CN>断言完成信号。</zh-CN><en>Assertion completion signal.</en></lang>
 * @lang zh-CN 所有公开 failure 都不得包含异常正文、token、endpoint、accessor 或 raw payload。
 * @lang en No public failure may contain exception text, token, endpoint, accessor, or raw payload.
 */
function testHostRedactionAndConfiguration() {
  // <lang><zh-CN>缺失 provider 时 host 初始化失败，不创建 partial host。</zh-CN><en>Host initialization fails for a missing provider and creates no partial host.</en></lang>
  const declarations = createDeclarations();
  const providers = createProviders();
  delete providers['entry-update'];
  const incomplete = createProviderPortHost({ declarations, providers });
  assert.equal(incomplete.ok, false);
  assert.equal('host' in incomplete, false);

  // <lang><zh-CN>异常 provider 与不安全 output 各自使用独立 host，隔离 observation 与 provider closure。</zh-CN><en>Use independent hosts for throwing and unsafe-output providers, isolating observation and provider closures.</en></lang>
  const throwingProviders = createProviders();
  throwingProviders['catalog-query'] = {
    contract: { id: 'catalog-query-detail.query', version: '1.0' },
    invoke: () => {
      throw new Error('secret-token raw-endpoint');
    }
  };
  const throwingHost = createProviderPortHost({ declarations: createDeclarations(), providers: throwingProviders }).host;
  const thrown = throwingHost.invoke('catalog-query', { page: 1, pageSize: 10 });
  assert.equal(thrown.kind, 'failure');
  assert.equal(JSON.stringify(thrown).includes('secret-token'), false);
  assert.equal(JSON.stringify(thrown).includes('raw-endpoint'), false);

  const unsafeProviders = createProviders();
  unsafeProviders['catalog-query'] = {
    contract: { id: 'catalog-query-detail.query', version: '1.0' },
    invoke: () => ({ kind: 'success', value: { get secret() { return 'must-not-run'; } } })
  };
  const unsafeHost = createProviderPortHost({ declarations: createDeclarations(), providers: unsafeProviders }).host;
  const unsafe = unsafeHost.invoke('catalog-query', { page: 1, pageSize: 10 });
  assert.equal(unsafe.kind, 'failure');
  assert.equal(unsafe.code, 'provider-unavailable');
  assert.equal(JSON.stringify(unsafe).includes('must-not-run'), false);
}

test('validates provider declarations and exact ownership', testValidatesProviderDeclarations);
test('isolates session, storage, and read provider success', testHostSuccessAndIsolation);
test('keeps write rollback state bounded', testHostWriteBoundary);
test('redacts provider failures and rejects partial configuration', testHostRedactionAndConfiguration);
