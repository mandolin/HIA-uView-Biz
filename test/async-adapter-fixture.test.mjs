/**
 * <lang><zh-CN>异步目录 adapter fixture 验收：固定 runtime envelope 到 canonical page/failure 的映射、显式退化 source 可见性和 private-value 脱敏。</zh-CN><en>Async catalog-adapter-fixture acceptance: fixes mapping from runtime envelopes to canonical pages/failures, explicit degraded-source visibility, and private-value redaction.</en></lang>
 * @lang zh-CN 测试仅使用内存 source provider，不发起网络、读取文件/环境/storage，或接入当前同步应用 core。
 * @lang en The test uses only in-memory source providers and performs no network, file/environment/storage read, or integration with the current synchronous app core.
 */

// <lang><zh-CN>使用 Node 内置测试工具，只验证公开 fixture subpath 的行为。</zh-CN><en>Use Node built-in test tools and verify only behavior of the public fixture subpath.</en></lang>
import assert from 'node:assert/strict';
import test from 'node:test';

// <lang><zh-CN>通过已声明 workspace subpath 导入，不读取 extension 的私有源码路径。</zh-CN><en>Import through the declared workspace subpath and do not read the extension's private source path.</en></lang>
import {
  createAsyncCatalogQueryAdapterFixture
} from '@hia-uview/biz-example-catalog-query-detail-adapter-fixture/async-query-fixture';

/**
 * <lang><zh-CN>创建一个受限 async source success。</zh-CN><en>Creates one bounded asynchronous source success.</en></lang>
 * @param {number} page <lang><zh-CN>canonical 页码。</zh-CN><en>Canonical page number.</en></lang>
 * @param {number} pageSize <lang><zh-CN>canonical 每页数量。</zh-CN><en>Canonical page size.</en></lang>
 * @returns {object} <lang><zh-CN>适配器私有的 source success。</zh-CN><en>Adapter-private source success.</en></lang>
 * @lang zh-CN 该值是测试内自有数据；它不模拟 HTTP DTO 或真实业务记录。
 * @lang en This value is test-owned data; it simulates neither an HTTP DTO nor a real business record.
 */
function createSourceSuccess(page, pageSize) {
  // <lang><zh-CN>返回 runtime allowlist 内的完整成功形状。</zh-CN><en>Return the complete success shape within the runtime allowlist.</en></lang>
  return {
    kind: 'success',
    value: {
      entryId: 'entry-001',
      labelZhHans: '示例条目 001',
      labelEn: 'Example entry 001',
      page,
      pageSize
    }
  };
}

test('maps the checked-in local async source to a canonical page', async () => {
  // <lang><zh-CN>不传 option，证明 checked-in local source 仍是唯一显式默认值。</zh-CN><en>Pass no option, proving the checked-in local source remains the sole explicit default.</en></lang>
  const fixture = createAsyncCatalogQueryAdapterFixture();

  // <lang><zh-CN>启动安全 page request 并等待 canonical terminal result。</zh-CN><en>Start a safe page request and await the canonical terminal result.</en></lang>
  const result = await fixture.start({ page: 1, pageSize: 10 }).promise;

  // <lang><zh-CN>断言 canonical paging、双语 entry 和可展示 local source metadata。</zh-CN><en>Assert canonical paging, bilingual entry, and displayable local source metadata.</en></lang>
  assert.deepEqual(result, {
    contractVersion: '1.0',
    kind: 'page',
    entries: [{ id: 'entry-001', label: { 'zh-Hans': '示例条目 001', en: 'Example entry 001' } }],
    page: 1,
    pageSize: 10,
    total: 1,
    hasNext: false,
    source: { sourceId: 'example.catalog-query-detail.local-query', authority: 'local', degradedReason: null }
  });
});

test('maps explicit remote degradation without exposing the remote source value', async () => {
  // <lang><zh-CN>声明 auto 顺序：remote 失败后明确退化到 local，不让 runtime 自行发现 source。</zh-CN><en>Declare auto order: explicitly degrade to local after remote failure and let the runtime discover no source itself.</en></lang>
  const sourcePolicy = {
    sourcePolicyVersion: '1.0',
    mode: 'auto',
    readSourceIds: ['example.catalog-query-detail.remote-query', 'example.catalog-query-detail.local-query'],
    writeSourceId: 'example.catalog-query-detail.local-query'
  };

  // <lang><zh-CN>remote 只返回受限 offline failure；local 返回自有 success。</zh-CN><en>Remote returns only a bounded offline failure; local returns owned success.</en></lang>
  const sourceProviders = {
    'example.catalog-query-detail.remote-query': {
      authority: 'remote',
      invoke: () => Promise.resolve({ kind: 'failure', code: 'offline', retryable: false })
    },
    'example.catalog-query-detail.local-query': {
      authority: 'local',
      invoke: (request) => Promise.resolve(createSourceSuccess(request.page, request.pageSize))
    }
  };

  // <lang><zh-CN>以完全显式的 policy/map 创建 fixture，不合并默认 provider。</zh-CN><en>Create the fixture with fully explicit policy/map and merge no default provider.</en></lang>
  const fixture = createAsyncCatalogQueryAdapterFixture({ sourcePolicy, sourceProviders });

  // <lang><zh-CN>读取最终 canonical result，用可见 metadata 验证选中的 local authority 与退化原因。</zh-CN><en>Read the final canonical result and verify selected local authority and degraded reason through visible metadata.</en></lang>
  const result = await fixture.start({ page: 2, pageSize: 5 }).promise;

  // <lang><zh-CN>只检查公开 projection；remote failure code 和 provider object 均不得存在于 page。</zh-CN><en>Check only public projection; remote failure code and provider object must not exist in the page.</en></lang>
  assert.deepEqual(result.source, {
    sourceId: 'example.catalog-query-detail.local-query',
    authority: 'local',
    degradedReason: 'offline'
  });
  assert.equal(Object.hasOwn(result, 'value'), false);
  assert.equal(Object.hasOwn(result, 'provider'), false);
});

test('redacts an unmappable source value as a canonical provider failure', async () => {
  // <lang><zh-CN>构造仅含 allowlisted source outcome shape、但缺失 catalog mapping 字段的 private value。</zh-CN><en>Construct a private value with an allowlisted source-outcome shape but missing catalog-mapping fields.</en></lang>
  const sourceProviders = {
    'example.catalog-query-detail.local-query': {
      authority: 'local',
      invoke: () => Promise.resolve({ kind: 'success', value: { privateWireFlag: 'not-canonical' } })
    }
  };

  // <lang><zh-CN>使用默认 local policy 与自定义 local provider，隔离测试到 value-mapping 边界。</zh-CN><en>Use default local policy and a custom local provider, isolating the test to the value-mapping boundary.</en></lang>
  const fixture = createAsyncCatalogQueryAdapterFixture({ sourceProviders });

  // <lang><zh-CN>等待适配器将 unsafe mapping 固定为公共 canonical failure。</zh-CN><en>Await the adapter fixing the unsafe mapping as a public canonical failure.</en></lang>
  const result = await fixture.start({ page: 1, pageSize: 1 }).promise;

  // <lang><zh-CN>断言 failure 可安全呈现，但不含 private wire key/value。</zh-CN><en>Assert the failure is safe to present but contains no private wire key/value.</en></lang>
  assert.equal(result.kind, 'failure');
  assert.equal(result.code, 'provider-unavailable');
  assert.equal(result.retryable, true);
  assert.equal(JSON.stringify(result).includes('privateWireFlag'), false);
  assert.equal(JSON.stringify(result).includes('not-canonical'), false);
});
