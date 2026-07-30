/**
 * <lang><zh-CN>Backend-agnostic read-adapter runtime：校验显式声明，把调用方注入的 exchange 转换为 canonical port result，并提供受限的进程内成功结果缓存。</zh-CN><en>Backend-agnostic read-adapter runtime: validates an explicit declaration, converts a caller-injected exchange into canonical port results, and provides a bounded process-local success-result cache.</en></lang>
 * @lang zh-CN 本模块不打开网络、不读取环境/文件/storage、不处理真实身份或 credential，也不发现 package、动态 import、调用 Directus 或依赖 UI。
 * @lang en This module opens no network, reads no environment/file/storage, handles no real identity or credential, and neither discovers packages, dynamically imports, calls Directus, nor depends on UI.
 */

/**
 * <lang><zh-CN>首个 adapter declaration/runtime contract 的固定版本。</zh-CN><en>The fixed version of the first adapter declaration/runtime contract.</en></lang>
 * @lang zh-CN 该版本只标识当前 private runtime shape，不代表 npm release semver。
 * @lang en This version identifies only the current private runtime shape and is not npm release semver.
 */
export const ADAPTER_CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>首轮进程内缓存允许的最大 TTL，单位毫秒。</zh-CN><en>The maximum TTL allowed by the initial process-local cache, in milliseconds.</en></lang>
 * @lang zh-CN 五分钟上限防止 fixture 声明形成无界或近似持久的默认缓存；真实缓存策略需要独立复审。
 * @lang en The five-minute limit prevents a fixture declaration from creating an unbounded or quasi-persistent default cache; a real cache policy requires separate review.
 */
const MAX_MEMORY_CACHE_TTL_MS = 300000;

/**
 * <lang><zh-CN>判断输入是否为可按 plain-data contract 审阅的普通对象。</zh-CN><en>Determines whether input is an ordinary object reviewable under the plain-data contract.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待判断值。</zh-CN><en>Value to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>值是否为非数组普通对象。</zh-CN><en>Whether the value is a non-array ordinary object.</en></lang>
 * @lang zh-CN 该检查拒绝 class instance、Date、Map 与其他带行为或非 JSON 语义的容器。
 * @lang en This check rejects class instances, Date, Map, and other containers with behavior or non-JSON semantics.
 */
function isPlainObject(value) {
  // <lang><zh-CN>null 与数组不是 declaration/canonical object。</zh-CN><en>Null and arrays are not declaration/canonical objects.</en></lang>
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    // <lang><zh-CN>立即拒绝不具备对象字段语义的值。</zh-CN><en>Reject immediately when a value has no object-field semantics.</en></lang>
    return false;
  }

  // <lang><zh-CN>读取 prototype 以区分普通对象与带行为的实例。</zh-CN><en>Read the prototype to distinguish an ordinary object from a behavioral instance.</en></lang>
  const prototype = Object.getPrototypeOf(value);

  // <lang><zh-CN>对象字面量与无 prototype 的 plain record 都可作为受控数据。</zh-CN><en>Object literals and prototype-free plain records are both accepted as controlled data.</en></lang>
  return prototype === Object.prototype || prototype === null;
}

/**
 * <lang><zh-CN>创建稳定的双语显示文本。</zh-CN><en>Creates stable bilingual display text.</en></lang>
 *
 * @param {string} zhHans <lang><zh-CN>简体中文文本。</zh-CN><en>Simplified-Chinese text.</en></lang>
 * @param {string} en <lang><zh-CN>英文文本。</zh-CN><en>English text.</en></lang>
 * @returns {object} <lang><zh-CN>新的双语 plain object。</zh-CN><en>A new bilingual plain object.</en></lang>
 * @lang zh-CN runtime 自有 diagnostic/failure 始终显式提供 `zh-Hans` 与 `en`。
 * @lang en Runtime-owned diagnostics/failures always provide explicit `zh-Hans` and `en` values.
 */
function createLocalizedText(zhHans, en) {
  // <lang><zh-CN>返回新对象，避免调用方共享或修改内部文本容器。</zh-CN><en>Return a new object so callers neither share nor mutate an internal text container.</en></lang>
  return {
    'zh-Hans': zhHans,
    en
  };
}

/**
 * <lang><zh-CN>创建不回显 declaration 或 wire 输入的结构化诊断。</zh-CN><en>Creates a structured diagnostic that echoes neither declaration nor wire input.</en></lang>
 *
 * @param {string} code <lang><zh-CN>稳定诊断代码。</zh-CN><en>Stable diagnostic code.</en></lang>
 * @param {string} zhHans <lang><zh-CN>中文修正说明。</zh-CN><en>Chinese correction guidance.</en></lang>
 * @param {string} en <lang><zh-CN>英文修正说明。</zh-CN><en>English correction guidance.</en></lang>
 * @returns {object} <lang><zh-CN>公开安全的诊断对象。</zh-CN><en>A public-safe diagnostic object.</en></lang>
 * @lang zh-CN diagnostic 只包含 code/message，不包含字段值、路径、endpoint 或 credential。
 * @lang en A diagnostic contains only code/message and no field value, path, endpoint, or credential.
 */
function createDiagnostic(code, zhHans, en) {
  // <lang><zh-CN>诊断 shape 与 core 的结构化拒绝风格一致，但不共享后端数据。</zh-CN><en>The diagnostic shape follows the core's structured-rejection style while sharing no backend data.</en></lang>
  return {
    code,
    message: createLocalizedText(zhHans, en)
  };
}

/**
 * <lang><zh-CN>创建 adapter boundary 自有的规范化不可用 failure。</zh-CN><en>Creates the canonical unavailable failure owned by the adapter boundary.</en></lang>
 *
 * @param {string} contractVersion <lang><zh-CN>当前 port contract version。</zh-CN><en>Current port-contract version.</en></lang>
 * @returns {object} <lang><zh-CN>不含 wire/异常细节的 canonical failure。</zh-CN><en>A canonical failure containing no wire/exception detail.</en></lang>
 * @lang zh-CN exchange、cache-key、wire mapping 或 conversion 的内部异常都统一投影为该失败，原始错误不跨 port。
 * @lang en Internal failures from exchange, cache-key, wire mapping, or conversion all project to this failure; the raw error never crosses the port.
 */
function createAdapterUnavailableFailure(contractVersion) {
  // <lang><zh-CN>failure 使用既有公开 code/scope/retry 语义，不扩展 module contract。</zh-CN><en>The failure uses existing public code/scope/retry semantics and does not extend the module contract.</en></lang>
  return {
    contractVersion,
    kind: 'failure',
    code: 'adapter-unavailable',
    message: createLocalizedText('所选 adapter 暂时无法提供该能力。', 'The selected adapter cannot currently serve this capability.'),
    retryable: true,
    scope: 'adapter'
  };
}

/**
 * <lang><zh-CN>递归复制受控 plain data，并拒绝循环或带行为的值。</zh-CN><en>Recursively copies controlled plain data and rejects cyclic or behavioral values.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待复制 canonical 值。</zh-CN><en>Canonical value to copy.</en></lang>
 * @param {WeakSet<object>} [seen] <lang><zh-CN>当前复制遍历已访问对象。</zh-CN><en>Objects visited by the current copy traversal.</en></lang>
 * @returns {unknown} <lang><zh-CN>与输入隔离的 plain-data 副本。</zh-CN><en>A plain-data copy isolated from the input.</en></lang>
 * @lang zh-CN cache 只保存和返回副本，防止调用方 mutation 污染另一调用；不使用 JSON stringify 隐式丢失值。
 * @lang en The cache stores and returns copies so caller mutation cannot contaminate another call; JSON stringification is not used to silently lose values.
 */
function clonePlainData(value, seen = new WeakSet()) {
  // <lang><zh-CN>null、string、number 与 boolean 可以安全按值返回。</zh-CN><en>Null, string, number, and Boolean values can be returned safely by value.</en></lang>
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    // <lang><zh-CN>primitive 不共享可变引用。</zh-CN><en>A primitive shares no mutable reference.</en></lang>
    return value;
  }

  // <lang><zh-CN>canonical plain data 不允许 undefined、bigint、symbol 或 function。</zh-CN><en>Canonical plain data permits no undefined, bigint, symbol, or function.</en></lang>
  if (typeof value !== 'object') {
    // <lang><zh-CN>以内部 TypeError 拒绝无法安全复制的值；调用者会在 port boundary 脱敏。</zh-CN><en>Reject an unsafe value with an internal TypeError; the caller redacts it at the port boundary.</en></lang>
    throw new TypeError('Canonical data must contain only supported plain values.');
  }

  // <lang><zh-CN>重复引用表示循环或共享对象图，不适合作为 canonical/cache value。</zh-CN><en>A repeated reference indicates a cycle or shared object graph unsuitable for a canonical/cache value.</en></lang>
  if (seen.has(value)) {
    // <lang><zh-CN>拒绝循环，避免递归失控或隐式引用语义。</zh-CN><en>Reject a cycle to prevent unbounded recursion or implicit reference semantics.</en></lang>
    throw new TypeError('Canonical data must not contain repeated object references.');
  }

  // <lang><zh-CN>将当前对象加入本次复制遍历，供循环/共享引用检测使用。</zh-CN><en>Add the current object to this copy traversal for cycle/shared-reference detection.</en></lang>
  seen.add(value);

  // <lang><zh-CN>数组按索引递归复制，保留 canonical sequence 顺序。</zh-CN><en>Copy arrays recursively by index, preserving canonical sequence order.</en></lang>
  if (Array.isArray(value)) {
    // <lang><zh-CN>每个元素都使用同一 traversal seen 集，拒绝循环与共享嵌套引用。</zh-CN><en>Use the same traversal seen set for every element, rejecting cycles and shared nested references.</en></lang>
    const copiedArray = value.map((item) => clonePlainData(item, seen));

    // <lang><zh-CN>返回新的数组引用。</zh-CN><en>Return the new array reference.</en></lang>
    return copiedArray;
  }

  // <lang><zh-CN>非数组对象必须为 plain object，防止 class/Date/Map 行为进入 cache。</zh-CN><en>A non-array object must be plain, preventing class/Date/Map behavior from entering the cache.</en></lang>
  if (!isPlainObject(value)) {
    // <lang><zh-CN>拒绝非 plain instance；错误内容不含 constructor 或输入字段。</zh-CN><en>Reject a non-plain instance without including its constructor or input field.</en></lang>
    throw new TypeError('Canonical data must use plain objects.');
  }

  // <lang><zh-CN>创建无继承行为的普通输出容器。</zh-CN><en>Create an ordinary output container with no inherited behavior of the input.</en></lang>
  const copiedObject = {};

  // <lang><zh-CN>只复制自有可枚举字段，保持 canonical plain-object 语义。</zh-CN><en>Copy only own enumerable fields, preserving canonical plain-object semantics.</en></lang>
  for (const [key, nestedValue] of Object.entries(value)) {
    // <lang><zh-CN>逐字段递归复制，阻断所有嵌套可变引用共享。</zh-CN><en>Copy each field recursively, blocking all nested mutable-reference sharing.</en></lang>
    copiedObject[key] = clonePlainData(nestedValue, seen);
  }

  // <lang><zh-CN>返回与输入完全隔离的 plain object。</zh-CN><en>Return a plain object fully isolated from the input.</en></lang>
  return copiedObject;
}

/**
 * <lang><zh-CN>判断值是否是当前 runtime 可返回或缓存的 canonical outcome。</zh-CN><en>Determines whether a value is a canonical outcome that the current runtime may return or cache.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>converter 或 validator 产生的候选值。</zh-CN><en>Candidate produced by a converter or validator.</en></lang>
 * @param {string} contractVersion <lang><zh-CN>declaration 声明的 port contract version。</zh-CN><en>Port-contract version declared by the declaration.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否具备当前最小 canonical outcome shape。</zh-CN><en>Whether the value has the current minimum canonical-outcome shape.</en></lang>
 * @lang zh-CN 深层领域字段由 module/fixture converter 负责；generic runtime 只保证 version 与 outcome kind 不越界。
 * @lang en Deep domain fields remain the module/fixture converter's responsibility; the generic runtime only guards version and outcome kind.
 */
function isCanonicalOutcome(value, contractVersion) {
  // <lang><zh-CN>首层必须是 plain object，且 contract version 与 selected port 完全一致。</zh-CN><en>The top level must be a plain object whose contract version exactly matches the selected port.</en></lang>
  if (!isPlainObject(value) || value.contractVersion !== contractVersion) {
    // <lang><zh-CN>版本或容器不匹配时拒绝。</zh-CN><en>Reject when the version or container does not match.</en></lang>
    return false;
  }

  // <lang><zh-CN>首轮 read adapter 只允许 page、detail 或 failure outcome。</zh-CN><en>The initial read adapter permits only page, detail, or failure outcomes.</en></lang>
  return value.kind === 'page' || value.kind === 'detail' || value.kind === 'failure';
}

/**
 * <lang><zh-CN>校验 backend-agnostic adapter declaration。</zh-CN><en>Validates a backend-agnostic adapter declaration.</en></lang>
 *
 * @param {unknown} declaration <lang><zh-CN>调用方提供的内存声明。</zh-CN><en>Caller-provided in-memory declaration.</en></lang>
 * @returns {object} <lang><zh-CN>`{ ok, diagnostics }` 结构化结果。</zh-CN><en>A structured `{ ok, diagnostics }` result.</en></lang>
 * @lang zh-CN 校验不读取文件、manifest registry 或 environment，且诊断不回显输入字段值。
 * @lang en Validation reads no file, manifest registry, or environment, and diagnostics do not echo input field values.
 */
export function validateAdapterDeclaration(declaration) {
  // <lang><zh-CN>按出现顺序收集稳定诊断，允许调用方一次修复多个独立声明问题。</zh-CN><en>Collect stable diagnostics in encounter order so callers can correct several independent declaration issues at once.</en></lang>
  const diagnostics = [];

  // <lang><zh-CN>非 plain declaration 无法安全读取字段，只返回单一 shape 诊断。</zh-CN><en>A non-plain declaration cannot be inspected safely, so return one shape diagnostic.</en></lang>
  if (!isPlainObject(declaration)) {
    // <lang><zh-CN>不把原始 declaration 或其类型写入诊断。</zh-CN><en>Do not put the raw declaration or its type into the diagnostic.</en></lang>
    diagnostics.push(createDiagnostic('adapter.declaration.invalid', 'Adapter 声明必须是普通对象。', 'The adapter declaration must be a plain object.'));

    // <lang><zh-CN>shape 不成立时立即返回，避免后续字段读取。</zh-CN><en>Return immediately when shape is invalid, avoiding later field reads.</en></lang>
    return { ok: false, diagnostics };
  }

  // <lang><zh-CN>adapter runtime contract version 必须精确匹配当前实现。</zh-CN><en>The adapter-runtime contract version must exactly match the current implementation.</en></lang>
  if (declaration.adapterContractVersion !== ADAPTER_CONTRACT_VERSION) {
    // <lang><zh-CN>版本诊断不回显未知值。</zh-CN><en>The version diagnostic does not echo an unknown value.</en></lang>
    diagnostics.push(createDiagnostic('adapter.contract-version.unsupported', 'Adapter 声明版本不受当前 runtime 支持。', 'The adapter declaration version is not supported by this runtime.'));
  }

  // <lang><zh-CN>adapterId、port 与 owner 都必须是非空稳定标识。</zh-CN><en>Adapter ID, port, and owner must all be non-empty stable identifiers.</en></lang>
  for (const [fieldName, code] of [
    ['adapterId', 'adapter.id.invalid'],
    ['port', 'adapter.port.invalid'],
    ['owner', 'adapter.owner.invalid']
  ]) {
    // <lang><zh-CN>只按字段类型/空白判断，不把 identifier 内容加入错误。</zh-CN><en>Judge only field type/blankness and never include identifier content in an error.</en></lang>
    if (typeof declaration[fieldName] !== 'string' || declaration[fieldName].trim().length === 0) {
      // <lang><zh-CN>不同 code 让调用方精确定位缺失主责字段。</zh-CN><en>Distinct codes let callers locate a missing ownership field precisely.</en></lang>
      diagnostics.push(createDiagnostic(code, 'Adapter 声明缺少必需的稳定标识。', 'The adapter declaration is missing a required stable identifier.'));
    }
  }

  // <lang><zh-CN>contract 必须显式声明非空 ID 与 version。</zh-CN><en>The contract must explicitly declare a non-empty ID and version.</en></lang>
  const hasValidContract = isPlainObject(declaration.contract)
    && typeof declaration.contract.id === 'string'
    && declaration.contract.id.trim().length > 0
    && typeof declaration.contract.version === 'string'
    && declaration.contract.version.trim().length > 0;

  // <lang><zh-CN>无效 contract reference 不能由 runtime 推断。</zh-CN><en>The runtime cannot infer an invalid contract reference.</en></lang>
  if (!hasValidContract) {
    // <lang><zh-CN>只报告 contract reference 缺失，不报告部分字段内容。</zh-CN><en>Report only the missing contract reference, not partial field content.</en></lang>
    diagnostics.push(createDiagnostic('adapter.contract.invalid', 'Adapter 必须声明有效的 port contract ID 与版本。', 'The adapter must declare a valid port-contract ID and version.'));
  }

  // <lang><zh-CN>首轮 runtime 只接受调用方注入的本地 fixture exchange。</zh-CN><en>The initial runtime accepts only a caller-injected local-fixture exchange.</en></lang>
  if (declaration.transport !== 'injected-fixture') {
    // <lang><zh-CN>HTTP、Directus 或未知 transport 需要独立实现和复审。</zh-CN><en>HTTP, Directus, or an unknown transport requires separate implementation and review.</en></lang>
    diagnostics.push(createDiagnostic('adapter.transport.unsupported', '当前 runtime 只支持 injected-fixture transport。', 'The current runtime supports only the injected-fixture transport.'));
  }

  // <lang><zh-CN>pagination declaration 必须使用已知 mode 并明确 pageJump；非分页 read port 可声明空 mode 数组。</zh-CN><en>The pagination declaration must use known modes and state pageJump explicitly; a non-paginated read port may declare an empty mode array.</en></lang>
  const knownPaginationModes = new Set(['page', 'cursor', 'offset']);

  // <lang><zh-CN>先判断 pagination 容器、数组与布尔字段的最小 shape。</zh-CN><en>First inspect the minimum shape of pagination container, modes array, and Boolean field.</en></lang>
  const hasPaginationShape = isPlainObject(declaration.pagination)
    && Array.isArray(declaration.pagination.modes)
    && typeof declaration.pagination.pageJump === 'boolean';

  // <lang><zh-CN>shape 无效时只报告一个 pagination 诊断。</zh-CN><en>Report one pagination diagnostic when shape is invalid.</en></lang>
  if (!hasPaginationShape) {
    // <lang><zh-CN>runtime 不猜测默认 mode 或 pageJump。</zh-CN><en>The runtime guesses neither a default mode nor pageJump.</en></lang>
    diagnostics.push(createDiagnostic('adapter.pagination.invalid', 'Adapter 必须声明 pagination modes 数组与 pageJump。', 'The adapter must declare a pagination-modes array and pageJump.'));
  } else {
    // <lang><zh-CN>检查每个 mode 是否稳定、已知且不重复。</zh-CN><en>Check every mode is stable, known, and unique.</en></lang>
    const uniqueModes = new Set(declaration.pagination.modes);

    // <lang><zh-CN>未知、非字符串或重复 mode 都使 capability 声明含糊。</zh-CN><en>An unknown, non-string, or duplicate mode makes the capability declaration ambiguous.</en></lang>
    const modesAreValid = uniqueModes.size === declaration.pagination.modes.length
      && declaration.pagination.modes.every((mode) => typeof mode === 'string' && knownPaginationModes.has(mode));

    // <lang><zh-CN>无效 mode 不被当作未来兼容值保留。</zh-CN><en>An invalid mode is not retained as a future-compatible value.</en></lang>
    if (!modesAreValid) {
      // <lang><zh-CN>诊断不回显未知 mode。</zh-CN><en>The diagnostic does not echo an unknown mode.</en></lang>
      diagnostics.push(createDiagnostic('adapter.pagination.mode.unsupported', 'Adapter pagination modes 含有未知或重复值。', 'Adapter pagination modes contain an unknown or duplicate value.'));
    }

    // <lang><zh-CN>pageJump 只有在明确提供 page mode 时才成立。</zh-CN><en>Page jump is valid only when page mode is explicitly provided.</en></lang>
    if (declaration.pagination.pageJump && !uniqueModes.has('page')) {
      // <lang><zh-CN>拒绝由 cursor/offset 虚构 page jump。</zh-CN><en>Reject page jump fabricated from cursor/offset.</en></lang>
      diagnostics.push(createDiagnostic('adapter.pagination.page-jump.invalid', 'pageJump 需要显式 page mode。', 'pageJump requires an explicit page mode.'));
    }
  }

  // <lang><zh-CN>cache 必须显式选择 none 或 memory，不存在隐式全局默认。</zh-CN><en>Cache must explicitly select none or memory; there is no implicit global default.</en></lang>
  if (!isPlainObject(declaration.cache) || (declaration.cache.mode !== 'none' && declaration.cache.mode !== 'memory')) {
    // <lang><zh-CN>未知 cache mode 直接拒绝。</zh-CN><en>Reject an unknown cache mode directly.</en></lang>
    diagnostics.push(createDiagnostic('adapter.cache.mode.unsupported', 'Adapter cache mode 必须是 none 或 memory。', 'Adapter cache mode must be none or memory.'));
  } else if (declaration.cache.mode === 'memory') {
    // <lang><zh-CN>memory cache TTL 必须是 1 到五分钟上限内的整数。</zh-CN><en>A memory-cache TTL must be an integer from 1 through the five-minute limit.</en></lang>
    const hasValidTtl = Number.isInteger(declaration.cache.ttlMs)
      && declaration.cache.ttlMs > 0
      && declaration.cache.ttlMs <= MAX_MEMORY_CACHE_TTL_MS;

    // <lang><zh-CN>无界、零、负数、非整数或过长 TTL 全部拒绝。</zh-CN><en>Reject unbounded, zero, negative, non-integer, or excessive TTL values.</en></lang>
    if (!hasValidTtl) {
      // <lang><zh-CN>诊断不回显具体 TTL。</zh-CN><en>The diagnostic does not echo the concrete TTL.</en></lang>
      diagnostics.push(createDiagnostic('adapter.cache.ttl.invalid', 'Memory cache TTL 必须是受限的正整数。', 'The memory-cache TTL must be a bounded positive integer.'));
    }
  }

  // <lang><zh-CN>首轮 credential policy 只允许 none；真实 reference 需独立 identity/transport contract。</zh-CN><en>The initial credential policy allows none only; a real reference requires a separate identity/transport contract.</en></lang>
  if (!isPlainObject(declaration.credential) || declaration.credential.mode !== 'none') {
    // <lang><zh-CN>拒绝未知 credential mode，且不读取任何 credential 值。</zh-CN><en>Reject an unknown credential mode without reading any credential value.</en></lang>
    diagnostics.push(createDiagnostic('adapter.credential.unsupported', '当前 adapter runtime 只允许 credential mode none。', 'The current adapter runtime permits only credential mode none.'));
  }

  // <lang><zh-CN>是否成功完全由诊断列表是否为空决定。</zh-CN><en>Success is determined solely by whether the diagnostic list is empty.</en></lang>
  return {
    ok: diagnostics.length === 0,
    diagnostics
  };
}

/**
 * <lang><zh-CN>创建一个同步、纯内存的 read-port adapter provider。</zh-CN><en>Creates a synchronous, in-memory read-port adapter provider.</en></lang>
 *
 * @param {object} input <lang><zh-CN>声明、validation、wire mapping、exchange、conversion、cache-key 与时钟函数。</zh-CN><en>Declaration, validation, wire mapping, exchange, conversion, cache-key, and clock functions.</en></lang>
 * @returns {object} <lang><zh-CN>失败时 `{ ok:false, diagnostics }`，成功时额外包含 `provider` 与 `controller`。</zh-CN><en>`{ ok:false, diagnostics }` on failure; on success also includes `provider` and `controller`.</en></lang>
 * @lang zh-CN runtime 不负责异步 transport、retry、credential injection 或 persistence；exchange 由已审阅 fixture 显式注入。
 * @lang en The runtime does not own asynchronous transport, retry, credential injection, or persistence; a reviewed fixture injects exchange explicitly.
 */
export function createReadAdapter(input) {
  // <lang><zh-CN>非 plain initialization 统一按声明无效处理，不尝试读取函数。</zh-CN><en>Treat a non-plain initialization as invalid without attempting to read functions.</en></lang>
  if (!isPlainObject(input)) {
    // <lang><zh-CN>使用公开安全诊断，不回显 input。</zh-CN><en>Use a public-safe diagnostic without echoing input.</en></lang>
    return {
      ok: false,
      diagnostics: [createDiagnostic('adapter.initialization.invalid', 'Adapter 初始化输入必须是普通对象。', 'Adapter initialization input must be a plain object.')]
    };
  }

  // <lang><zh-CN>先校验 declaration，再检查 runtime 函数 surface。</zh-CN><en>Validate the declaration before inspecting the runtime-function surface.</en></lang>
  const declarationValidation = validateAdapterDeclaration(input.declaration);

  // <lang><zh-CN>复制 declaration diagnostics，使后续函数诊断在同一结果中返回。</zh-CN><en>Copy declaration diagnostics so later function diagnostics return in the same result.</en></lang>
  const diagnostics = [...declarationValidation.diagnostics];

  // <lang><zh-CN>四个生命周期函数在所有 cache mode 下都必需。</zh-CN><en>Four lifecycle functions are required under every cache mode.</en></lang>
  const requiredFunctionFields = ['validateRequest', 'createWireRequest', 'exchange', 'convertWireOutcome'];

  // <lang><zh-CN>逐字段检查函数存在性，不执行任何回调。</zh-CN><en>Check function presence field by field without executing a callback.</en></lang>
  for (const fieldName of requiredFunctionFields) {
    // <lang><zh-CN>非函数字段不能进入 provider lifecycle。</zh-CN><en>A non-function field cannot enter the provider lifecycle.</en></lang>
    if (typeof input[fieldName] !== 'function') {
      // <lang><zh-CN>错误 code 保持统一，message 不回显字段值。</zh-CN><en>The error code remains uniform and the message does not echo a field value.</en></lang>
      diagnostics.push(createDiagnostic('adapter.lifecycle.function.missing', 'Adapter 缺少必需的 lifecycle function。', 'The adapter is missing a required lifecycle function.'));
    }
  }

  // <lang><zh-CN>只有合法 memory declaration 才要求 cache-key function。</zh-CN><en>Only a valid memory declaration requires a cache-key function.</en></lang>
  const usesMemoryCache = isPlainObject(input.declaration)
    && isPlainObject(input.declaration.cache)
    && input.declaration.cache.mode === 'memory';

  // <lang><zh-CN>memory cache key 必须由 adapter 显式提供，runtime 不从任意对象隐式序列化。</zh-CN><en>The adapter must explicitly provide a memory-cache key; the runtime does not implicitly serialize arbitrary objects.</en></lang>
  if (usesMemoryCache && typeof input.createCacheKey !== 'function') {
    // <lang><zh-CN>缺失 key function 阻止 cache 初始化。</zh-CN><en>A missing key function prevents cache initialization.</en></lang>
    diagnostics.push(createDiagnostic('adapter.cache-key.function.missing', 'Memory cache 需要显式 cache-key function。', 'Memory cache requires an explicit cache-key function.'));
  }

  // <lang><zh-CN>可选时钟必须是函数；缺省使用进程当前时间。</zh-CN><en>An optional clock must be a function; by default the process current time is used.</en></lang>
  if (input.now !== undefined && typeof input.now !== 'function') {
    // <lang><zh-CN>错误时钟不能在 runtime 内隐式纠正。</zh-CN><en>An invalid clock cannot be corrected implicitly inside the runtime.</en></lang>
    diagnostics.push(createDiagnostic('adapter.clock.invalid', 'Adapter clock 必须是函数。', 'The adapter clock must be a function.'));
  }

  // <lang><zh-CN>存在任何 declaration/lifecycle 诊断时，不创建 provider 或 controller。</zh-CN><en>Create neither provider nor controller when any declaration/lifecycle diagnostic exists.</en></lang>
  if (diagnostics.length > 0) {
    // <lang><zh-CN>返回结构化失败，便于调用方在组合前处理。</zh-CN><en>Return structured failure so callers can handle it before composition.</en></lang>
    return { ok: false, diagnostics };
  }

  // <lang><zh-CN>复制 runtime 实际使用的 declaration 字段，防止调用方在初始化后改变 contract 或 TTL。</zh-CN><en>Copy declaration fields actually used by the runtime so callers cannot change the contract or TTL after initialization.</en></lang>
  const declaration = {
    contract: {
      id: input.declaration.contract.id,
      version: input.declaration.contract.version
    },
    cache: input.declaration.cache.mode === 'memory'
      ? {
          mode: 'memory',
          ttlMs: input.declaration.cache.ttlMs
        }
      : {
          mode: 'none'
        }
  };

  // <lang><zh-CN>此分支已确保 contract shape 合法，从隔离 snapshot 读取固定版本。</zh-CN><en>This branch has established a valid contract shape, so read the fixed version from the isolated snapshot.</en></lang>
  const contractVersion = declaration.contract.version;

  // <lang><zh-CN>复制 lifecycle function references，防止调用方在初始化后替换 callback 行为。</zh-CN><en>Copy lifecycle-function references so callers cannot replace callback behavior after initialization.</en></lang>
  const validateRequest = input.validateRequest;
  const createWireRequest = input.createWireRequest;
  const exchange = input.exchange;
  const convertWireOutcome = input.convertWireOutcome;

  // <lang><zh-CN>memory mode 固定其 cache-key function；none mode 使用 null 且不会调用。</zh-CN><en>Memory mode fixes its cache-key function; none mode uses null and never invokes it.</en></lang>
  const createCacheKey = usesMemoryCache ? input.createCacheKey : null;

  // <lang><zh-CN>memory cache 仅存在当前 adapter instance 内，不使用全局容器。</zh-CN><en>The memory cache exists only inside this adapter instance and uses no global container.</en></lang>
  const cacheEntries = new Map();

  // <lang><zh-CN>显式时钟便于确定性测试；否则读取单调性不保证的 wall clock 仅用于短 TTL。</zh-CN><en>An explicit clock supports deterministic tests; otherwise wall-clock time is read only for a short TTL and is not assumed monotonic.</en></lang>
  const readCurrentTime = input.now ?? (() => Date.now());

  // <lang><zh-CN>observation 只保存有限计数，绝不保存 request、wire、canonical value 或异常。</zh-CN><en>The observation stores only bounded counts and never a request, wire value, canonical value, or exception.</en></lang>
  const observation = {
    exchanges: 0,
    cacheHits: 0,
    cacheMisses: 0,
    failures: {
      validation: 0,
      exchange: 0,
      conversion: 0
    }
  };

  /**
   * <lang><zh-CN>调用已声明 read port，并在每个 boundary 对内部失败脱敏。</zh-CN><en>Invokes the declared read port and redacts internal failures at every boundary.</en></lang>
   *
   * @param {unknown} request <lang><zh-CN>module-owned canonical request。</zh-CN><en>Module-owned canonical request.</en></lang>
   * @returns {object} <lang><zh-CN>canonical page/detail/failure。</zh-CN><en>A canonical page/detail/failure.</en></lang>
   * @lang zh-CN request validation 在 exchange 前运行；cache 只保存 converter 产生的非 failure canonical outcome。
   * @lang en Request validation runs before exchange; cache stores only a non-failure canonical outcome produced by the converter.
   */
  const invoke = (request) => {
    // <lang><zh-CN>validator 由 module-specific adapter fixture 提供；任何内部异常都作为 conversion/config failure 脱敏。</zh-CN><en>The module-specific adapter fixture supplies the validator; any internal exception is redacted as a conversion/configuration failure.</en></lang>
    let validationOutcome;

    // <lang><zh-CN>隔离执行 validator，防止异常越过 port。</zh-CN><en>Execute the validator in isolation so an exception cannot cross the port.</en></lang>
    try {
      // <lang><zh-CN>null 表示可继续；canonical failure 表示 module 已拒绝请求。</zh-CN><en>Null means continue; a canonical failure means the module has rejected the request.</en></lang>
      validationOutcome = validateRequest(request);
    } catch {
      // <lang><zh-CN>validator 自身异常属于 adapter implementation 问题，不伪装成用户请求错误。</zh-CN><en>A validator exception is an adapter-implementation problem, not a user-request error.</en></lang>
      observation.failures.conversion += 1;

      // <lang><zh-CN>返回固定 adapter failure，不包含异常。</zh-CN><en>Return the fixed adapter failure without the exception.</en></lang>
      return createAdapterUnavailableFailure(contractVersion);
    }

    // <lang><zh-CN>非 null validation outcome 必须是同版本 canonical failure。</zh-CN><en>A non-null validation outcome must be a same-version canonical failure.</en></lang>
    if (validationOutcome !== null) {
      // <lang><zh-CN>记录 validation short-circuit 次数，不记录 request 或 failure 内容。</zh-CN><en>Count validation short-circuits without recording request or failure content.</en></lang>
      observation.failures.validation += 1;

      // <lang><zh-CN>无效 validator outcome 被视为 adapter implementation failure。</zh-CN><en>An invalid validator outcome is treated as an adapter-implementation failure.</en></lang>
      if (!isCanonicalOutcome(validationOutcome, contractVersion) || validationOutcome.kind !== 'failure') {
        // <lang><zh-CN>将分类从 validation 改为 conversion，避免宣称 module 产生了合法拒绝。</zh-CN><en>Move classification from validation to conversion to avoid claiming the module produced a valid rejection.</en></lang>
        observation.failures.validation -= 1;
        observation.failures.conversion += 1;

        // <lang><zh-CN>返回脱敏 adapter failure。</zh-CN><en>Return a redacted adapter failure.</en></lang>
        return createAdapterUnavailableFailure(contractVersion);
      }

      // <lang><zh-CN>返回 module failure 的隔离副本；它永不进入 cache。</zh-CN><en>Return an isolated copy of the module failure; it never enters the cache.</en></lang>
      return clonePlainData(validationOutcome);
    }

    // <lang><zh-CN>cache key 只在 request 已通过 module validation 后计算。</zh-CN><en>Compute a cache key only after the request passes module validation.</en></lang>
    let cacheKey;

    // <lang><zh-CN>memory mode 才进入 cache lookup；none mode 完全跳过。</zh-CN><en>Only memory mode enters cache lookup; none mode skips it completely.</en></lang>
    if (usesMemoryCache) {
      // <lang><zh-CN>cache-key function 的异常或非空字符串失败均不允许降级为无缓存 exchange。</zh-CN><en>A cache-key exception or non-string/blank result may not silently degrade to an uncached exchange.</en></lang>
      try {
        // <lang><zh-CN>key function 只接收已验证 canonical request。</zh-CN><en>The key function receives only the validated canonical request.</en></lang>
        cacheKey = createCacheKey(request);
      } catch {
        // <lang><zh-CN>配置错误归类为 conversion failure，且不触碰 exchange。</zh-CN><en>Classify the configuration error as conversion failure without touching exchange.</en></lang>
        observation.failures.conversion += 1;

        // <lang><zh-CN>返回固定 adapter failure。</zh-CN><en>Return the fixed adapter failure.</en></lang>
        return createAdapterUnavailableFailure(contractVersion);
      }

      // <lang><zh-CN>空或非字符串 key 无法形成明确 adapter-owned cache scope。</zh-CN><en>A blank or non-string key cannot form an explicit adapter-owned cache scope.</en></lang>
      if (typeof cacheKey !== 'string' || cacheKey.length === 0) {
        // <lang><zh-CN>拒绝隐式 JSON serialization 或 object identity key。</zh-CN><en>Reject implicit JSON serialization or object-identity keys.</en></lang>
        observation.failures.conversion += 1;

        // <lang><zh-CN>返回脱敏失败。</zh-CN><en>Return a redacted failure.</en></lang>
        return createAdapterUnavailableFailure(contractVersion);
      }

      // <lang><zh-CN>读取当前时间用于 TTL 判断；时钟异常也不触碰 exchange。</zh-CN><en>Read current time for TTL evaluation; a clock exception also does not touch exchange.</en></lang>
      let currentTime;

      // <lang><zh-CN>隔离时钟调用。</zh-CN><en>Invoke the clock in isolation.</en></lang>
      try {
        // <lang><zh-CN>时钟必须产生有限 number 毫秒值。</zh-CN><en>The clock must produce a finite numeric millisecond value.</en></lang>
        currentTime = readCurrentTime();
      } catch {
        // <lang><zh-CN>时钟错误按 adapter implementation failure 处理。</zh-CN><en>Treat a clock error as an adapter-implementation failure.</en></lang>
        observation.failures.conversion += 1;

        // <lang><zh-CN>返回固定失败。</zh-CN><en>Return the fixed failure.</en></lang>
        return createAdapterUnavailableFailure(contractVersion);
      }

      // <lang><zh-CN>NaN/Infinity 无法用于受限 TTL。</zh-CN><en>NaN/Infinity cannot support a bounded TTL.</en></lang>
      if (typeof currentTime !== 'number' || !Number.isFinite(currentTime)) {
        // <lang><zh-CN>无效时钟值不被隐式替换。</zh-CN><en>An invalid clock value is not replaced implicitly.</en></lang>
        observation.failures.conversion += 1;

        // <lang><zh-CN>返回脱敏失败。</zh-CN><en>Return a redacted failure.</en></lang>
        return createAdapterUnavailableFailure(contractVersion);
      }

      // <lang><zh-CN>按 adapter-owned key 查找当前 instance 内条目。</zh-CN><en>Look up an entry in this instance by the adapter-owned key.</en></lang>
      const cachedEntry = cacheEntries.get(cacheKey);

      // <lang><zh-CN>未过期条目命中；过期或缺失条目进入 exchange。</zh-CN><en>An unexpired entry hits; an expired or missing entry proceeds to exchange.</en></lang>
      if (cachedEntry !== undefined && cachedEntry.expiresAt > currentTime) {
        // <lang><zh-CN>命中计数不包含 key/value。</zh-CN><en>The hit count contains neither key nor value.</en></lang>
        observation.cacheHits += 1;

        // <lang><zh-CN>返回新副本，防止调用方修改 cache value。</zh-CN><en>Return a new copy so the caller cannot mutate the cache value.</en></lang>
        return clonePlainData(cachedEntry.value);
      }

      // <lang><zh-CN>过期条目先删除，确保 observation 的 entry count 反映有效/最新容器。</zh-CN><en>Delete an expired entry first so observation entry count reflects the current container.</en></lang>
      if (cachedEntry !== undefined) {
        // <lang><zh-CN>删除只针对当前 adapter key。</zh-CN><en>Delete only the current adapter key.</en></lang>
        cacheEntries.delete(cacheKey);
      }

      // <lang><zh-CN>仅 accepted request 的实际未命中才计数。</zh-CN><en>Count only a real miss for an accepted request.</en></lang>
      observation.cacheMisses += 1;
    }

    // <lang><zh-CN>wire request mapping、exchange 与 conversion 都在同一隔离区运行。</zh-CN><en>Run wire-request mapping, exchange, and conversion in the same isolation region.</en></lang>
    let canonicalOutcome;

    // <lang><zh-CN>阶段标记只保留稳定类别，供 catch 区分 mapping、exchange 与 conversion；不保存任何值。</zh-CN><en>The stage marker retains only a stable category so catch can distinguish mapping, exchange, and conversion; it stores no value.</en></lang>
    let wireStage = 'mapping';

    // <lang><zh-CN>exchange 分类需区分 transport invocation 与 conversion。</zh-CN><en>Exchange classification distinguishes transport invocation from conversion.</en></lang>
    try {
      // <lang><zh-CN>adapter-specific mapper 构造只在 exchange 内可见的 wire request。</zh-CN><en>The adapter-specific mapper constructs a wire request visible only inside exchange.</en></lang>
      const wireRequest = createWireRequest(request);

      // <lang><zh-CN>mapping 完成后才进入 exchange 阶段。</zh-CN><en>Enter the exchange stage only after mapping completes.</en></lang>
      wireStage = 'exchange';

      // <lang><zh-CN>计数在调用前增加，使抛出异常的 exchange 也可被观察。</zh-CN><en>Increment before invocation so a throwing exchange remains observable.</en></lang>
      observation.exchanges += 1;

      // <lang><zh-CN>injected exchange 返回 adapter-private wire outcome。</zh-CN><en>The injected exchange returns an adapter-private wire outcome.</en></lang>
      const wireOutcome = exchange(wireRequest);

      // <lang><zh-CN>exchange 成功返回后才进入 conversion 阶段。</zh-CN><en>Enter the conversion stage only after exchange returns successfully.</en></lang>
      wireStage = 'conversion';

      // <lang><zh-CN>converter 在 wire 值跨 port 前完成 module-specific mapping。</zh-CN><en>The converter completes module-specific mapping before a wire value can cross the port.</en></lang>
      canonicalOutcome = convertWireOutcome(wireOutcome, request);
    } catch {
      // <lang><zh-CN>只有 exchange 调用自身抛出时归类为 exchange failure。</zh-CN><en>Classify only an exception thrown by the exchange invocation itself as exchange failure.</en></lang>
      if (wireStage === 'exchange') {
        // <lang><zh-CN>exchange failure 只增加计数，不保存异常。</zh-CN><en>An exchange failure increments only a count and stores no exception.</en></lang>
        observation.failures.exchange += 1;
      } else {
        // <lang><zh-CN>mapper 或 converter 异常归为 conversion/configuration failure。</zh-CN><en>A mapper or converter exception is classified as conversion/configuration failure.</en></lang>
        observation.failures.conversion += 1;
      }

      // <lang><zh-CN>任何原始异常都不跨 port。</zh-CN><en>No raw exception crosses the port.</en></lang>
      return createAdapterUnavailableFailure(contractVersion);
    }

    // <lang><zh-CN>converter 返回值必须符合最小 canonical outcome shape。</zh-CN><en>The converter return value must conform to the minimum canonical-outcome shape.</en></lang>
    if (!isCanonicalOutcome(canonicalOutcome, contractVersion)) {
      // <lang><zh-CN>malformed conversion 归类且不回显 wire/canonical candidate。</zh-CN><en>Classify malformed conversion without echoing the wire/canonical candidate.</en></lang>
      observation.failures.conversion += 1;

      // <lang><zh-CN>返回固定 adapter failure。</zh-CN><en>Return the fixed adapter failure.</en></lang>
      return createAdapterUnavailableFailure(contractVersion);
    }

    // <lang><zh-CN>先复制 converter 结果，验证 plain-data/cycle 边界。</zh-CN><en>Copy the converter result first, validating plain-data/cycle boundaries.</en></lang>
    let isolatedOutcome;

    // <lang><zh-CN>复制异常也属于 conversion failure，且不得泄漏源对象。</zh-CN><en>A copy exception is also a conversion failure and must not leak the source object.</en></lang>
    try {
      // <lang><zh-CN>得到可安全返回/缓存的隔离副本。</zh-CN><en>Obtain an isolated copy safe for return/cache.</en></lang>
      isolatedOutcome = clonePlainData(canonicalOutcome);
    } catch {
      // <lang><zh-CN>拒绝非 plain/cyclic outcome。</zh-CN><en>Reject a non-plain/cyclic outcome.</en></lang>
      observation.failures.conversion += 1;

      // <lang><zh-CN>返回固定失败。</zh-CN><en>Return the fixed failure.</en></lang>
      return createAdapterUnavailableFailure(contractVersion);
    }

    // <lang><zh-CN>只有 memory mode 的非 failure canonical outcome 才可进入 cache。</zh-CN><en>Only a non-failure canonical outcome in memory mode may enter the cache.</en></lang>
    if (usesMemoryCache && isolatedOutcome.kind !== 'failure') {
      // <lang><zh-CN>重新读取当前时间，令 TTL 从成功 conversion 时刻开始；时钟在两次读取间仍可能失败或变为无效值。</zh-CN><en>Read current time again so TTL starts at successful conversion; the clock may still fail or become invalid between reads.</en></lang>
      let storedAt;

      // <lang><zh-CN>隔离第二次时钟读取，保持 port 永不抛出 clock exception。</zh-CN><en>Isolate the second clock read so the port never throws a clock exception.</en></lang>
      try {
        // <lang><zh-CN>读取成功 conversion 的存储时刻。</zh-CN><en>Read the storage time of the successful conversion.</en></lang>
        storedAt = readCurrentTime();
      } catch {
        // <lang><zh-CN>时钟失败使本次成功无法安全缓存，统一改为 adapter failure 而不返回未缓存的成功。</zh-CN><en>A clock failure makes this success unsafe to cache, so convert it uniformly to adapter failure instead of returning an uncached success.</en></lang>
        observation.failures.conversion += 1;

        // <lang><zh-CN>返回脱敏失败。</zh-CN><en>Return a redacted failure.</en></lang>
        return createAdapterUnavailableFailure(contractVersion);
      }

      // <lang><zh-CN>第二次时钟值也必须有限。</zh-CN><en>The second clock value must also be finite.</en></lang>
      if (typeof storedAt !== 'number' || !Number.isFinite(storedAt)) {
        // <lang><zh-CN>拒绝用无效时间写 cache。</zh-CN><en>Reject writing the cache with an invalid time.</en></lang>
        observation.failures.conversion += 1;

        // <lang><zh-CN>返回固定 failure。</zh-CN><en>Return the fixed failure.</en></lang>
        return createAdapterUnavailableFailure(contractVersion);
      }

      // <lang><zh-CN>写入当前 instance 的成功 canonical 副本和受限过期时间。</zh-CN><en>Write a successful canonical copy and bounded expiration time to the current instance.</en></lang>
      cacheEntries.set(cacheKey, {
        expiresAt: storedAt + declaration.cache.ttlMs,
        value: clonePlainData(isolatedOutcome)
      });
    }

    // <lang><zh-CN>failure 不缓存但仍作为 canonical outcome 返回；成功返回同样是隔离副本。</zh-CN><en>A failure is not cached but still returned as a canonical outcome; a success is likewise an isolated copy.</en></lang>
    return isolatedOutcome;
  };

  /**
   * <lang><zh-CN>返回不含请求、wire、cache value 或异常的受限 observation。</zh-CN><en>Returns a bounded observation containing no request, wire value, cache value, or exception.</en></lang>
   *
   * @returns {object} <lang><zh-CN>当前 adapter instance 的计数副本。</zh-CN><en>A count-only copy for the current adapter instance.</en></lang>
   * @lang zh-CN observation 仅供测试/开发诊断，不属于业务 port result。
   * @lang en The observation is for test/development diagnostics only and is not a business-port result.
   */
  const getObservation = () => {
    // <lang><zh-CN>构造新对象，调用方无法修改内部计数。</zh-CN><en>Construct a new object so the caller cannot modify internal counts.</en></lang>
    return {
      exchanges: observation.exchanges,
      cacheHits: observation.cacheHits,
      cacheMisses: observation.cacheMisses,
      cacheEntries: cacheEntries.size,
      failures: {
        validation: observation.failures.validation,
        exchange: observation.failures.exchange,
        conversion: observation.failures.conversion
      }
    };
  };

  /**
   * <lang><zh-CN>清空当前 adapter instance 的内存 cache。</zh-CN><en>Clears the memory cache of the current adapter instance.</en></lang>
   *
   * @returns {void} <lang><zh-CN>无返回值。</zh-CN><en>No return value.</en></lang>
   * @lang zh-CN 清理不影响 observation 计数，也不触及任何 storage 或其他 adapter instance。
   * @lang en Clearing changes no observation count and touches neither storage nor another adapter instance.
   */
  const clearCache = () => {
    // <lang><zh-CN>Map 只属于当前闭包，清理是可恢复的局部状态操作。</zh-CN><en>The map belongs only to this closure, so clearing is a recoverable local-state operation.</en></lang>
    cacheEntries.clear();
  };

  // <lang><zh-CN>provider 只暴露 core 需要的 contract/invoke；controller 明确分离开发观察与 cache 管理。</zh-CN><en>The provider exposes only contract/invoke required by core; the controller explicitly separates development observation and cache management.</en></lang>
  return {
    ok: true,
    diagnostics: [],
    provider: {
      contract: {
        id: declaration.contract.id,
        version: declaration.contract.version
      },
      invoke
    },
    controller: {
      getObservation,
      clearCache
    }
  };
}
