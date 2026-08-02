/**
 * <lang><zh-CN>Biz provider-port runtime：校验业务项目拥有的显式 provider 声明，隔离 plain-data 调用并投影受控 success/failure/rollback 结果。</zh-CN><en>Biz provider-port runtime: validates explicit consumer-owned provider declarations, isolates plain-data calls, and projects controlled success, failure, and rollback results.</en></lang>
 * @lang zh-CN 本模块不打开网络、不读取环境/文件/storage、不处理真实身份或 credential，不执行动态发现、脚本或异步生命周期；真实 remote executor 仍需独立复审。
 * @lang en This module opens no network, reads no environment/file/storage, handles no real identity or credential, and performs no dynamic discovery, script, or asynchronous lifecycle; a real remote executor still requires separate review.
 */

/**
 * <lang><zh-CN>provider-port contract 的固定版本。</zh-CN><en>Fixed version of the provider-port contract.</en></lang>
 * @lang zh-CN 该版本固定当前声明、provider outcome 与 rollback shape，不代表 npm release semver。
 * @lang en This version fixes the current declaration, provider-outcome, and rollback shape and is not npm release semver.
 */
export const PROVIDER_PORT_CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>允许的 provider port 分类。</zh-CN><en>Allowed provider-port categories.</en></lang>
 * @lang zh-CN 分类决定最小 failure scope 与 rollback 规则；runtime 不根据未知分类猜测行为。
 * @lang en The category determines minimum failure scope and rollback rules; the runtime does not infer behavior from an unknown category.
 */
export const PROVIDER_PORT_KINDS = Object.freeze(['session', 'storage', 'read', 'write']);

/**
 * <lang><zh-CN>判断值是否为没有行为的普通对象。</zh-CN><en>Determines whether a value is an object without behavioral prototype semantics.</en></lang>
 * @param {unknown} value <lang><zh-CN>待检查值。</zh-CN><en>Value to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否为 plain object。</zh-CN><en>Whether the value is a plain object.</en></lang>
 * @lang zh-CN provider declaration、provider map 与 outcome 都只接受普通对象，避免 class instance 或平台对象越过边界。
 * @lang en Provider declarations, provider maps, and outcomes accept ordinary objects only, preventing class instances or platform objects from crossing the boundary.
 */
function isPlainObject(value) {
  // <lang><zh-CN>null、数组和 primitive 不承载命名 contract 字段。</zh-CN><en>Null, arrays, and primitives cannot carry named contract fields.</en></lang>
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  // <lang><zh-CN>只允许字面量对象或无 prototype record，拒绝 class/Date/Map 等带行为容器。</zh-CN><en>Accept only literal objects or prototype-free records and reject behavioral containers such as class instances, Date, and Map.</en></lang>
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * <lang><zh-CN>判断字符串是否为稳定、可脱敏的标识符。</zh-CN><en>Determines whether a string is a stable identifier that can be safely redacted.</en></lang>
 * @param {unknown} value <lang><zh-CN>候选标识。</zh-CN><en>Candidate identifier.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否符合长度和字符约束。</zh-CN><en>Whether length and character constraints pass.</en></lang>
 * @lang zh-CN 标识符不接受 URL、空白、控制字符或任意长字符串；诊断不会回显其内容。
 * @lang en Identifiers accept no URL, whitespace, control character, or arbitrary-length value; diagnostics never echo their contents.
 */
function isIdentifier(value) {
  // <lang><zh-CN>短 ASCII 标识便于日志、manifest 与 provider map 进行稳定比对。</zh-CN><en>Short ASCII identifiers keep log, manifest, and provider-map comparison stable.</en></lang>
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,95}$/u.test(value);
}

/**
 * <lang><zh-CN>创建双语 runtime diagnostic message。</zh-CN><en>Creates a bilingual runtime diagnostic message.</en></lang>
 * @param {string} zhHans <lang><zh-CN>中文说明。</zh-CN><en>Chinese description.</en></lang>
 * @param {string} en <lang><zh-CN>英文说明。</zh-CN><en>English description.</en></lang>
 * @returns {{'zh-Hans': string, en: string}} <lang><zh-CN>新的双语 plain object。</zh-CN><en>New bilingual plain object.</en></lang>
 * @lang zh-CN message 只由 runtime 自有固定文本构成，不接收 provider 或输入值。
 * @lang en The message contains only runtime-owned fixed text and accepts no provider or input value.
 */
function createLocalizedText(zhHans, en) {
  // <lang><zh-CN>每次创建新对象，避免调用方修改共享诊断文本。</zh-CN><en>Create a new object each time so callers cannot mutate shared diagnostic text.</en></lang>
  return {
    'zh-Hans': zhHans,
    en
  };
}

/**
 * <lang><zh-CN>创建不回显输入的结构化声明诊断。</zh-CN><en>Creates a structured declaration diagnostic that echoes no input.</en></lang>
 * @param {string} code <lang><zh-CN>稳定诊断代码。</zh-CN><en>Stable diagnostic code.</en></param>
 * @param {string} zhHans <lang><zh-CN>中文修正说明。</zh-CN><en>Chinese correction guidance.</en></param>
 * @param {string} en <lang><zh-CN>英文修正说明。</zh-CN><en>English correction guidance.</en></param>
 * @returns {{code: string, message: object}} <lang><zh-CN>公开安全诊断。</zh-CN><en>Public-safe diagnostic.</en></lang>
 * @lang zh-CN 诊断不包含 provider、port、payload、endpoint、exception 或 credential。
 * @lang en A diagnostic contains no provider, port, payload, endpoint, exception, or credential.
 */
function createDiagnostic(code, zhHans, en) {
  // <lang><zh-CN>固定 shape 与 Biz 其他 runtime 一致，便于宿主统一处理。</zh-CN><en>Keep the shape consistent with other Biz runtimes so hosts can handle diagnostics uniformly.</en></lang>
  return {
    code,
    message: createLocalizedText(zhHans, en)
  };
}

/**
 * <lang><zh-CN>检查对象是否含 accessor property。</zh-CN><en>Checks whether an object contains accessor properties.</en></lang>
 * @param {object} value <lang><zh-CN>待检查普通对象。</zh-CN><en>Ordinary object to inspect.</en></param>
 * @returns {boolean} <lang><zh-CN>存在 accessor 时为 true。</zh-CN><en>`true` when an accessor exists.</en></lang>
 * @lang zh-CN getter 可能读取环境、storage 或隐藏输入，因此 plain-data contract 直接拒绝它。
 * @lang en A getter may read environment, storage, or hidden input, so the plain-data contract rejects it directly.
 */
function hasAccessorProperty(value) {
  // <lang><zh-CN>只查看自有 descriptors，不执行 getter。</zh-CN><en>Inspect own descriptors only and execute no getter.</en></lang>
  return Object.values(Object.getOwnPropertyDescriptors(value)).some((descriptor) => Boolean(descriptor.get || descriptor.set));
}

/**
 * <lang><zh-CN>递归复制受控 plain data。</zh-CN><en>Recursively copies controlled plain data.</en></lang>
 * @param {unknown} value <lang><zh-CN>待复制值。</zh-CN><en>Value to copy.</en></param>
 * @param {WeakSet<object>} [seen] <lang><zh-CN>当前遍历已见对象集合。</zh-CN><en>Objects seen by the current traversal.</en></param>
 * @returns {unknown} <lang><zh-CN>与输入隔离的副本。</zh-CN><en>Copy isolated from input.</en></lang>
 * @throws {TypeError} <lang><zh-CN>值含 accessor、循环、共享引用或不支持类型时抛出。</zh-CN><en>When the value contains an accessor, cycle, shared reference, or unsupported type.</en></throws>
 * @lang zh-CN 该复制器用于 input、provider outcome 与公开 observation；任何失败都会在 host boundary 被固定投影。
 * @lang en This copier is used for input, provider outcomes, and public observations; every failure is projected to a fixed host-boundary result.
 */
function clonePlainData(value, seen = new WeakSet()) {
  // <lang><zh-CN>允许有限 primitive；undefined、bigint、symbol 与 function 不是 provider plain data。</zh-CN><en>Allow finite primitives only; undefined, bigint, symbol, and function are not provider plain data.</en></lang>
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    // <lang><zh-CN>拒绝 NaN 与无穷，避免不同 provider 对非 JSON number 产生不一致解释。</zh-CN><en>Reject NaN and infinity so providers cannot interpret non-JSON numbers inconsistently.</en></lang>
    if (!Number.isFinite(value)) {
      throw new TypeError('Plain data number is not finite.');
    }
    return value;
  }

  if (typeof value !== 'object') {
    throw new TypeError('Plain data contains an unsupported value.');
  }

  // <lang><zh-CN>重复引用同时覆盖循环与共享引用，防止 host 保存调用方对象图。</zh-CN><en>Repeated references cover both cycles and shared references, preventing the host from retaining the caller object graph.</en></lang>
  if (seen.has(value)) {
    throw new TypeError('Plain data contains a repeated object reference.');
  }
  seen.add(value);

  if (Array.isArray(value)) {
    // <lang><zh-CN>稀疏数组会隐藏缺失字段，按安全边界拒绝而不是补 undefined。</zh-CN><en>Sparse arrays can hide missing fields, so reject them rather than filling undefined.</en></lang>
    if (Object.keys(value).length !== value.length) {
      throw new TypeError('Plain data arrays must not be sparse.');
    }
    return value.map((item) => clonePlainData(item, seen));
  }

  // <lang><zh-CN>对象必须是 plain 且没有 getter/setter，防止平台对象或隐式 I/O 越过边界。</zh-CN><en>Objects must be plain and accessor-free, preventing platform objects or implicit I/O from crossing the boundary.</en></lang>
  if (!isPlainObject(value) || hasAccessorProperty(value)) {
    throw new TypeError('Plain data must use accessor-free plain objects.');
  }

  // <lang><zh-CN>只复制 enumerable own fields，输出容器不继承输入 prototype。</zh-CN><en>Copy enumerable own fields only and give the output no input prototype behavior.</en></lang>
  const copiedObject = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    copiedObject[key] = clonePlainData(nestedValue, seen);
  }
  return copiedObject;
}

/**
 * <lang><zh-CN>校验 provider port contract reference。</zh-CN><en>Validates a provider-port contract reference.</en></lang>
 * @param {unknown} contract <lang><zh-CN>声明中的 contract。</zh-CN><en>Contract from a declaration.</en></param>
 * @returns {boolean} <lang><zh-CN>contract shape 是否可用。</zh-CN><en>Whether the contract shape is usable.</en></lang>
 * @lang zh-CN contract 只含 id/version，不允许 endpoint、DTO schema 或 credential reference 混入。
 * @lang en A contract contains only id/version and does not admit endpoint, DTO schema, or credential reference.
 */
function isValidContract(contract) {
  // <lang><zh-CN>严格限制字段集合，避免 provider 借 contract 传递隐藏配置。</zh-CN><en>Restrict the field set strictly so a provider cannot smuggle hidden configuration through the contract.</en></lang>
  return isPlainObject(contract)
    && !hasAccessorProperty(contract)
    && Object.keys(contract).length === 2
    && isIdentifier(contract.id)
    && typeof contract.version === 'string'
    && /^\d+\.\d+$/u.test(contract.version);
}

/**
 * <lang><zh-CN>校验一个 provider port declaration。</zh-CN><en>Validates one provider-port declaration.</en></lang>
 * @param {unknown} declaration <lang><zh-CN>调用方显式提供的 declaration。</zh-CN><en>Explicit declaration supplied by the caller.</en></param>
 * @returns {{ok: boolean, diagnostics: object[]}} <lang><zh-CN>结构化验证结果。</zh-CN><en>Structured validation result.</en></returns>
 * @lang zh-CN declaration 不读取文件、环境、registry 或 provider 实现；诊断不回显字段值。
 * @lang en Declaration validation reads no file, environment, registry, or provider implementation; diagnostics echo no field values.
 */
export function validateProviderPortDeclaration(declaration) {
  // <lang><zh-CN>按稳定顺序累积诊断，让宿主一次修复多个声明错误。</zh-CN><en>Accumulate diagnostics in stable order so a host can fix several declaration errors at once.</en></lang>
  const diagnostics = [];
  if (!isPlainObject(declaration) || hasAccessorProperty(declaration)) {
    // <lang><zh-CN>容器错误时不读取后续字段。</zh-CN><en>Do not read later fields when the container is invalid.</en></lang>
    return {
      ok: false,
      diagnostics: [createDiagnostic('provider.declaration.invalid', 'Provider 声明必须是无 accessor 的普通对象。', 'The provider declaration must be an accessor-free plain object.')]
    };
  }

  // <lang><zh-CN>拒绝未定义字段，避免 endpoint/token 等配置借普通 declaration 进入 runtime。</zh-CN><en>Reject unknown fields so endpoint/token configuration cannot enter through an ordinary declaration.</en></lang>
  const allowedFields = new Set(['providerContractVersion', 'providerId', 'portId', 'owner', 'kind', 'contract', 'execution', 'credential', 'optional', 'rollback']);
  if (Object.keys(declaration).some((field) => !allowedFields.has(field))) {
    diagnostics.push(createDiagnostic('provider.declaration.fields.invalid', 'Provider 声明含有不受支持的字段。', 'The provider declaration contains unsupported fields.'));
  }

  if (declaration.providerContractVersion !== PROVIDER_PORT_CONTRACT_VERSION) {
    diagnostics.push(createDiagnostic('provider.contract-version.unsupported', 'Provider 声明版本不受当前 runtime 支持。', 'The provider declaration version is not supported by this runtime.'));
  }

  // <lang><zh-CN>providerId、portId 与 owner 是 consumer-owned 主责的最小稳定标识。</zh-CN><en>Provider ID, port ID, and owner are the minimum stable identifiers for consumer ownership.</en></lang>
  for (const [fieldName, code] of [['providerId', 'provider.id.invalid'], ['portId', 'provider.port.invalid'], ['owner', 'provider.owner.invalid']]) {
    if (!isIdentifier(declaration[fieldName])) {
      diagnostics.push(createDiagnostic(code, 'Provider 声明缺少有效的稳定标识。', 'The provider declaration is missing a valid stable identifier.'));
    }
  }

  if (!PROVIDER_PORT_KINDS.includes(declaration.kind)) {
    diagnostics.push(createDiagnostic('provider.kind.unsupported', 'Provider port 分类不受当前 runtime 支持。', 'The provider-port kind is not supported by this runtime.'));
  }

  if (!isValidContract(declaration.contract)) {
    diagnostics.push(createDiagnostic('provider.contract.invalid', 'Provider 必须声明仅含 id/version 的 contract。', 'A provider must declare a contract containing only id/version.'));
  }

  if (declaration.execution !== 'injected-sync') {
    diagnostics.push(createDiagnostic('provider.execution.unsupported', '当前 runtime 只支持 injected-sync provider。', 'The current runtime supports only injected-sync providers.'));
  }

  if (!isPlainObject(declaration.credential) || hasAccessorProperty(declaration.credential) || Object.keys(declaration.credential).length !== 1 || declaration.credential.mode !== 'none') {
    diagnostics.push(createDiagnostic('provider.credential.unsupported', '当前 provider 只允许 credential mode none。', 'The current provider runtime permits only credential mode none.'));
  }

  if (typeof declaration.optional !== 'boolean') {
    diagnostics.push(createDiagnostic('provider.optional.invalid', 'Provider optional 必须显式为布尔值。', 'Provider optional must be an explicit Boolean.'));
  }

  // <lang><zh-CN>只有 write port 需要声明 local no-partial-mutation rollback policy，其他 port 不携带 transaction 语义。</zh-CN><en>Only a write port declares the local no-partial-mutation rollback policy; other ports carry no transaction semantics.</en></lang>
  const expectedRollback = declaration.kind === 'write' ? 'local-no-partial-mutation' : 'not-applicable';
  if (declaration.rollback !== expectedRollback) {
    diagnostics.push(createDiagnostic('provider.rollback.invalid', 'Provider rollback policy 与 port 分类不一致。', 'The provider rollback policy does not match the port kind.'));
  }

  return {
    ok: diagnostics.length === 0,
    diagnostics
  };
}

/**
 * <lang><zh-CN>校验一组 provider declaration 的唯一性与最小 shape。</zh-CN><en>Validates declaration uniqueness and minimum shape for a provider set.</en></lang>
 * @param {unknown} declarations <lang><zh-CN>声明数组。</zh-CN><en>Declaration array.</en></param>
 * @returns {{ok: boolean, diagnostics: object[]}} <lang><zh-CN>结构化验证结果。</zh-CN><en>Structured validation result.</en></returns>
 * @lang zh-CN 该函数不读取 provider map；host 初始化会在此结果通过后单独校验实现注入。
 * @lang en This function reads no provider map; host initialization validates injected implementations separately after this result passes.
 */
export function validateProviderPortDeclarations(declarations) {
  // <lang><zh-CN>非数组输入没有可确定的 port 集合语义。</zh-CN><en>A non-array input has no determinate port-set semantics.</en></lang>
  if (!Array.isArray(declarations) || declarations.length === 0) {
    return {
      ok: false,
      diagnostics: [createDiagnostic('provider.declarations.invalid', 'Provider 声明必须是非空数组。', 'Provider declarations must be a non-empty array.')]
    };
  }

  const diagnostics = [];
  const providerIds = new Set();
  const portIds = new Set();
  for (const declaration of declarations) {
    // <lang><zh-CN>每个声明独立验证，保持一组配置的错误顺序稳定。</zh-CN><en>Validate each declaration independently, keeping a set's error order stable.</en></lang>
    const validation = validateProviderPortDeclaration(declaration);
    diagnostics.push(...validation.diagnostics);

    if (validation.ok) {
      // <lang><zh-CN>只有 shape 合法时才读取 identifier 做唯一性检查。</zh-CN><en>Read identifiers for uniqueness checks only when the shape is valid.</en></lang>
      if (providerIds.has(declaration.providerId)) {
        diagnostics.push(createDiagnostic('provider.id.duplicate', 'Provider 声明的 providerId 必须唯一。', 'Provider declaration providerId values must be unique.'));
      }
      if (portIds.has(declaration.portId)) {
        diagnostics.push(createDiagnostic('provider.port.duplicate', 'Provider 声明的 portId 必须唯一。', 'Provider declaration portId values must be unique.'));
      }
      providerIds.add(declaration.providerId);
      portIds.add(declaration.portId);
    }
  }

  return {
    ok: diagnostics.length === 0,
    diagnostics
  };
}

/**
 * <lang><zh-CN>创建 runtime-owned provider failure。</zh-CN><en>Creates a runtime-owned provider failure.</en></lang>
 * @param {string} code <lang><zh-CN>受控 failure code。</zh-CN><en>Controlled failure code.</en></param>
 * @param {string} scope <lang><zh-CN>failure scope。</zh-CN><en>Failure scope.</en></param>
 * @param {boolean} retryable <lang><zh-CN>是否建议调用方重试。</zh-CN><en>Whether retry may be attempted by the caller.</en></param>
 * @param {string} rollback <lang><zh-CN>rollback 状态。</zh-CN><en>Rollback status.</en></param>
 * @returns {object} <lang><zh-CN>不含 provider 输入/异常的固定 failure。</zh-CN><en>Fixed failure containing no provider input or exception.</en></returns>
 * @lang zh-CN message 使用 runtime 自有双语文本，不复制 provider 的错误消息或后端 DTO。
 * @lang en The message uses runtime-owned bilingual text and copies neither provider error messages nor backend DTOs.
 */
function createProviderFailure(code, scope, retryable, rollback) {
  // <lang><zh-CN>所有公开 failure 都使用同一 contract version 与固定字段集合。</zh-CN><en>Every public failure uses the same contract version and fixed field set.</en></lang>
  return {
    contractVersion: PROVIDER_PORT_CONTRACT_VERSION,
    kind: 'failure',
    code,
    message: createLocalizedText('Provider port 未能完成受控操作。', 'The provider port could not complete the controlled operation.'),
    retryable,
    scope,
    rollback
  };
}

/**
 * <lang><zh-CN>把 provider 内部 failure code 投影为安全且有限的 code。</zh-CN><en>Projects an internal provider failure code to a safe bounded code.</en></lang>
 * @param {unknown} value <lang><zh-CN>provider 返回的候选 code。</zh-CN><en>Candidate code returned by a provider.</en></param>
 * @returns {string} <lang><zh-CN>允许的公开 code。</zh-CN><en>Allowed public code.</en></returns>
 * @lang zh-CN 未知 code 统一为 provider-failed，防止后端文本、异常对象或任意字符串跨过 boundary。
 * @lang en Unknown codes become provider-failed, preventing backend text, exception objects, or arbitrary strings from crossing the boundary.
 */
function normalizeFailureCode(value) {
  // <lang><zh-CN>只允许少量与 provider boundary 相关的稳定语义。</zh-CN><en>Allow only a small set of stable semantics related to the provider boundary.</en></lang>
  const allowedCodes = new Set(['request-invalid', 'provider-unavailable', 'not-found', 'conflict', 'cancelled', 'write-failed', 'write-conflict', 'write-cancelled']);
  return typeof value === 'string' && allowedCodes.has(value) ? value : 'provider-failed';
}

/**
 * <lang><zh-CN>按 port 分类规范化 provider outcome。</zh-CN><en>Normalizes a provider outcome by port category.</en></lang>
 * @param {object} declaration <lang><zh-CN>已验证 declaration snapshot。</zh-CN><en>Validated declaration snapshot.</en></param>
 * @param {unknown} outcome <lang><zh-CN>provider 返回值。</zh-CN><en>Value returned by the provider.</en></param>
 * @returns {object} <lang><zh-CN>内部结果与 observation category。</zh-CN><en>Internal result and observation category.</en></lang>
 * @lang zh-CN 该函数不保留 provider 的未知字段；write failure 的 rollback 必须显式且不能被 runtime 猜测为 completed。
 * @lang en This function retains no unknown provider fields; write-failure rollback must be explicit and is never inferred as completed by the runtime.
 */
function normalizeOutcome(declaration, outcome) {
  // <lang><zh-CN>outcome 容器必须是无 accessor plain object，避免执行隐藏 getter。</zh-CN><en>The outcome container must be an accessor-free plain object to avoid executing hidden getters.</en></lang>
  if (!isPlainObject(outcome) || hasAccessorProperty(outcome)) {
    return { ok: false, category: 'output' };
  }

  if (outcome.kind === 'success') {
    // <lang><zh-CN>success 只允许 kind/value，防止 provider 将 raw response 或 diagnostics 一起返回。</zh-CN><en>Success permits only kind/value, preventing a provider from returning raw response or diagnostics alongside it.</en></lang>
    if (Object.keys(outcome).length !== 2 || !Object.prototype.hasOwnProperty.call(outcome, 'value')) {
      return { ok: false, category: 'output' };
    }
    try {
      const value = clonePlainData(outcome.value);
      return {
        ok: true,
        result: {
          contractVersion: PROVIDER_PORT_CONTRACT_VERSION,
          kind: 'success',
          value,
          rollback: 'not-needed'
        },
        category: 'success'
      };
    } catch {
      return { ok: false, category: 'output' };
    }
  }

  if (outcome.kind !== 'failure') {
    return { ok: false, category: 'output' };
  }

  // <lang><zh-CN>failure 只接收固定字段；message/DTO/exception 不在 provider 内部 outcome 中允许出现。</zh-CN><en>Failure accepts fixed fields only; message/DTO/exception are not permitted in the provider-internal outcome.</en></lang>
  const expectedKeys = declaration.kind === 'write' ? ['kind', 'code', 'retryable', 'rollback'] : ['kind', 'code', 'retryable'];
  if (Object.keys(outcome).some((key) => !expectedKeys.includes(key)) || expectedKeys.some((key) => !Object.prototype.hasOwnProperty.call(outcome, key))) {
    return { ok: false, category: 'output' };
  }
  if (typeof outcome.retryable !== 'boolean') {
    return { ok: false, category: 'output' };
  }

  const code = normalizeFailureCode(outcome.code);
  const isWrite = declaration.kind === 'write';
  let rollback = 'not-applicable';
  if (isWrite) {
    // <lang><zh-CN>write failure 必须声明 completed/not-needed/unknown，缺失或其他值都不能假设安全回退。</zh-CN><en>A write failure must declare completed/not-needed/unknown; a missing or other value can never be assumed safely rolled back.</en></lang>
    if (!['completed', 'not-needed', 'unknown'].includes(outcome.rollback)) {
      return { ok: false, category: 'rollback' };
    }
    rollback = outcome.rollback;
  }

  // <lang><zh-CN>unknown rollback 被保留为受限失败，不会被重新包装成成功。</zh-CN><en>Unknown rollback remains a bounded failure and is never wrapped as success.</en></lang>
  const safeCode = isWrite && rollback === 'unknown' ? 'write-failed' : code;
  return {
    ok: true,
    result: createProviderFailure(safeCode, isWrite ? 'transaction' : (code === 'request-invalid' ? 'request' : 'provider'), outcome.retryable, rollback),
    category: rollback === 'unknown' ? 'rollback' : 'provider'
  };
}

/**
 * <lang><zh-CN>验证 provider map 的 exact port 对应关系。</zh-CN><en>Validates the exact port correspondence of a provider map.</en></lang>
 * @param {unknown} providers <lang><zh-CN>按 portId 索引的 provider map。</zh-CN><en>Provider map indexed by portId.</en></param>
 * @param {object[]} declarations <lang><zh-CN>已验证的 declarations。</zh-CN><en>Validated declarations.</en></param>
 * @returns {{ok: boolean, diagnostics: object[]}} <lang><zh-CN>结构化验证结果。</zh-CN><en>Structured validation result.</en></returns>
 * @lang zh-CN 缺失或额外 key 都拒绝初始化；runtime 不发现、不 fallback、不动态 import provider。
 * @lang en Missing or extra keys reject initialization; the runtime does not discover, fall back, or dynamically import providers.
 */
function validateProviderMap(providers, declarations) {
  // <lang><zh-CN>provider map 本身必须是无 accessor plain object。</zh-CN><en>The provider map itself must be an accessor-free plain object.</en></lang>
  if (!isPlainObject(providers) || hasAccessorProperty(providers)) {
    return {
      ok: false,
      diagnostics: [createDiagnostic('provider.map.invalid', 'Provider map 必须是无 accessor 的普通对象。', 'The provider map must be an accessor-free plain object.')]
    };
  }

  const diagnostics = [];
  const declarationIds = new Set(declarations.map((declaration) => declaration.portId));
  const providerIds = Object.keys(providers);
  if (providerIds.length !== declarationIds.size || providerIds.some((portId) => !declarationIds.has(portId))) {
    diagnostics.push(createDiagnostic('provider.map.complete', 'Provider map 必须与声明的 portId 完全一致。', 'The provider map must exactly match declared portId values.'));
  }

  for (const declaration of declarations) {
    // <lang><zh-CN>逐 port 校验 provider object 与 contract，避免一个错误 provider 让其他 port 部分可用。</zh-CN><en>Validate each provider object and contract so one bad provider cannot leave other ports partially usable.</en></lang>
    const provider = providers[declaration.portId];
    if (!isPlainObject(provider) || hasAccessorProperty(provider) || typeof provider.invoke !== 'function') {
      diagnostics.push(createDiagnostic('provider.invoke.missing', 'Provider 必须提供显式 invoke function。', 'A provider must provide an explicit invoke function.'));
      continue;
    }

    if (!isValidContract(provider.contract) || provider.contract.id !== declaration.contract.id || provider.contract.version !== declaration.contract.version) {
      diagnostics.push(createDiagnostic('provider.contract.mismatch', 'Provider contract 与 port declaration 不一致。', 'The provider contract does not match the port declaration.'));
    }

    if (Object.keys(provider).some((key) => !['contract', 'invoke'].includes(key))) {
      diagnostics.push(createDiagnostic('provider.fields.invalid', 'Provider object 含有不受支持的字段。', 'The provider object contains unsupported fields.'));
    }
  }

  return {
    ok: diagnostics.length === 0,
    diagnostics
  };
}

/**
 * <lang><zh-CN>创建显式 provider-port host。</zh-CN><en>Creates an explicit provider-port host.</en></lang>
 * @param {{declarations: unknown, providers: unknown}} input <lang><zh-CN>声明数组与 consumer-owned provider map。</zh-CN><en>Declaration array and consumer-owned provider map.</en></lang>
 * @returns {object} <lang><zh-CN>失败时只有 diagnostics，成功时额外提供 host。</zh-CN><en>Diagnostics only on failure and a host on success.</en></lang>
 * @lang zh-CN 初始化不执行 provider、不访问外部资源；成功 host 只持有冻结后的 contract snapshot 和显式 invoke 引用。
 * @lang en Initialization invokes no provider and accesses no external resource; a successful host retains only frozen contract snapshots and explicit invoke references.
 */
export function createProviderPortHost(input) {
  // <lang><zh-CN>非 plain initialization 不尝试读取 declarations/providers，避免异常越过初始化 boundary。</zh-CN><en>Do not read declarations/providers for a non-plain initialization, keeping exceptions inside the initialization boundary.</en></lang>
  if (!isPlainObject(input) || hasAccessorProperty(input)) {
    return {
      ok: false,
      diagnostics: [createDiagnostic('provider.initialization.invalid', 'Provider host 初始化输入必须是无 accessor 的普通对象。', 'Provider host initialization input must be an accessor-free plain object.')]
    };
  }

  const declarationValidation = validateProviderPortDeclarations(input.declarations);
  const diagnostics = [...declarationValidation.diagnostics];
  const validDeclarations = declarationValidation.ok ? input.declarations : [];
  if (declarationValidation.ok) {
    // <lang><zh-CN>只有 declaration 集合合法时才读取 provider map，避免错误配置触发不必要的对象访问。</zh-CN><en>Read the provider map only after declarations are valid, avoiding unnecessary object access for invalid configuration.</en></lang>
    const providerValidation = validateProviderMap(input.providers, validDeclarations);
    diagnostics.push(...providerValidation.diagnostics);
  }

  if (diagnostics.length > 0) {
    return { ok: false, diagnostics };
  }

  // <lang><zh-CN>复制最小声明字段，防止调用方在初始化后修改 contract/rollback policy。</zh-CN><en>Copy minimum declaration fields so callers cannot change contract or rollback policy after initialization.</en></lang>
  const declarationsByPort = new Map(validDeclarations.map((declaration) => [
    declaration.portId,
    Object.freeze({
      providerId: declaration.providerId,
      portId: declaration.portId,
      owner: declaration.owner,
      kind: declaration.kind,
      contract: Object.freeze({ id: declaration.contract.id, version: declaration.contract.version }),
      rollback: declaration.rollback
    })
  ]));

  // <lang><zh-CN>只保存已验证 provider.invoke，避免向 host 暴露 provider object 的其他字段。</zh-CN><en>Retain only validated provider.invoke functions so the host exposes no other provider-object fields.</en></lang>
  const invocationsByPort = new Map(validDeclarations.map((declaration) => [declaration.portId, input.providers[declaration.portId].invoke]));

  // <lang><zh-CN>observation 只保存有限计数，不保存 port ID、input、outcome、异常或 provider 引用。</zh-CN><en>Observation stores bounded counts only and no port ID, input, outcome, exception, or provider reference.</en></lang>
  const observation = {
    invocations: 0,
    successes: 0,
    failures: {
      input: 0,
      provider: 0,
      output: 0,
      rollback: 0
    }
  };

  /**
   * <lang><zh-CN>调用一个已声明 provider port。</zh-CN><en>Invokes one declared provider port.</en></lang>
   * @param {string} portId <lang><zh-CN>声明中的 portId。</zh-CN><en>Port ID declared by the host.</en></param>
   * @param {unknown} inputValue <lang><zh-CN>canonical plain input；无输入时可传 undefined。</zh-CN><en>Canonical plain input; `undefined` is allowed when no input is needed.</en></param>
   * @returns {object} <lang><zh-CN>隔离后的 success 或 redacted failure。</zh-CN><en>Isolated success or redacted failure.</en></lang>
   * @lang zh-CN provider exception、raw output 与输入对象都不会跨越 host boundary；write failure 只带受限 rollback 状态。
   * @lang en Provider exceptions, raw outputs, and input objects never cross the host boundary; write failures carry only bounded rollback status.
   */
  const invoke = (portId, inputValue) => {
    observation.invocations += 1;
    const declaration = declarationsByPort.get(portId);
    const providerInvoke = invocationsByPort.get(portId);
    if (declaration === undefined || providerInvoke === undefined) {
      observation.failures.provider += 1;
      return createProviderFailure('provider-unavailable', 'provider', false, 'not-applicable');
    }

    // <lang><zh-CN>undefined 代表无参数 session 调用；其他输入必须先复制并验证 plain-data shape。</zh-CN><en>`undefined` represents a no-argument session call; every other input is copied and checked before invocation.</en></lang>
    let isolatedInput;
    try {
      isolatedInput = inputValue === undefined ? null : clonePlainData(inputValue);
    } catch {
      observation.failures.input += 1;
      return createProviderFailure('request-invalid', 'request', false, declaration.kind === 'write' ? 'unknown' : 'not-applicable');
    }

    let providerOutcome;
    try {
      // <lang><zh-CN>provider 只能看见本次调用的隔离副本，不能保留或修改调用方引用。</zh-CN><en>The provider sees only an isolated copy for this call and cannot retain or mutate the caller reference.</en></lang>
      providerOutcome = providerInvoke(isolatedInput);
    } catch {
      observation.failures.provider += 1;
      return createProviderFailure(declaration.kind === 'write' ? 'write-failed' : 'provider-unavailable', 'provider', true, declaration.kind === 'write' ? 'unknown' : 'not-applicable');
    }

    const normalized = normalizeOutcome(declaration, providerOutcome);
    if (!normalized.ok) {
      observation.failures[normalized.category] += 1;
      return createProviderFailure(declaration.kind === 'write' ? 'write-failed' : 'provider-unavailable', declaration.kind === 'write' ? 'transaction' : 'provider', false, declaration.kind === 'write' ? 'unknown' : 'not-applicable');
    }

    if (normalized.category === 'success') {
      observation.successes += 1;
    } else if (normalized.category === 'rollback') {
      observation.failures.rollback += 1;
    } else {
      observation.failures.provider += 1;
    }
    return normalized.result;
  };

  /**
   * <lang><zh-CN>读取 count-only provider observation。</zh-CN><en>Reads count-only provider observation.</en></lang>
   * @returns {object} <lang><zh-CN>新的计数快照。</zh-CN><en>New count snapshot.</en></lang>
   * @lang zh-CN 返回副本而非内部对象；不公开 provider ID、port ID、request、outcome 或错误正文。
   * @lang en Return a copy rather than the internal object and expose no provider ID, port ID, request, outcome, or error body.
   */
  const getObservation = () => ({
    invocations: observation.invocations,
    successes: observation.successes,
    failures: { ...observation.failures }
  });

  // <lang><zh-CN>冻结 API surface，防止宿主替换 invoke 或读取 mutable declaration/provider map。</zh-CN><en>Freeze the API surface so the host cannot replace invoke or read mutable declarations/provider maps.</en></lang>
  const host = Object.freeze({ invoke, getObservation });
  return {
    ok: true,
    diagnostics: [],
    host
  };
}
