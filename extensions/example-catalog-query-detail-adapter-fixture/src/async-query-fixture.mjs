/**
 * <lang><zh-CN>中性目录查询的异步 provider adapter seam：把显式注入的 runtime terminal envelope 投影为最小 canonical page/failure，不接入现有同步 core 或任何后端。</zh-CN><en>Asynchronous-provider adapter seam for the neutral catalog query: projects explicitly injected runtime terminal envelopes to a minimal canonical page/failure without joining the existing synchronous core or any backend.</en></lang>
 * @lang zh-CN 该 seam 只作为异步契约的 project-oriented mapping evidence；它不声明示例应用已经采用异步查询，也不拥有业务数据、网络、身份或真实持久化。
 * @lang en This seam is only project-oriented mapping evidence for the async contract; it declares neither that the example app adopts asynchronous querying nor ownership of business data, network, identity, or real persistence.
 */

// <lang><zh-CN>只使用同仓独立 async runtime 的公开包契约，不访问其内部实现或同步 provider-port v1。</zh-CN><en>Use only the public package contract of the same-repository independent async runtime, accessing neither its internals nor synchronous provider-port v1.</en></lang>
import {
  ASYNC_PROVIDER_CONTRACT_VERSION,
  ASYNC_SOURCE_POLICY_VERSION,
  createAsyncProviderHost
} from '@hia-uview/biz-async-provider-runtime';

/**
 * <lang><zh-CN>中性目录查询 canonical contract 的固定版本。</zh-CN><en>Fixed version of the neutral catalog-query canonical contract.</en></lang>
 * @lang zh-CN 此版本仅与既有中性 example 对齐，不是 npm 或 runtime 发布版本。
 * @lang en This version aligns only with the existing neutral example and is not an npm or runtime release version.
 */
const CATALOG_QUERY_CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>异步 query provider 的稳定声明标识。</zh-CN><en>Stable declaration ID of the asynchronous query provider.</en></lang>
 * @lang zh-CN 此 ID 是显式 adapter 配置键，不是 URL、endpoint 或 source 发现键。
 * @lang en This ID is an explicit adapter configuration key, not a URL, endpoint, or source-discovery key.
 */
const ASYNC_QUERY_PROVIDER_ID = 'example.catalog-query-detail.async-query-fixture';

/**
 * <lang><zh-CN>仓内 local query source 的稳定标识。</zh-CN><en>Stable ID of the checked-in local query source.</en></lang>
 * @lang zh-CN local 只代表受控内存 fixture authority，不代表 local file、storage 或持久化数据集。
 * @lang en Local represents only a controlled in-memory fixture authority and not a local file, storage, or persisted dataset.
 */
const LOCAL_QUERY_SOURCE_ID = 'example.catalog-query-detail.local-query';

/**
 * <lang><zh-CN>创建双语 canonical 文本。</zh-CN><en>Creates bilingual canonical text.</en></lang>
 * @param {string} zhHans <lang><zh-CN>简体中文文本。</zh-CN><en>Simplified-Chinese text.</en></lang>
 * @param {string} en <lang><zh-CN>英文文本。</zh-CN><en>English text.</en></lang>
 * @returns {object} <lang><zh-CN>新的双语文本对象。</zh-CN><en>A new bilingual-text object.</en></lang>
 * @lang zh-CN 每次都创建新对象，防止结果之间共享可写语言对象。
 * @lang en Create a new object each time, preventing results from sharing a writable locale object.
 */
function createLocalizedText(zhHans, en) {
  // <lang><zh-CN>保持已有 Biz runtime locale key，避免引入别名或环境语言推测。</zh-CN><en>Keep the existing Biz runtime locale keys and introduce neither aliases nor environment-language guessing.</en></lang>
  return { 'zh-Hans': zhHans, en };
}

/**
 * <lang><zh-CN>复制 runtime 已验证的可公开 source metadata。</zh-CN><en>Copies public source metadata already validated by the runtime.</en></lang>
 * @param {object} source <lang><zh-CN>runtime envelope 的 source 字段。</zh-CN><en>The source field of a runtime envelope.</en></lang>
 * @returns {object} <lang><zh-CN>不共享引用的 source metadata。</zh-CN><en>Source metadata with no shared reference.</en></lang>
 * @lang zh-CN adapter 不新增 source 字段或重解释 degraded reason；它只投影 runtime allowlist。
 * @lang en The adapter adds no source fields and does not reinterpret a degraded reason; it only projects the runtime allowlist.
 */
function copySourceMetadata(source) {
  // <lang><zh-CN>以明确字段复制，防止额外 runtime/source 属性向 canonical result 漏出。</zh-CN><en>Copy explicit fields, preventing extra runtime/source properties from leaking into the canonical result.</en></lang>
  return {
    sourceId: source.sourceId,
    authority: source.authority,
    degradedReason: source.degradedReason
  };
}

/**
 * <lang><zh-CN>创建不含 source 私有值的 canonical provider failure。</zh-CN><en>Creates a canonical provider failure containing no source-private value.</en></lang>
 * @param {boolean} retryable <lang><zh-CN>页面层是否可请求重试。</zh-CN><en>Whether the page layer may request a retry.</en></lang>
 * @param {object} source <lang><zh-CN>runtime 已受限的 source metadata。</zh-CN><en>Runtime-bounded source metadata.</en></lang>
 * @returns {object} <lang><zh-CN>canonical provider failure。</zh-CN><en>A canonical provider failure.</en></lang>
 * @lang zh-CN failure 不回显 request、wire、异常、source provider、message、URL 或 credential。
 * @lang en The failure echoes no request, wire, exception, source provider, message, URL, or credential.
 */
function createProviderFailure(retryable, source) {
  // <lang><zh-CN>只使用 adapter 自有的稳定双语说明，不传播 source 的任意文本。</zh-CN><en>Use only adapter-owned stable bilingual copy and propagate no arbitrary source text.</en></lang>
  return {
    contractVersion: CATALOG_QUERY_CONTRACT_VERSION,
    kind: 'failure',
    code: 'provider-unavailable',
    message: createLocalizedText('目录数据暂时不可用。', 'Catalog data is temporarily unavailable.'),
    retryable,
    scope: 'provider',
    source
  };
}

/**
 * <lang><zh-CN>将 async source value 映射为中性 canonical page。</zh-CN><en>Maps an asynchronous source value to a neutral canonical page.</en></lang>
 * @param {unknown} value <lang><zh-CN>adapter-private source value。</zh-CN><en>Adapter-private source value.</en></lang>
 * @param {object} source <lang><zh-CN>runtime 已受限 source metadata。</zh-CN><en>Runtime-bounded source metadata.</en></lang>
 * @returns {object|null} <lang><zh-CN>可映射时的 canonical page，否则为 null。</zh-CN><en>A canonical page when mappable, otherwise null.</en></lang>
 * @lang zh-CN 只接受当前 fixture 自有的五个标量字段；不猜测、部分映射或保留 wire 字段。
 * @lang en Accept only the five scalar fields owned by this fixture; do not guess, partially map, or retain wire fields.
 */
function mapAsyncSourceValueToPage(value, source) {
  // <lang><zh-CN>一次性校验 plain shape、稳定 entry、双语 label 与 paging 标量。</zh-CN><en>Validate plain shape, stable entry, bilingual label, and paging scalars together.</en></lang>
  const isMappable = typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && value.entryId === 'entry-001'
    && typeof value.labelZhHans === 'string'
    && typeof value.labelEn === 'string'
    && Number.isInteger(value.page)
    && value.page >= 1
    && Number.isInteger(value.pageSize)
    && value.pageSize >= 1;

  // <lang><zh-CN>无法安全映射时禁止任何部分 wire projection。</zh-CN><en>When mapping is unsafe, prohibit every partial wire projection.</en></lang>
  if (!isMappable) {
    // <lang><zh-CN>null 是 adapter 内部映射标记，不是业务结果。</zh-CN><en>Null is an internal adapter mapping marker and not a business result.</en></lang>
    return null;
  }

  // <lang><zh-CN>当前 fixture 只有一个 entry，因此 total/hasNext 由 adapter 自有常量语义确定。</zh-CN><en>The current fixture has one entry, so total/hasNext are determined by adapter-owned constant semantics.</en></lang>
  return {
    contractVersion: CATALOG_QUERY_CONTRACT_VERSION,
    kind: 'page',
    entries: [{ id: value.entryId, label: createLocalizedText(value.labelZhHans, value.labelEn) }],
    page: value.page,
    pageSize: value.pageSize,
    total: 1,
    hasNext: false,
    source: copySourceMetadata(source)
  };
}

/**
 * <lang><zh-CN>将一个 runtime terminal envelope 映射为 canonical query outcome。</zh-CN><en>Maps one runtime terminal envelope to a canonical query outcome.</en></lang>
 * @param {object} envelope <lang><zh-CN>async runtime 的受限 terminal envelope。</zh-CN><en>A bounded terminal envelope from the async runtime.</en></lang>
 * @returns {object} <lang><zh-CN>canonical page 或 canonical provider failure。</zh-CN><en>A canonical page or canonical provider failure.</en></lang>
 * @lang zh-CN runtime 已吞没 source exception；adapter 进一步隔离 source value，并统一为当前 module 的 canonical failure 文案。
 * @lang en The runtime has already swallowed source exceptions; the adapter further isolates source values and unifies them as current-module canonical failure copy.
 */
function mapEnvelopeToCanonicalOutcome(envelope) {
  // <lang><zh-CN>success 先严格转换 private value；失败时不保留 value 的任意片段。</zh-CN><en>For success, strictly convert the private value first; on failure retain no fragment of the value.</en></lang>
  if (envelope.kind === 'success') {
    // <lang><zh-CN>只有完整 canonical page 才能向调用方返回。</zh-CN><en>Return to the caller only a complete canonical page.</en></lang>
    const mappedPage = mapAsyncSourceValueToPage(envelope.value, envelope.source);

    // <lang><zh-CN>映射失败仍带安全 source metadata，以便 UI 显示实际已选 authority。</zh-CN><en>A mapping failure still carries safe source metadata so UI can show the selected authority.</en></lang>
    return mappedPage ?? createProviderFailure(true, copySourceMetadata(envelope.source));
  }

  // <lang><zh-CN>仅 timeout/offline/unavailable 允许页面层显式再试；冲突、取消、未知由项目语义另行处理。</zh-CN><en>Only timeout/offline/unavailable allow an explicit page-layer retry; conflict, cancellation, and unknown receive separate project semantics.</en></lang>
  const retryable = envelope.code === 'timeout' || envelope.code === 'offline' || envelope.code === 'unavailable';

  // <lang><zh-CN>把任何 runtime failure 统一为既有 canonical provider category，避免 runtime 内部 kind 或 exception 越界。</zh-CN><en>Unify every runtime failure as the existing canonical provider category, preventing runtime-internal kind or exception from crossing the boundary.</en></lang>
  return createProviderFailure(retryable, copySourceMetadata(envelope.source));
}

/**
 * <lang><zh-CN>创建默认 local 内存 source provider。</zh-CN><en>Creates the default local in-memory source provider.</en></lang>
 * @returns {object} <lang><zh-CN>一个显式 local async source provider。</zh-CN><en>One explicit local asynchronous source provider.</en></lang>
 * @lang zh-CN provider 只返回当前 fixture 的自有 plain data；它不读取 local JSON 文件、storage、clock 或外部资源。
 * @lang en The provider returns only plain data owned by this fixture; it reads no local JSON file, storage, clock, or external resource.
 */
function createDefaultLocalSourceProvider() {
  // <lang><zh-CN>source authority 与 policy 中的 local 明确对应。</zh-CN><en>The source authority explicitly corresponds to local in the policy.</en></lang>
  return {
    authority: 'local',
    /**
     * <lang><zh-CN>读取一个已由 runtime 隔离的目录请求。</zh-CN><en>Reads one catalog request already isolated by the runtime.</en></lang>
     * @param {object} request <lang><zh-CN>已复制的 adapter-private request。</zh-CN><en>A copied adapter-private request.</en></lang>
     * @returns {Promise<object>} <lang><zh-CN>受限 source terminal outcome。</zh-CN><en>A bounded source terminal outcome.</en></lang>
     * @lang zh-CN 该方法不改变 request，也不使用 timer、网络、storage 或外部状态。
     * @lang en This method mutates no request and uses no timer, network, storage, or external state.
     */
    invoke(request) {
      // <lang><zh-CN>只读取 runtime 已复制的最小 page/pageSize 字段；任何不合法值都受限为不可 retry failure。</zh-CN><en>Read only the minimum page/pageSize fields copied by the runtime; any invalid value becomes a bounded non-retryable failure.</en></lang>
      const isValidRequest = typeof request === 'object'
        && request !== null
        && Number.isInteger(request.page)
        && request.page >= 1
        && Number.isInteger(request.pageSize)
        && request.pageSize >= 1;

      // <lang><zh-CN>非法领域 request 不生成 partial page，也不回显输入。</zh-CN><en>An invalid domain request generates no partial page and echoes no input.</en></lang>
      if (!isValidRequest) {
        // <lang><zh-CN>返回允许的 source failure，不暴露 validation detail。</zh-CN><en>Return a permitted source failure without exposing validation detail.</en></lang>
        return Promise.resolve({ kind: 'failure', code: 'unknown', retryable: false });
      }

      // <lang><zh-CN>返回独立的 adapter-private fixture value；source metadata 由 runtime 单独创建。</zh-CN><en>Return independent adapter-private fixture data; source metadata is created separately by the runtime.</en></lang>
      return Promise.resolve({
        kind: 'success',
        value: {
          entryId: 'entry-001',
          labelZhHans: '示例条目 001',
          labelEn: 'Example entry 001',
          page: request.page,
          pageSize: request.pageSize
        }
      });
    }
  };
}

/**
 * <lang><zh-CN>创建中性目录查询的最小异步 provider adapter fixture。</zh-CN><en>Creates the minimal asynchronous-provider adapter fixture for the neutral catalog query.</en></lang>
 * @param {object} [options] <lang><zh-CN>显式 runtime/source 注入选项。</zh-CN><en>Explicit runtime/source injection options.</en></lang>
 * @returns {object} <lang><zh-CN>声明、policy、可取消 start、canonical mapping 与 observation。</zh-CN><en>Declaration, policy, cancellable start, canonical mapping, and observation.</en></lang>
 * @lang zh-CN 若调用方提供 policy/source map，它们必须原样通过 runtime gate；本 fixture 不发现、合并或回退额外 source。
 * @lang en When callers provide policy/source map, they must pass the runtime gate verbatim; this fixture discovers, merges, and falls back to no extra source.
 */
export function createAsyncCatalogQueryAdapterFixture(options = {}) {
  // <lang><zh-CN>固定 read declaration 仅承载当前 catalog-query contract 与安全执行语义。</zh-CN><en>The fixed read declaration carries only the current catalog-query contract and safe execution semantics.</en></lang>
  const declaration = {
    asyncProviderContractVersion: ASYNC_PROVIDER_CONTRACT_VERSION,
    providerId: ASYNC_QUERY_PROVIDER_ID,
    portId: 'catalog-query',
    owner: 'example-catalog-query-detail-adapter-fixture',
    kind: 'read',
    contract: { id: 'catalog-query-detail.query', version: CATALOG_QUERY_CONTRACT_VERSION },
    execution: 'injected-async',
    credential: { mode: 'none' },
    cancellation: 'explicit-handle',
    retry: { maxAttempts: 1 }
  };

  // <lang><zh-CN>默认 policy 明确选择一个 local source；没有隐式 remote/virtual 候选。</zh-CN><en>The default policy explicitly selects one local source; it has no implicit remote/virtual candidate.</en></lang>
  const sourcePolicy = options.sourcePolicy ?? {
    sourcePolicyVersion: ASYNC_SOURCE_POLICY_VERSION,
    mode: 'local',
    readSourceIds: [LOCAL_QUERY_SOURCE_ID],
    writeSourceId: LOCAL_QUERY_SOURCE_ID
  };

  // <lang><zh-CN>默认 map 正好含 default local provider；调用方自定义 map 时不与默认值合并。</zh-CN><en>The default map contains exactly the default local provider; a caller-custom map is not merged with defaults.</en></lang>
  const sourceProviders = options.sourceProviders ?? { [LOCAL_QUERY_SOURCE_ID]: createDefaultLocalSourceProvider() };

  // <lang><zh-CN>把 scheduler 明确透传，支持 deterministic timeout/race test 与小程序等价 timer。</zh-CN><en>Pass schedulers through explicitly, supporting deterministic timeout/race tests and equivalent mini-program timers.</en></lang>
  const initialization = createAsyncProviderHost({
    declaration,
    sourcePolicy,
    sourceProviders,
    timeoutMs: options.timeoutMs,
    schedule: options.schedule,
    clearSchedule: options.clearSchedule
  });

  // <lang><zh-CN>本 fixture 自有固定配置失败表示开发错误；不向页面泄漏 initialization diagnostics。</zh-CN><en>A failure of this fixture's fixed configuration is a development error; do not leak initialization diagnostics to a page.</en></lang>
  if (!initialization.ok) {
    // <lang><zh-CN>错误不包含 policy、source map 或 diagnostic 内容。</zh-CN><en>The error contains no policy, source map, or diagnostic content.</en></lang>
    throw new Error('Async catalog-query adapter fixture failed to initialize.');
  }

  /**
   * <lang><zh-CN>启动一次并映射为 canonical query outcome。</zh-CN><en>Starts one invocation and maps it to a canonical query outcome.</en></lang>
   * @param {unknown} request <lang><zh-CN>待复制的 canonical query request。</zh-CN><en>Canonical query request to copy.</en></lang>
   * @returns {object} <lang><zh-CN>mapped Promise 与原样的显式 cancel handle。</zh-CN><en>A mapped Promise and the unchanged explicit cancel handle.</en></lang>
   * @lang zh-CN 映射只发生在 terminal envelope 之后；cancel 仍由 runtime 决定，以保证 write/read 通用语义不被 adapter 改写。
   * @lang en Mapping occurs only after a terminal envelope; cancellation remains runtime-owned so the adapter cannot rewrite shared write/read semantics.
   */
  const start = (request) => {
    // <lang><zh-CN>先取得 runtime handle，使 request isolation、timeout 与取消始终由独立 package 统一执行。</zh-CN><en>Obtain the runtime handle first so request isolation, timeout, and cancellation are consistently executed by the independent package.</en></lang>
    const invocation = initialization.host.start(request);

    // <lang><zh-CN>只变换 resolved terminal envelope；不添加 rejection path 或 source exception handling。</zh-CN><en>Transform only the resolved terminal envelope and add neither a rejection path nor source-exception handling.</en></lang>
    return { promise: invocation.promise.then(mapEnvelopeToCanonicalOutcome), cancel: invocation.cancel };
  };

  // <lang><zh-CN>返回最小 adapter surface；不暴露 source map、runtime host、scheduler 或 private value mapper。</zh-CN><en>Return the minimum adapter surface and expose no source map, runtime host, scheduler, or private-value mapper.</en></lang>
  return {
    declaration: { ...declaration, contract: { ...declaration.contract }, credential: { ...declaration.credential }, retry: { ...declaration.retry } },
    sourcePolicy: { ...sourcePolicy, readSourceIds: [...sourcePolicy.readSourceIds] },
    start,
    getObservation: initialization.host.getObservation
  };
}
