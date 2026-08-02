/**
 * <lang><zh-CN>Biz async-provider runtime：校验显式注入的异步 provider/source policy，隔离 plain-data 调用，并把 timeout、取消、重试、降级与晚到结果投影为受限 terminal envelope。</zh-CN><en>Biz async-provider runtime: validates explicitly injected asynchronous provider/source policy, isolates plain-data invocations, and projects timeout, cancellation, retry, degradation, and late results into bounded terminal envelopes.</en></lang>
 * @lang zh-CN 本模块不打开网络、不读取环境/文件/storage、不处理身份或 credential、不发现 source/package，也不定义业务 DTO、HTTP 或生产 transaction。
 * @lang en This module opens no network, reads no environment/file/storage, handles no identity or credential, discovers no source/package, and defines no business DTO, HTTP, or production transaction.
 */

/**
 * <lang><zh-CN>async-provider contract 的固定版本。</zh-CN><en>Fixed version of the async-provider contract.</en></lang>
 * @lang zh-CN 该版本固定 declaration、source policy 与 terminal envelope shape，不代表 npm release semver。
 * @lang en This version fixes declaration, source-policy, and terminal-envelope shapes and is not npm release semver.
 */
export const ASYNC_PROVIDER_CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>source policy 的固定版本。</zh-CN><en>Fixed version of the source policy.</en></lang>
 * @lang zh-CN source policy 与 provider declaration 分离，避免把后端选择混入 package 或业务 manifest。
 * @lang en The source policy is separate from the provider declaration, preventing backend selection from entering a package or business manifest.
 */
export const ASYNC_SOURCE_POLICY_VERSION = '1.0';

/**
 * <lang><zh-CN>当前允许的异步 provider port 分类。</zh-CN><en>Currently permitted asynchronous provider-port kinds.</en></lang>
 * @lang zh-CN 分类决定退化、retry 与取消后不确定性规则；runtime 不猜测未知分类。
 * @lang en The kind determines degradation, retry, and post-cancellation uncertainty rules; the runtime never guesses an unknown kind.
 */
export const ASYNC_PROVIDER_KINDS = Object.freeze(['read', 'write']);

/**
 * <lang><zh-CN>当前允许的 source authority 分类。</zh-CN><en>Currently permitted source-authority kinds.</en></lang>
 * @lang zh-CN authority 是可展示的抽象来源分类，不是 URL、服务商、endpoint 或 credential reference。
 * @lang en An authority is a displayable abstract source category, not a URL, vendor, endpoint, or credential reference.
 */
export const ASYNC_SOURCE_AUTHORITIES = Object.freeze(['local', 'virtual', 'remote']);

/**
 * <lang><zh-CN>当前允许的 provider failure code。</zh-CN><en>Currently permitted provider failure codes.</en></lang>
 * @lang zh-CN 受限 code 防止 source 将内部异常、HTTP 状态或任意文本泄漏到 adapter/UI。
 * @lang en Bounded codes prevent a source from leaking internal exceptions, HTTP statuses, or arbitrary text to an adapter/UI.
 */
export const ASYNC_PROVIDER_FAILURE_CODES = Object.freeze(['offline', 'conflict', 'unavailable', 'unknown']);

/**
 * <lang><zh-CN>受限 source terminal outcome 的文档类型。</zh-CN><en>Documentation type for a bounded source terminal outcome.</en></lang>
 * @typedef {object} AsyncSourceOutcome
 * @property {'success'|'failure'|'cancelled'} kind <lang><zh-CN>终态类别。</zh-CN><en>Terminal category.</en></lang>
 * @property {unknown} [value] <lang><zh-CN>success 的已隔离 plain-data 值。</zh-CN><en>An isolated plain-data value for success.</en></lang>
 * @property {string} [code] <lang><zh-CN>failure 的受限失败代码。</zh-CN><en>A bounded failure code for failure.</en></lang>
 * @property {boolean} [retryable] <lang><zh-CN>failure 是否允许 read retry。</zh-CN><en>Whether a failure permits a read retry.</en></lang>
 * @property {'before-commit'} [phase] <lang><zh-CN>cancelled 的唯一可证实阶段。</zh-CN><en>The sole provable phase for cancelled.</en></lang>
 * @lang zh-CN 这只是 source 与 runtime 之间的内部受限类型，不能直接作为 Biz canonical outcome 或对外数据模型。
 * @lang en This is an internal bounded type between a source and runtime; it is not a Biz canonical outcome or external data model.
 */

/**
 * <lang><zh-CN>判断候选值是否是不带行为的普通对象。</zh-CN><en>Determines whether a candidate is an ordinary object without behavior.</en></lang>
 * @param {unknown} value <lang><zh-CN>待检查值。</zh-CN><en>Value to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>值是否为 plain object。</zh-CN><en>Whether the value is a plain object.</en></lang>
 * @lang zh-CN declaration、policy、source map 与 envelope 均只接收 plain object，阻断 class/platform object 跨越边界。
 * @lang en Declarations, policies, source maps, and envelopes accept only plain objects, blocking class/platform objects from crossing the boundary.
 */
function isPlainObject(value) {
  // <lang><zh-CN>null、数组和 primitive 不能承载命名 contract 字段。</zh-CN><en>Null, arrays, and primitives cannot carry named contract fields.</en></lang>
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    // <lang><zh-CN>立即拒绝没有对象字段语义的候选值。</zh-CN><en>Reject a candidate with no object-field semantics immediately.</en></lang>
    return false;
  }

  // <lang><zh-CN>读取 prototype，用于拒绝 class、Date、Map 等有行为的容器。</zh-CN><en>Read the prototype to reject behavioral containers such as classes, Date, and Map.</en></lang>
  const prototype = Object.getPrototypeOf(value);

  // <lang><zh-CN>只允许对象字面量或无 prototype record。</zh-CN><en>Allow only object literals or prototype-free records.</en></lang>
  return prototype === Object.prototype || prototype === null;
}

/**
 * <lang><zh-CN>判断对象是否含 accessor property。</zh-CN><en>Determines whether an object contains an accessor property.</en></lang>
 * @param {object} value <lang><zh-CN>已确认的普通对象。</zh-CN><en>An already confirmed ordinary object.</en></lang>
 * @returns {boolean} <lang><zh-CN>含 getter/setter 时为 true。</zh-CN><en>`true` when the object contains a getter/setter.</en></lang>
 * @lang zh-CN getter/setter 可能隐式读取环境、storage 或敏感状态，因此任何 contract/plain-data 入口都拒绝它。
 * @lang en A getter/setter may implicitly read environment, storage, or sensitive state, so every contract/plain-data entry rejects it.
 */
function hasAccessorProperty(value) {
  // <lang><zh-CN>只读取 property descriptor，不执行未知 getter。</zh-CN><en>Read property descriptors only and execute no unknown getter.</en></lang>
  return Object.values(Object.getOwnPropertyDescriptors(value)).some((descriptor) => Boolean(descriptor.get || descriptor.set));
}

/**
 * <lang><zh-CN>判断值是否是稳定且可公开呈现的标识。</zh-CN><en>Determines whether a value is a stable identifier safe for public presentation.</en></lang>
 * @param {unknown} value <lang><zh-CN>候选标识。</zh-CN><en>Candidate identifier.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否符合短 ASCII identifier 约束。</zh-CN><en>Whether the short ASCII identifier constraint passes.</en></lang>
 * @lang zh-CN source/provider/port 标识不得携带 URL、空白、控制字符或任意长业务文本。
 * @lang en Source/provider/port identifiers admit no URL, whitespace, control character, or arbitrary-length business text.
 */
function isIdentifier(value) {
  // <lang><zh-CN>长度和字符范围让标识可在 manifest、测试和受限 source metadata 中稳定比较。</zh-CN><en>The length and character range keep identifiers comparable in manifests, tests, and bounded source metadata.</en></lang>
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,95}$/u.test(value);
}

/**
 * <lang><zh-CN>创建 runtime 自有的双语文本。</zh-CN><en>Creates runtime-owned bilingual text.</en></lang>
 * @param {string} zhHans <lang><zh-CN>简体中文文本。</zh-CN><en>Simplified-Chinese text.</en></lang>
 * @param {string} en <lang><zh-CN>英文文本。</zh-CN><en>English text.</en></lang>
 * @returns {{'zh-Hans': string, en: string}} <lang><zh-CN>新建的双语 plain object。</zh-CN><en>A new bilingual plain object.</en></lang>
 * @lang zh-CN 该 helper 不接收 source/request/exception 文本，确保公共 message 不会回显私有数据。
 * @lang en This helper accepts no source/request/exception text, ensuring public messages cannot echo private data.
 */
function createLocalizedText(zhHans, en) {
  // <lang><zh-CN>每次返回新对象，避免调用方修改共享 message。</zh-CN><en>Return a new object each time so a caller cannot mutate a shared message.</en></lang>
  return {
    'zh-Hans': zhHans,
    en
  };
}

/**
 * <lang><zh-CN>创建不回显输入的结构化诊断。</zh-CN><en>Creates a structured diagnostic that echoes no input.</en></lang>
 * @param {string} code <lang><zh-CN>稳定诊断 code。</zh-CN><en>Stable diagnostic code.</en></lang>
 * @param {string} zhHans <lang><zh-CN>中文修正提示。</zh-CN><en>Chinese correction guidance.</en></lang>
 * @param {string} en <lang><zh-CN>英文修正提示。</zh-CN><en>English correction guidance.</en></lang>
 * @returns {{code: string, message: object}} <lang><zh-CN>公开安全的诊断。</zh-CN><en>A public-safe diagnostic.</en></lang>
 * @lang zh-CN diagnostics 只含 runtime 固定文本，不包含 declaration、policy、source map、payload、exception 或 credential。
 * @lang en Diagnostics contain only runtime-fixed text and no declaration, policy, source map, payload, exception, or credential.
 */
function createDiagnostic(code, zhHans, en) {
  // <lang><zh-CN>固定 shape 让 host 可以不解析异常地呈现多项启动问题。</zh-CN><en>The fixed shape lets a host present several initialization issues without parsing exceptions.</en></lang>
  return {
    code,
    message: createLocalizedText(zhHans, en)
  };
}

/**
 * <lang><zh-CN>递归复制受控 plain data。</zh-CN><en>Recursively copies controlled plain data.</en></lang>
 * @param {unknown} value <lang><zh-CN>待复制值。</zh-CN><en>Value to copy.</en></lang>
 * @param {WeakSet<object>} [seen] <lang><zh-CN>当前 traversal 已见对象。</zh-CN><en>Objects seen by the current traversal.</en></lang>
 * @returns {unknown} <lang><zh-CN>与输入隔离的副本。</zh-CN><en>A copy isolated from the input.</en></lang>
 * @throws {TypeError} <lang><zh-CN>遇到 accessor、cycle、shared ref、sparse array 或不支持值时抛出。</zh-CN><en>Throws when an accessor, cycle, shared reference, sparse array, or unsupported value is encountered.</en></lang>
 * @lang zh-CN runtime 使用该 copier 隔离 request、source value 与公开 envelope；任何异常随后被边界转为固定 failure。
 * @lang en The runtime uses this copier to isolate request, source value, and public envelope; every exception is later converted to a fixed boundary failure.
 */
function clonePlainData(value, seen = new WeakSet()) {
  // <lang><zh-CN>null、字符串、布尔和有限 number 没有可变引用，可按值返回。</zh-CN><en>Null, strings, Booleans, and finite numbers have no mutable reference and can return by value.</en></lang>
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    // <lang><zh-CN>primitive 可安全直接返回。</zh-CN><en>A primitive can return safely without copying.</en></lang>
    return value;
  }

  // <lang><zh-CN>number 必须有限，避免 NaN/Infinity 在不同 source 中被解释为不同 JSON 值。</zh-CN><en>A number must be finite, avoiding source-specific interpretation of NaN/Infinity as JSON values.</en></lang>
  if (typeof value === 'number') {
    // <lang><zh-CN>不允许非有限 number 进入 source envelope。</zh-CN><en>Do not admit a non-finite number into a source envelope.</en></lang>
    if (!Number.isFinite(value)) {
      // <lang><zh-CN>抛出内部错误，由终端 boundary 脱敏。</zh-CN><en>Throw an internal error that the terminal boundary will redact.</en></lang>
      throw new TypeError('Plain data numbers must be finite.');
    }

    // <lang><zh-CN>有限 number 没有嵌套引用。</zh-CN><en>A finite number has no nested reference.</en></lang>
    return value;
  }

  // <lang><zh-CN>undefined、bigint、symbol 与 function 均不是 plain-data contract 值。</zh-CN><en>Undefined, bigint, symbol, and function are not plain-data contract values.</en></lang>
  if (typeof value !== 'object') {
    // <lang><zh-CN>拒绝无法安全序列化/隔离的 primitive 类型。</zh-CN><en>Reject a primitive type that cannot be safely serialized/isolated.</en></lang>
    throw new TypeError('Plain data contains an unsupported value.');
  }

  // <lang><zh-CN>重复对象同时涵盖 cycle 与 shared reference，二者都不能保留在 host outcome 中。</zh-CN><en>A repeated object covers both cycles and shared references, neither of which may remain in a host outcome.</en></lang>
  if (seen.has(value)) {
    // <lang><zh-CN>中止复制，避免 host 记录调用方对象图。</zh-CN><en>Stop copying to prevent the host from retaining a caller object graph.</en></lang>
    throw new TypeError('Plain data contains a repeated object reference.');
  }

  // <lang><zh-CN>登记当前对象，供后续嵌套对象检测重复引用。</zh-CN><en>Register the current object so later nested objects can detect a repeated reference.</en></lang>
  seen.add(value);

  // <lang><zh-CN>数组必须密集，避免用 hole 隐藏缺失输入或结果。</zh-CN><en>An array must be dense, preventing a hole from hiding a missing input or result.</en></lang>
  if (Array.isArray(value)) {
    // <lang><zh-CN>稀疏数组的 own key 数少于 length。</zh-CN><en>A sparse array has fewer own keys than its length.</en></lang>
    if (Object.keys(value).length !== value.length) {
      // <lang><zh-CN>拒绝稀疏语义而非填充 undefined。</zh-CN><en>Reject sparse semantics instead of filling with undefined.</en></lang>
      throw new TypeError('Plain data arrays must not be sparse.');
    }

    // <lang><zh-CN>逐项创建隔离数组，维持原始顺序。</zh-CN><en>Create an isolated array item by item while preserving order.</en></lang>
    return value.map((item) => clonePlainData(item, seen));
  }

  // <lang><zh-CN>对象必须为无 accessor 的 plain object，拒绝 platform/class 行为。</zh-CN><en>An object must be accessor-free and plain, rejecting platform/class behavior.</en></lang>
  if (!isPlainObject(value) || hasAccessorProperty(value)) {
    // <lang><zh-CN>内部 TypeError 不携带 constructor、字段或 getter 文本。</zh-CN><en>The internal TypeError contains no constructor, field, or getter text.</en></lang>
    throw new TypeError('Plain data must use accessor-free plain objects.');
  }

  // <lang><zh-CN>输出对象不继承输入 prototype。</zh-CN><en>The output object inherits no input prototype.</en></lang>
  const copiedObject = {};

  // <lang><zh-CN>只复制 own enumerable fields，阻断 inherited/private 行为。</zh-CN><en>Copy only own enumerable fields, blocking inherited/private behavior.</en></lang>
  for (const [key, nestedValue] of Object.entries(value)) {
    // <lang><zh-CN>递归复制每个字段，确保嵌套容器同样隔离。</zh-CN><en>Copy each field recursively so nested containers are also isolated.</en></lang>
    copiedObject[key] = clonePlainData(nestedValue, seen);
  }

  // <lang><zh-CN>返回新的 plain record。</zh-CN><en>Return the new plain record.</en></lang>
  return copiedObject;
}

/**
 * <lang><zh-CN>校验稳定 contract reference。</zh-CN><en>Validates a stable contract reference.</en></lang>
 * @param {unknown} contract <lang><zh-CN>候选 contract。</zh-CN><en>Candidate contract.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否恰好为 id/version 形状。</zh-CN><en>Whether the shape is exactly id/version.</en></lang>
 * @lang zh-CN contract 不承载 endpoint、schema、source list 或 credential reference。
 * @lang en A contract carries no endpoint, schema, source list, or credential reference.
 */
function isValidContract(contract) {
  // <lang><zh-CN>字段集合必须精确，避免通过额外字段传入隐式连接配置。</zh-CN><en>The field set must be exact, preventing hidden connection configuration through extra fields.</en></lang>
  return isPlainObject(contract)
    && !hasAccessorProperty(contract)
    && Object.keys(contract).length === 2
    && isIdentifier(contract.id)
    && typeof contract.version === 'string'
    && /^\d+\.\d+$/u.test(contract.version);
}

/**
 * <lang><zh-CN>校验异步 provider declaration。</zh-CN><en>Validates an asynchronous provider declaration.</en></lang>
 * @param {unknown} declaration <lang><zh-CN>调用方显式提供的 declaration。</zh-CN><en>Explicit declaration supplied by the caller.</en></lang>
 * @returns {{ok: boolean, diagnostics: object[]}} <lang><zh-CN>结构化 validation 结果。</zh-CN><en>A structured validation result.</en></lang>
 * @lang zh-CN validation 只检查内存 plain data，不读取 package、profile 文件、环境或网络。
 * @lang en Validation checks only in-memory plain data and reads no package, profile file, environment, or network.
 */
export function validateAsyncProviderDeclaration(declaration) {
  // <lang><zh-CN>容器无效时不读取任何未知属性，避免 getter/Proxy 侧效应。</zh-CN><en>When the container is invalid, read no unknown property, avoiding getter/Proxy side effects.</en></lang>
  if (!isPlainObject(declaration) || hasAccessorProperty(declaration)) {
    // <lang><zh-CN>返回固定 shape diagnostic，不回显 declaration。</zh-CN><en>Return a fixed shape diagnostic without echoing the declaration.</en></lang>
    return {
      ok: false,
      diagnostics: [createDiagnostic('async-provider.declaration.invalid', '异步 provider 声明必须是无 accessor 的普通对象。', 'The asynchronous-provider declaration must be an accessor-free plain object.')]
    };
  }

  // <lang><zh-CN>按稳定顺序收集所有 declaration 诊断。</zh-CN><en>Collect all declaration diagnostics in stable order.</en></lang>
  const diagnostics = [];

  // <lang><zh-CN>只允许声明 contract 所定义字段，阻止 URL、token、retry callback 等隐藏配置进入。</zh-CN><en>Allow only contract-defined fields, preventing hidden URL, token, or retry-callback configuration from entering.</en></lang>
  const allowedFields = new Set(['asyncProviderContractVersion', 'providerId', 'portId', 'owner', 'kind', 'contract', 'execution', 'credential', 'cancellation', 'retry']);

  // <lang><zh-CN>多余字段说明 declaration 已跨越受控边界。</zh-CN><en>An extra field means the declaration has crossed the controlled boundary.</en></lang>
  if (Object.keys(declaration).some((field) => !allowedFields.has(field))) {
    // <lang><zh-CN>不报告未知字段名，避免将输入写入公开 diagnostic。</zh-CN><en>Do not report an unknown field name, avoiding publication of input in a diagnostic.</en></lang>
    diagnostics.push(createDiagnostic('async-provider.declaration.fields.invalid', '异步 provider 声明含有不受支持的字段。', 'The asynchronous-provider declaration contains unsupported fields.'));
  }

  // <lang><zh-CN>版本必须精确匹配当前独立 runtime。</zh-CN><en>The version must exactly match the current independent runtime.</en></lang>
  if (declaration.asyncProviderContractVersion !== ASYNC_PROVIDER_CONTRACT_VERSION) {
    // <lang><zh-CN>拒绝将同步 v1 或未知版本静默解释为 async 声明。</zh-CN><en>Reject silently interpreting sync v1 or an unknown version as an async declaration.</en></lang>
    diagnostics.push(createDiagnostic('async-provider.contract-version.unsupported', '异步 provider 声明版本不受当前 runtime 支持。', 'The asynchronous-provider declaration version is not supported by this runtime.'));
  }

  // <lang><zh-CN>三个 ownership identifier 都必须稳定且可审计。</zh-CN><en>All three ownership identifiers must be stable and reviewable.</en></lang>
  for (const [fieldName, code] of [['providerId', 'async-provider.id.invalid'], ['portId', 'async-provider.port.invalid'], ['owner', 'async-provider.owner.invalid']]) {
    // <lang><zh-CN>只判断 identifier shape，不回显候选文本。</zh-CN><en>Judge only identifier shape and never echo candidate text.</en></lang>
    if (!isIdentifier(declaration[fieldName])) {
      // <lang><zh-CN>记录对应字段的稳定 diagnostic code。</zh-CN><en>Record the stable diagnostic code for the corresponding field.</en></lang>
      diagnostics.push(createDiagnostic(code, '异步 provider 声明缺少有效的稳定标识。', 'The asynchronous-provider declaration is missing a valid stable identifier.'));
    }
  }

  // <lang><zh-CN>kind 决定可否 fallback/retry 与 write 不确定性保护。</zh-CN><en>The kind determines whether fallback/retry and write-uncertainty protections apply.</en></lang>
  if (!ASYNC_PROVIDER_KINDS.includes(declaration.kind)) {
    // <lang><zh-CN>未知 kind 不可由 runtime 推断为 read 或 write。</zh-CN><en>An unknown kind cannot be inferred as read or write by the runtime.</en></lang>
    diagnostics.push(createDiagnostic('async-provider.kind.unsupported', '异步 provider port 分类不受当前 runtime 支持。', 'The asynchronous-provider port kind is not supported by this runtime.'));
  }

  // <lang><zh-CN>contract reference 保持 module/adapter 自有语义，不承载 wire detail。</zh-CN><en>The contract reference keeps module/adapter-owned semantics and carries no wire detail.</en></lang>
  if (!isValidContract(declaration.contract)) {
    // <lang><zh-CN>contract shape 错误时不给出部分字段值。</zh-CN><en>When contract shape is invalid, provide no partial field value.</en></lang>
    diagnostics.push(createDiagnostic('async-provider.contract.invalid', '异步 provider 必须声明仅含 id/version 的 contract。', 'An asynchronous provider must declare a contract containing only id/version.'));
  }

  // <lang><zh-CN>该 package 只接受显式注入的 Promise provider，不发现或加载其他执行器。</zh-CN><en>This package accepts only explicitly injected Promise providers and discovers/loads no other executor.</en></lang>
  if (declaration.execution !== 'injected-async') {
    // <lang><zh-CN>阻断同步、HTTP 或未知 execution 的隐式兼容假设。</zh-CN><en>Block an implicit compatibility assumption for sync, HTTP, or unknown execution.</en></lang>
    diagnostics.push(createDiagnostic('async-provider.execution.unsupported', '当前 runtime 只支持 injected-async provider。', 'The current runtime supports only injected-async providers.'));
  }

  // <lang><zh-CN>初始 async boundary 不处理任何 credential 获取、存储或 reference。</zh-CN><en>The initial async boundary handles no credential acquisition, storage, or reference.</en></lang>
  const hasNoCredential = isPlainObject(declaration.credential)
    && !hasAccessorProperty(declaration.credential)
    && Object.keys(declaration.credential).length === 1
    && declaration.credential.mode === 'none';

  // <lang><zh-CN>credential 非 none 时必须等待独立 identity/trust 设计。</zh-CN><en>A credential other than none must wait for a separate identity/trust design.</en></lang>
  if (!hasNoCredential) {
    // <lang><zh-CN>不将 credential 形状或内容写入 diagnostic。</zh-CN><en>Do not write credential shape or content into a diagnostic.</en></lang>
    diagnostics.push(createDiagnostic('async-provider.credential.unsupported', '当前异步 provider 只允许 credential mode none。', 'The current asynchronous provider permits only credential mode none.'));
  }

  // <lang><zh-CN>cancellation 固定为显式 handle，避免依赖各平台 AbortController 行为。</zh-CN><en>Cancellation is fixed to an explicit handle, avoiding dependence on per-platform AbortController behavior.</en></lang>
  if (declaration.cancellation !== 'explicit-handle') {
    // <lang><zh-CN>不接受 signal、hook、callback 或隐式全局取消机制。</zh-CN><en>Do not accept signal, hook, callback, or implicit global cancellation mechanisms.</en></lang>
    diagnostics.push(createDiagnostic('async-provider.cancellation.unsupported', '当前异步 provider 只支持 explicit-handle 取消。', 'The current asynchronous provider supports only explicit-handle cancellation.'));
  }

  // <lang><zh-CN>retry 必须显式、有限且仅描述最大尝试数。</zh-CN><en>Retry must be explicit, finite, and describe only a maximum attempt count.</en></lang>
  const hasRetryShape = isPlainObject(declaration.retry)
    && !hasAccessorProperty(declaration.retry)
    && Object.keys(declaration.retry).length === 1
    && Number.isInteger(declaration.retry.maxAttempts)
    && declaration.retry.maxAttempts >= 1
    && declaration.retry.maxAttempts <= 3;

  // <lang><zh-CN>无效 retry policy 不得由 runtime 赋予默认重试预算。</zh-CN><en>An invalid retry policy must not receive a default retry budget from the runtime.</en></lang>
  if (!hasRetryShape) {
    // <lang><zh-CN>只报告固定 retry shape 问题。</zh-CN><en>Report only the fixed retry-shape issue.</en></lang>
    diagnostics.push(createDiagnostic('async-provider.retry.invalid', '异步 provider retry 必须声明 1 到 3 的 maxAttempts。', 'An asynchronous provider retry must declare maxAttempts from 1 through 3.'));
  }

  // <lang><zh-CN>write 不可自动重试，避免未知 side effect 被重复提交。</zh-CN><en>A write cannot retry automatically, preventing an unknown side effect from being submitted twice.</en></lang>
  if (declaration.kind === 'write' && hasRetryShape && declaration.retry.maxAttempts !== 1) {
    // <lang><zh-CN>只有 read 可拥有大于一的 retry budget。</zh-CN><en>Only a read may own a retry budget greater than one.</en></lang>
    diagnostics.push(createDiagnostic('async-provider.write-retry.unsupported', 'write 异步 provider 的 maxAttempts 必须为 1。', 'A write asynchronous provider must use maxAttempts 1.'));
  }

  // <lang><zh-CN>通过 diagnostics 数量决定 declaration 是否可进入 host 初始化。</zh-CN><en>Use the diagnostic count to determine whether the declaration may enter host initialization.</en></lang>
  return {
    ok: diagnostics.length === 0,
    diagnostics
  };
}

/**
 * <lang><zh-CN>校验一个 source provider entry。</zh-CN><en>Validates one source-provider entry.</en></lang>
 * @param {unknown} sourceProvider <lang><zh-CN>候选 source provider。</zh-CN><en>Candidate source provider.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否为固定 authority/invoke shape。</zh-CN><en>Whether the value has the fixed authority/invoke shape.</en></lang>
 * @lang zh-CN source provider 不含 URL、header、token、retry callback 或动态 importer；执行函数由调用方显式注入。
 * @lang en A source provider contains no URL, header, token, retry callback, or dynamic importer; its execution function is explicitly injected by the caller.
 */
function isValidSourceProvider(sourceProvider) {
  // <lang><zh-CN>source provider 的字段必须精确，避免可执行/连接配置绕过 policy。</zh-CN><en>The source-provider fields must be exact, preventing execution/connection configuration from bypassing policy.</en></lang>
  return isPlainObject(sourceProvider)
    && !hasAccessorProperty(sourceProvider)
    && Object.keys(sourceProvider).length === 2
    && ASYNC_SOURCE_AUTHORITIES.includes(sourceProvider.authority)
    && typeof sourceProvider.invoke === 'function';
}

/**
 * <lang><zh-CN>校验异步 source policy。</zh-CN><en>Validates an asynchronous source policy.</en></lang>
 * @param {unknown} sourcePolicy <lang><zh-CN>调用方显式提供的 source policy。</zh-CN><en>Explicit source policy supplied by the caller.</en></lang>
 * @returns {{ok: boolean, diagnostics: object[]}} <lang><zh-CN>结构化 validation 结果。</zh-CN><en>A structured validation result.</en></lang>
 * @lang zh-CN policy 只描述 stable source ID、mode、read sequence 与 write authority；它不是 endpoint 配置、连接池或动态 fallback 脚本。
 * @lang en A policy describes only stable source IDs, mode, read sequence, and write authority; it is not endpoint configuration, a connection pool, or a dynamic fallback script.
 */
export function validateAsyncSourcePolicy(sourcePolicy) {
  // <lang><zh-CN>不安全容器不能读取字段，直接返回 shape diagnostic。</zh-CN><en>An unsafe container cannot have fields read, so return a shape diagnostic directly.</en></lang>
  if (!isPlainObject(sourcePolicy) || hasAccessorProperty(sourcePolicy)) {
    // <lang><zh-CN>诊断不回显 policy 内容。</zh-CN><en>The diagnostic does not echo policy content.</en></lang>
    return {
      ok: false,
      diagnostics: [createDiagnostic('async-source-policy.invalid', '异步 source policy 必须是无 accessor 的普通对象。', 'The asynchronous source policy must be an accessor-free plain object.')]
    };
  }

  // <lang><zh-CN>按稳定顺序收集 policy 诊断。</zh-CN><en>Collect policy diagnostics in stable order.</en></lang>
  const diagnostics = [];

  // <lang><zh-CN>policy 不接收 URL、健康检查、timeout callback 或任意 code。</zh-CN><en>A policy admits no URL, health check, timeout callback, or arbitrary code.</en></lang>
  const allowedFields = new Set(['sourcePolicyVersion', 'mode', 'readSourceIds', 'writeSourceId']);

  // <lang><zh-CN>拒绝任何未定义字段，保持 policy 可静态审阅。</zh-CN><en>Reject every undefined field, keeping the policy statically reviewable.</en></lang>
  if (Object.keys(sourcePolicy).some((field) => !allowedFields.has(field))) {
    // <lang><zh-CN>不向 diagnostic 传入未知 field name。</zh-CN><en>Do not pass an unknown field name into a diagnostic.</en></lang>
    diagnostics.push(createDiagnostic('async-source-policy.fields.invalid', '异步 source policy 含有不受支持的字段。', 'The asynchronous source policy contains unsupported fields.'));
  }

  // <lang><zh-CN>版本与当前 runtime 的 source-policy contract 必须一致。</zh-CN><en>The version must match the source-policy contract of the current runtime.</en></lang>
  if (sourcePolicy.sourcePolicyVersion !== ASYNC_SOURCE_POLICY_VERSION) {
    // <lang><zh-CN>不将旧 policy 或未知版本做兼容猜测。</zh-CN><en>Make no compatibility guess for an old policy or unknown version.</en></lang>
    diagnostics.push(createDiagnostic('async-source-policy.version.unsupported', '异步 source policy 版本不受当前 runtime 支持。', 'The asynchronous source-policy version is not supported by this runtime.'));
  }

  // <lang><zh-CN>mode 只选择当前已知 authority 策略，不接受任意业务词。</zh-CN><en>The mode selects only a currently known authority policy and admits no arbitrary business term.</en></lang>
  const supportedModes = new Set(['local', 'virtual', 'remote', 'auto']);

  // <lang><zh-CN>未知 mode 不能决定 read/write source 行为。</zh-CN><en>An unknown mode cannot decide read/write source behavior.</en></lang>
  if (!supportedModes.has(sourcePolicy.mode)) {
    // <lang><zh-CN>只报告 mode 不支持，不回显其内容。</zh-CN><en>Report only unsupported mode without echoing its content.</en></lang>
    diagnostics.push(createDiagnostic('async-source-policy.mode.unsupported', '异步 source policy mode 不受当前 runtime 支持。', 'The asynchronous source-policy mode is not supported by this runtime.'));
  }

  // <lang><zh-CN>read source sequence 必须非空、稳定且无重复，才能保证降级顺序可解释。</zh-CN><en>The read-source sequence must be non-empty, stable, and unique so degradation order remains explainable.</en></lang>
  const hasValidReadSequence = Array.isArray(sourcePolicy.readSourceIds)
    && sourcePolicy.readSourceIds.length > 0
    && sourcePolicy.readSourceIds.every((sourceId) => isIdentifier(sourceId))
    && new Set(sourcePolicy.readSourceIds).size === sourcePolicy.readSourceIds.length;

  // <lang><zh-CN>非法 sequence 不由 runtime 补默认 local 或 remote。</zh-CN><en>An invalid sequence receives no default local or remote from the runtime.</en></lang>
  if (!hasValidReadSequence) {
    // <lang><zh-CN>只提供固定 sequence diagnostic。</zh-CN><en>Provide only the fixed sequence diagnostic.</en></lang>
    diagnostics.push(createDiagnostic('async-source-policy.read-sequence.invalid', '异步 source policy 必须声明非空且无重复的 readSourceIds。', 'An asynchronous source policy must declare non-empty, unique readSourceIds.'));
  }

  // <lang><zh-CN>write source ID 必须单一明确，使开始前的 authority 选择可审计。</zh-CN><en>The write source ID must be one explicit value, making pre-start authority selection reviewable.</en></lang>
  if (!isIdentifier(sourcePolicy.writeSourceId)) {
    // <lang><zh-CN>不允许未声明的 default write source。</zh-CN><en>Do not allow an undeclared default write source.</en></lang>
    diagnostics.push(createDiagnostic('async-source-policy.write-source.invalid', '异步 source policy 必须声明有效的 writeSourceId。', 'An asynchronous source policy must declare a valid writeSourceId.'));
  }

  // <lang><zh-CN>通过 diagnostics 数量判断 policy 是否可供 host 使用。</zh-CN><en>Use the diagnostic count to decide whether a policy may be used by a host.</en></lang>
  return {
    ok: diagnostics.length === 0,
    diagnostics
  };
}

/**
 * <lang><zh-CN>校验 declaration、policy 与 source provider map 的交叉关系。</zh-CN><en>Validates cross-relations among declaration, policy, and the source-provider map.</en></lang>
 * @param {object} declaration <lang><zh-CN>已通过基础校验的 declaration。</zh-CN><en>A declaration that passed basic validation.</en></lang>
 * @param {object} sourcePolicy <lang><zh-CN>已通过基础校验的 source policy。</zh-CN><en>A source policy that passed basic validation.</en></lang>
 * @param {unknown} sourceProviders <lang><zh-CN>候选 source provider map。</zh-CN><en>Candidate source-provider map.</en></lang>
 * @returns {{ok: boolean, diagnostics: object[]}} <lang><zh-CN>关系 validation 结果。</zh-CN><en>A relation-validation result.</en></lang>
 * @lang zh-CN 该验证不调用任何 source 函数；它只证明显式 provider 集合与 policy 完整对应。
 * @lang en This validation calls no source function; it proves only that the explicit provider set corresponds completely to policy.
 */
function validateAsyncProviderRelations(declaration, sourcePolicy, sourceProviders) {
  // <lang><zh-CN>source map 容器不安全时不读取其键或 provider。</zh-CN><en>When the source-map container is unsafe, read neither its keys nor providers.</en></lang>
  if (!isPlainObject(sourceProviders) || hasAccessorProperty(sourceProviders)) {
    // <lang><zh-CN>返回一个不回显 map 的固定 diagnostic。</zh-CN><en>Return one fixed diagnostic that does not echo the map.</en></lang>
    return {
      ok: false,
      diagnostics: [createDiagnostic('async-source-providers.invalid', '异步 source providers 必须是无 accessor 的普通对象。', 'Asynchronous source providers must be an accessor-free plain object.')]
    };
  }

  // <lang><zh-CN>收集 policy 所需 source ID，read/write 共享 ID 时只保留一次。</zh-CN><en>Collect source IDs required by policy, retaining a shared read/write ID once.</en></lang>
  const requiredSourceIds = new Set([...sourcePolicy.readSourceIds, sourcePolicy.writeSourceId]);

  // <lang><zh-CN>source map 必须精确匹配 policy 所需集合，禁止静默备用 source。</zh-CN><en>The source map must exactly match the policy-required set, forbidding a silent backup source.</en></lang>
  const sourceMapKeys = Object.keys(sourceProviders);

  // <lang><zh-CN>初始化关系诊断列表。</zh-CN><en>Initialize the relation-diagnostics list.</en></lang>
  const diagnostics = [];

  // <lang><zh-CN>键名、缺失或额外 source 任一不一致时拒绝 host 初始化。</zh-CN><en>Reject host initialization when a key name, missing source, or extra source is inconsistent.</en></lang>
  const exactSourceSet = sourceMapKeys.length === requiredSourceIds.size
    && sourceMapKeys.every((sourceId) => requiredSourceIds.has(sourceId));

  // <lang><zh-CN>拒绝未在 policy 声明的 source，防止后续 code 根据环境偷偷选择它。</zh-CN><en>Reject a source not declared by policy, preventing later code from secretly selecting it by environment.</en></lang>
  if (!exactSourceSet) {
    // <lang><zh-CN>diagnostic 不回显 source ID，避免将部署命名写入公开错误面。</zh-CN><en>The diagnostic does not echo source IDs, avoiding deployment naming in a public error surface.</en></lang>
    diagnostics.push(createDiagnostic('async-source-providers.set.invalid', '异步 source providers 必须与 source policy 精确匹配。', 'Asynchronous source providers must exactly match the source policy.'));
  }

  // <lang><zh-CN>逐项验证 provider 的固定 authority/invoke shape。</zh-CN><en>Validate the fixed authority/invoke shape of each provider.</en></lang>
  for (const sourceProvider of Object.values(sourceProviders)) {
    // <lang><zh-CN>无效 provider 不读取其 authority/invoke 细节。</zh-CN><en>Do not read authority/invoke detail from an invalid provider.</en></lang>
    if (!isValidSourceProvider(sourceProvider)) {
      // <lang><zh-CN>仅记录一个通用 source entry diagnostic。</zh-CN><en>Record only one generic source-entry diagnostic.</en></lang>
      diagnostics.push(createDiagnostic('async-source-provider.invalid', '异步 source provider 必须只含 authority 与 invoke。', 'An asynchronous source provider must contain only authority and invoke.'));
    }
  }

  // <lang><zh-CN>只有基础 shape 都成立时才检查 mode 与 authority 关系。</zh-CN><en>Check mode/authority relations only after every basic shape is valid.</en></lang>
  if (diagnostics.length === 0) {
    // <lang><zh-CN>读取 primary read source，用于 local/virtual/remote fixed mode 验证。</zh-CN><en>Read the primary read source for local/virtual/remote fixed-mode validation.</en></lang>
    const firstReadProvider = sourceProviders[sourcePolicy.readSourceIds[0]];

    // <lang><zh-CN>读取固定 write source，用于 write authority 验证。</zh-CN><en>Read the fixed write source for write-authority validation.</en></lang>
    const writeProvider = sourceProviders[sourcePolicy.writeSourceId];

    // <lang><zh-CN>local/virtual/remote fixed mode 必须只选同一种 authority，避免 mode 名称与执行源矛盾。</zh-CN><en>A local/virtual/remote fixed mode must select only its matching authority, avoiding conflict between mode name and executing source.</en></lang>
    if (sourcePolicy.mode !== 'auto') {
      // <lang><zh-CN>检查每个 read source 都与 fixed mode 相同。</zh-CN><en>Check that every read source matches the fixed mode.</en></lang>
      const readsMatchMode = sourcePolicy.readSourceIds.every((sourceId) => sourceProviders[sourceId].authority === sourcePolicy.mode);

      // <lang><zh-CN>write source 同样必须匹配 fixed mode。</zh-CN><en>The write source must also match the fixed mode.</en></lang>
      const writeMatchesMode = writeProvider.authority === sourcePolicy.mode;

      // <lang><zh-CN>任何 authority 不匹配都会造成错误的 source badge/authority 展示。</zh-CN><en>Any authority mismatch would produce an incorrect source badge/authority display.</en></lang>
      if (!readsMatchMode || !writeMatchesMode || firstReadProvider.authority !== sourcePolicy.mode) {
        // <lang><zh-CN>不回显 source ID 或 authority 细节。</zh-CN><en>Do not echo source ID or authority detail.</en></lang>
        diagnostics.push(createDiagnostic('async-source-policy.mode.relation.invalid', '固定 mode 的 source authority 必须与 mode 一致。', 'A fixed mode source authority must match its mode.'));
      }
    }

    // <lang><zh-CN>auto mode 必须把 local 放入可读序列，确保 profile 的显式降级集合真正保留 checkout-first 回退。</zh-CN><en>Auto mode must place local in readable sequence, ensuring its explicit degradation set actually retains checkout-first fallback.</en></lang>
    if (sourcePolicy.mode === 'auto') {
      // <lang><zh-CN>检查 read source 中至少一个 provider 明确标记 local authority。</zh-CN><en>Check that at least one read source provider explicitly marks local authority.</en></lang>
      const hasAutoLocalRead = sourcePolicy.readSourceIds.some((sourceId) => sourceProviders[sourceId].authority === 'local');

      // <lang><zh-CN>不允许 auto 退化序列只停在 remote/virtual。</zh-CN><en>Do not allow an auto degradation sequence to stop at only remote/virtual.</en></lang>
      if (!hasAutoLocalRead) {
        // <lang><zh-CN>只报告 policy requirement，不回显 source ID。</zh-CN><en>Report only policy requirement and do not echo source ID.</en></lang>
        diagnostics.push(createDiagnostic('async-source-policy.auto.local.required', 'auto mode 的 readSourceIds 必须包含 local authority。', 'Auto mode readSourceIds must include local authority.'));
      }
    }

    // <lang><zh-CN>write retry 约束已由 declaration 校验；此处保留参数引用，明确 relation 依赖 declaration.kind。</zh-CN><en>The write-retry constraint is validated by declaration; retain this parameter use here to make relation dependence on declaration.kind explicit.</en></lang>
    if (declaration.kind === 'write' && sourcePolicy.mode === 'auto' && !sourceProviders[sourcePolicy.writeSourceId]) {
      // <lang><zh-CN>该分支理论上已被精确集合校验覆盖，仍防止未来改动留下无 write authority 的 auto policy。</zh-CN><en>This branch is theoretically covered by exact-set validation but prevents a future edit from leaving an auto policy without write authority.</en></lang>
      diagnostics.push(createDiagnostic('async-source-policy.write-authority.invalid', 'auto mode 必须在启动前声明一个 write authority。', 'Auto mode must declare one write authority before start.'));
    }
  }

  // <lang><zh-CN>返回稳定排序的 diagnostics，便于测试和调用方一次修复配置。</zh-CN><en>Return stably ordered diagnostics so tests/callers can correct configuration at once.</en></lang>
  return {
    ok: diagnostics.length === 0,
    diagnostics
  };
}

/**
 * <lang><zh-CN>创建 source metadata。</zh-CN><en>Creates source metadata.</en></lang>
 * @param {string|null} sourceId <lang><zh-CN>稳定 source identifier，未选择 source 时为 null。</zh-CN><en>Stable source identifier, or null before a source is selected.</en></lang>
 * @param {'local'|'virtual'|'remote'|null} authority <lang><zh-CN>来源 authority，未选择 source 时为 null。</zh-CN><en>Source authority, or null before a source is selected.</en></lang>
 * @param {string|null} degradedReason <lang><zh-CN>成功降级或写不确定性原因。</zh-CN><en>Reason for successful degradation or write uncertainty.</en></lang>
 * @returns {{sourceId: string|null, authority: string|null, degradedReason: string|null}} <lang><zh-CN>新的受限 metadata。</zh-CN><en>New bounded metadata.</en></lang>
 * @lang zh-CN metadata 只呈现稳定 source 事实；它不包含 URL、HTTP、provider name、payload 或异常。
 * @lang en Metadata presents only stable source facts; it contains no URL, HTTP, provider name, payload, or exception.
 */
function createSourceMetadata(sourceId, authority, degradedReason) {
  // <lang><zh-CN>返回新对象，确保调用方不能改写内部 invocation 状态。</zh-CN><en>Return a new object so callers cannot rewrite internal invocation state.</en></lang>
  return {
    sourceId,
    authority,
    degradedReason
  };
}

/**
 * <lang><zh-CN>为 terminal failure 创建固定双语文本。</zh-CN><en>Creates fixed bilingual text for a terminal failure.</en></lang>
 * @param {string} code <lang><zh-CN>受限 terminal code。</zh-CN><en>Bounded terminal code.</en></lang>
 * @returns {{'zh-Hans': string, en: string}} <lang><zh-CN>固定本地化文本。</zh-CN><en>Fixed localized text.</en></lang>
 * @lang zh-CN 文案由 runtime 拥有，不把 source 的 raw message 或 exception 跨越到调用方。
 * @lang en The runtime owns the text and does not pass a source raw message or exception to the caller.
 */
function createFailureMessage(code) {
  // <lang><zh-CN>各 code 使用用户/adapter 可稳定识别的固定语义。</zh-CN><en>Each code uses a fixed meaning stable for user/adapter recognition.</en></lang>
  const messages = {
    'invalid-request': ['请求不符合异步 provider 的 plain-data 边界。', 'The request does not satisfy the asynchronous-provider plain-data boundary.'],
    offline: ['所选数据来源当前离线。', 'The selected data source is currently offline.'],
    conflict: ['所选数据来源报告了可识别的冲突。', 'The selected data source reported a recognized conflict.'],
    unavailable: ['所选数据来源暂时不可用。', 'The selected data source is temporarily unavailable.'],
    timeout: ['本次操作在确认结果前超时。', 'The operation timed out before a result was confirmed.'],
    cancelled: ['本次操作已在可安全取消的阶段停止。', 'The operation was stopped at a safely cancellable stage.'],
    unknown: ['本次操作结果无法安全确认。', 'The operation result cannot be confirmed safely.']
  };

  // <lang><zh-CN>未知 code 只能落到 unknown，避免将内部错误文字变成 public message。</zh-CN><en>An unknown code may only fall to unknown, preventing internal error text from becoming a public message.</en></lang>
  const selectedMessage = messages[code] ?? messages.unknown;

  // <lang><zh-CN>通过统一 helper 返回新的双语对象。</zh-CN><en>Return a new bilingual object through the shared helper.</en></lang>
  return createLocalizedText(selectedMessage[0], selectedMessage[1]);
}

/**
 * <lang><zh-CN>创建受限 terminal failure envelope。</zh-CN><en>Creates a bounded terminal-failure envelope.</en></lang>
 * @param {string} code <lang><zh-CN>受限失败 code。</zh-CN><en>Bounded failure code.</en></lang>
 * @param {boolean} retryable <lang><zh-CN>调用方是否可发起一轮新的显式操作。</zh-CN><en>Whether a caller may start a new explicit operation.</en></lang>
 * @param {object} source <lang><zh-CN>受限 source metadata。</zh-CN><en>Bounded source metadata.</en></lang>
 * @returns {object} <lang><zh-CN>固定 terminal failure。</zh-CN><en>A fixed terminal failure.</en></lang>
 * @lang zh-CN envelope 不含 attempt、provider、request、exception、endpoint 或写入 side-effect 细节；adapter 负责将它映射到领域 canonical outcome。
 * @lang en The envelope carries no attempt, provider, request, exception, endpoint, or write-side-effect detail; the adapter maps it to a domain canonical outcome.
 */
function createFailureEnvelope(code, retryable, source) {
  // <lang><zh-CN>使用独立 contract version，避免和同步 provider 或业务 module outcome 混淆。</zh-CN><en>Use the independent contract version, avoiding confusion with sync providers or business-module outcomes.</en></lang>
  return {
    asyncProviderContractVersion: ASYNC_PROVIDER_CONTRACT_VERSION,
    kind: 'failure',
    code,
    message: createFailureMessage(code),
    retryable,
    source: createSourceMetadata(source.sourceId, source.authority, source.degradedReason)
  };
}

/**
 * <lang><zh-CN>创建受限 terminal success envelope。</zh-CN><en>Creates a bounded terminal-success envelope.</en></lang>
 * @param {unknown} value <lang><zh-CN>已隔离 plain-data source value。</zh-CN><en>An isolated plain-data source value.</en></lang>
 * @param {object} source <lang><zh-CN>受限 source metadata。</zh-CN><en>Bounded source metadata.</en></lang>
 * @returns {object} <lang><zh-CN>固定 terminal success。</zh-CN><en>A fixed terminal success.</en></lang>
 * @lang zh-CN value 仍是 adapter-private 数据；runtime 不声称其是 Biz canonical page/detail/receipt。
 * @lang en The value remains adapter-private data; the runtime does not claim it is a Biz canonical page/detail/receipt.
 */
function createSuccessEnvelope(value, source) {
  // <lang><zh-CN>复制 value 与 metadata，保证公开返回对象不共享 source/provider 引用。</zh-CN><en>Copy value and metadata so the public returned object shares no source/provider reference.</en></lang>
  return {
    asyncProviderContractVersion: ASYNC_PROVIDER_CONTRACT_VERSION,
    kind: 'success',
    value: clonePlainData(value),
    source: createSourceMetadata(source.sourceId, source.authority, source.degradedReason)
  };
}

/**
 * <lang><zh-CN>校验并隔离一个 source terminal outcome。</zh-CN><en>Validates and isolates one source terminal outcome.</en></lang>
 * @param {unknown} sourceOutcome <lang><zh-CN>source resolve 的候选值。</zh-CN><en>Candidate value resolved by a source.</en></lang>
 * @returns {?AsyncSourceOutcome} <lang><zh-CN>受限 source outcome，或 null。</zh-CN><en>A bounded source outcome, or null.</en></lang>
 * @lang zh-CN source 只能返回 success、failure 或 pre-commit cancelled，不能返回 message、HTTP data、token、handler 或未知字段。
 * @lang en A source may return only success, failure, or pre-commit cancelled and cannot return a message, HTTP data, token, handler, or unknown field.
 */
function normalizeSourceOutcome(sourceOutcome) {
  // <lang><zh-CN>非 plain/accessor 容器没有安全可读的 outcome 字段。</zh-CN><en>A non-plain/accessor container has no safely readable outcome fields.</en></lang>
  if (!isPlainObject(sourceOutcome) || hasAccessorProperty(sourceOutcome)) {
    // <lang><zh-CN>返回 null，让调用方固定映射为 unknown。</zh-CN><en>Return null so the caller maps it to fixed unknown.</en></lang>
    return null;
  }

  // <lang><zh-CN>success 必须只含 kind/value，并先复制 value 检验 plain-data 安全性。</zh-CN><en>A success must contain only kind/value and copies value first to validate plain-data safety.</en></lang>
  if (sourceOutcome.kind === 'success' && Object.keys(sourceOutcome).length === 2 && Object.hasOwn(sourceOutcome, 'value')) {
    // <lang><zh-CN>复制失败会被 catch 并映射为 null。</zh-CN><en>A copy failure will be caught and mapped to null.</en></lang>
    try {
      // <lang><zh-CN>source value 与 provider/private object 图完全隔离。</zh-CN><en>The source value is fully isolated from the provider/private object graph.</en></lang>
      const copiedValue = clonePlainData(sourceOutcome.value);

      // <lang><zh-CN>返回最小安全 success shape。</zh-CN><en>Return the minimum safe success shape.</en></lang>
      return {
        kind: 'success',
        value: copiedValue
      };
    } catch {
      // <lang><zh-CN>不传播 source value 的错误详情。</zh-CN><en>Do not propagate source-value error detail.</en></lang>
      return null;
    }
  }

  // <lang><zh-CN>failure 只含可枚举 code/retryable，供 runtime 决定 read retry 或最终映射。</zh-CN><en>A failure contains only enumerable code/retryable so the runtime can decide read retry or terminal mapping.</en></lang>
  if (sourceOutcome.kind === 'failure' && Object.keys(sourceOutcome).length === 3 && ASYNC_PROVIDER_FAILURE_CODES.includes(sourceOutcome.code) && typeof sourceOutcome.retryable === 'boolean') {
    // <lang><zh-CN>返回 source 自有但受限的 failure 分类。</zh-CN><en>Return the source-owned but bounded failure classification.</en></lang>
    return {
      kind: 'failure',
      code: sourceOutcome.code,
      retryable: sourceOutcome.retryable
    };
  }

  // <lang><zh-CN>只有声明为 before-commit 的取消才可证明 write 未提交；其他取消状态必须保持 unknown。</zh-CN><en>Only cancellation declared before-commit can prove a write was not committed; any other cancellation state must remain unknown.</en></lang>
  if (sourceOutcome.kind === 'cancelled' && Object.keys(sourceOutcome).length === 2 && sourceOutcome.phase === 'before-commit') {
    // <lang><zh-CN>返回不含 source message 的安全取消 shape。</zh-CN><en>Return a safe cancellation shape containing no source message.</en></lang>
    return {
      kind: 'cancelled',
      phase: 'before-commit'
    };
  }

  // <lang><zh-CN>未知 kind/field/shape 不能被当作成功或 retryable failure。</zh-CN><en>An unknown kind/field/shape cannot be treated as success or retryable failure.</en></lang>
  return null;
}

/**
 * <lang><zh-CN>创建仅计数的 async runtime observation。</zh-CN><en>Creates count-only async-runtime observation.</en></lang>
 * @returns {object} <lang><zh-CN>新的内部计数器。</zh-CN><en>New internal counters.</en></lang>
 * @lang zh-CN observation 不存储 invocation、source、request、value 或异常；它不是 telemetry 或用户可见 application state。
 * @lang en Observation stores no invocation, source, request, value, or exception; it is neither telemetry nor user-visible application state.
 */
function createObservation() {
  // <lang><zh-CN>初始化固定总计数与每个 terminal failure 类别。</zh-CN><en>Initialize fixed totals and each terminal-failure category.</en></lang>
  return {
    starts: 0,
    attempts: 0,
    retries: 0,
    successes: 0,
    lateResultsDiscarded: 0,
    failures: {
      'invalid-request': 0,
      offline: 0,
      conflict: 0,
      unavailable: 0,
      timeout: 0,
      cancelled: 0,
      unknown: 0
    }
  };
}

/**
 * <lang><zh-CN>校验 host 的 timeout/scheduler 依赖。</zh-CN><en>Validates timeout/scheduler dependencies of a host.</en></lang>
 * @param {unknown} timeoutMs <lang><zh-CN>候选 timeout 毫秒数。</zh-CN><en>Candidate timeout milliseconds.</en></lang>
 * @param {unknown} schedule <lang><zh-CN>候选 timer scheduler。</zh-CN><en>Candidate timer scheduler.</en></lang>
 * @param {unknown} clearSchedule <lang><zh-CN>候选 timer cleaner。</zh-CN><en>Candidate timer cleaner.</en></lang>
 * @returns {{ok: boolean, diagnostics: object[]}} <lang><zh-CN>scheduler validation 结果。</zh-CN><en>A scheduler-validation result.</en></lang>
 * @lang zh-CN timer 由调用方或标准 runtime 注入，便于 deterministic test；不依赖平台 AbortController、网络或外部 queue。
 * @lang en Timers are supplied by the caller or standard runtime for deterministic tests; they depend on no platform AbortController, network, or external queue.
 */
function validateHostTiming(timeoutMs, schedule, clearSchedule) {
  // <lang><zh-CN>按稳定顺序创建 timing diagnostics。</zh-CN><en>Create timing diagnostics in stable order.</en></lang>
  const diagnostics = [];

  // <lang><zh-CN>timeout 上限防止一个声明把运行时变成无界等待或背景任务。</zh-CN><en>The timeout cap prevents a declaration from turning runtime into unbounded waiting or a background task.</en></lang>
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000) {
    // <lang><zh-CN>不回显调用方传入的 timeout 值。</zh-CN><en>Do not echo a caller-supplied timeout value.</en></lang>
    diagnostics.push(createDiagnostic('async-provider.timeout.invalid', '异步 provider timeout 必须是 1 到 30000 的整数毫秒。', 'An asynchronous-provider timeout must be an integer from 1 through 30000 milliseconds.'));
  }

  // <lang><zh-CN>scheduler 必须成对提供，避免 timeout 无法安全清理。</zh-CN><en>A scheduler must be supplied as a pair, avoiding a timeout that cannot be safely cleared.</en></lang>
  if (typeof schedule !== 'function' || typeof clearSchedule !== 'function') {
    // <lang><zh-CN>不接受 scheduler object、queue name 或自动平台探测。</zh-CN><en>Do not accept a scheduler object, queue name, or automatic platform detection.</en></lang>
    diagnostics.push(createDiagnostic('async-provider.scheduler.invalid', '异步 provider 必须提供 schedule 与 clearSchedule 函数。', 'An asynchronous provider must supply schedule and clearSchedule functions.'));
  }

  // <lang><zh-CN>返回 timing 依赖的总体验证结果。</zh-CN><en>Return the overall timing-dependency validation result.</en></lang>
  return {
    ok: diagnostics.length === 0,
    diagnostics
  };
}

/**
 * <lang><zh-CN>创建一个显式异步 provider host。</zh-CN><en>Creates one explicit asynchronous-provider host.</en></lang>
 * @param {object} options <lang><zh-CN>host 初始化选项。</zh-CN><en>Host initialization options.</en></lang>
 * @param {object} options.declaration <lang><zh-CN>版本化 async provider declaration。</zh-CN><en>Versioned async-provider declaration.</en></lang>
 * @param {object} options.sourcePolicy <lang><zh-CN>版本化 source policy。</zh-CN><en>Versioned source policy.</en></lang>
 * @param {object} options.sourceProviders <lang><zh-CN>精确 source provider map。</zh-CN><en>Exact source-provider map.</en></lang>
 * @param {number} [options.timeoutMs=5000] <lang><zh-CN>每次 invocation 的受限 timeout。</zh-CN><en>Bounded timeout for each invocation.</en></lang>
 * @param {Function} [options.schedule=setTimeout] <lang><zh-CN>timer scheduler。</zh-CN><en>Timer scheduler.</en></lang>
 * @param {Function} [options.clearSchedule=clearTimeout] <lang><zh-CN>timer cleaner。</zh-CN><en>Timer cleaner.</en></lang>
 * @returns {object} <lang><zh-CN>host 或结构化初始化诊断。</zh-CN><en>A host or structured initialization diagnostics.</en></lang>
 * @lang zh-CN source、timer 与 policy 都由调用方显式注入；本函数不加载配置、不发现实现、不建立网络连接。
 * @lang en Sources, timers, and policy are explicitly injected by the caller; this function loads no configuration, discovers no implementation, and establishes no network connection.
 */
export function createAsyncProviderHost({
  declaration,
  sourcePolicy,
  sourceProviders,
  timeoutMs = 5000,
  schedule = setTimeout,
  clearSchedule = clearTimeout
}) {
  // <lang><zh-CN>先独立校验 declaration，保证后续 relation validation 不读取未知 execution/credential shape。</zh-CN><en>Validate declaration independently first, ensuring later relation validation reads no unknown execution/credential shape.</en></lang>
  const declarationValidation = validateAsyncProviderDeclaration(declaration);

  // <lang><zh-CN>再校验 source policy 的 plain-data 形状与稳定 source 序列。</zh-CN><en>Then validate the source-policy plain-data shape and stable source sequence.</en></lang>
  const sourcePolicyValidation = validateAsyncSourcePolicy(sourcePolicy);

  // <lang><zh-CN>校验 timer 依赖，支持 Node 和小程序宿主提供同等语义的函数。</zh-CN><en>Validate timer dependencies, allowing Node and mini-program hosts to provide equivalent functions.</en></lang>
  const timingValidation = validateHostTiming(timeoutMs, schedule, clearSchedule);

  // <lang><zh-CN>基础 shape 全部成立后才读取 source provider map 的键和值。</zh-CN><en>Read source-provider map keys/values only after all basic shapes are valid.</en></lang>
  const relationValidation = declarationValidation.ok && sourcePolicyValidation.ok
    ? validateAsyncProviderRelations(declaration, sourcePolicy, sourceProviders)
    : { ok: true, diagnostics: [] };

  // <lang><zh-CN>合并固定顺序 diagnostics，方便调用方一次修复初始化输入。</zh-CN><en>Merge diagnostics in fixed order so the caller can correct initialization input at once.</en></lang>
  const diagnostics = [
    ...declarationValidation.diagnostics,
    ...sourcePolicyValidation.diagnostics,
    ...timingValidation.diagnostics,
    ...relationValidation.diagnostics
  ];

  // <lang><zh-CN>任一初始化问题都不创建 partial host 或部分 source fallback。</zh-CN><en>Any initialization issue creates no partial host or partial source fallback.</en></lang>
  if (diagnostics.length > 0) {
    // <lang><zh-CN>返回仅含 public-safe diagnostic 的拒绝结果。</zh-CN><en>Return a rejection result containing only public-safe diagnostics.</en></lang>
    return {
      ok: false,
      diagnostics
    };
  }

  // <lang><zh-CN>创建 host 私有的仅计数 observation，不保存 source/request/value。</zh-CN><en>Create host-private count-only observation, storing no source/request/value.</en></lang>
  const observation = createObservation();

  /**
   * <lang><zh-CN>读取当前 observation 的隔离副本。</zh-CN><en>Reads an isolated copy of the current observation.</en></lang>
   * @returns {object} <lang><zh-CN>只含计数的 observation。</zh-CN><en>A count-only observation.</en></lang>
   * @lang zh-CN 输出副本防止调用方篡改 host 内部计数；该 API 不是 telemetry 或业务状态。
   * @lang en The output copy prevents caller mutation of host counters; this API is neither telemetry nor business state.
   */
  function getObservation() {
    // <lang><zh-CN>用受控 copier 返回每层新对象。</zh-CN><en>Return a new object at every layer through the controlled copier.</en></lang>
    return clonePlainData(observation);
  }

  /**
   * <lang><zh-CN>启动一轮异步 provider invocation。</zh-CN><en>Starts one asynchronous-provider invocation.</en></lang>
   * @param {unknown} request <lang><zh-CN>adapter-private plain-data request。</zh-CN><en>Adapter-private plain-data request.</en></lang>
   * @returns {object} <lang><zh-CN>terminal Promise 与显式 cancel handle。</zh-CN><en>A terminal Promise and explicit cancel handle.</en></lang>
   * @lang zh-CN Promise 始终 resolve 为受限 envelope；它不 reject source exception，也不公开 source/provider 的内部细节。
   * @lang en The Promise always resolves to a bounded envelope; it never rejects a source exception or exposes source/provider internals.
   */
  function start(request) {
    // <lang><zh-CN>每次 start 都先计数，即使 request 会在 plain-data 边界被拒绝。</zh-CN><en>Count every start first, even when request will be rejected at the plain-data boundary.</en></lang>
    observation.starts += 1;

    // <lang><zh-CN>复制 request，使每个 source attempt 都能获得与调用方隔离的输入副本。</zh-CN><en>Copy request so every source attempt can receive input isolated from the caller.</en></lang>
    let copiedRequest;

    // <lang><zh-CN>unsafe request 不进入 source、timer 或 retry 流程。</zh-CN><en>An unsafe request enters no source, timer, or retry flow.</en></lang>
    try {
      // <lang><zh-CN>递归复制并验证 plain-data request。</zh-CN><en>Recursively copy and validate the plain-data request.</en></lang>
      copiedRequest = clonePlainData(request);
    } catch {
      // <lang><zh-CN>登记输入失败，但不记录 request 或异常文本。</zh-CN><en>Record input failure but store no request or exception text.</en></lang>
      observation.failures['invalid-request'] += 1;

      // <lang><zh-CN>预先 resolve 固定 failure，cancel 已无可取消工作。</zh-CN><en>Resolve a fixed failure immediately; cancel has no remaining work to cancel.</en></lang>
      return {
        promise: Promise.resolve(createFailureEnvelope('invalid-request', false, createSourceMetadata(null, null, null))),
        cancel: () => false
      };
    }

    // <lang><zh-CN>terminal flag 保证 timeout、cancel、source resolve/reject 之间只完成一次。</zh-CN><en>The terminal flag guarantees exactly one completion across timeout, cancel, source resolve/reject.</en></lang>
    let terminal = false;

    // <lang><zh-CN>cancel flag 让 source control 可以观察请求，而不会获得 request/source internals。</zh-CN><en>The cancel flag lets source control observe a request without receiving request/source internals.</en></lang>
    let cancelRequested = false;

    // <lang><zh-CN>write 已开始标志决定 timeout/cancel 是否必须保持 unknown。</zh-CN><en>The write-started flag decides whether timeout/cancel must remain unknown.</en></lang>
    let writeExecutionStarted = false;

    // <lang><zh-CN>当前 source metadata 只用于形成最终固定 envelope，不写入 observation。</zh-CN><en>Current source metadata is used only to form a final fixed envelope and is never written into observation.</en></lang>
    let currentSource = createSourceMetadata(null, null, null);

    // <lang><zh-CN>timer ID 在 terminal completion 后立即清除，防止重复完成或泄漏背景 timer。</zh-CN><en>The timer ID is cleared at terminal completion, preventing duplicate completion or a leaked background timer.</en></lang>
    let timerId = null;

    // <lang><zh-CN>resolver 由 Promise executor 捕获，只有 finish 可调用它。</zh-CN><en>The resolver is captured by the Promise executor and only finish may call it.</en></lang>
    let resolveTerminal;

    // <lang><zh-CN>创建永不 reject 的 terminal Promise。</zh-CN><en>Create a terminal Promise that never rejects.</en></lang>
    const promise = new Promise((resolve) => {
      // <lang><zh-CN>保存 resolve，不在 executor 内执行 source 逻辑。</zh-CN><en>Store resolve and execute no source logic inside the executor.</en></lang>
      resolveTerminal = resolve;
    });

    /**
     * <lang><zh-CN>完成一次 invocation 并更新受限 observation。</zh-CN><en>Completes one invocation and updates bounded observation.</en></lang>
     * @param {object} envelope <lang><zh-CN>已构造的 terminal envelope。</zh-CN><en>An already constructed terminal envelope.</en></lang>
     * @returns {boolean} <lang><zh-CN>首次完成时为 true。</zh-CN><en>`true` on first completion.</en></lang>
     * @lang zh-CN 后到的 timer/source 结果调用本函数时只计入 late-result，并永不覆盖第一个 terminal envelope。
     * @lang en When a later timer/source result calls this function, it only counts as late-result and never overwrites the first terminal envelope.
     */
    function finish(envelope) {
      // <lang><zh-CN>terminal invocation 不可被第二个结果改写。</zh-CN><en>A terminal invocation cannot be rewritten by a second result.</en></lang>
      if (terminal) {
        // <lang><zh-CN>登记晚到结果，但不保留其内容。</zh-CN><en>Count a late result without retaining its content.</en></lang>
        observation.lateResultsDiscarded += 1;

        // <lang><zh-CN>向调用方表示本次结果没有被采用。</zh-CN><en>Tell the caller this result was not adopted.</en></lang>
        return false;
      }

      // <lang><zh-CN>先封存 terminal state，防止 resolve callback 触发重入。</zh-CN><en>Seal terminal state first, preventing reentry from a resolve callback.</en></lang>
      terminal = true;

      // <lang><zh-CN>仅在已注册 timer 时清理它。</zh-CN><en>Clear the timer only when it has been registered.</en></lang>
      if (timerId !== null) {
        // <lang><zh-CN>调用注入 cleaner，不让 timer 在 completion 后继续执行。</zh-CN><en>Call the injected cleaner so a timer does not continue after completion.</en></lang>
        clearSchedule(timerId);
      }

      // <lang><zh-CN>success 与 failure 分别更新固定计数，不读取/记录 value 或 source metadata。</zh-CN><en>Update fixed counts separately for success/failure without reading/storing value or source metadata.</en></lang>
      if (envelope.kind === 'success') {
        // <lang><zh-CN>登记一个安全完成的 source success。</zh-CN><en>Record one safely completed source success.</en></lang>
        observation.successes += 1;
      } else {
        // <lang><zh-CN>failure code 已由 runtime 固定/验证，可安全索引计数器。</zh-CN><en>The failure code has been fixed/validated by runtime and can safely index counters.</en></lang>
        observation.failures[envelope.code] += 1;
      }

      // <lang><zh-CN>最后 resolve 已隔离的 envelope；不抛出 source/provider 异常。</zh-CN><en>Resolve the isolated envelope last and throw no source/provider exception.</en></lang>
      resolveTerminal(envelope);

      // <lang><zh-CN>向内部流程报告首次完成成功。</zh-CN><en>Report successful first completion to internal flow.</en></lang>
      return true;
    }

    /**
     * <lang><zh-CN>调用一个显式 source provider 并归一化其结果。</zh-CN><en>Invokes one explicit source provider and normalizes its result.</en></lang>
     * @param {string} sourceId <lang><zh-CN>已声明 source ID。</zh-CN><en>Declared source ID.</en></lang>
     * @param {number} attempt <lang><zh-CN>当前 source 的一基 attempt 序号。</zh-CN><en>One-based attempt number for the current source.</en></lang>
     * @returns {Promise<object|null>} <lang><zh-CN>受限 outcome 或 null。</zh-CN><en>A bounded outcome or null.</en></lang>
     * @lang zh-CN 任何 source throw/reject/unsafe outcome 都只返回 null，调用方再投影为 unknown；不泄漏 error。
     * @lang en Any source throw/reject/unsafe outcome returns only null, which the caller projects to unknown; no error leaks.
     */
    async function invokeSource(sourceId, attempt) {
      // <lang><zh-CN>读取已通过 host 初始化 relation validation 的 source provider。</zh-CN><en>Read a source provider that passed host-initialization relation validation.</en></lang>
      const sourceProvider = sourceProviders[sourceId];

      // <lang><zh-CN>为本次 attempt 新建 request 副本，防止一个 source mutation 影响重试/降级 source。</zh-CN><en>Create a fresh request copy for this attempt so one source mutation cannot affect retry/degraded sources.</en></lang>
      const attemptRequest = clonePlainData(copiedRequest);

      // <lang><zh-CN>control 只公开尝试次数和无参取消查询，不公开 runtime state 或 source map。</zh-CN><en>Control exposes only attempt count and a zero-argument cancellation query, not runtime state or source map.</en></lang>
      const control = {
        attempt,
        isCancellationRequested: () => cancelRequested
      };

      // <lang><zh-CN>source 可同步或异步返回；Promise.resolve 统一其 terminal timing。</zh-CN><en>A source may return synchronously or asynchronously; Promise.resolve normalizes its terminal timing.</en></lang>
      try {
        // <lang><zh-CN>等待 source outcome，不在此边界调用网络或读取平台状态。</zh-CN><en>Await source outcome without calling network or reading platform state at this boundary.</en></lang>
        const sourceOutcome = await Promise.resolve(sourceProvider.invoke(attemptRequest, control));

        // <lang><zh-CN>将 source 输出复制并限制为三种允许 outcome。</zh-CN><en>Copy and constrain source output to the three allowed outcomes.</en></lang>
        return normalizeSourceOutcome(sourceOutcome);
      } catch {
        // <lang><zh-CN>source exception/rejection 只转为 null；原始文本永不跨 boundary。</zh-CN><en>A source exception/rejection becomes only null; raw text never crosses the boundary.</en></lang>
        return null;
      }
    }

    /**
     * <lang><zh-CN>执行一个 read invocation 的有限 retry 与显式降级序列。</zh-CN><en>Executes the finite retry and explicit degradation sequence of one read invocation.</en></lang>
     * @returns {Promise<void>} <lang><zh-CN>完成或已有 terminal 时 resolve。</zh-CN><en>Resolves when completed or already terminal.</en></lang>
     * @lang zh-CN read 只在 policy 已声明的 source 间前进；它不会发现新 source、修改 policy 或重试 write。
     * @lang en A read advances only among policy-declared sources; it discovers no new source, changes no policy, and retries no write.
     */
    async function executeRead() {
      // <lang><zh-CN>记录最近一个可识别 failure，用于最终 failure 或成功降级 reason。</zh-CN><en>Keep the most recent recognized failure for final failure or successful-degradation reason.</en></lang>
      let lastFailure = null;

      // <lang><zh-CN>按 policy 顺序遍历每个已声明 read source。</zh-CN><en>Traverse every declared read source in policy order.</en></lang>
      for (const sourceId of sourcePolicy.readSourceIds) {
        // <lang><zh-CN>若 timeout/cancel 已完成，则不启动下一 source。</zh-CN><en>Do not start the next source when timeout/cancel has already completed.</en></lang>
        if (terminal) {
          // <lang><zh-CN>保留第一个 terminal envelope。</zh-CN><en>Preserve the first terminal envelope.</en></lang>
          return;
        }

        // <lang><zh-CN>读取当前 source provider 的 authority，并创建没有降级 reason 的当前 metadata。</zh-CN><en>Read the current source provider authority and create current metadata with no degradation reason.</en></lang>
        const sourceProvider = sourceProviders[sourceId];

        // <lang><zh-CN>前一 source 的失败仅在后续 source 成功时才成为可见 degraded reason。</zh-CN><en>A prior source failure becomes visible degraded reason only when a later source succeeds.</en></lang>
        const degradedReason = lastFailure?.code ?? null;

        // <lang><zh-CN>记录本轮 source，用于 timeout/cancel 等 terminal envelope。</zh-CN><en>Record this source for terminal envelopes such as timeout/cancel.</en></lang>
        currentSource = createSourceMetadata(sourceId, sourceProvider.authority, degradedReason);

        // <lang><zh-CN>每个 source 的 retry budget 由 declaration 固定，且只适用于 read。</zh-CN><en>Each source retry budget is fixed by declaration and applies only to reads.</en></lang>
        for (let attempt = 1; attempt <= declaration.retry.maxAttempts; attempt += 1) {
          // <lang><zh-CN>terminal completion 不可在新的 retry 前被覆盖。</zh-CN><en>Terminal completion cannot be overwritten before a new retry.</en></lang>
          if (terminal) {
            // <lang><zh-CN>结束该 read sequence。</zh-CN><en>End this read sequence.</en></lang>
            return;
          }

          // <lang><zh-CN>read 的取消在 source 调用前可安全终止。</zh-CN><en>Read cancellation may safely terminate before source invocation.</en></lang>
          if (cancelRequested) {
            // <lang><zh-CN>取消不 retry，也不继续降级到后续 source。</zh-CN><en>Cancellation neither retries nor continues degradation to a later source.</en></lang>
            finish(createFailureEnvelope('cancelled', false, currentSource));
            return;
          }

          // <lang><zh-CN>登记一个实际 source attempt，不记录 source ID。</zh-CN><en>Count one actual source attempt without recording its source ID.</en></lang>
          observation.attempts += 1;

          // <lang><zh-CN>调用 source，并等待受限 outcome/null。</zh-CN><en>Invoke the source and await a bounded outcome/null.</en></lang>
          const sourceOutcome = await invokeSource(sourceId, attempt);

          // <lang><zh-CN>source resolve/reject 在 timeout/cancel 后到达时不能改变已完成的 Promise。</zh-CN><en>A source resolve/reject arriving after timeout/cancel cannot change the completed Promise.</en></lang>
          if (terminal) {
            // <lang><zh-CN>登记一次晚到 source result。</zh-CN><en>Count one late source result.</en></lang>
            observation.lateResultsDiscarded += 1;
            return;
          }

          // <lang><zh-CN>read 在 source 调用中收到取消请求时，结果不再可安全采用。</zh-CN><en>When a read receives a cancellation request during source invocation, its result is no longer safe to adopt.</en></lang>
          if (cancelRequested) {
            // <lang><zh-CN>以取消 terminal envelope 停止，而不采纳刚返回的 success/failure。</zh-CN><en>Stop with a cancellation envelope rather than adopting the just returned success/failure.</en></lang>
            finish(createFailureEnvelope('cancelled', false, currentSource));
            return;
          }

          // <lang><zh-CN>safe source success 完成 read，并保留上一 source 的可见降级 reason。</zh-CN><en>A safe source success completes the read and retains visible degradation reason from a prior source.</en></lang>
          if (sourceOutcome?.kind === 'success') {
            // <lang><zh-CN>输出会再次复制，避免 sourceOutcome 与 terminal envelope 共享引用。</zh-CN><en>The output is copied again so sourceOutcome and terminal envelope share no reference.</en></lang>
            finish(createSuccessEnvelope(sourceOutcome.value, currentSource));
            return;
          }

          // <lang><zh-CN>source 声明 pre-commit cancelled 对 read 可直接映射为 cancelled，不继续 fallback。</zh-CN><en>A source-declared pre-commit cancellation maps directly to cancelled for read and does not continue fallback.</en></lang>
          if (sourceOutcome?.kind === 'cancelled') {
            // <lang><zh-CN>结束本次 read，不误将取消显示为离线或成功。</zh-CN><en>End this read without misrepresenting cancellation as offline or success.</en></lang>
            finish(createFailureEnvelope('cancelled', false, currentSource));
            return;
          }

          // <lang><zh-CN>null 或不合规输出统一作为不可 retry 的 unknown；受控 failure 保留其 code/retryable。</zh-CN><en>Null or malformed output becomes non-retryable unknown; a controlled failure retains code/retryable.</en></lang>
          const normalizedFailure = sourceOutcome?.kind === 'failure'
            ? sourceOutcome
            : { kind: 'failure', code: 'unknown', retryable: false };

          // <lang><zh-CN>保存当前 failure，供 retry 耗尽后的 fallback 或最终 envelope 使用。</zh-CN><en>Store current failure for fallback after retry exhaustion or for the final envelope.</en></lang>
          lastFailure = normalizedFailure;

          // <lang><zh-CN>只有显式 retryable failure 且未耗尽 budget 时才重试同一 source。</zh-CN><en>Retry the same source only when failure is explicitly retryable and budget remains.</en></lang>
          if (normalizedFailure.retryable && attempt < declaration.retry.maxAttempts) {
            // <lang><zh-CN>计数 retry，不引入睡眠、指数退避或后台调度。</zh-CN><en>Count retry without adding sleep, exponential backoff, or background scheduling.</en></lang>
            observation.retries += 1;
            continue;
          }

          // <lang><zh-CN>当前 source 不可再尝试，进入 policy 中的下一 source（若有）。</zh-CN><en>The current source cannot be attempted further, so move to the next policy source when present.</en></lang>
          break;
        }
      }

      // <lang><zh-CN>所有 read source 均失败时，使用最后一项受限 code/metadata 完成；不伪造 local success。</zh-CN><en>When every read source fails, complete with the last bounded code/metadata and never fabricate local success.</en></lang>
      const terminalFailure = lastFailure ?? { kind: 'failure', code: 'unknown', retryable: false };

      // <lang><zh-CN>最终 failure 是否可由用户发起新 invocation，取决于 source 的受控 retryable 标志。</zh-CN><en>Whether a user may start a new invocation after final failure depends on source bounded retryable flag.</en></lang>
      finish(createFailureEnvelope(terminalFailure.code, terminalFailure.retryable, currentSource));
    }

    /**
     * <lang><zh-CN>执行一个 authority 已在开始前固定的 write invocation。</zh-CN><en>Executes one write invocation whose authority was fixed before start.</en></lang>
     * @returns {Promise<void>} <lang><zh-CN>完成或已有 terminal 时 resolve。</zh-CN><en>Resolves when completed or already terminal.</en></lang>
     * @lang zh-CN write 永不自动 retry 或 fallback；启动后取消/timeout 的首要目标是避免错误成功声明，而不是承诺底层 transaction 已回退。
     * @lang en A write never retries or falls back automatically; after start, cancellation/timeout primarily avoid a false success claim rather than promise underlying transaction rollback.
     */
    async function executeWrite() {
      // <lang><zh-CN>读取 policy 已固定的唯一 write source 与 authority。</zh-CN><en>Read the policy-fixed single write source and authority.</en></lang>
      const sourceProvider = sourceProviders[sourcePolicy.writeSourceId];

      // <lang><zh-CN>write 没有 read degradation；metadata 的 reason 初始为 null。</zh-CN><en>A write has no read degradation; metadata reason starts as null.</en></lang>
      currentSource = createSourceMetadata(sourcePolicy.writeSourceId, sourceProvider.authority, null);

      // <lang><zh-CN>source 调用前的取消可以安全保证未开始 write。</zh-CN><en>Cancellation before source invocation can safely guarantee the write never started.</en></lang>
      if (cancelRequested) {
        // <lang><zh-CN>完成受限 cancelled，而不调用 source。</zh-CN><en>Complete bounded cancelled without calling source.</en></lang>
        finish(createFailureEnvelope('cancelled', false, currentSource));
        return;
      }

      // <lang><zh-CN>登记唯一 write attempt；声明已要求 write retry budget 为一。</zh-CN><en>Count the single write attempt; declaration already requires write retry budget one.</en></lang>
      observation.attempts += 1;

      // <lang><zh-CN>设置标志后，timeout/cancel 将不再声称 write 未发生。</zh-CN><en>After setting flag, timeout/cancel no longer claims the write did not occur.</en></lang>
      writeExecutionStarted = true;

      // <lang><zh-CN>调用固定 authority 的 source 一次。</zh-CN><en>Invoke the fixed-authority source once.</en></lang>
      const sourceOutcome = await invokeSource(sourcePolicy.writeSourceId, 1);

      // <lang><zh-CN>timeout 或其他 terminal 先完成时，source 结果只能计为 late，不得覆盖 unknown/timeout。</zh-CN><en>When timeout or another terminal completed first, source result only counts as late and cannot overwrite unknown/timeout.</en></lang>
      if (terminal) {
        // <lang><zh-CN>登记晚到 write result 而不读取其 semantic。</zh-CN><en>Count late write result without reading its semantics.</en></lang>
        observation.lateResultsDiscarded += 1;
        return;
      }

      // <lang><zh-CN>只有 source 明确 before-commit cancelled 才可安全显示为 cancelled。</zh-CN><en>Only a source explicitly cancelled before-commit may safely display as cancelled.</en></lang>
      if (sourceOutcome?.kind === 'cancelled') {
        // <lang><zh-CN>不替代为 unknown，因为 source 已声明未进入 commit。</zh-CN><en>Do not replace with unknown because source declared it never entered commit.</en></lang>
        finish(createFailureEnvelope('cancelled', false, currentSource));
        return;
      }

      // <lang><zh-CN>写入已经启动后收到 cancel 时，除 source 已明确 before-commit cancelled 外，即使 source 报 success 也不能确认没有竞争 side effect；固定映射 unknown。</zh-CN><en>When cancel arrives after write start, except when source explicitly reports before-commit cancelled, even a source success cannot confirm absence of competing side effect; map fixed unknown.</en></lang>
      if (cancelRequested) {
        // <lang><zh-CN>metadata 明确不确定性来自取消请求，而不是读降级。</zh-CN><en>Metadata makes clear uncertainty comes from cancellation request rather than read degradation.</en></lang>
        const uncertainSource = createSourceMetadata(currentSource.sourceId, currentSource.authority, 'cancelled');

        // <lang><zh-CN>不 retry、不 fallback、不保留 source outcome。</zh-CN><en>Do not retry, fall back, or retain source outcome.</en></lang>
        finish(createFailureEnvelope('unknown', false, uncertainSource));
        return;
      }

      // <lang><zh-CN>safe source success 是唯一可确认的 write success。</zh-CN><en>A safe source success is the only confirmable write success.</en></lang>
      if (sourceOutcome?.kind === 'success') {
        // <lang><zh-CN>返回隔离 value，但由后续 adapter/command 决定 canonical receipt/rollback 语义。</zh-CN><en>Return isolated value, while a later adapter/command decides canonical receipt/rollback semantics.</en></lang>
        finish(createSuccessEnvelope(sourceOutcome.value, currentSource));
        return;
      }

      // <lang><zh-CN>受控 failure 保留业务 adapter 可映射的 code；异常/unsafe output 固定为 unknown。</zh-CN><en>A controlled failure retains code mappable by business adapter; exception/unsafe output becomes fixed unknown.</en></lang>
      const terminalFailure = sourceOutcome?.kind === 'failure'
        ? sourceOutcome
        : { kind: 'failure', code: 'unknown', retryable: false };

      // <lang><zh-CN>write 不因 retryable 标记而自动重试；终端 retryable 固定 false，要求用户/业务显式发起新的受控 command。</zh-CN><en>A write does not automatically retry even if marked retryable; terminal retryable is fixed false, requiring user/business to start a new controlled command explicitly.</en></lang>
      finish(createFailureEnvelope(terminalFailure.code, false, currentSource));
    }

    /**
     * <lang><zh-CN>请求取消当前 invocation。</zh-CN><en>Requests cancellation of the current invocation.</en></lang>
     * @returns {boolean} <lang><zh-CN>请求仍有待处理工作时为 true。</zh-CN><en>`true` when the request still has pending work.</en></lang>
     * @lang zh-CN cancel 返回值不声称底层 source 已停止或 write 已回退；最终含义只以 terminal envelope 为准。
     * @lang en The cancel return value does not claim underlying source stopped or write rolled back; terminal envelope alone defines final meaning.
     */
    function cancel() {
      // <lang><zh-CN>已完成 invocation 没有可取消工作。</zh-CN><en>A completed invocation has no remaining work to cancel.</en></lang>
      if (terminal) {
        // <lang><zh-CN>明确拒绝重复 cancel。</zh-CN><en>Explicitly reject repeated cancellation.</en></lang>
        return false;
      }

      // <lang><zh-CN>设置 cancellation request，供 source control 和 write 不确定性逻辑读取。</zh-CN><en>Set cancellation request for source control and write-uncertainty logic to read.</en></lang>
      cancelRequested = true;

      // <lang><zh-CN>read 或尚未开始的 write 可立即安全完成 cancelled。</zh-CN><en>A read or a write not yet started may immediately and safely complete cancelled.</en></lang>
      if (declaration.kind === 'read' || !writeExecutionStarted) {
        // <lang><zh-CN>不再等待 source 结果；任何后到结果会被丢弃。</zh-CN><en>Do not wait for source result; any later result will be discarded.</en></lang>
        finish(createFailureEnvelope('cancelled', false, currentSource));
      }

      // <lang><zh-CN>返回 true 只表示 request 已被 runtime 接受，不表示远端 transaction 已取消。</zh-CN><en>Return true only to show runtime accepted the request, not that a remote transaction was cancelled.</en></lang>
      return true;
    }

    // <lang><zh-CN>注册 invocation timeout；timer callback 只产生固定 terminal outcome。</zh-CN><en>Register invocation timeout; timer callback creates only a fixed terminal outcome.</en></lang>
    const scheduledTimerId = schedule(() => {
      // <lang><zh-CN>已完成的 invocation 不接受 timer 的第二次 completion。</zh-CN><en>A completed invocation does not accept a second completion from timer.</en></lang>
      if (terminal) {
        // <lang><zh-CN>直接返回，不重复计算 late timer 为 source late result。</zh-CN><en>Return directly without counting a late timer as a source late result.</en></lang>
        return;
      }

      // <lang><zh-CN>已启动的 write timeout 不知道 side effect 是否发生，固定返回 unknown 并标明 timeout 原因。</zh-CN><en>A timeout of started write cannot know whether side effect occurred, so return fixed unknown with timeout reason.</en></lang>
      if (declaration.kind === 'write' && writeExecutionStarted) {
        // <lang><zh-CN>创建与当前 authority 对应的写不确定 metadata。</zh-CN><en>Create write-uncertainty metadata corresponding to current authority.</en></lang>
        const uncertainSource = createSourceMetadata(currentSource.sourceId, currentSource.authority, 'timeout');

        // <lang><zh-CN>完成 unknown，不重试、不降级、不假设 rollback。</zh-CN><en>Complete unknown without retry, degradation, or rollback assumption.</en></lang>
        finish(createFailureEnvelope('unknown', false, uncertainSource));
        return;
      }

      // <lang><zh-CN>read 或尚未开始 write 的 timeout 可明确表达为 timeout。</zh-CN><en>A read or write not yet started can express timeout definitively as timeout.</en></lang>
      finish(createFailureEnvelope('timeout', true, currentSource));
    }, timeoutMs);

    // <lang><zh-CN>保存 scheduler 返回的 opaque timer ID；runtime 从不解释其类型或内容。</zh-CN><en>Store opaque timer ID returned by scheduler; runtime never interprets its type or contents.</en></lang>
    timerId = scheduledTimerId;

    // <lang><zh-CN>兼容测试 scheduler 立即触发 callback 的情况，避免完成后留下 timer handle。</zh-CN><en>Accommodate a test scheduler that triggers callback immediately, avoiding a timer handle left after completion.</en></lang>
    if (terminal && timerId !== null) {
      // <lang><zh-CN>立即触发后的 timer 同样需要清理。</zh-CN><en>A timer after immediate trigger also needs cleanup.</en></lang>
      clearSchedule(timerId);
    }

    // <lang><zh-CN>异步启动执行，避免 source 同步返回改变 cancel handle 已交付这一 API 事实。</zh-CN><en>Start execution asynchronously, ensuring a synchronously returning source cannot change the fact that cancel handle was delivered.</en></lang>
    void Promise.resolve().then(async () => {
      // <lang><zh-CN>开始前已取消/超时时不再调用 source。</zh-CN><en>Do not call source when cancelled/timed out before start.</en></lang>
      if (terminal) {
        // <lang><zh-CN>保留原 terminal outcome。</zh-CN><en>Preserve original terminal outcome.</en></lang>
        return;
      }

      // <lang><zh-CN>按 declaration kind 选择唯一允许的执行流。</zh-CN><en>Select the only permitted execution flow by declaration kind.</en></lang>
      if (declaration.kind === 'read') {
        // <lang><zh-CN>执行有限 read retry/degrade 流程。</zh-CN><en>Execute finite read retry/degradation flow.</en></lang>
        await executeRead();
      } else {
        // <lang><zh-CN>执行固定-authority write 流程。</zh-CN><en>Execute fixed-authority write flow.</en></lang>
        await executeWrite();
      }
    }).catch(() => {
      // <lang><zh-CN>理论上内部路径已经吸收 source 异常；保留最后一层防线，确保 Promise 永不 reject。</zh-CN><en>Internal paths should already absorb source exceptions; retain final defense so Promise never rejects.</en></lang>
      finish(createFailureEnvelope('unknown', false, currentSource));
    });

    // <lang><zh-CN>立即交付 Promise/cancel handle；source 只能在其后异步开始。</zh-CN><en>Deliver Promise/cancel handle immediately; source may begin only afterward asynchronously.</en></lang>
    return {
      promise,
      cancel
    };
  }

  // <lang><zh-CN>返回已完整初始化的 host，不公开 declaration/policy/source provider 引用。</zh-CN><en>Return fully initialized host without exposing declaration/policy/source-provider references.</en></lang>
  return {
    ok: true,
    diagnostics: [],
    host: {
      start,
      getObservation
    }
  };
}
