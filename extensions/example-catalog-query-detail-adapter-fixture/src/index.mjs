/**
 * <lang><zh-CN>中性目录—查询—详情能力的 injected-wire adapter fixture：独立实现 query/detail wire mapping、mock session 与可选进程内 query cache，不连接实际后端。</zh-CN><en>Injected-wire adapter fixture for the neutral catalog-query-detail capability: independently implements query/detail wire mapping, mock session, and optional process-local query cache without connecting to a real backend.</en></lang>
 * @lang zh-CN 所有 wire 值和 entry 均为本 extension 自有测试数据；本模块不读取网络、环境、文件、storage、credential、identity provider、Directus、UI 或 route。
 * @lang en Every wire value and entry is test data owned by this extension; this module reads no network, environment, file, storage, credential, identity provider, Directus, UI, or route.
 */

// <lang><zh-CN>只依赖同仓纯 adapter runtime，不导入 core、app shell、UI 或 backend SDK。</zh-CN><en>Depend only on the same-repository pure adapter runtime, importing neither core, app shell, UI, nor a backend SDK.</en></lang>
import {
  ADAPTER_CONTRACT_VERSION,
  createReadAdapter
} from '@hia-uview/biz-adapter-runtime';

/**
 * <lang><zh-CN>中性 module 与 adapter port 共用的固定 contract version。</zh-CN><en>The fixed contract version shared by the neutral module and adapter ports.</en></lang>
 * @lang zh-CN 与公开 catalog-query-detail contract 对齐，不表示发布版本。
 * @lang en It aligns with the public catalog-query-detail contract and is not a release version.
 */
const CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>当前 adapter fixture 所服务的稳定 module ID。</zh-CN><en>The stable module ID served by the current adapter fixture.</en></lang>
 * @lang zh-CN 该 ID 只代表中性 example，不代表行业能力。
 * @lang en This ID represents only the neutral example and no industry capability.
 */
const MODULE_ID = 'example.catalog-query-detail';

/**
 * <lang><zh-CN>中性 wire fixture implementation package 的稳定标识。</zh-CN><en>The stable identifier of the neutral wire-fixture implementation package.</en></lang>
 * @lang zh-CN profile 必须显式选择该 ID；不存在环境发现或 mock fallback。
 * @lang en A profile must select this ID explicitly; there is no environment discovery or mock fallback.
 */
export const CATALOG_ADAPTER_IMPLEMENTATION_ID = 'example.catalog-query-detail.wire-fixture';

/**
 * <lang><zh-CN>query adapter declaration 的稳定 ID。</zh-CN><en>The stable ID of the query-adapter declaration.</en></lang>
 * @lang zh-CN ID 用于 owner/cache scope，不是 endpoint URL。
 * @lang en The ID scopes ownership/cache and is not an endpoint URL.
 */
const QUERY_ADAPTER_ID = `${MODULE_ID}.query-wire-fixture`;

/**
 * <lang><zh-CN>detail adapter declaration 的稳定 ID。</zh-CN><en>The stable ID of the detail-adapter declaration.</en></lang>
 * @lang zh-CN detail 与 query 拥有独立 runtime/controller，防止隐式共享 cache 或 retry。
 * @lang en Detail and query own separate runtimes/controllers, preventing implicit cache or retry sharing.
 */
const DETAIL_ADAPTER_ID = `${MODULE_ID}.detail-wire-fixture`;

/**
 * <lang><zh-CN>创建稳定的双语 canonical 文本。</zh-CN><en>Creates stable bilingual canonical text.</en></lang>
 *
 * @param {string} zhHans <lang><zh-CN>中文文本。</zh-CN><en>Chinese text.</en></lang>
 * @param {string} en <lang><zh-CN>英文文本。</zh-CN><en>English text.</en></lang>
 * @returns {object} <lang><zh-CN>新的本地化对象。</zh-CN><en>A new localized object.</en></lang>
 * @lang zh-CN 所有面向人的 fixture result 显式提供 `zh-Hans` 与 `en`。
 * @lang en Every human-facing fixture result explicitly provides `zh-Hans` and `en`.
 */
function createLocalizedText(zhHans, en) {
  // <lang><zh-CN>返回新对象，避免 query/detail 结果共享文本引用。</zh-CN><en>Return a new object so query/detail results do not share a text reference.</en></lang>
  return {
    'zh-Hans': zhHans,
    en
  };
}

/**
 * <lang><zh-CN>创建 module-owned canonical failure。</zh-CN><en>Creates a module-owned canonical failure.</en></lang>
 *
 * @param {string} code <lang><zh-CN>稳定 failure code。</zh-CN><en>Stable failure code.</en></lang>
 * @param {string} zhHans <lang><zh-CN>中文说明。</zh-CN><en>Chinese explanation.</en></lang>
 * @param {string} en <lang><zh-CN>英文说明。</zh-CN><en>English explanation.</en></lang>
 * @param {boolean} retryable <lang><zh-CN>是否允许重试。</zh-CN><en>Whether retry is allowed.</en></lang>
 * @param {string} scope <lang><zh-CN>failure 所属范围。</zh-CN><en>Failure scope.</en></lang>
 * @returns {object} <lang><zh-CN>不含 wire 细节的 failure。</zh-CN><en>A failure containing no wire detail.</en></lang>
 * @lang zh-CN 仅 request/section 语义由本 extension 创建；adapter-unavailable 由 generic runtime 脱敏创建。
 * @lang en This extension creates only request/section semantics; the generic runtime creates the redacted adapter-unavailable failure.
 */
function createFailure(code, zhHans, en, retryable, scope) {
  // <lang><zh-CN>保持既有 canonical shape，不添加 raw response、status 或 diagnostic。</zh-CN><en>Keep the existing canonical shape and add no raw response, status, or diagnostic.</en></lang>
  return {
    contractVersion: CONTRACT_VERSION,
    kind: 'failure',
    code,
    message: createLocalizedText(zhHans, en),
    retryable,
    scope
  };
}

/**
 * <lang><zh-CN>校验 current module 的空 filter 页码 query。</zh-CN><en>Validates the current module's page query with an empty filter.</en></lang>
 *
 * @param {unknown} request <lang><zh-CN>候选 canonical query。</zh-CN><en>Candidate canonical query.</en></lang>
 * @returns {object|null} <lang><zh-CN>合法时为 null，否则为 request-scope failure。</zh-CN><en>Null when valid; otherwise a request-scope failure.</en></lang>
 * @lang zh-CN adapter 不接受私有 filter syntax；当前中性 module 只允许空 plain object。
 * @lang en The adapter accepts no private filter syntax; the current neutral module permits only an empty plain object.
 */
function validateQueryRequest(request) {
  // <lang><zh-CN>filter 必须为无字段的普通对象；数组、null 与行业字段均拒绝。</zh-CN><en>The filter must be an ordinary object with no fields; arrays, null, and industry fields are rejected.</en></lang>
  const hasEmptyFilter = typeof request === 'object'
    && request !== null
    && !Array.isArray(request)
    && typeof request.filter === 'object'
    && request.filter !== null
    && !Array.isArray(request.filter)
    && Object.keys(request.filter).length === 0;

  // <lang><zh-CN>页码从一开始，pageSize 限制在当前 fixture 的 1 到 100。</zh-CN><en>Page numbering starts at one and pageSize is bounded from 1 through 100 for this fixture.</en></lang>
  const hasValidPaging = hasEmptyFilter
    && request.contractVersion === CONTRACT_VERSION
    && Number.isInteger(request.page)
    && request.page >= 1
    && Number.isInteger(request.pageSize)
    && request.pageSize >= 1
    && request.pageSize <= 100;

  // <lang><zh-CN>完整 shape 合法时允许进入 wire mapping。</zh-CN><en>Allow wire mapping when the complete shape is valid.</en></lang>
  if (hasValidPaging) {
    // <lang><zh-CN>null 是 runtime 约定的 validation success 标记，不是业务结果。</zh-CN><en>Null is the runtime's validation-success marker, not a business result.</en></lang>
    return null;
  }

  // <lang><zh-CN>无效输入不回显 raw request，也不触发 exchange。</zh-CN><en>Invalid input neither echoes the raw request nor triggers exchange.</en></lang>
  return createFailure('invalid-query', '查询条件不符合该模块的最小契约。', 'The query does not satisfy the module contract.', false, 'request');
}

/**
 * <lang><zh-CN>校验 current module 的 entry detail request。</zh-CN><en>Validates the current module's entry-detail request.</en></lang>
 *
 * @param {unknown} request <lang><zh-CN>候选 canonical detail request。</zh-CN><en>Candidate canonical detail request.</en></lang>
 * @returns {object|null} <lang><zh-CN>合法时为 null，否则为 not-found failure。</zh-CN><en>Null when valid; otherwise a not-found failure.</en></lang>
 * @lang zh-CN fixture 只拥有 `entry-001`，未知值不回显可用 ID 或 backend lookup 信息。
 * @lang en The fixture owns only `entry-001`; an unknown value reveals neither available IDs nor backend lookup information.
 */
function validateDetailRequest(request) {
  // <lang><zh-CN>同时校验 plain-object shape、版本和唯一自有 entry ID。</zh-CN><en>Validate plain-object shape, version, and the single owned entry ID together.</en></lang>
  const isValid = typeof request === 'object'
    && request !== null
    && !Array.isArray(request)
    && request.contractVersion === CONTRACT_VERSION
    && request.entryId === 'entry-001';

  // <lang><zh-CN>合法 request 进入 detail wire mapping。</zh-CN><en>A valid request enters detail wire mapping.</en></lang>
  if (isValid) {
    // <lang><zh-CN>null 表示 validation success。</zh-CN><en>Null indicates validation success.</en></lang>
    return null;
  }

  // <lang><zh-CN>未知/无效 ID 返回不可重试 request-scope failure。</zh-CN><en>An unknown/invalid ID returns a non-retryable request-scope failure.</en></lang>
  return createFailure('not-found', '未找到请求的示例 entry。', 'The requested example entry was not found.', false, 'request');
}

/**
 * <lang><zh-CN>构造 query adapter declaration。</zh-CN><en>Constructs the query-adapter declaration.</en></lang>
 *
 * @param {object} queryCache <lang><zh-CN>显式 none/memory cache policy。</zh-CN><en>Explicit none/memory cache policy.</en></lang>
 * @returns {object} <lang><zh-CN>新的 backend-agnostic declaration。</zh-CN><en>A new backend-agnostic declaration.</en></lang>
 * @lang zh-CN declaration 只含 stable IDs/capabilities，不含 URL、header、credential 或 connection。
 * @lang en The declaration contains only stable IDs/capabilities and no URL, header, credential, or connection.
 */
function createQueryDeclaration(queryCache) {
  // <lang><zh-CN>query 声明 page/pageJump，并仅允许无 credential 的 injected fixture。</zh-CN><en>The query declaration states page/pageJump and allows only an injected fixture with no credential.</en></lang>
  return {
    adapterContractVersion: ADAPTER_CONTRACT_VERSION,
    adapterId: QUERY_ADAPTER_ID,
    port: 'catalog-query',
    contract: {
      id: 'catalog-query-detail.query',
      version: CONTRACT_VERSION
    },
    owner: 'example-catalog-query-detail-adapter-fixture',
    transport: 'injected-fixture',
    pagination: {
      modes: ['page'],
      pageJump: true
    },
    cache: { ...queryCache },
    credential: {
      mode: 'none'
    }
  };
}

/**
 * <lang><zh-CN>构造 detail adapter declaration。</zh-CN><en>Constructs the detail-adapter declaration.</en></lang>
 *
 * @returns {object} <lang><zh-CN>无 cache/credential 的 detail 声明。</zh-CN><en>A detail declaration with neither cache nor credential.</en></lang>
 * @lang zh-CN detail request 仍是 read port，但本 fixture 明确不缓存，证明 policy 逐 port 声明。
 * @lang en Detail remains a read port, but this fixture explicitly does not cache it, proving policy is declared per port.
 */
function createDetailDeclaration() {
  // <lang><zh-CN>pagination 对 detail 没有业务含义，因此声明空 mode 与 pageJump false。</zh-CN><en>Pagination has no business meaning for detail, so declare empty modes and pageJump false.</en></lang>
  return {
    adapterContractVersion: ADAPTER_CONTRACT_VERSION,
    adapterId: DETAIL_ADAPTER_ID,
    port: 'entry-detail',
    contract: {
      id: 'catalog-query-detail.detail',
      version: CONTRACT_VERSION
    },
    owner: 'example-catalog-query-detail-adapter-fixture',
    transport: 'injected-fixture',
    pagination: {
      modes: [],
      pageJump: false
    },
    cache: {
      mode: 'none'
    },
    credential: {
      mode: 'none'
    }
  };
}

/**
 * <lang><zh-CN>构造 wire fixture implementation-package manifest。</zh-CN><en>Constructs the wire-fixture implementation-package manifest.</en></lang>
 *
 * @returns {object} <lang><zh-CN>与现有 business module port contract 对应的实现声明。</zh-CN><en>An implementation declaration corresponding to the existing business-module port contracts.</en></lang>
 * @lang zh-CN manifest 描述 fixture-only engineering delivery，不取得 module business ownership。
 * @lang en The manifest describes fixture-only engineering delivery and does not acquire module business ownership.
 */
function createImplementationPackage() {
  // <lang><zh-CN>提供 query/detail adapter 和同契约 mock session，供 core 显式校验。</zh-CN><en>Provide query/detail adapters and a same-contract mock session for explicit core validation.</en></lang>
  return {
    manifestVersion: CONTRACT_VERSION,
    kind: 'implementation-package',
    id: CATALOG_ADAPTER_IMPLEMENTATION_ID,
    moduleId: MODULE_ID,
    package: {
      identity: 'example-catalog-query-detail-adapter-fixture',
      distribution: 'fixture-only'
    },
    runtime: {
      targets: ['node'],
      surfaces: ['adapter', 'mock-session']
    },
    provides: [
      {
        id: 'catalog-query',
        kind: 'adapter',
        contract: {
          id: 'catalog-query-detail.query',
          version: CONTRACT_VERSION
        }
      },
      {
        id: 'entry-detail',
        kind: 'adapter',
        contract: {
          id: 'catalog-query-detail.detail',
          version: CONTRACT_VERSION
        }
      },
      {
        id: 'session-state',
        kind: 'mock-session',
        contract: {
          id: 'catalog-query-detail.session',
          version: CONTRACT_VERSION
        }
      }
    ],
    compatibility: {
      bizContract: '>=1.0.0 <2.0.0',
      hiauviewUi: 'not-required'
    },
    provenance: {
      strategy: 'independent',
      license: 'MIT',
      noticeRequired: false
    },
    validation: {
      evidence: ['adapter-declaration', 'contract-fixture'],
      status: 'fixture'
    }
  };
}

/**
 * <lang><zh-CN>创建中性 catalog-query-detail adapter fixture。</zh-CN><en>Creates the neutral catalog-query-detail adapter fixture.</en></lang>
 *
 * @param {object} [options] <lang><zh-CN>fixture case、query cache 与可控时钟。</zh-CN><en>Fixture case, query cache, and controlled clock.</en></lang>
 * @returns {object} <lang><zh-CN>implementation package、port providers、declarations 与受限 controller。</zh-CN><en>Implementation package, port providers, declarations, and bounded controller.</en></lang>
 * @lang zh-CN options 只选择 allowlisted 本地行为，不接受 endpoint、connection、credential、远端数据或动态代码。
 * @lang en Options select only allowlisted local behavior and accept no endpoint, connection, credential, remote data, or dynamic code.
 */
export function createCatalogQueryDetailAdapterFixture(options = {}) {
  // <lang><zh-CN>非 plain options 是测试配置错误，不进入 runtime。</zh-CN><en>Non-plain options are a test-configuration error and do not enter the runtime.</en></lang>
  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    // <lang><zh-CN>错误不回显 options。</zh-CN><en>The error does not echo options.</en></lang>
    throw new TypeError('Adapter fixture options must be a plain object.');
  }

  // <lang><zh-CN>fixtureCase 只影响本地 wire exchange/conversion，不改变 declaration。</zh-CN><en>fixtureCase changes only local wire exchange/conversion and not the declaration.</en></lang>
  const fixtureCase = options.fixtureCase ?? 'success';

  // <lang><zh-CN>允许列表阻止任意字符串变成远端/动态行为。</zh-CN><en>The allowlist prevents an arbitrary string from becoming remote/dynamic behavior.</en></lang>
  const allowedFixtureCases = new Set(['success', 'exchange-failure', 'malformed-wire', 'detail-section-failure']);

  // <lang><zh-CN>未知 fixture case 立即拒绝。</zh-CN><en>Reject an unknown fixture case immediately.</en></lang>
  if (!allowedFixtureCases.has(fixtureCase)) {
    // <lang><zh-CN>错误只说明允许的配置类别，不包含输入对象。</zh-CN><en>The error states only the allowed configuration category and contains no input object.</en></lang>
    throw new RangeError('Unsupported catalog adapter fixture case.');
  }

  // <lang><zh-CN>query cache 缺省为 none，避免所有 adapter 默认缓存。</zh-CN><en>Query cache defaults to none so adapters do not cache by default.</en></lang>
  const queryCache = options.queryCache ?? { mode: 'none' };

  // <lang><zh-CN>分别构造 query/detail 声明，保持 port owner/cache policy 清晰。</zh-CN><en>Construct separate query/detail declarations, keeping port ownership and cache policy clear.</en></lang>
  const queryDeclaration = createQueryDeclaration(queryCache);
  const detailDeclaration = createDetailDeclaration();

  /**
   * <lang><zh-CN>将 canonical query 映射为仅在 query exchange 内可见的 wire request。</zh-CN><en>Maps a canonical query to a wire request visible only inside the query exchange.</en></lang>
   *
   * @param {object} request <lang><zh-CN>已通过 module validation 的 query。</zh-CN><en>Query that passed module validation.</en></lang>
   * @returns {object} <lang><zh-CN>本地 fixture wire request。</zh-CN><en>A local-fixture wire request.</en></lang>
   * @lang zh-CN wire 字段不跨 port，也不成为 module filter schema。
   * @lang en Wire fields neither cross the port nor become module-filter schema.
   */
  const createQueryWireRequest = (request) => {
    // <lang><zh-CN>只映射 page/pageSize；空 filter 不产生 backend-specific 参数。</zh-CN><en>Map only page/pageSize; the empty filter creates no backend-specific parameter.</en></lang>
    return {
      page_number: request.page,
      page_size: request.pageSize
    };
  };

  /**
   * <lang><zh-CN>执行确定性的本地 query wire exchange。</zh-CN><en>Executes the deterministic local query-wire exchange.</en></lang>
   *
   * @param {object} wireRequest <lang><zh-CN>本 extension 自有 wire request。</zh-CN><en>Wire request owned by this extension.</en></lang>
   * @returns {object} <lang><zh-CN>本地 wire outcome。</zh-CN><en>A local wire outcome.</en></lang>
   * @lang zh-CN 函数不调用 fetch/uni.request，也不读取 URL、environment 或 credential。
   * @lang en The function calls neither fetch nor uni.request and reads no URL, environment, or credential.
   */
  const exchangeQuery = (wireRequest) => {
    // <lang><zh-CN>exchange-failure 用局部异常测试 runtime 脱敏。</zh-CN><en>exchange-failure uses a local exception to test runtime redaction.</en></lang>
    if (fixtureCase === 'exchange-failure') {
      // <lang><zh-CN>异常文本不含真实 secret，但仍不得跨 port。</zh-CN><en>The exception text contains no real secret but still must not cross the port.</en></lang>
      throw new Error('Local query exchange fixture failed.');
    }

    // <lang><zh-CN>malformed-wire 返回无法映射的受控形状。</zh-CN><en>malformed-wire returns a controlled unmappable shape.</en></lang>
    if (fixtureCase === 'malformed-wire') {
      // <lang><zh-CN>converter 将拒绝缺失 result fields 的 outcome。</zh-CN><en>The converter will reject an outcome missing result fields.</en></lang>
      return { state: 'malformed' };
    }

    // <lang><zh-CN>成功 wire envelope 只包含中性 entry 与分页字段。</zh-CN><en>The successful wire envelope contains only a neutral entry and pagination fields.</en></lang>
    return {
      state: 'ok',
      result: {
        rows: [
          {
            entry_key: 'entry-001',
            label_zh_hans: '示例条目 001',
            label_en: 'Example entry 001'
          }
        ],
        page_number: wireRequest.page_number,
        page_size: wireRequest.page_size,
        total_count: 1
      }
    };
  };

  /**
   * <lang><zh-CN>将受控 query wire outcome 转换为 canonical page。</zh-CN><en>Converts a controlled query-wire outcome to a canonical page.</en></lang>
   *
   * @param {unknown} wireOutcome <lang><zh-CN>adapter-private outcome。</zh-CN><en>Adapter-private outcome.</en></lang>
   * @returns {object} <lang><zh-CN>canonical page。</zh-CN><en>A canonical page.</en></lang>
   * @lang zh-CN converter 严格检查本 fixture 的 shape，不把未知字段或整个 body 透传。
   * @lang en The converter strictly checks this fixture's shape and passes through neither unknown fields nor a whole body.
   */
  const convertQueryWireOutcome = (wireOutcome) => {
    // <lang><zh-CN>只接受明确 ok/result/rows/paging 的 plain shape。</zh-CN><en>Accept only an explicit plain shape with ok/result/rows/paging.</en></lang>
    const isValid = typeof wireOutcome === 'object'
      && wireOutcome !== null
      && !Array.isArray(wireOutcome)
      && wireOutcome.state === 'ok'
      && typeof wireOutcome.result === 'object'
      && wireOutcome.result !== null
      && Array.isArray(wireOutcome.result.rows)
      && wireOutcome.result.rows.length === 1
      && Number.isInteger(wireOutcome.result.page_number)
      && Number.isInteger(wireOutcome.result.page_size)
      && Number.isInteger(wireOutcome.result.total_count);

    // <lang><zh-CN>malformed wire 在 adapter 内抛出，由 runtime 统一脱敏。</zh-CN><en>Malformed wire throws inside the adapter and is uniformly redacted by the runtime.</en></lang>
    if (!isValid) {
      // <lang><zh-CN>错误不包含 wire outcome。</zh-CN><en>The error does not include the wire outcome.</en></lang>
      throw new TypeError('Query wire outcome is not mappable.');
    }

    // <lang><zh-CN>读取唯一中性 row；其字段逐一白名单映射。</zh-CN><en>Read the single neutral row and map its fields through an allowlist.</en></lang>
    const row = wireOutcome.result.rows[0];

    // <lang><zh-CN>row 必须含固定 ID 与双语 string label。</zh-CN><en>The row must contain the fixed ID and bilingual string labels.</en></lang>
    const rowIsValid = typeof row === 'object'
      && row !== null
      && row.entry_key === 'entry-001'
      && typeof row.label_zh_hans === 'string'
      && typeof row.label_en === 'string';

    // <lang><zh-CN>不合法 row 不会部分投影。</zh-CN><en>An invalid row is not partially projected.</en></lang>
    if (!rowIsValid) {
      // <lang><zh-CN>错误仍不包含 row。</zh-CN><en>The error still contains no row.</en></lang>
      throw new TypeError('Query wire row is not mappable.');
    }

    // <lang><zh-CN>由 total/page/pageSize 计算 hasNext，避免直接信任 wire boolean。</zh-CN><en>Compute hasNext from total/page/pageSize instead of trusting a wire Boolean.</en></lang>
    const hasNext = wireOutcome.result.page_number * wireOutcome.result.page_size < wireOutcome.result.total_count;

    // <lang><zh-CN>只返回 current module 声明的 canonical fields。</zh-CN><en>Return only canonical fields declared by the current module.</en></lang>
    return {
      contractVersion: CONTRACT_VERSION,
      kind: 'page',
      entries: [
        {
          id: row.entry_key,
          label: createLocalizedText(row.label_zh_hans, row.label_en)
        }
      ],
      page: wireOutcome.result.page_number,
      pageSize: wireOutcome.result.page_size,
      total: wireOutcome.result.total_count,
      hasNext
    };
  };

  // <lang><zh-CN>query cache key 包含 adapter/contract/port 与已验证 canonical paging fields。</zh-CN><en>The query cache key contains adapter/contract/port and validated canonical paging fields.</en></lang>
  const createQueryCacheKey = (request) => `${QUERY_ADAPTER_ID}|${CONTRACT_VERSION}|catalog-query|${request.page}|${request.pageSize}`;

  // <lang><zh-CN>初始化 query runtime；只有 memory mode 时传入 key function。</zh-CN><en>Initialize the query runtime; the key function is used only in memory mode.</en></lang>
  const queryInitialization = createReadAdapter({
    declaration: queryDeclaration,
    validateRequest: validateQueryRequest,
    createCacheKey: createQueryCacheKey,
    createWireRequest: createQueryWireRequest,
    exchange: exchangeQuery,
    convertWireOutcome: convertQueryWireOutcome,
    now: options.now
  });

  // <lang><zh-CN>extension 自有 declaration 必须初始化成功，否则属于开发配置错误。</zh-CN><en>The extension-owned declaration must initialize successfully or it is a development-configuration error.</en></lang>
  if (!queryInitialization.ok) {
    // <lang><zh-CN>错误不回显 declaration/diagnostics，详细 code 由直接 validator tests 覆盖。</zh-CN><en>The error echoes neither declaration nor diagnostics; direct validator tests cover detailed codes.</en></lang>
    throw new Error('Query adapter fixture failed to initialize.');
  }

  /**
   * <lang><zh-CN>将 canonical detail request 映射为 adapter-private wire request。</zh-CN><en>Maps a canonical detail request to an adapter-private wire request.</en></lang>
   *
   * @param {object} request <lang><zh-CN>已验证 detail request。</zh-CN><en>Validated detail request.</en></lang>
   * @returns {object} <lang><zh-CN>本地 detail wire request。</zh-CN><en>A local detail-wire request.</en></lang>
   * @lang zh-CN 只映射 entry ID，不引入 URL 或 credential。
   * @lang en Only the entry ID is mapped; no URL or credential is introduced.
   */
  const createDetailWireRequest = (request) => {
    // <lang><zh-CN>wire key 只在本 extension exchange 内可见。</zh-CN><en>The wire key is visible only inside this extension's exchange.</en></lang>
    return { entry_key: request.entryId };
  };

  /**
   * <lang><zh-CN>执行确定性的本地 detail wire exchange。</zh-CN><en>Executes the deterministic local detail-wire exchange.</en></lang>
   *
   * @param {object} wireRequest <lang><zh-CN>本地 wire request。</zh-CN><en>Local wire request.</en></lang>
   * @returns {object} <lang><zh-CN>本地 detail wire outcome。</zh-CN><en>Local detail-wire outcome.</en></lang>
   * @lang zh-CN detail 与 query 共享稳定 entry ID，但不共享 runtime cache。
   * @lang en Detail and query share the stable entry ID but no runtime cache.
   */
  const exchangeDetail = (wireRequest) => {
    // <lang><zh-CN>exchange-failure 同时模拟 selected adapter 的 detail port 不可用。</zh-CN><en>exchange-failure also simulates unavailability of the selected adapter's detail port.</en></lang>
    if (fixtureCase === 'exchange-failure') {
      // <lang><zh-CN>局部异常由 runtime 脱敏。</zh-CN><en>The runtime redacts the local exception.</en></lang>
      throw new Error('Local detail exchange fixture failed.');
    }

    // <lang><zh-CN>malformed-wire 提供无法映射的 detail shape。</zh-CN><en>malformed-wire provides an unmappable detail shape.</en></lang>
    if (fixtureCase === 'malformed-wire') {
      // <lang><zh-CN>converter 不会猜测缺失主体。</zh-CN><en>The converter will not guess a missing primary record.</en></lang>
      return { state: 'malformed' };
    }

    // <lang><zh-CN>成功 outcome 仅含中性主 entry 与附属区块状态。</zh-CN><en>The successful outcome contains only a neutral primary entry and supplementary-section state.</en></lang>
    return {
      state: 'ok',
      result: {
        entry_key: wireRequest.entry_key,
        label_zh_hans: '示例条目 001',
        label_en: 'Example entry 001',
        supplementary_state: fixtureCase === 'detail-section-failure' ? 'unavailable' : 'empty'
      }
    };
  };

  /**
   * <lang><zh-CN>将受控 detail wire outcome 转换为 canonical detail。</zh-CN><en>Converts a controlled detail-wire outcome to a canonical detail.</en></lang>
   *
   * @param {unknown} wireOutcome <lang><zh-CN>adapter-private outcome。</zh-CN><en>Adapter-private outcome.</en></lang>
   * @returns {object} <lang><zh-CN>canonical detail。</zh-CN><en>A canonical detail.</en></lang>
   * @lang zh-CN 附属失败只进入 supplementary section，不覆盖 ready 主体。
   * @lang en A supplementary failure enters only the supplementary section and does not override the ready primary entry.
   */
  const convertDetailWireOutcome = (wireOutcome) => {
    // <lang><zh-CN>严格校验 outcome/result/entry/label/section state。</zh-CN><en>Strictly validate outcome/result/entry/label/section state.</en></lang>
    const isValid = typeof wireOutcome === 'object'
      && wireOutcome !== null
      && !Array.isArray(wireOutcome)
      && wireOutcome.state === 'ok'
      && typeof wireOutcome.result === 'object'
      && wireOutcome.result !== null
      && wireOutcome.result.entry_key === 'entry-001'
      && typeof wireOutcome.result.label_zh_hans === 'string'
      && typeof wireOutcome.result.label_en === 'string'
      && (wireOutcome.result.supplementary_state === 'empty' || wireOutcome.result.supplementary_state === 'unavailable');

    // <lang><zh-CN>无法映射时在 adapter 内抛出，不透传局部 wire。</zh-CN><en>Throw inside the adapter when mapping is impossible and do not pass through local wire.</en></lang>
    if (!isValid) {
      // <lang><zh-CN>错误不包含 outcome 字段。</zh-CN><en>The error contains no outcome field.</en></lang>
      throw new TypeError('Detail wire outcome is not mappable.');
    }

    // <lang><zh-CN>创建唯一 canonical 主 entry。</zh-CN><en>Create the single canonical primary entry.</en></lang>
    const entry = {
      id: wireOutcome.result.entry_key,
      label: createLocalizedText(wireOutcome.result.label_zh_hans, wireOutcome.result.label_en)
    };

    // <lang><zh-CN>主 section 始终 ready，保持 partial-failure 规则。</zh-CN><en>The primary section is always ready, preserving the partial-failure rule.</en></lang>
    const primarySection = {
      id: 'primary',
      state: 'ready'
    };

    // <lang><zh-CN>按 allowlisted wire state 构造 empty 或 section-scope failure。</zh-CN><en>Construct an empty or section-scope failure from the allowlisted wire state.</en></lang>
    const supplementarySection = wireOutcome.result.supplementary_state === 'unavailable'
      ? {
          id: 'supplementary',
          state: 'failure',
          failure: createFailure('section-unavailable', '附属区块暂时不可用。', 'The supplementary section is temporarily unavailable.', true, 'section')
        }
      : {
          id: 'supplementary',
          state: 'empty'
        };

    // <lang><zh-CN>返回既有 canonical detail shape，不包含 wire state 名称。</zh-CN><en>Return the existing canonical detail shape without a wire-state name.</en></lang>
    return {
      contractVersion: CONTRACT_VERSION,
      kind: 'detail',
      entry,
      sections: [primarySection, supplementarySection]
    };
  };

  // <lang><zh-CN>初始化 detail runtime；cache mode none 不需要 cache key。</zh-CN><en>Initialize the detail runtime; cache mode none requires no cache key.</en></lang>
  const detailInitialization = createReadAdapter({
    declaration: detailDeclaration,
    validateRequest: validateDetailRequest,
    createWireRequest: createDetailWireRequest,
    exchange: exchangeDetail,
    convertWireOutcome: convertDetailWireOutcome,
    now: options.now
  });

  // <lang><zh-CN>extension 自有 detail declaration 必须成功。</zh-CN><en>The extension-owned detail declaration must succeed.</en></lang>
  if (!detailInitialization.ok) {
    // <lang><zh-CN>失败表示本地开发配置错误。</zh-CN><en>Failure indicates a local development-configuration error.</en></lang>
    throw new Error('Detail adapter fixture failed to initialize.');
  }

  /**
   * <lang><zh-CN>返回 existing contract 的无账户 mock session。</zh-CN><en>Returns the existing contract's account-free mock session.</en></lang>
   *
   * @returns {object} <lang><zh-CN>anonymous-capability mock session。</zh-CN><en>An anonymous-capability mock session.</en></lang>
   * @lang zh-CN provider 不读取 identity、token、cookie、header、storage 或 route。
   * @lang en The provider reads no identity, token, cookie, header, storage, or route.
   */
  const getSession = () => {
    // <lang><zh-CN>每次返回新对象和 capability 数组。</zh-CN><en>Return a new object and capability array every time.</en></lang>
    return {
      contractVersion: CONTRACT_VERSION,
      mode: 'mock',
      subject: null,
      capabilities: []
    };
  };

  /**
   * <lang><zh-CN>合并 query/detail runtime 的计数 observation。</zh-CN><en>Combines count-only observations from query/detail runtimes.</en></lang>
   *
   * @returns {object} <lang><zh-CN>按 port 分组的受限 observation。</zh-CN><en>A bounded observation grouped by port.</en></lang>
   * @lang zh-CN 结果不含 request、wire、cache value、异常或 session data。
   * @lang en The result contains no request, wire value, cache value, exception, or session data.
   */
  const getObservation = () => {
    // <lang><zh-CN>controller 分别返回新对象，组合后仍不共享内部计数容器。</zh-CN><en>Each controller returns a new object, so their composition shares no internal count container.</en></lang>
    return {
      query: queryInitialization.controller.getObservation(),
      detail: detailInitialization.controller.getObservation()
    };
  };

  /**
   * <lang><zh-CN>清理两个 adapter instance 的局部 cache。</zh-CN><en>Clears local caches of both adapter instances.</en></lang>
   *
   * @returns {void} <lang><zh-CN>无返回值。</zh-CN><en>No return value.</en></lang>
   * @lang zh-CN detail 当前为 none，调用其 clearCache 仍是无害且局部的统一 lifecycle 操作。
   * @lang en Detail currently uses none; calling its clearCache remains a harmless local uniform-lifecycle operation.
   */
  const clearCaches = () => {
    // <lang><zh-CN>先清 query instance，再清 detail instance；不访问全局 storage。</zh-CN><en>Clear the query instance and then the detail instance without accessing global storage.</en></lang>
    queryInitialization.controller.clearCache();
    detailInitialization.controller.clearCache();
  };

  // <lang><zh-CN>core 只接收 implementation package 和三个显式 provider；adapter controller/declarations 保留在 fixture owner 一侧。</zh-CN><en>The core receives only the implementation package and three explicit providers; adapter controllers/declarations stay with the fixture owner.</en></lang>
  return {
    implementationPackage: createImplementationPackage(),
    portProviders: {
      'catalog-query': queryInitialization.provider,
      'entry-detail': detailInitialization.provider,
      'session-state': {
        contract: {
          id: 'catalog-query-detail.session',
          version: CONTRACT_VERSION
        },
        invoke: getSession
      }
    },
    adapterDeclarations: {
      query: { ...queryDeclaration, contract: { ...queryDeclaration.contract }, pagination: { ...queryDeclaration.pagination, modes: [...queryDeclaration.pagination.modes] }, cache: { ...queryDeclaration.cache }, credential: { ...queryDeclaration.credential } },
      detail: { ...detailDeclaration, contract: { ...detailDeclaration.contract }, pagination: { ...detailDeclaration.pagination, modes: [...detailDeclaration.pagination.modes] }, cache: { ...detailDeclaration.cache }, credential: { ...detailDeclaration.credential } }
    },
    getObservation,
    clearCaches
  };
}
