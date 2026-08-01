/**
 * <lang><zh-CN>静态 local-synchronous transport-operation runtime：校验受限 descriptor 与完整 reviewed handler map，并在 adapter-private plain-data 边界分发 operation。</zh-CN><en>Static local-synchronous transport-operation runtime: validates a bounded descriptor and complete reviewed handler map, then dispatches operations at an adapter-private plain-data boundary.</en></lang>
 * @lang zh-CN 本模块不打开网络、不调用 HTTP/Directus、不读取环境/文件/storage、不处理身份/credential、不发现 handler/package，也不实现异步、retry、timeout 或 cancellation。
 * @lang en This module opens no network, calls no HTTP/Directus, reads no environment/file/storage, handles no identity/credential, discovers no handler/package, and implements no asynchronous behavior, retry, timeout, or cancellation.
 */

/**
 * <lang><zh-CN>首个 transport-operation descriptor/runtime contract 的固定版本。</zh-CN><en>The fixed contract version of the first transport-operation descriptor/runtime.</en></lang>
 * @lang zh-CN 该版本只标识当前私有 workspace contract，不代表已发布 package semver。
 * @lang en This version identifies only the current private-workspace contract and is not published package semver.
 */
export const TRANSPORT_OPERATION_CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>transport-operation descriptor 根对象允许的精确字段。</zh-CN><en>Exact fields allowed on the transport-operation descriptor root object.</en></lang>
 * @lang zh-CN 精确 root shape 阻止 endpoint、URL、HTTP method、header、token、connection 或可执行配置混入静态声明。
 * @lang en The exact root shape prevents endpoint, URL, HTTP method, header, token, connection, or executable configuration from entering static declaration.
 */
const DESCRIPTOR_KEYS = Object.freeze([
  'transportOperationContractVersion',
  'kind',
  'id',
  'execution',
  'credential',
  'operations'
]);

/**
 * <lang><zh-CN>每个静态 operation declaration 允许的精确字段。</zh-CN><en>Exact fields allowed by every static operation declaration.</en></lang>
 * @lang zh-CN operation 只陈述稳定 ID、read kind、port 和已存在 contract reference；不包含 wire/endpoint 细节。
 * @lang en An operation states only stable ID, read kind, port, and existing contract reference; it contains no wire/endpoint detail.
 */
const OPERATION_KEYS = Object.freeze(['id', 'kind', 'port', 'contract']);

/**
 * <lang><zh-CN>operation contract reference 允许的精确字段。</zh-CN><en>Exact fields allowed by an operation contract reference.</en></lang>
 * @lang zh-CN contract reference 只建立 selected adapter 与既有 module port 的对应关系，不创建新的业务 schema。
 * @lang en A contract reference only establishes correspondence between selected adapter and existing module port; it creates no new business schema.
 */
const CONTRACT_KEYS = Object.freeze(['id', 'version']);

/**
 * <lang><zh-CN>credential none declaration 允许的精确字段。</zh-CN><en>Exact fields allowed by the credential-none declaration.</en></lang>
 * @lang zh-CN 该 runtime 不读取任何 credential；精确 shape 防止 reference/token/header 配置被静默保留。
 * @lang en This runtime reads no credential; exact shape prevents reference/token/header configuration from being silently retained.
 */
const CREDENTIAL_KEYS = Object.freeze(['mode']);

/**
 * <lang><zh-CN>初始化 input 允许的精确字段。</zh-CN><en>Exact fields allowed by initialization input.</en></lang>
 * @lang zh-CN handler map 由同一调用中的 reviewed host source 提供，不从 descriptor、文件或 registry 动态加载。
 * @lang en Reviewed host source supplies handler map in the same invocation; it is not dynamically loaded from descriptor, file, or registry.
 */
const INITIALIZATION_KEYS = Object.freeze(['descriptor', 'handlers']);

/**
 * <lang><zh-CN>判断值是否为普通或无原型的 plain object。</zh-CN><en>Determines whether a value is an ordinary or null-prototype plain object.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待检查值。</zh-CN><en>Value to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否可作为受限 plain-data record。</zh-CN><en>Whether it can serve as a bounded plain-data record.</en></lang>
 * @lang zh-CN guard 拒绝 null、数组与自定义 prototype，避免 class instance 或继承字段进入 contract/handler map。
 * @lang en Guard rejects null, arrays, and custom prototypes, preventing class instances or inherited fields from entering contract/handler map.
 */
function isPlainObject(value) {
  // <lang><zh-CN>先排除没有命名 record 语义的值。</zh-CN><en>Exclude values without named-record semantics first.</en></lang>
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  // <lang><zh-CN>只接受对象字面量或无原型 record，避免从 prototype 链借用配置。</zh-CN><en>Accept only object literals or null-prototype records, avoiding configuration borrowed through prototype chain.</en></lang>
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * <lang><zh-CN>判断 record 是否精确拥有可安全读取的 enumerable data-property 集合。</zh-CN><en>Determines whether a record owns exactly a safely readable enumerable data-property set.</en></lang>
 *
 * @param {object} record <lang><zh-CN>已通过 plain-object guard 的 record。</zh-CN><en>Record that passed plain-object guard.</en></lang>
 * @param {string[]} expectedKeys <lang><zh-CN>完整允许键集合。</zh-CN><en>Complete allowed key set.</en></lang>
 * @returns {boolean} <lang><zh-CN>键集合和 descriptor 都精确时为 true。</zh-CN><en>True when both key set and descriptors are exact.</en></lang>
 * @lang zh-CN accessor 被拒绝，避免 descriptor/handler/adapter-private input 的校验执行调用方 getter。
 * @lang en Accessors are rejected, preventing validation of descriptor/handler/adapter-private input from executing caller getters.
 */
function hasExactDataKeys(record, expectedKeys) {
  // <lang><zh-CN>检查全部 own key（包含不可枚举与 Symbol），再逐项检查 data descriptor；不直接读取 record 字段。</zh-CN><en>Inspect every own key (including non-enumerable and Symbol keys) and then each data descriptor; do not read record fields directly.</en></lang>
  const actualKeys = Reflect.ownKeys(record);
  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }

  // <lang><zh-CN>每个允许键都必须是 enumerable own data property，且不能有额外键、隐藏键或 Symbol 键。</zh-CN><en>Every allowed key must be an enumerable own data property, with no extra, hidden, or Symbol keys.</en></lang>
  return expectedKeys.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    return descriptor !== undefined && descriptor.enumerable && Object.hasOwn(descriptor, 'value');
  });
}

/**
 * <lang><zh-CN>取得只含连续 enumerable data element 的数组长度；不满足受限形态时返回 `null`。</zh-CN><en>Gets an array length only when it contains contiguous enumerable data elements; returns `null` when the bounded shape is not met.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待检查的数组候选。</zh-CN><en>Candidate array to inspect.</en></lang>
 * @returns {number | null} <lang><zh-CN>安全的连续长度，或拒绝标记。</zh-CN><en>Safe contiguous length or rejection marker.</en></lang>
 * @lang zh-CN 标准数组仅允许其内建不可枚举 `length` 加连续索引；额外隐藏/Symbol 属性和 accessor 都被拒绝。
 * @lang en A standard array permits only its built-in non-enumerable `length` plus contiguous indices; extra hidden/Symbol properties and accessors are rejected.
 */
function getDenseArrayDataLength(value) {
  // <lang><zh-CN>先确认 array 与安全 data `length` descriptor，避免读取调用方覆盖的属性。</zh-CN><en>Confirm an array and a safe data `length` descriptor first, avoiding a read of a caller-overridden property.</en></lang>
  if (!Array.isArray(value)) {
    return null;
  }

  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length');
  if (lengthDescriptor === undefined
    || lengthDescriptor.enumerable
    || !Object.hasOwn(lengthDescriptor, 'value')
    || !Number.isSafeInteger(lengthDescriptor.value)
    || lengthDescriptor.value < 0) {
    return null;
  }

  const length = lengthDescriptor.value;
  const actualKeys = Reflect.ownKeys(value);
  if (actualKeys.length !== length + 1 || !actualKeys.includes('length')) {
    return null;
  }

  // <lang><zh-CN>每个位置必须是 enumerable own data element；这同时拒绝 hole、accessor 和非索引键。</zh-CN><en>Every position must be an enumerable own data element; this also rejects holes, accessors, and non-index keys.</en></lang>
  for (let index = 0; index < length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (descriptor === undefined || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
      return null;
    }
  }

  return length;
}

/**
 * <lang><zh-CN>判断值是否为稳定的点分/连字符 identifier。</zh-CN><en>Determines whether a value is a stable dotted/hyphen identifier.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>候选 identifier。</zh-CN><en>Candidate identifier.</en></lang>
 * @returns {boolean} <lang><zh-CN>满足受限 identifier pattern 时为 true。</zh-CN><en>True when it satisfies bounded identifier pattern.</en></lang>
 * @lang zh-CN pattern 不生成、规范化或发现 ID；它只拒绝 URL、路径、空白和任意表达式。
 * @lang en Pattern generates, normalizes, and discovers no ID; it only rejects URL, path, whitespace, and arbitrary expression.
 */
function isStableIdentifier(value) {
  // <lang><zh-CN>每个 segment 以小写字母开始，后续只允许小写字母、数字或连字符。</zh-CN><en>Every segment starts with lowercase letter and then permits only lowercase letters, digits, or hyphens.</en></lang>
  return typeof value === 'string' && /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/.test(value);
}

/**
 * <lang><zh-CN>创建不回显 descriptor、handler、input 或 raw outcome 的双语 diagnostic。</zh-CN><en>Creates a bilingual diagnostic that echoes no descriptor, handler, input, or raw outcome.</en></lang>
 *
 * @param {string} code <lang><zh-CN>稳定诊断 code。</zh-CN><en>Stable diagnostic code.</en></lang>
 * @param {string} zhHans <lang><zh-CN>中文修正说明。</zh-CN><en>Chinese correction guidance.</en></lang>
 * @param {string} en <lang><zh-CN>English correction guidance.</en></lang>
 * @returns {object} <lang><zh-CN>公开安全的 diagnostic。</zh-CN><en>Public-safe diagnostic.</en></lang>
 * @lang zh-CN 初始化诊断只指导静态 host source 修复，不是用户可见业务 failure。
 * @lang en Initialization diagnostics guide static-host-source repair only and are not user-visible business failures.
 */
function createDiagnostic(code, zhHans, en) {
  // <lang><zh-CN>每次生成独立 message object，避免调用方修改共享内部文本。</zh-CN><en>Create an independent message object each time, preventing callers from modifying shared internal text.</en></lang>
  return {
    code,
    message: {
      'zh-Hans': zhHans,
      en
    }
  };
}

/**
 * <lang><zh-CN>创建仅供 selected adapter 映射的受限 local transport failure。</zh-CN><en>Creates a bounded local transport failure only for selected-adapter mapping.</en></lang>
 *
 * @param {string} code <lang><zh-CN>稳定 failure code。</zh-CN><en>Stable failure code.</en></lang>
 * @param {string} zhHans <lang><zh-CN>中文 failure 说明。</zh-CN><en>Chinese failure explanation.</en></lang>
 * @param {string} en <lang><zh-CN>English failure explanation.</en></lang>
 * @returns {object} <lang><zh-CN>不含 local input/output/exception 的 failure envelope。</zh-CN><en>Failure envelope containing no local input/output/exception.</en></lang>
 * @lang zh-CN 此 envelope 不是 canonical business result；adapter 必须在其 private exchange 内将其映射为既有 canonical failure。
 * @lang en This envelope is not a canonical business result; adapter must map it to existing canonical failure inside its private exchange.
 */
function createTransportFailure(code, zhHans, en) {
  // <lang><zh-CN>使用固定 kind/code/message，防止 handler error 或 payload 跨越 runtime 边界。</zh-CN><en>Use fixed kind/code/message, preventing handler error or payload from crossing runtime boundary.</en></lang>
  return {
    kind: 'transport-operation-failure',
    code,
    message: {
      'zh-Hans': zhHans,
      en
    }
  };
}

/**
 * <lang><zh-CN>复制 adapter-private plain data，并拒绝 accessor、循环、共享引用和带行为 value。</zh-CN><en>Copies adapter-private plain data and rejects accessors, cycles, shared references, and behavioral values.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待隔离的 input 或 outcome。</zh-CN><en>Input or outcome to isolate.</en></lang>
 * @param {WeakSet<object>} [seen] <lang><zh-CN>本次遍历已访问对象。</zh-CN><en>Objects visited by current traversal.</en></lang>
 * @returns {unknown} <lang><zh-CN>完全隔离的 plain-data 副本。</zh-CN><en>Fully isolated plain-data copy.</en></lang>
 * @lang zh-CN 不使用 JSON stringify，避免静默丢失 unsupported value；复制失败由 dispatch 转换为脱敏 failure。
 * @lang en Do not use JSON stringify, avoiding silent loss of unsupported value; a copy failure becomes redacted failure at dispatch.
 */
function clonePlainData(value, seen = new WeakSet()) {
  // <lang><zh-CN>允许的 primitive 没有可变引用。</zh-CN><en>Allowed primitives carry no mutable reference.</en></lang>
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  // <lang><zh-CN>undefined、function、symbol 与 bigint 不属于当前 plain-data contract。</zh-CN><en>Undefined, function, symbol, and bigint do not belong to current plain-data contract.</en></lang>
  if (typeof value !== 'object') {
    throw new TypeError('Transport operation data must use supported plain values.');
  }

  // <lang><zh-CN>循环或共享对象图不能安全作为 instance-local operation input/output。</zh-CN><en>A cycle or shared object graph cannot safely serve as instance-local operation input/output.</en></lang>
  if (seen.has(value)) {
    throw new TypeError('Transport operation data must not repeat object references.');
  }
  seen.add(value);

  // <lang><zh-CN>数组只允许连续 data element，不允许 hole、accessor 或额外 enumerable property。</zh-CN><en>Arrays permit only contiguous data elements and no hole, accessor, or extra enumerable property.</en></lang>
  if (Array.isArray(value)) {
    const length = getDenseArrayDataLength(value);
    if (length === null) {
      throw new TypeError('Transport operation arrays must be dense plain data.');
    }

    // <lang><zh-CN>逐索引读取 data descriptor，避免通过数组 accessor 执行调用方逻辑。</zh-CN><en>Read data descriptors by index, avoiding execution of caller logic through array accessor.</en></lang>
    return Array.from({ length }, (_, index) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (descriptor === undefined || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
        throw new TypeError('Transport operation arrays must use data elements.');
      }
      return clonePlainData(descriptor.value, seen);
    });
  }

  // <lang><zh-CN>对象必须为 plain record；class、Date、Map 等行为容器不能通过 local transport。</zh-CN><en>Objects must be plain records; behavioral containers such as class, Date, or Map cannot cross local transport.</en></lang>
  if (!isPlainObject(value)) {
    throw new TypeError('Transport operation data must use plain objects.');
  }

  // <lang><zh-CN>新对象不继承输入的 prototype 或 descriptor，逐字段复制明确 data value。</zh-CN><en>New object inherits no input prototype or descriptor and copies each explicit data value field by field.</en></lang>
  const copied = {};
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string') {
      throw new TypeError('Transport operation objects must use string data keys.');
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
      throw new TypeError('Transport operation objects must use data properties.');
    }
    copied[key] = clonePlainData(descriptor.value, seen);
  }
  return copied;
}

/**
 * <lang><zh-CN>校验 versioned static transport-operation descriptor。</zh-CN><en>Validates a versioned static transport-operation descriptor.</en></lang>
 *
 * @param {unknown} descriptor <lang><zh-CN>调用方提供的 descriptor plain data。</zh-CN><en>Descriptor plain data supplied by caller.</en></lang>
 * @returns {object} <lang><zh-CN>`{ ok, diagnostics }` 结构化结果。</zh-CN><en>Structured `{ ok, diagnostics }` result.</en></lang>
 * @lang zh-CN 校验不执行 handler、不发现 package/operation，也不读取文件、环境或网络。
 * @lang en Validation executes no handler, discovers no package/operation, and reads no file, environment, or network.
 */
export function validateTransportOperationDescriptor(descriptor) {
  // <lang><zh-CN>所有 diagnostics 使用稳定出现顺序，且不会回显调用方 value。</zh-CN><en>All diagnostics use stable encounter order and never echo caller value.</en></lang>
  const diagnostics = [];

  // <lang><zh-CN>先拒绝无法安全读取的 root，不访问其字段。</zh-CN><en>Reject an unsafe root before reading its fields.</en></lang>
  if (!isPlainObject(descriptor) || !hasExactDataKeys(descriptor, DESCRIPTOR_KEYS)) {
    return {
      ok: false,
      diagnostics: [createDiagnostic('transport-operation.descriptor.invalid', 'Transport operation descriptor 必须是精确的普通对象。', 'The transport-operation descriptor must be an exact plain object.')]
    };
  }

  // <lang><zh-CN>所有 root 字段已是 data property，下面可在不触发 accessor 的前提下读取。</zh-CN><en>All root fields are data properties, so below reads cannot trigger accessors.</en></lang>
  if (descriptor.transportOperationContractVersion !== TRANSPORT_OPERATION_CONTRACT_VERSION) {
    diagnostics.push(createDiagnostic('transport-operation.contract-version.unsupported', 'Transport operation descriptor 版本不受当前 runtime 支持。', 'The transport-operation descriptor version is not supported by this runtime.'));
  }

  if (descriptor.kind !== 'transport-operation-descriptor') {
    diagnostics.push(createDiagnostic('transport-operation.kind.invalid', 'Transport operation descriptor kind 不正确。', 'The transport-operation descriptor kind is invalid.'));
  }

  if (!isStableIdentifier(descriptor.id)) {
    diagnostics.push(createDiagnostic('transport-operation.id.invalid', 'Transport operation descriptor 缺少稳定 ID。', 'The transport-operation descriptor is missing a stable ID.'));
  }

  if (descriptor.execution !== 'local-synchronous') {
    diagnostics.push(createDiagnostic('transport-operation.execution.unsupported', '当前 runtime 只支持 local-synchronous execution。', 'The current runtime supports local-synchronous execution only.'));
  }

  // <lang><zh-CN>credential 只允许精确 none record，不读取任何 reference/token 值。</zh-CN><en>Credential permits only exact none record and reads no reference/token value.</en></lang>
  if (!isPlainObject(descriptor.credential)
    || !hasExactDataKeys(descriptor.credential, CREDENTIAL_KEYS)
    || descriptor.credential.mode !== 'none') {
    diagnostics.push(createDiagnostic('transport-operation.credential.unsupported', '当前 runtime 只允许 credential mode none。', 'The current runtime permits credential mode none only.'));
  }

  // <lang><zh-CN>operations 必须是至少一个显式声明的 dense array；不允许未来/动态 operation 以空集合掩盖。</zh-CN><en>Operations must be a dense array with at least one explicit declaration; an empty collection cannot hide future/dynamic operation.</en></lang>
  const operationLength = getDenseArrayDataLength(descriptor.operations);
  if (operationLength === null || operationLength === 0) {
    diagnostics.push(createDiagnostic('transport-operation.operations.invalid', 'Transport operation descriptor 必须声明完整 operation 数组。', 'The transport-operation descriptor must declare a complete operation array.'));
    return { ok: false, diagnostics };
  }

  // <lang><zh-CN>逐项校验 operation 的 exact metadata；generic runtime 只允许 read，不把 command 写入 transport surface。</zh-CN><en>Validate exact metadata per operation; generic runtime permits read only and writes no command into transport surface.</en></lang>
  const operationIds = new Set();
  const portIds = new Set();
  let operationsAreValid = true;
  for (let index = 0; index < operationLength; index += 1) {
    const operationDescriptor = Object.getOwnPropertyDescriptor(descriptor.operations, String(index));
    if (operationDescriptor === undefined || !operationDescriptor.enumerable || !Object.hasOwn(operationDescriptor, 'value')) {
      operationsAreValid = false;
      continue;
    }

    const operation = operationDescriptor.value;
    if (!isPlainObject(operation) || !hasExactDataKeys(operation, OPERATION_KEYS)) {
      operationsAreValid = false;
      continue;
    }

    const contractIsValid = isPlainObject(operation.contract)
      && hasExactDataKeys(operation.contract, CONTRACT_KEYS)
      && isStableIdentifier(operation.contract.id)
      && typeof operation.contract.version === 'string'
      && operation.contract.version.trim().length > 0;
    if (!isStableIdentifier(operation.id)
      || operation.kind !== 'read'
      || !isStableIdentifier(operation.port)
      || !contractIsValid) {
      operationsAreValid = false;
      continue;
    }

    // <lang><zh-CN>operation ID 与 port 都必须唯一，避免一个 handler 或 port 出现隐式优先级。</zh-CN><en>Operation ID and port must both be unique, preventing implicit precedence for one handler or port.</en></lang>
    if (operationIds.has(operation.id) || portIds.has(operation.port)) {
      operationsAreValid = false;
      continue;
    }
    operationIds.add(operation.id);
    portIds.add(operation.port);
  }

  if (!operationsAreValid) {
    diagnostics.push(createDiagnostic('transport-operation.operations.invalid', 'Transport operation 声明必须是唯一、完整的静态 read operation。', 'Transport operation declarations must be unique, complete static read operations.'));
  }

  return {
    ok: diagnostics.length === 0,
    diagnostics
  };
}

/**
 * <lang><zh-CN>创建静态 local-synchronous operation transport。</zh-CN><en>Creates a static local-synchronous operation transport.</en></lang>
 *
 * @param {object} input <lang><zh-CN>descriptor 与同一调用中提供的 complete handler map。</zh-CN><en>Descriptor and complete handler map supplied in same invocation.</en></lang>
 * @returns {object} <lang><zh-CN>失败时 `{ ok:false, diagnostics }`；成功时额外包含受限 `transport`。</zh-CN><en>`{ ok:false, diagnostics }` on failure; on success additionally contains bounded `transport`.</en></lang>
 * @lang zh-CN runtime 不公开 registry/descriptor/handler；transport 仅供 selected adapter 的私有 exchange wrapper 使用。
 * @lang en Runtime exposes no registry/descriptor/handler; transport is only for selected adapter private exchange wrapper.
 */
export function createStaticOperationTransport(input) {
  // <lang><zh-CN>初始化 root 必须精确，防止 input 因 endpoint、option 或动态 loader 字段而扩张。</zh-CN><en>Initialization root must be exact, preventing input expansion through endpoint, option, or dynamic-loader field.</en></lang>
  if (!isPlainObject(input) || !hasExactDataKeys(input, INITIALIZATION_KEYS)) {
    return {
      ok: false,
      diagnostics: [createDiagnostic('transport-operation.initialization.invalid', 'Transport operation 初始化输入必须是精确的普通对象。', 'The transport-operation initialization input must be an exact plain object.')]
    };
  }

  // <lang><zh-CN>先校验 descriptor；非法 metadata 时既不检查 handler 也不建立 partial transport。</zh-CN><en>Validate descriptor first; invalid metadata neither inspects handlers nor creates partial transport.</en></lang>
  const descriptorValidation = validateTransportOperationDescriptor(input.descriptor);
  if (!descriptorValidation.ok) {
    return descriptorValidation;
  }

  // <lang><zh-CN>handler map 必须是普通 record，其 exact key set 与 declared operation IDs 一一对应。</zh-CN><en>Handler map must be an ordinary record whose exact key set corresponds one-to-one with declared operation IDs.</en></lang>
  const expectedOperationIds = input.descriptor.operations.map((operation) => operation.id);
  const handlersAreValid = isPlainObject(input.handlers)
    && hasExactDataKeys(input.handlers, expectedOperationIds)
    && expectedOperationIds.every((operationId) => {
      const handlerDescriptor = Object.getOwnPropertyDescriptor(input.handlers, operationId);
      return handlerDescriptor !== undefined
        && handlerDescriptor.enumerable
        && Object.hasOwn(handlerDescriptor, 'value')
        && typeof handlerDescriptor.value === 'function';
    });
  if (!handlersAreValid) {
    return {
      ok: false,
      diagnostics: [createDiagnostic('transport-operation.handlers.invalid', 'Transport operation handler map 必须完整且精确对应已声明 operation。', 'The transport-operation handler map must completely and exactly correspond to declared operations.')]
    };
  }

  // <lang><zh-CN>在初始化时固定 handler function references，调用方随后修改原 map 不会改变 transport 行为。</zh-CN><en>Fix handler function references during initialization so caller mutations to original map cannot change transport behavior.</en></lang>
  const handlersByOperationId = new Map(expectedOperationIds.map((operationId) => [
    operationId,
    Object.getOwnPropertyDescriptor(input.handlers, operationId).value
  ]));

  // <lang><zh-CN>observation 只保留稳定计数，不保存 operation ID、input、outcome、exception 或 handler reference。</zh-CN><en>Observation retains only stable counts and stores no operation ID, input, outcome, exception, or handler reference.</en></lang>
  const observation = {
    invocations: 0,
    successes: 0,
    failures: {
      operation: 0,
      input: 0,
      handler: 0
    }
  };

  /**
   * <lang><zh-CN>调用一个已声明的 local read operation。</zh-CN><en>Invokes one declared local read operation.</en></lang>
   *
   * @param {string} operationId <lang><zh-CN>selected adapter 源码字面传入的 operation ID。</zh-CN><en>Operation ID passed as source literal by selected adapter.</en></lang>
   * @param {unknown} inputValue <lang><zh-CN>仅在 selected adapter 内可见的 wire plain data。</zh-CN><en>Wire plain data visible only inside selected adapter.</en></lang>
   * @returns {object} <lang><zh-CN>成功 envelope 或不含 raw data 的 local failure envelope。</zh-CN><en>Success envelope or local failure envelope containing no raw data.</en></lang>
   * @lang zh-CN operation dispatch 不执行 canonical conversion；selected adapter 继续拥有 wire-to-canonical mapping 与 port failure projection。
   * @lang en Operation dispatch executes no canonical conversion; selected adapter continues to own wire-to-canonical mapping and port-failure projection.
   */
  const invoke = (operationId, inputValue) => {
    // <lang><zh-CN>每次 invocation 都计数，包含未知 operation；计数没有 caller value。</zh-CN><en>Count every invocation, including unknown operation; counts contain no caller value.</en></lang>
    observation.invocations += 1;

    // <lang><zh-CN>operation lookup 只使用初始化固定 map；不进行 discovery、fallback 或 handler selection。</zh-CN><en>Operation lookup uses only initialization-fixed map and performs no discovery, fallback, or handler selection.</en></lang>
    const handler = typeof operationId === 'string' ? handlersByOperationId.get(operationId) : undefined;
    if (handler === undefined) {
      observation.failures.operation += 1;
      return {
        ok: false,
        failure: createTransportFailure('transport-operation.operation-unavailable', '所选本地 transport operation 当前不可用。', 'The selected local transport operation is currently unavailable.')
      };
    }

    // <lang><zh-CN>先复制 input，防止 handler 读取 accessor、保留调用方引用或修改 adapter-private request。</zh-CN><en>Copy input first, preventing handler from reading accessor, retaining caller reference, or mutating adapter-private request.</en></lang>
    let isolatedInput;
    try {
      isolatedInput = clonePlainData(inputValue);
    } catch {
      observation.failures.input += 1;
      return {
        ok: false,
        failure: createTransportFailure('transport-operation.input-invalid', '本地 transport operation 输入不符合受限 plain-data 契约。', 'The local transport-operation input does not satisfy bounded plain-data contract.')
      };
    }

    // <lang><zh-CN>handler invocation 与 outcome copy 在同一隔离区域内执行；所有内部异常统一脱敏。</zh-CN><en>Run handler invocation and outcome copy in one isolation region; redact every internal exception uniformly.</en></lang>
    try {
      const handlerOutcome = handler(isolatedInput);
      const isolatedOutcome = clonePlainData(handlerOutcome);
      observation.successes += 1;
      return {
        ok: true,
        outcome: isolatedOutcome
      };
    } catch {
      observation.failures.handler += 1;
      return {
        ok: false,
        failure: createTransportFailure('transport-operation.operation-unavailable', '所选本地 transport operation 当前不可用。', 'The selected local transport operation is currently unavailable.')
      };
    }
  };

  /**
   * <lang><zh-CN>返回当前 transport instance 的 count-only observation。</zh-CN><en>Returns count-only observation for current transport instance.</en></lang>
   *
   * @returns {object} <lang><zh-CN>完全隔离的稳定计数。</zh-CN><en>Fully isolated stable counts.</en></lang>
   * @lang zh-CN observation 只用于本地测试/开发诊断，不属于 business port、UI state 或 telemetry export。
   * @lang en Observation is only for local test/development diagnostics and is not business port, UI state, or telemetry export.
   */
  const getObservation = () => ({
    invocations: observation.invocations,
    successes: observation.successes,
    failures: {
      operation: observation.failures.operation,
      input: observation.failures.input,
      handler: observation.failures.handler
    }
  });

  return {
    ok: true,
    diagnostics: [],
    transport: {
      invoke,
      getObservation
    }
  };
}
