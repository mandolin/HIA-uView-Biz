/**
 * <lang><zh-CN>Biz adapter runtime 与中性 wire fixture 的纯 Node 契约测试：验证 backend-agnostic 声明、wire 转换、脱敏、内存缓存、mock session 和显式 composition 接入。</zh-CN><en>Pure-Node contract tests for the Biz adapter runtime and neutral wire fixture: verify backend-agnostic declarations, wire conversion, redaction, memory cache, mock session, and explicit composition integration.</en></lang>
 * @lang zh-CN 所有 exchange 都是测试进程内的确定性函数；本文件不打开网络、不读取环境/文件/storage，也不含真实 endpoint、credential、Directus 或行业数据。
 * @lang en Every exchange is a deterministic in-process test function; this file opens no network, reads no environment/file/storage, and contains no real endpoint, credential, Directus, or industry data.
 */

// <lang><zh-CN>使用 Node 内置断言与测试器，避免为 adapter contract 增加第三方测试依赖。</zh-CN><en>Use Node's built-in assertion and test runner to avoid adding a third-party test dependency for the adapter contract.</en></lang>
import assert from 'node:assert/strict';
import test from 'node:test';

// <lang><zh-CN>直接导入本仓待实现的纯 runtime API，使首轮 test-first 失败精确指向缺失实现。</zh-CN><en>Import the repository's pending pure-runtime API directly so the first test-first failure points precisely to the missing implementation.</en></lang>
import {
  ADAPTER_CONTRACT_VERSION,
  createReadAdapter,
  validateAdapterDeclaration
} from '../packages/adapter-runtime/src/index.mjs';

// <lang><zh-CN>导入 existing core/shell/example 与新的 wire fixture，以验证替换实现不改变 module contract。</zh-CN><en>Import the existing core/shell/example and new wire fixture to verify implementation replacement does not change the module contract.</en></lang>
import { createApplicationShell } from '../packages/app-shell/src/index.mjs';
import { assembleComposition } from '../packages/core/src/index.mjs';
import {
  createCatalogQueryDetailMock,
  createExampleManifests
} from '../modules/example-catalog-query-detail/src/index.mjs';
import {
  CATALOG_ADAPTER_IMPLEMENTATION_ID,
  createCatalogQueryDetailAdapterFixture
} from '../extensions/example-catalog-query-detail-adapter-fixture/src/index.mjs';

/**
 * <lang><zh-CN>当前中性 module、adapter 与测试共用的稳定契约版本。</zh-CN><en>The stable contract version shared by the current neutral module, adapter, and tests.</en></lang>
 * @lang zh-CN 该值用于测试 declaration 与 canonical outcome 的对应关系，不代表已发布 semver。
 * @lang en This value tests correspondence between declarations and canonical outcomes; it is not published semver.
 */
const CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>创建最小、合法且无 credential 的 query adapter 声明。</zh-CN><en>Creates a minimal valid query-adapter declaration with no credential.</en></lang>
 *
 * @param {object} [overrides] <lang><zh-CN>用于单项负测的顶层字段覆盖。</zh-CN><en>Top-level field overrides used by one-condition negative tests.</en></lang>
 * @returns {object} <lang><zh-CN>可交给 adapter runtime 校验的独立声明对象。</zh-CN><en>An independent declaration object suitable for adapter-runtime validation.</en></lang>
 * @lang zh-CN helper 只产生测试自有 metadata，不含 URL、header、token、cookie 或 backend configuration。
 * @lang en The helper produces only test-owned metadata and contains no URL, header, token, cookie, or backend configuration.
 */
function createValidDeclaration(overrides = {}) {
  // <lang><zh-CN>基础声明固定单一 port owner、injected fixture transport 与 page capability。</zh-CN><en>The base declaration fixes one port owner, injected-fixture transport, and page capability.</en></lang>
  const declaration = {
    adapterContractVersion: ADAPTER_CONTRACT_VERSION,
    adapterId: 'example.catalog-query-detail.unit-fixture',
    port: 'catalog-query',
    contract: {
      id: 'catalog-query-detail.query',
      version: CONTRACT_VERSION
    },
    owner: 'example-catalog-query-detail-unit-fixture',
    transport: 'injected-fixture',
    pagination: {
      modes: ['page'],
      pageJump: true
    },
    cache: {
      mode: 'memory',
      ttlMs: 1000
    },
    credential: {
      mode: 'none'
    }
  };

  // <lang><zh-CN>只覆盖调用方显式给出的顶层字段，使每个负测可以隔离一个边界。</zh-CN><en>Override only explicitly supplied top-level fields so every negative test can isolate one boundary.</en></lang>
  return { ...declaration, ...overrides };
}

/**
 * <lang><zh-CN>创建当前 module 接受的空 filter 页码查询。</zh-CN><en>Creates a page query with an empty filter accepted by the current module.</en></lang>
 *
 * @param {number} [page=1] <lang><zh-CN>从一开始的页码。</zh-CN><en>One-based page number.</en></lang>
 * @returns {object} <lang><zh-CN>规范化 query 输入。</zh-CN><en>Canonical query input.</en></lang>
 * @lang zh-CN request 不包含 adapter/private wire syntax 或身份字段。
 * @lang en The request contains no adapter-private wire syntax or identity field.
 */
function createQuery(page = 1) {
  // <lang><zh-CN>保持 filter 为空，以证明 adapter 不会私自增加行业或 backend 字段。</zh-CN><en>Keep the filter empty to prove the adapter does not privately add industry or backend fields.</en></lang>
  return {
    contractVersion: CONTRACT_VERSION,
    filter: {},
    page,
    pageSize: 20
  };
}

/**
 * <lang><zh-CN>创建测试自有的规范化 page 结果。</zh-CN><en>Creates a test-owned canonical page result.</en></lang>
 *
 * @param {number} [page=1] <lang><zh-CN>结果对应页码。</zh-CN><en>Page number represented by the result.</en></lang>
 * @returns {object} <lang><zh-CN>不含 wire 细节的 page。</zh-CN><en>A page containing no wire detail.</en></lang>
 * @lang zh-CN label 与 ID 均为中性 fixture 数据，不代表生产记录。
 * @lang en The label and ID are neutral fixture data and represent no production record.
 */
function createCanonicalPage(page = 1) {
  // <lang><zh-CN>返回新 entry 与 label 对象，以便测试缓存命中时的隔离副本。</zh-CN><en>Return new entry and label objects so tests can verify isolated copies on cache hits.</en></lang>
  return {
    contractVersion: CONTRACT_VERSION,
    kind: 'page',
    entries: [
      {
        id: 'entry-001',
        label: {
          'zh-Hans': '示例条目 001',
          en: 'Example entry 001'
        }
      }
    ],
    page,
    pageSize: 20,
    total: 1,
    hasNext: false
  };
}

/**
 * <lang><zh-CN>验证合法声明以及 credential/cache 越界声明会得到稳定诊断。</zh-CN><en>Verifies a valid declaration and stable diagnostics for credential/cache boundary violations.</en></lang>
 * @lang zh-CN 声明校验不得回显调用方对象或把未知 credential mode 当作未来兼容值接受。
 * @lang en Declaration validation must neither echo caller objects nor accept an unknown credential mode as a future-compatible value.
 */
function testValidatesAdapterDeclaration() {
  // <lang><zh-CN>合法声明应通过且不产生诊断。</zh-CN><en>A valid declaration must pass without diagnostics.</en></lang>
  const valid = validateAdapterDeclaration(createValidDeclaration());

  // <lang><zh-CN>成功结果同时固定结构化 ok 与空 diagnostic 表面。</zh-CN><en>The success result fixes both structured ok and empty-diagnostic surfaces.</en></lang>
  assert.deepEqual(valid, { ok: true, diagnostics: [] });

  // <lang><zh-CN>真实 credential 不属于首轮 runtime，任何非 none mode 都必须拒绝。</zh-CN><en>Real credentials are outside the first runtime; every mode other than none must be rejected.</en></lang>
  const credentialFailure = validateAdapterDeclaration(createValidDeclaration({ credential: { mode: 'reference' } }));

  // <lang><zh-CN>测试只依据稳定 code 分支，不依赖诊断文案。</zh-CN><en>The test branches only on a stable code and does not depend on diagnostic prose.</en></lang>
  assert.equal(credentialFailure.ok, false);
  assert.equal(credentialFailure.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.credential.unsupported'), true);

  // <lang><zh-CN>无限或过长 TTL 违反 bounded memory-cache policy。</zh-CN><en>An infinite or excessive TTL violates the bounded memory-cache policy.</en></lang>
  const cacheFailure = validateAdapterDeclaration(createValidDeclaration({ cache: { mode: 'memory', ttlMs: 999999999 } }));

  // <lang><zh-CN>TTL 诊断独立于 credential 诊断，便于调用方精确修复声明。</zh-CN><en>The TTL diagnostic is independent of the credential diagnostic so callers can correct the declaration precisely.</en></lang>
  assert.equal(cacheFailure.ok, false);
  assert.equal(cacheFailure.diagnostics.some((diagnostic) => diagnostic.code === 'adapter.cache.ttl.invalid'), true);
}

/**
 * <lang><zh-CN>验证成功 conversion、TTL 内 cache hit 与返回对象隔离。</zh-CN><en>Verifies successful conversion, a cache hit within TTL, and isolation of returned objects.</en></lang>
 * @lang zh-CN exchange 只返回本地 wire fixture；runtime 必须在缓存前转换为 canonical result。
 * @lang en The exchange returns only a local wire fixture; runtime must convert it to a canonical result before caching.
 */
function testCachesOnlyCanonicalSuccess() {
  // <lang><zh-CN>可控时钟从固定值开始，避免测试依赖真实时间。</zh-CN><en>The controlled clock starts from a fixed value, avoiding dependence on real time.</en></lang>
  let currentTime = 1000;

  // <lang><zh-CN>exchange 计数用于证明第二次相同调用没有再次触碰 wire 层。</zh-CN><en>The exchange count proves the second identical invocation does not touch the wire layer again.</en></lang>
  let exchangeCount = 0;

  // <lang><zh-CN>创建启用显式 memory cache 的纯 adapter。</zh-CN><en>Create a pure adapter with an explicit memory cache.</en></lang>
  const initialization = createReadAdapter({
    declaration: createValidDeclaration(),
    validateRequest: () => null,
    createCacheKey: (request) => `page:${request.page}:size:${request.pageSize}`,
    createWireRequest: (request) => ({ requestedPage: request.page }),
    exchange: (wireRequest) => {
      // <lang><zh-CN>每次真实 exchange 增加计数；wire 对象只含中性页码。</zh-CN><en>Increment the count for every real exchange; the wire object contains only a neutral page number.</en></lang>
      exchangeCount += 1;

      // <lang><zh-CN>返回局部 wire envelope，由 converter 独立映射。</zh-CN><en>Return a local wire envelope for independent mapping by the converter.</en></lang>
      return { ok: true, requestedPage: wireRequest.requestedPage };
    },
    convertWireOutcome: (wireOutcome) => createCanonicalPage(wireOutcome.requestedPage),
    now: () => currentTime
  });

  // <lang><zh-CN>合法声明和函数集合必须初始化为可调用 provider。</zh-CN><en>A valid declaration and function set must initialize an invokable provider.</en></lang>
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>第一次调用经过 exchange 并返回规范化 page。</zh-CN><en>The first invocation goes through exchange and returns a canonical page.</en></lang>
  const first = initialization.provider.invoke(createQuery());

  // <lang><zh-CN>修改调用方收到的嵌套 label，用于检测 cache 是否保存了共享可变引用。</zh-CN><en>Mutate the nested label received by the caller to detect whether the cache stored a shared mutable reference.</en></lang>
  first.entries[0].label.en = 'Mutated by caller';

  // <lang><zh-CN>时钟仍处于 TTL 内；同一 accepted request 应命中 cache。</zh-CN><en>The clock remains within TTL; the same accepted request should hit the cache.</en></lang>
  currentTime = 1500;

  // <lang><zh-CN>第二次调用必须返回 cache 中 canonical result 的隔离副本。</zh-CN><en>The second invocation must return an isolated copy of the cached canonical result.</en></lang>
  const second = initialization.provider.invoke(createQuery());

  // <lang><zh-CN>exchange 只执行一次，且调用方 mutation 未污染 cache。</zh-CN><en>The exchange runs only once and caller mutation does not contaminate the cache.</en></lang>
  assert.equal(exchangeCount, 1);
  assert.equal(second.entries[0].label.en, 'Example entry 001');

  // <lang><zh-CN>observation 只公开计数，不包含 wire outcome、request 或 cache value。</zh-CN><en>The observation exposes counts only and contains no wire outcome, request, or cache value.</en></lang>
  assert.deepEqual(initialization.controller.getObservation(), {
    exchanges: 1,
    cacheHits: 1,
    cacheMisses: 1,
    cacheEntries: 1,
    failures: {
      validation: 0,
      exchange: 0,
      conversion: 0
    }
  });
}

/**
 * <lang><zh-CN>验证过期 cache 会重新 exchange，且 failure 永不进入 cache。</zh-CN><en>Verifies an expired cache re-exchanges and failures never enter the cache.</en></lang>
 * @lang zh-CN 该测试同时固定 validation short-circuit，不允许非法 request 到达 wire 层。
 * @lang en This test also fixes the validation short-circuit, preventing an invalid request from reaching the wire layer.
 */
function testExpiresCacheAndSkipsFailures() {
  // <lang><zh-CN>可控时钟与 exchange 次数让 TTL 行为可重复。</zh-CN><en>A controlled clock and exchange count make TTL behavior repeatable.</en></lang>
  let currentTime = 1000;
  let exchangeCount = 0;

  // <lang><zh-CN>定义不含 raw input 的 request-scope failure。</zh-CN><en>Define a request-scope failure containing no raw input.</en></lang>
  const invalidQuery = {
    contractVersion: CONTRACT_VERSION,
    kind: 'failure',
    code: 'invalid-query',
    message: {
      'zh-Hans': '查询条件不符合该模块的最小契约。',
      en: 'The query does not satisfy the module contract.'
    },
    retryable: false,
    scope: 'request'
  };

  // <lang><zh-CN>adapter 对 page 小于一的 request 在 exchange 前返回 module failure。</zh-CN><en>The adapter returns the module failure before exchange for a request whose page is below one.</en></lang>
  const initialization = createReadAdapter({
    declaration: createValidDeclaration({ cache: { mode: 'memory', ttlMs: 100 } }),
    validateRequest: (request) => request.page < 1 ? invalidQuery : null,
    createCacheKey: (request) => `page:${request.page}`,
    createWireRequest: (request) => ({ requestedPage: request.page }),
    exchange: (wireRequest) => {
      // <lang><zh-CN>只为通过 validation 的 request 记录 exchange。</zh-CN><en>Record an exchange only for a request that passed validation.</en></lang>
      exchangeCount += 1;

      // <lang><zh-CN>返回可由 converter 映射的最小成功 wire 值。</zh-CN><en>Return a minimal successful wire value that the converter can map.</en></lang>
      return { requestedPage: wireRequest.requestedPage };
    },
    convertWireOutcome: (wireOutcome) => createCanonicalPage(wireOutcome.requestedPage),
    now: () => currentTime
  });

  // <lang><zh-CN>非法 query 连续调用两次仍不得 exchange 或 cache failure。</zh-CN><en>Invoking the invalid query twice must still neither exchange nor cache its failure.</en></lang>
  assert.equal(initialization.provider.invoke(createQuery(0)).code, 'invalid-query');
  assert.equal(initialization.provider.invoke(createQuery(0)).code, 'invalid-query');
  assert.equal(exchangeCount, 0);

  // <lang><zh-CN>第一次合法调用在当前时刻建立一个成功 cache entry。</zh-CN><en>The first valid invocation creates one successful cache entry at the current time.</en></lang>
  initialization.provider.invoke(createQuery(1));

  // <lang><zh-CN>越过 TTL 后，同一 request 必须重新 exchange。</zh-CN><en>After crossing TTL, the same request must exchange again.</en></lang>
  currentTime = 1200;
  initialization.provider.invoke(createQuery(1));

  // <lang><zh-CN>一个初始成功和一个过期后成功合计两次 exchange。</zh-CN><en>One initial success and one success after expiration total two exchanges.</en></lang>
  assert.equal(exchangeCount, 2);

  // <lang><zh-CN>observation 把两个 validation failure 与两个 cache miss 分开计数。</zh-CN><en>The observation counts two validation failures separately from two cache misses.</en></lang>
  assert.equal(initialization.controller.getObservation().failures.validation, 2);
  assert.equal(initialization.controller.getObservation().cacheMisses, 2);
}

/**
 * <lang><zh-CN>验证 exchange/conversion 异常统一脱敏为 canonical adapter failure。</zh-CN><en>Verifies exchange/conversion exceptions are uniformly redacted into canonical adapter failures.</en></lang>
 * @lang zh-CN 测试故意在局部异常中放入禁止文本，确认 port result 不会泄漏它们。
 * @lang en The test deliberately puts forbidden text in local exceptions to confirm port results do not leak it.
 */
function testRedactsAdapterFailures() {
  // <lang><zh-CN>exchange 失败 adapter 在本地抛出包含敏感形状的错误。</zh-CN><en>The exchange-failure adapter locally throws an error containing a sensitive-shaped value.</en></lang>
  const exchangeFailureAdapter = createReadAdapter({
    declaration: createValidDeclaration({ cache: { mode: 'none' } }),
    validateRequest: () => null,
    createWireRequest: (request) => ({ requestedPage: request.page }),
    exchange: () => {
      // <lang><zh-CN>该文本只存在测试异常，不得进入 result、diagnostic observation 或 message。</zh-CN><en>This text exists only in the test exception and must enter neither result, diagnostic observation, nor message.</en></lang>
      throw new Error('secret-token raw-endpoint backend-stack');
    },
    convertWireOutcome: () => createCanonicalPage()
  });

  // <lang><zh-CN>port 返回稳定 adapter-unavailable，而不是向调用方抛出原始异常。</zh-CN><en>The port returns stable adapter-unavailable instead of throwing the raw exception to the caller.</en></lang>
  const exchangeFailure = exchangeFailureAdapter.provider.invoke(createQuery());

  // <lang><zh-CN>序列化用于扫描整个公开 failure surface。</zh-CN><en>Serialize the entire public failure surface for scanning.</en></lang>
  const exchangeFailureText = JSON.stringify(exchangeFailure);

  // <lang><zh-CN>failure 保留 canonical code/scope/retry 语义且不含局部异常内容。</zh-CN><en>The failure retains canonical code/scope/retry semantics and contains no local-exception content.</en></lang>
  assert.equal(exchangeFailure.code, 'adapter-unavailable');
  assert.equal(exchangeFailure.scope, 'adapter');
  assert.equal(exchangeFailure.retryable, true);
  assert.equal(exchangeFailureText.includes('secret-token'), false);
  assert.equal(exchangeFailureText.includes('raw-endpoint'), false);

  // <lang><zh-CN>conversion 失败使用独立 adapter，以证明 malformed wire 也被同一 port boundary 截断。</zh-CN><en>Use a separate adapter for conversion failure to prove malformed wire is cut off by the same port boundary.</en></lang>
  const conversionFailureAdapter = createReadAdapter({
    declaration: createValidDeclaration({ cache: { mode: 'none' } }),
    validateRequest: () => null,
    createWireRequest: (request) => ({ requestedPage: request.page }),
    exchange: () => ({ rawSecret: 'must-not-leak' }),
    convertWireOutcome: () => {
      // <lang><zh-CN>converter 拒绝无法映射的 wire outcome；runtime 负责统一脱敏。</zh-CN><en>The converter rejects an unmappable wire outcome; runtime performs uniform redaction.</en></lang>
      throw new TypeError('malformed-wire must-not-leak');
    }
  });

  // <lang><zh-CN>conversion failure 仍是同一规范化 code，但 observation 归类不同。</zh-CN><en>The conversion failure still uses the same canonical code but a different observation category.</en></lang>
  const conversionFailure = conversionFailureAdapter.provider.invoke(createQuery());
  assert.equal(conversionFailure.code, 'adapter-unavailable');
  assert.equal(JSON.stringify(conversionFailure).includes('must-not-leak'), false);
  assert.equal(conversionFailureAdapter.controller.getObservation().failures.conversion, 1);
}

/**
 * <lang><zh-CN>验证 adapter/conversion failure 不会写入 memory cache，重复调用必须重新 exchange。</zh-CN><en>Verifies adapter/conversion failures are not written to memory cache and repeated invocations must exchange again.</en></lang>
 * @lang zh-CN 使用中性 malformed-wire fixture 覆盖 adapter-specific converter，而不是只覆盖 generic callback。
 * @lang en The neutral malformed-wire fixture covers the adapter-specific converter rather than only a generic callback.
 */
function testNeverCachesAdapterFailures() {
  // <lang><zh-CN>为 query 显式启用 memory cache，同时选择每次都无法转换的本地 wire fixture。</zh-CN><en>Explicitly enable query memory cache while selecting a local wire fixture that cannot be converted on any call.</en></lang>
  const fixture = createCatalogQueryDetailAdapterFixture({
    fixtureCase: 'malformed-wire',
    queryCache: {
      mode: 'memory',
      ttlMs: 1000
    },
    now: () => 1000
  });

  // <lang><zh-CN>同一合法 query 连续调用两次，均应得到脱敏 adapter failure。</zh-CN><en>Invoke the same valid query twice; both calls should receive a redacted adapter failure.</en></lang>
  const firstFailure = fixture.portProviders['catalog-query'].invoke(createQuery());
  const secondFailure = fixture.portProviders['catalog-query'].invoke(createQuery());

  // <lang><zh-CN>failure code 稳定且不包含 malformed wire 字段。</zh-CN><en>The failure code is stable and contains no malformed-wire field.</en></lang>
  assert.equal(firstFailure.code, 'adapter-unavailable');
  assert.equal(secondFailure.code, 'adapter-unavailable');
  assert.equal(JSON.stringify(secondFailure).includes('malformed'), false);

  // <lang><zh-CN>两次 exchange、零 cache hit 与零 cache entry 证明 conversion failure 未缓存。</zh-CN><en>Two exchanges, zero cache hits, and zero cache entries prove conversion failures were not cached.</en></lang>
  const observation = fixture.getObservation().query;
  assert.equal(observation.exchanges, 2);
  assert.equal(observation.cacheHits, 0);
  assert.equal(observation.cacheEntries, 0);
  assert.equal(observation.failures.conversion, 2);
}

/**
 * <lang><zh-CN>验证中性 wire fixture 映射 query/detail、维持 mock session 并只公开计数 observation。</zh-CN><en>Verifies the neutral wire fixture maps query/detail, keeps a mock session, and exposes count-only observations.</en></lang>
 * @lang zh-CN fixture 是 adapter contract 的本地证明，不是实际 HTTP 或 Directus 实现。
 * @lang en The fixture is a local proof of the adapter contract, not an actual HTTP or Directus implementation.
 */
function testMapsCatalogWireFixture() {
  // <lang><zh-CN>启用 query memory cache，detail 保持无 cache，以覆盖两个 read-port policy。</zh-CN><en>Enable query memory cache while keeping detail uncached to cover both read-port policies.</en></lang>
  const fixture = createCatalogQueryDetailAdapterFixture({ queryCache: { mode: 'memory', ttlMs: 1000 } });

  // <lang><zh-CN>query provider 应把本地 wire 字段转换为公开 canonical entry/page。</zh-CN><en>The query provider should convert local wire fields to public canonical entry/page values.</en></lang>
  const page = fixture.portProviders['catalog-query'].invoke(createQuery());

  // <lang><zh-CN>转换后结果只含中性 module shape。</zh-CN><en>The converted result contains only the neutral module shape.</en></lang>
  assert.equal(page.kind, 'page');
  assert.equal(page.entries[0].id, 'entry-001');
  assert.equal(page.total, 1);

  // <lang><zh-CN>detail provider 通过同一稳定 ID 返回主体与独立 section state。</zh-CN><en>The detail provider returns a primary entry and independent section state through the same stable ID.</en></lang>
  const detail = fixture.portProviders['entry-detail'].invoke({
    contractVersion: CONTRACT_VERSION,
    entryId: 'entry-001'
  });

  // <lang><zh-CN>成功详情包含 ready 主 section 和 empty 附属 section。</zh-CN><en>The successful detail contains a ready primary section and an empty supplementary section.</en></lang>
  assert.equal(detail.kind, 'detail');
  assert.deepEqual(detail.sections.map((section) => section.state), ['ready', 'empty']);

  // <lang><zh-CN>session provider 保持 mock/anonymous contract，不携带账户或 credential。</zh-CN><en>The session provider keeps the mock/anonymous contract and carries no account or credential.</en></lang>
  const session = fixture.portProviders['session-state'].invoke();
  assert.deepEqual(session, {
    contractVersion: CONTRACT_VERSION,
    mode: 'mock',
    subject: null,
    capabilities: []
  });

  // <lang><zh-CN>implementation package 与 declaration 使用明确 owner 和 fixture-only provenance。</zh-CN><en>The implementation package and declaration use an explicit owner and fixture-only provenance.</en></lang>
  assert.equal(fixture.implementationPackage.id, CATALOG_ADAPTER_IMPLEMENTATION_ID);
  assert.equal(fixture.adapterDeclarations.query.credential.mode, 'none');
  assert.equal(fixture.adapterDeclarations.detail.cache.mode, 'none');

  // <lang><zh-CN>observation 不公开 wire value；只报告 query/detail runtime 的受限计数。</zh-CN><en>The observation exposes no wire value and reports only bounded counts from query/detail runtimes.</en></lang>
  const observationText = JSON.stringify(fixture.getObservation());
  assert.equal(observationText.includes('raw'), false);
  assert.equal(observationText.includes('token'), false);

  // <lang><zh-CN>独立 fixture 验证 supplementary section failure 不覆盖主 entry。</zh-CN><en>A separate fixture verifies a supplementary-section failure does not overwrite the primary entry.</en></lang>
  const partialFailureFixture = createCatalogQueryDetailAdapterFixture({ fixtureCase: 'detail-section-failure' });

  // <lang><zh-CN>detail request 使用相同 canonical contract，不暴露 wire section state。</zh-CN><en>The detail request uses the same canonical contract and exposes no wire-section state.</en></lang>
  const partialDetail = partialFailureFixture.portProviders['entry-detail'].invoke({
    contractVersion: CONTRACT_VERSION,
    entryId: 'entry-001'
  });

  // <lang><zh-CN>主 entry 保持 ready，附属 section 承载可重试 failure。</zh-CN><en>The primary entry remains ready while the supplementary section carries a retryable failure.</en></lang>
  assert.equal(partialDetail.entry.id, 'entry-001');
  assert.equal(partialDetail.sections[1].failure.code, 'section-unavailable');
}

/**
 * <lang><zh-CN>验证 wire fixture 可显式替换 mock implementation 并驱动 existing composition/app shell。</zh-CN><en>Verifies the wire fixture can explicitly replace the mock implementation and drive the existing composition/app shell.</en></lang>
 * @lang zh-CN 替换只发生在 implementation package 与 port provider；business module、route projection 和 shell API 保持不变。
 * @lang en Replacement occurs only in the implementation package and port provider; the business module, route projection, and shell API remain unchanged.
 */
function testComposesReplaceableAdapterFixture() {
  // <lang><zh-CN>创建 existing example 声明，随后只选择新的 fixture implementation ID。</zh-CN><en>Create the existing example declarations and then select only the new fixture implementation ID.</en></lang>
  const manifests = createExampleManifests();

  // <lang><zh-CN>新的 adapter fixture 不改变 module-owned port contract。</zh-CN><en>The new adapter fixture does not change the module-owned port contract.</en></lang>
  const fixture = createCatalogQueryDetailAdapterFixture();

  // <lang><zh-CN>profile 显式选择 wire fixture，不通过 registry、环境或 fallback 自动替换。</zh-CN><en>The profile explicitly selects the wire fixture without automatic replacement through registry, environment, or fallback.</en></lang>
  manifests.profile.implementationPackageIds = [fixture.implementationPackage.id];

  // <lang><zh-CN>core 使用原 business module、新 implementation package 与显式 provider 装配。</zh-CN><en>The core composes the original business module, new implementation package, and explicit providers.</en></lang>
  const assembly = assembleComposition({
    businessModule: manifests.businessModule,
    implementationPackage: fixture.implementationPackage,
    profile: manifests.profile,
    portProviders: fixture.portProviders
  });

  // <lang><zh-CN>合法替换应通过既有 core relation validation。</zh-CN><en>A valid replacement should pass existing core relation validation.</en></lang>
  assert.equal(assembly.ok, true);

  // <lang><zh-CN>复用 existing static route projection，证明 adapter 不拥有 URL 或 screen mapping。</zh-CN><en>Reuse the existing static route projection to prove the adapter owns neither URL nor screen mapping.</en></lang>
  const routeProjection = createCatalogQueryDetailMock().routeProjection;

  // <lang><zh-CN>screen policy 显式允许匿名目录与详情，仍不代表真实授权系统。</zh-CN><en>The screen policy explicitly permits anonymous catalog and detail screens and still represents no real authorization system.</en></lang>
  const initialization = createApplicationShell({
    composition: assembly.composition,
    routeProjection,
    screenCapabilityPolicy: {
      'catalog-list': [],
      'entry-detail': []
    }
  });

  // <lang><zh-CN>shell 初始化与 query/detail 流程应无需修改 existing app-shell code。</zh-CN><en>Shell initialization and query/detail flow should require no existing app-shell code modification.</en></lang>
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>shell 通过同一 catalog-query port 获取 wire fixture 转换后的 page。</zh-CN><en>The shell obtains the wire-fixture-converted page through the same catalog-query port.</en></lang>
  const pageResult = initialization.shell.query(createQuery());
  assert.equal(pageResult.entries[0].id, 'entry-001');

  // <lang><zh-CN>选择 canonical entry 通过原 route action 调用新的 detail provider。</zh-CN><en>Select the canonical entry through the original route action to invoke the new detail provider.</en></lang>
  const detailResult = initialization.shell.selectEntry('entry-001');
  assert.equal(detailResult.entry.id, 'entry-001');
}

// <lang><zh-CN>逐项登记契约测试，名称描述公开行为而不是内部阶段或实现路径。</zh-CN><en>Register each contract test with names that describe public behavior rather than an internal stage or implementation path.</en></lang>
test('validates a backend-agnostic adapter declaration', testValidatesAdapterDeclaration);
test('caches only isolated canonical success within TTL', testCachesOnlyCanonicalSuccess);
test('expires memory cache and never caches validation failures', testExpiresCacheAndSkipsFailures);
test('redacts exchange and conversion failures at the adapter port', testRedactsAdapterFailures);
test('never caches an adapter or conversion failure', testNeverCachesAdapterFailures);
test('maps the neutral query/detail wire fixture and mock session', testMapsCatalogWireFixture);
test('composes the wire fixture as an explicit replaceable implementation', testComposesReplaceableAdapterFixture);
