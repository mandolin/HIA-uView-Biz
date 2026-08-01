/**
 * <lang><zh-CN>中性目录—查询—详情 example 的确定性 mock 实现：提供查询/详情、受限 acknowledge command、mock session 与 route action，不连接任何后端。</zh-CN><en>Deterministic mock implementation for the neutral catalog-query-detail example: provides query/detail, bounded acknowledge command, mock session, and route action without connecting to any backend.</en></lang>
 * @lang zh-CN 所有 entry、receipt 与失败文案均为本模块自有测试数据；本模块不读取文件、网络、环境变量、真实时间、随机值或用户存储。
 * @lang en Every entry, receipt, and failure message is module-owned test data; this module reads no file, network, environment variable, real time, random value, or user storage.
 */

/**
 * <lang><zh-CN>example module 与 port 所使用的固定契约版本。</zh-CN><en>The fixed contract version used by the example module and its ports.</en></lang>
 * @lang zh-CN 与公开 contract 一致，且只表达当前 fixture 范围。
 * @lang en It aligns with the public contract and expresses only the current fixture scope.
 */
const CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>中性业务模块的稳定标识。</zh-CN><en>The stable identifier of the neutral business module.</en></lang>
 * @lang zh-CN 该标识不代表行业、生产数据主责或发布包名。
 * @lang en This identifier represents neither an industry, production-data ownership, nor a published package name.
 */
const MODULE_ID = 'example.catalog-query-detail';

/**
 * <lang><zh-CN>中性 mock 实现包的稳定标识。</zh-CN><en>The stable identifier of the neutral mock implementation package.</en></lang>
 * @lang zh-CN core/profile 仅通过该 ID 显式选择该 fixture-only 实现。
 * @lang en The core/profile selects this fixture-only implementation explicitly through this ID alone.
 */
const IMPLEMENTATION_ID = 'example.catalog-query-detail.mock-implementation';

/**
 * <lang><zh-CN>catalog filter option 所依赖的中性 reference-data module ID。</zh-CN><en>The neutral reference-data module ID required for catalog filter options.</en></lang>
 * @lang zh-CN 依赖只引用业务能力 ID；本模块不 import reference provider、package 或 fixture。
 * @lang en The dependency references only a business-capability ID; this module imports no reference provider, package, or fixture.
 */
const REFERENCE_DATA_MODULE_ID = 'example.reference-data';

/**
 * <lang><zh-CN>中性 entry acknowledge command 的稳定 required port ID。</zh-CN><en>Stable required-port ID of the neutral entry acknowledge command.</en></lang>
 * @lang zh-CN ID 只表示当前 module 内的明确 command 边界，不是 URL、route、事件名或动态 provider selector。
 * @lang en The ID denotes only the explicit command boundary in current module and is not a URL, route, event name, or dynamic provider selector.
 */
const ENTRY_ACKNOWLEDGE_PORT_ID = 'entry-acknowledge';

/**
 * <lang><zh-CN>中性 acknowledge command 与 receipt 共用的稳定契约 ID。</zh-CN><en>Stable contract ID shared by neutral acknowledge command and receipt.</en></lang>
 * @lang zh-CN 此 ID 只用于 manifest/provider 精确对应，不表述 HTTP operation、数据库表或行业事件。
 * @lang en This ID is used only for exact manifest/provider correspondence and expresses no HTTP operation, database table, or industry event.
 */
const ENTRY_ACKNOWLEDGEMENT_CONTRACT_ID = 'catalog-query-detail.acknowledgement';

/**
 * <lang><zh-CN>当前 deterministic transaction 唯一拥有的中性 entry ID。</zh-CN><en>Only neutral entry ID owned by current deterministic transaction.</en></lang>
 * @lang zh-CN 该 ID 是 fixture 数据，不代表真实目录、外部主键或可发现的 entry 集合。
 * @lang en This ID is fixture data and represents neither a real catalog, external key, nor discoverable entry set.
 */
const ACKNOWLEDGEMENT_ENTRY_ID = 'entry-001';

/**
 * <lang><zh-CN>canonical acknowledge command 根对象允许的精确字段。</zh-CN><en>Exact fields allowed on canonical acknowledge-command root object.</en></lang>
 * @lang zh-CN 精确键集合阻止 payload、patch、自由文本、身份、URL 与其他未审阅控制字段进入 transaction。
 * @lang en The exact key set prevents payload, patch, free text, identity, URL, and other unreviewed control fields from entering transaction.
 */
const ACKNOWLEDGEMENT_COMMAND_KEYS = Object.freeze([
  'contractVersion',
  'kind',
  'commandId',
  'entryId'
]);

/**
 * <lang><zh-CN>transaction factory options 允许的精确字段。</zh-CN><en>Exact fields allowed by transaction-factory options.</en></lang>
 * @lang zh-CN 该选项只供 checked-in deterministic tests 使用，不进入 command、profile、manifest 或 app 配置。
 * @lang en This option serves only checked-in deterministic tests and enters no command, profile, manifest, or app configuration.
 */
const TRANSACTION_OPTION_KEYS = Object.freeze(['transactionMode']);

/**
 * <lang><zh-CN>允许的固定 transaction 模式。</zh-CN><en>Allowed fixed transaction modes.</en></lang>
 * @lang zh-CN `commit-failure` 只证明 rollback/no-partial-mutation，不模拟网络、超时、存储或真实故障。
 * @lang en `commit-failure` proves only rollback/no-partial-mutation and simulates no network, timeout, storage, or real fault.
 */
const TRANSACTION_MODES = new Set(['success', 'commit-failure']);

/**
 * <lang><zh-CN>创建双语显示文本。</zh-CN><en>Creates bilingual display text.</en></lang>
 *
 * @param {string} zhHans 中文文本。 / Chinese text.
 * @param {string} en English text.
 * @returns {{'zh-Hans': string, en: string}} 本地化文本。 / Localized text.
 * @lang zh-CN 此 helper 确保 mock 的所有人类文案显式包含 zh-Hans 与 en。
 * @lang en This helper ensures every human-facing mock message explicitly contains zh-Hans and en.
 */
function createLocalizedText(zhHans, en) {
  // <lang><zh-CN>返回新对象，避免不同结果共享同一可变文本容器。</zh-CN><en>Return a new object so different results do not share the same mutable text container.</en></lang>
  return {
    'zh-Hans': zhHans,
    en
  };
}

/**
 * <lang><zh-CN>判断值是否为可受限检查自有字段的 plain 非数组对象。</zh-CN><en>Determines whether a value is a plain non-array object whose own fields can be inspected within a boundary.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待检查值。</zh-CN><en>Value to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否满足最小 plain-record shape。</zh-CN><en>Whether it satisfies minimum plain-record shape.</en></lang>
 * @lang zh-CN guard 只建立受限字段检查前提，不把调用方原型、class instance 或 getter 视为可信 transaction 数据。
 * @lang en Guard establishes only a bounded field-inspection precondition and treats no caller prototype, class instance, or getter as trusted transaction data.
 */
function isRecord(value) {
  // <lang><zh-CN>排除 null、数组和自定义原型，避免位置值、class instance 或原型字段伪装成命名 command 配置。</zh-CN><en>Exclude null, arrays, and custom prototypes, preventing positional values, class instances, or prototype fields from masquerading as named command configuration.</en></lang>
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  // <lang><zh-CN>仅接受普通对象或无原型对象；后续 exact-key guard 还会拒绝 accessor 属性。</zh-CN><en>Accept only ordinary or null-prototype objects; the following exact-key guard also rejects accessor properties.</en></lang>
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * <lang><zh-CN>判断 record 是否精确拥有给定字段集合。</zh-CN><en>Determines whether a record owns exactly a given field set.</en></lang>
 *
 * @param {object} record <lang><zh-CN>已通过最小 record guard 的对象。</zh-CN><en>Object that passed minimum record guard.</en></lang>
 * @param {string[]} expectedKeys <lang><zh-CN>完整允许字段列表。</zh-CN><en>Complete allowed field list.</en></lang>
 * @returns {boolean} <lang><zh-CN>没有缺失或额外 enumerable 自有字段时为 true。</zh-CN><en>True when no enumerable own field is missing or extra.</en></lang>
 * @lang zh-CN 该检查拒绝 command payload/patch/accessor 扩张，且不从原型链借用配置。
 * @lang en This check rejects command payload/patch/accessor expansion and borrows no configuration through prototype chain.
 */
function hasExactOwnKeys(record, expectedKeys) {
  // <lang><zh-CN>先比较数量，随后逐个确认允许键是 enumerable 自有 data property，拒绝 getter/setter 执行。</zh-CN><en>Compare count first and then confirm every allowed key is an enumerable own data property, rejecting getter/setter execution.</en></lang>
  return Object.keys(record).length === expectedKeys.length
    && expectedKeys.every((expectedKey) => {
      const descriptor = Object.getOwnPropertyDescriptor(record, expectedKey);
      return descriptor !== undefined && descriptor.enumerable && Object.hasOwn(descriptor, 'value');
    });
}

/**
 * <lang><zh-CN>判断字符串是否是当前 command contract 接受的稳定小写连字符标识。</zh-CN><en>Determines whether a string is a stable lowercase-hyphen identifier accepted by current command contract.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待校验值。</zh-CN><en>Value to validate.</en></lang>
 * @returns {boolean} <lang><zh-CN>满足有限 command ID pattern 时为 true。</zh-CN><en>True when it meets the finite command-ID pattern.</en></lang>
 * @lang zh-CN pattern 只建立本地 mock 的审阅边界，不生成、规范化或持久化 command ID。
 * @lang en Pattern establishes only the reviewed boundary of local mock and generates, normalizes, and persists no command ID.
 */
function isCommandIdentifier(value) {
  // <lang><zh-CN>长度和字符集同时限制，防止空白、路径、URL、表达式或无界文本成为 idempotency key。</zh-CN><en>Limit length and character set together, preventing whitespace, path, URL, expression, or unbounded text from becoming idempotency key.</en></lang>
  return typeof value === 'string' && /^[a-z][a-z0-9-]{2,63}$/.test(value);
}

/**
 * <lang><zh-CN>创建不含 wire 细节的规范化 failure。</zh-CN><en>Creates a canonical failure that contains no wire details.</en></lang>
 *
 * @param {string} code 稳定失败代码。 / Stable failure code.
 * @param {string} zhHans 中文失败说明。 / Chinese failure explanation.
 * @param {string} en English failure explanation.
 * @param {boolean} retryable 是否允许调用方重试。 / Whether a caller may retry.
 * @param {'request'|'adapter'|'section'|'session'|'command'|'transaction'} scope 失败所属范围。 / Failure scope.
 * @returns {object} 规范化失败对象。 / Canonical failure object.
 * @lang zh-CN failure 不包含 HTTP、Directus、token、URL 或原始请求数据。
 * @lang en A failure contains no HTTP, Directus, token, URL, or raw request data.
 */
function createFailure(code, zhHans, en, retryable, scope) {
  // <lang><zh-CN>统一 result shape 让 core/UI 可以只依据 code、scope 与 retryable 分支。</zh-CN><en>The uniform result shape lets core/UI branch only on code, scope, and retryable.</en></lang>
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
 * <lang><zh-CN>创建测试自有的中性 entry 显示对象。</zh-CN><en>Creates a test-owned neutral entry display object.</en></lang>
 *
 * @param {string} id 稳定测试 entry ID。 / Stable test entry ID.
 * @param {string} ordinal 面向人显示的序号。 / Human-facing ordinal.
 * @returns {{id: string, label: {'zh-Hans': string, en: string}}} 中性 entry。 / Neutral entry.
 * @lang zh-CN entry 仅有 ID 与双语 label，不含行业字段、真实资源或生产主责。
 * @lang en An entry contains only ID and bilingual label, with no industry field, real resource, or production ownership.
 */
function createEntry(id, ordinal) {
  // <lang><zh-CN>label 按测试序号生成，使每个 fixture 的输入输出可预测且不复制业务文案。</zh-CN><en>Create the label from a test ordinal, making each fixture's input/output predictable without copying business copy.</en></lang>
  const label = createLocalizedText(`示例条目 ${ordinal}`, `Example entry ${ordinal}`);

  // <lang><zh-CN>返回新的 entry 对象，调用方可以比较值而不会共享可变记录。</zh-CN><en>Return a new entry object so callers can compare values without sharing a mutable record.</en></lang>
  return { id, label };
}

/**
 * <lang><zh-CN>校验公开 page/pageSize query 的最小形状。</zh-CN><en>Validates the minimum shape of a public page/pageSize query.</en></lang>
 *
 * @param {unknown} request 传给 catalog-query port 的输入。 / Input passed to the catalog-query port.
 * @returns {object|null} 无效时的 canonical failure；合法时为 null。 / A canonical failure when invalid; null when valid.
 * @lang zh-CN mock 只校验当前明确实现的版本、filter 对象、one-based page 与正 pageSize。
 * @lang en The mock validates only the currently implemented version, filter object, one-based page, and positive pageSize.
 */
function validatePageQuery(request) {
  // <lang><zh-CN>非对象请求没有可安全校验的字段，直接返回 request scope failure。</zh-CN><en>A non-object request has no fields safe to validate, so return a request-scope failure directly.</en></lang>
  if (typeof request !== 'object' || request === null || Array.isArray(request)) {
    // <lang><zh-CN>failure 文案不回显请求内容，避免日志或 UI 泄露调用方输入。</zh-CN><en>The failure wording does not echo request contents, avoiding caller-input leakage through logs or UI.</en></lang>
    return createFailure('invalid-query', '查询输入必须是对象。', 'The query input must be an object.', false, 'request');
  }

  // <lang><zh-CN>版本、filter、page 和 pageSize 是当前 mock 已承诺的唯一 query 字段形状。</zh-CN><en>Version, filter, page, and pageSize are the only query field shapes committed by the current mock.</en></lang>
  const hasValidShape = request.contractVersion === CONTRACT_VERSION && typeof request.filter === 'object' && request.filter !== null && !Array.isArray(request.filter) && Number.isInteger(request.page) && request.page >= 1 && Number.isInteger(request.pageSize) && request.pageSize >= 1;

  // <lang><zh-CN>任一字段不符合最小形状时，在调用 adapter fixture 前返回不可重试 failure。</zh-CN><en>When any field fails the minimum shape, return a non-retryable failure before invoking adapter-fixture behavior.</en></lang>
  if (!hasValidShape) {
    // <lang><zh-CN>该失败对应公开 contract 的 invalid-query code 与 request scope。</zh-CN><en>This failure corresponds to the public contract's invalid-query code and request scope.</en></lang>
    return createFailure('invalid-query', '查询条件不符合该模块的最小契约。', 'The query does not satisfy this module\'s minimum contract.', false, 'request');
  }

  // <lang><zh-CN>返回 null 表示请求可交给当前 mock fixture；null 不是业务结果。</zh-CN><en>Return null to indicate the request may proceed to the current mock fixture; null is not a business result.</en></lang>
  return null;
}

/**
 * <lang><zh-CN>创建一个 instance-local、确定性的中性 entry acknowledgement mock transaction。</zh-CN><en>Creates an instance-local deterministic neutral-entry acknowledgement mock transaction.</en></lang>
 *
 * @param {object} [options={}] <lang><zh-CN>仅测试拥有的固定 transaction mode 选择。</zh-CN><en>Fixed transaction-mode selection owned only by tests.</en></lang>
 * @returns {object} <lang><zh-CN>只暴露 canonical command invoke 与受限 state snapshot 的 transaction。</zh-CN><en>Transaction exposing only canonical command invocation and bounded state snapshot.</en></lang>
 * @lang zh-CN factory 不读取/写入文件、网络、环境、storage、真实时间、随机数或身份；所有 state 在闭包内并随 instance 丢弃。
 * @lang en Factory reads or writes no file, network, environment, storage, real time, random value, or identity; all state remains in closure and is discarded with instance.
 */
export function createEntryAcknowledgementMockTransaction(options = { transactionMode: 'success' }) {
  // <lang><zh-CN>options 必须是 exact plain record，防止测试控制字段扩展到 command 或生产配置面。</zh-CN><en>Options must be an exact plain record, preventing test control fields from expanding into command or production configuration surfaces.</en></lang>
  if (!isRecord(options) || !hasExactOwnKeys(options, TRANSACTION_OPTION_KEYS)) {
    throw new TypeError('Acknowledgement transaction options are invalid.');
  }

  // <lang><zh-CN>只允许两种固定模式；未知值不会变成异常脚本、动态行为或 fallback。</zh-CN><en>Allow only two fixed modes; an unknown value becomes neither exception script, dynamic behavior, nor fallback.</en></lang>
  const transactionMode = options.transactionMode ?? 'success';
  if (!TRANSACTION_MODES.has(transactionMode)) {
    throw new RangeError('Acknowledgement transaction mode is unsupported.');
  }

  // <lang><zh-CN>state 只含单一 fixture entry 的 acknowledgement/revision；不保存 command payload、session、provider 或 UI event。</zh-CN><en>State contains acknowledgement/revision only for one fixture entry and retains no command payload, session, provider, or UI event.</en></lang>
  const state = {
    acknowledgement: 'pending',
    revision: 0
  };

  // <lang><zh-CN>receipt 按 command ID 缓存为不可变 plain data，以实现同 ID retry 的确定性等值结果。</zh-CN><en>Cache receipts by command ID as immutable plain data to implement deterministic equivalent result for same-ID retry.</en></lang>
  const receiptsByCommandId = new Map();

  // <lang><zh-CN>记录 command ID 首次绑定的 entry ID，明确拒绝同一 idempotency key 的不兼容重用。</zh-CN><en>Record entry ID first bound by command ID, explicitly rejecting incompatible reuse of same idempotency key.</en></lang>
  const entryIdByCommandId = new Map();

  /**
   * <lang><zh-CN>返回 transaction 自有 state 的最小隔离快照。</zh-CN><en>Returns minimum detached snapshot of transaction-owned state.</en></lang>
   *
 * @returns {object} <lang><zh-CN>仅含 fixture entry ID、acknowledgement 与非负 revision 的新对象。</zh-CN><en>New object containing only fixture entry ID, acknowledgement, and nonnegative revision.</en></lang>
   * @lang zh-CN snapshot 不含 command ID 历史、receipt map、provider、session 或内部选项；调用方修改不会写回 transaction。
   * @lang en Snapshot contains no command-ID history, receipt map, provider, session, or internal option; caller changes cannot write back into transaction.
   */
  const getSnapshot = () => ({
    entryId: ACKNOWLEDGEMENT_ENTRY_ID,
    acknowledgement: state.acknowledgement,
    revision: state.revision
  });

  /**
   * <lang><zh-CN>构造 canonical acknowledge-entry receipt 的独立副本。</zh-CN><en>Constructs an independent copy of canonical acknowledge-entry receipt.</en></lang>
   *
   * @param {object} receipt <lang><zh-CN>transaction 已保存的稳定 receipt metadata。</zh-CN><en>Stable receipt metadata already saved by transaction.</en></lang>
   * @returns {object} <lang><zh-CN>调用方可修改但不会回写的 receipt 副本。</zh-CN><en>Receipt copy caller may mutate without writeback.</en></lang>
   * @lang zh-CN helper 明确列出公开字段，不把 map entry、state 或 command 原文泄露给调用方。
   * @lang en Helper explicitly lists public fields and leaks no map entry, state, or raw command to caller.
   */
  const copyReceipt = (receipt) => ({
    contractVersion: receipt.contractVersion,
    kind: receipt.kind,
    commandId: receipt.commandId,
    entryId: receipt.entryId,
    outcome: receipt.outcome,
    revision: receipt.revision
  });

  /**
   * <lang><zh-CN>以精确 shape 校验并复制当前 command 的稳定字段。</zh-CN><en>Validates exact shape and copies stable fields of current command.</en></lang>
   *
   * @param {unknown} command <lang><zh-CN>调用方提供的候选 command。</zh-CN><en>Candidate command supplied by caller.</en></lang>
   * @returns {{ok: true, commandId: string, entryId: string}|{ok: false, failure: object}} <lang><zh-CN>安全 command metadata 或 canonical failure。</zh-CN><en>Safe command metadata or canonical failure.</en></lang>
   * @lang zh-CN validation 不回显输入值；任一 invalid shape 都在 state/map 检查和 mutation 前拒绝。
   * @lang en Validation echoes no input value; any invalid shape is rejected before state/map inspection and mutation.
   */
  const validateCommand = (command) => {
    // <lang><zh-CN>只读取经过 guard 的 exact own keys，避免 payload、prototype 或 getter 成为 transaction 输入。</zh-CN><en>Read only exact own keys that passed guard, preventing payload, prototype, or getter from becoming transaction input.</en></lang>
    if (!isRecord(command) || !hasExactOwnKeys(command, ACKNOWLEDGEMENT_COMMAND_KEYS)) {
      return {
        ok: false,
        failure: createFailure(
          'invalid-command',
          '确认命令不符合最小契约。',
          'The acknowledgement command does not satisfy the minimum contract.',
          false,
          'command'
        )
      };
    }

    // <lang><zh-CN>版本、kind、command ID 与唯一 entry ID 同时固定，当前 contract 不接受 alias、patch 或其他 command kind。</zh-CN><en>Fix version, kind, command ID, and sole entry ID together; current contract accepts no alias, patch, or other command kind.</en></lang>
    const isValid = command.contractVersion === CONTRACT_VERSION
      && command.kind === 'acknowledge-entry'
      && isCommandIdentifier(command.commandId)
      && typeof command.entryId === 'string';
    if (!isValid) {
      return {
        ok: false,
        failure: createFailure(
          'invalid-command',
          '确认命令不符合最小契约。',
          'The acknowledgement command does not satisfy the minimum contract.',
          false,
          'command'
        )
      };
    }

    // <lang><zh-CN>只复制两个稳定标识；command 原对象随后修改不能影响本次 idempotency/entry 分支。</zh-CN><en>Copy only two stable identifiers so later mutation of original command cannot affect this idempotency/entry branch.</en></lang>
    return {
      ok: true,
      commandId: command.commandId,
      entryId: command.entryId
    };
  };

  /**
   * <lang><zh-CN>执行一次 canonical acknowledge-entry command。</zh-CN><en>Executes one canonical acknowledge-entry command.</en></lang>
   *
   * @param {unknown} command <lang><zh-CN>调用方传入的候选 command plain data。</zh-CN><en>Candidate command plain data passed by caller.</en></lang>
   * @returns {object} <lang><zh-CN>成功时为 detached receipt，失败时为 canonical failure。</zh-CN><en>Detached receipt on success, canonical failure on failure.</en></lang>
   * @lang zh-CN 函数只对当前 closure state 进行受控 mutation；没有 I/O、并发、timer、queue、storage 或真实 rollback protocol。
   * @lang en Function performs controlled mutation only on current closure state; it has no I/O, concurrency, timer, queue, storage, or real rollback protocol.
   */
  const invoke = (command) => {
    // <lang><zh-CN>无效 command 在读取 receipt/state 前直接返回安全 failure，避免 caller 值影响任何可观察 transaction 结果。</zh-CN><en>Invalid command returns safe failure before receipt/state read, preventing caller values from affecting any observable transaction result.</en></lang>
    const validation = validateCommand(command);
    if (!validation.ok) {
      return validation.failure;
    }

    // <lang><zh-CN>相同 command ID 若曾绑定其他 entry，必须明确拒绝而不是把 retry 误当成新 command。</zh-CN><en>If same command ID was bound to another entry, reject explicitly instead of mistaking retry for new command.</en></lang>
    const boundEntryId = entryIdByCommandId.get(validation.commandId);
    if (boundEntryId !== undefined && boundEntryId !== validation.entryId) {
      return createFailure(
        'command-id-conflict',
        '命令标识已绑定到不兼容的确认请求。',
        'The command identifier is already bound to an incompatible acknowledgement request.',
        false,
        'command'
      );
    }

    // <lang><zh-CN>相同已提交 command ID 返回保存 receipt 的独立副本；不触碰 revision 或 acknowledgement。</zh-CN><en>Return detached copy of saved receipt for same submitted command ID; touch neither revision nor acknowledgement.</en></lang>
    const previousReceipt = receiptsByCommandId.get(validation.commandId);
    if (previousReceipt !== undefined) {
      return copyReceipt(previousReceipt);
    }

    // <lang><zh-CN>未知 entry 在任何 map/state mutation 前拒绝，且不列出该 fixture 唯一允许 ID。</zh-CN><en>Reject unknown entry before any map/state mutation and do not list this fixture's sole allowed ID.</en></lang>
    if (validation.entryId !== ACKNOWLEDGEMENT_ENTRY_ID) {
      return createFailure(
        'not-found',
        '未找到请求的示例 entry。',
        'The requested example entry was not found.',
        false,
        'request'
      );
    }

    // <lang><zh-CN>已确认 entry 的不同 command ID 不是 retry；按维护者确定的规则返回不可重试 command failure，并保持 state 不变。</zh-CN><en>A different command ID for an acknowledged entry is not a retry; per confirmed rule return non-retryable command failure and retain state.</en></lang>
    if (state.acknowledgement === 'acknowledged') {
      return createFailure(
        'command-not-applicable',
        '当前 entry 已确认，不能应用新的确认命令。',
        'The current entry is already acknowledged and cannot accept a new acknowledgement command.',
        false,
        'command'
      );
    }

    // <lang><zh-CN>固定失败模式在提交前返回 transaction failure；不会写入 command ID、receipt、acknowledgement 或 revision，形成显式 rollback/no-partial-mutation 证据。</zh-CN><en>The fixed failure mode returns transaction failure before commit; it writes no command ID, receipt, acknowledgement, or revision, forming explicit rollback/no-partial-mutation evidence.</en></lang>
    if (transactionMode === 'commit-failure') {
      return createFailure(
        'command-transaction-failed',
        '示例确认事务未提交。',
        'The example acknowledgement transaction did not commit.',
        false,
        'transaction'
      );
    }

    // <lang><zh-CN>所有 precondition 已满足后才一次性推进有限 state；revision 只在首个成功 command 增加一次。</zh-CN><en>Advance finite state only after every precondition passes; revision increases once only for first successful command.</en></lang>
    state.acknowledgement = 'acknowledged';
    state.revision += 1;
    const receipt = {
      contractVersion: CONTRACT_VERSION,
      kind: 'command-receipt',
      commandId: validation.commandId,
      entryId: ACKNOWLEDGEMENT_ENTRY_ID,
      outcome: 'acknowledged',
      revision: state.revision
    };

    // <lang><zh-CN>成功后同时保存 command-to-entry 关系和 receipt；两者只保存安全 metadata，不保留调用方 command 对象。</zh-CN><en>After success save command-to-entry relationship and receipt; both retain only safe metadata and no caller command object.</en></lang>
    entryIdByCommandId.set(validation.commandId, ACKNOWLEDGEMENT_ENTRY_ID);
    receiptsByCommandId.set(validation.commandId, receipt);

    // <lang><zh-CN>返回新 receipt 副本，调用方无法通过返回值改写 idempotency cache。</zh-CN><en>Return new receipt copy so caller cannot rewrite idempotency cache through returned value.</en></lang>
    return copyReceipt(receipt);
  };

  // <lang><zh-CN>冻结最小 API，不泄露 mutable Map、state、transaction mode 或内部 validation helper。</zh-CN><en>Freeze minimum API and expose no mutable map, state, transaction mode, or internal validation helper.</en></lang>
  return Object.freeze({ invoke, getSnapshot });
}

/**
 * <lang><zh-CN>创建中性 example 的 module、implementation package 与 profile 声明。</zh-CN><en>Creates module, implementation-package, and profile declarations for the neutral example.</en></lang>
 *
 * @returns {{businessModule: object, implementationPackage: object, profile: object}} 可显式交给 core 的声明集合。 / A declaration set that can be passed explicitly to the core.
 * @lang zh-CN 每次调用返回新对象，允许测试制造非法关系而不污染后续装配。
 * @lang en Each call returns new objects, allowing tests to create invalid relations without contaminating subsequent assembly.
 */
export function createExampleManifests() {
  // <lang><zh-CN>业务模块声明拥有 port、allowlist、依赖和冲突，不承担工程分发事实。</zh-CN><en>The business-module declaration owns ports, allowlists, dependencies, and conflicts and does not own engineering-distribution facts.</en></lang>
  const businessModule = {
    manifestVersion: CONTRACT_VERSION,
    kind: 'business-module',
    id: MODULE_ID,
    displayName: createLocalizedText('通用目录—查询—详情示例', 'Catalog query and detail example'),
    business: {
      responsibility: createLocalizedText('提供中性 entry 目录、查询、详情与受限确认命令。', 'Provides neutral entry catalog, query, detail, and bounded acknowledgement command.'),
      lifecycle: 'profile-selected',
      permissions: []
    },
    contracts: {
      ports: [
        {
          id: 'catalog-query',
          direction: 'required',
          contract: { id: 'catalog-query-detail.query', version: CONTRACT_VERSION }
        },
        {
          id: 'entry-detail',
          direction: 'required',
          contract: { id: 'catalog-query-detail.detail', version: CONTRACT_VERSION }
        },
        {
          id: ENTRY_ACKNOWLEDGE_PORT_ID,
          direction: 'required',
          contract: { id: ENTRY_ACKNOWLEDGEMENT_CONTRACT_ID, version: CONTRACT_VERSION }
        },
        {
          id: 'session-state',
          direction: 'required',
          contract: { id: 'catalog-query-detail.session', version: CONTRACT_VERSION }
        }
      ],
      filterSchema: { id: 'catalog-query-detail.filter', version: CONTRACT_VERSION },
      outcomes: [
        { id: 'catalog-query-detail.query-result', version: CONTRACT_VERSION },
        { id: 'catalog-query-detail.detail-result', version: CONTRACT_VERSION },
        { id: 'catalog-query-detail.command-receipt', version: CONTRACT_VERSION },
        { id: 'catalog-query-detail.failure', version: CONTRACT_VERSION }
      ]
    },
    configuration: {
      registeredBlocks: ['catalog-list', 'entry-detail'],
      paginationModes: ['page'],
      visibilityConditions: ['always', 'has-results', 'has-selection', 'detail-ready'],
      ordering: 'profile-controlled'
    },
    // <lang><zh-CN>目录能力显式依赖中性 reference-data，以确保已声明 filter option 先可用。</zh-CN><en>The catalog capability explicitly depends on neutral reference-data so declared filter options are available first.</en></lang>
    dependencies: [REFERENCE_DATA_MODULE_ID],
    conflicts: []
  };

  // <lang><zh-CN>实现包声明只描述 fixture-only 工程交付与其提供的 port，不拥有业务主责。</zh-CN><en>The implementation-package declaration describes only fixture-only engineering delivery and its supplied ports and owns no business responsibility.</en></lang>
  const implementationPackage = {
    manifestVersion: CONTRACT_VERSION,
    kind: 'implementation-package',
    id: IMPLEMENTATION_ID,
    moduleId: MODULE_ID,
    package: {
      identity: 'example-catalog-query-detail-mock',
      distribution: 'fixture-only'
    },
    runtime: {
      targets: ['mp-weixin'],
      surfaces: ['adapter', 'channel-projection', 'mock-session', 'mock-command', 'presentation-block']
    },
    provides: [
      {
        id: 'catalog-query',
        kind: 'adapter',
        contract: { id: 'catalog-query-detail.query', version: CONTRACT_VERSION }
      },
      {
        id: 'entry-detail',
        kind: 'adapter',
        contract: { id: 'catalog-query-detail.detail', version: CONTRACT_VERSION }
      },
      {
        id: ENTRY_ACKNOWLEDGE_PORT_ID,
        kind: 'mock-command',
        contract: { id: ENTRY_ACKNOWLEDGEMENT_CONTRACT_ID, version: CONTRACT_VERSION }
      },
      {
        id: 'session-state',
        kind: 'mock-session',
        contract: { id: 'catalog-query-detail.session', version: CONTRACT_VERSION }
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
      evidence: ['manifest-schema', 'contract-fixture'],
      status: 'planned'
    }
  };

  // <lang><zh-CN>profile 只选择已登记 module、implementation、block、condition 和 screen/action ID。</zh-CN><en>The profile selects only registered module, implementation, block, condition, and screen/action IDs.</en></lang>
  const profile = {
    id: MODULE_ID,
    // <lang><zh-CN>core profile 同时选择当前模块及其业务依赖，但不会自动发现或安装依赖。</zh-CN><en>The core profile selects the current module and its business dependency but does not discover or install that dependency automatically.</en></lang>
    enabledModuleIds: [REFERENCE_DATA_MODULE_ID, MODULE_ID],
    implementationPackageIds: [IMPLEMENTATION_ID],
    selectedBlocks: ['catalog-list', 'entry-detail'],
    visibilityByBlock: {
      'catalog-list': 'always',
      'entry-detail': 'has-selection'
    },
    blockOrder: ['catalog-list', 'entry-detail'],
    routeProjection: {
      channel: 'mp-weixin',
      screens: [
        { intent: 'catalog', screenId: 'catalog-list', blocks: ['catalog-list'] },
        { intent: 'entry-detail', screenId: 'entry-detail', blocks: ['entry-detail'] }
      ],
      actions: [
        { id: 'select-entry', from: 'catalog-list', to: 'entry-detail' }
      ]
    }
  };

  // <lang><zh-CN>显式返回三类声明，调用方不必从文件系统、环境或隐式注册表发现它们。</zh-CN><en>Return the three declaration types explicitly so callers need not discover them from filesystem, environment, or implicit registry.</en></lang>
  return { businessModule, implementationPackage, profile };
}

/**
 * <lang><zh-CN>创建 `example.catalog-query-detail` 的确定性 mock provider 集合与 route action 解析器。</zh-CN><en>Creates deterministic mock providers and a route-action resolver for `example.catalog-query-detail`.</en></lang>
 *
 * @param {object} [options] fixture 行为选择。 / Fixture behavior selection.
 * @returns {object} mock 能力集合。 / Mock capability collection.
 * @lang zh-CN fixtureCase 只选择预定义的本地测试行为，不接受远端代码、数据源或动态 import。
 * @lang en fixtureCase selects only predefined local test behavior and accepts no remote code, data source, or dynamic import.
 */
export function createCatalogQueryDetailMock(options = {}) {
  // <lang><zh-CN>从显式 options 读取 fixture case；未提供时使用 first-page，保持测试默认可预测。</zh-CN><en>Read the fixture case from explicit options; when absent, use first-page to keep the test default predictable.</en></lang>
  const fixtureCase = options.fixtureCase ?? 'first-page';

  // <lang><zh-CN>允许列表阻止未知字符串成为动态行为开关。</zh-CN><en>The allowlist prevents an unknown string from becoming a dynamic-behavior switch.</en></lang>
  const allowedFixtureCases = new Set(['first-page', 'last-page', 'empty-query', 'adapter-failure', 'detail-section-failure']);

  // <lang><zh-CN>未知 fixture 是测试配置错误，立即抛出且不回显 options 对象内容。</zh-CN><en>An unknown fixture is a test-configuration error; throw immediately without echoing options-object contents.</en></lang>
  if (!allowedFixtureCases.has(fixtureCase)) {
    // <lang><zh-CN>错误只包含 allowlisted fixture 名称，便于维护者修正本地测试设置。</zh-CN><en>The error includes only allowlisted fixture names, helping maintainers correct local test setup.</en></lang>
    throw new RangeError(`Unsupported fixture case: ${fixtureCase}`);
  }

  // <lang><zh-CN>每个 catalog mock instance 取得自己的 success transaction；query/detail fixture 不读取或修改 command state。</zh-CN><en>Each catalog mock instance receives its own success transaction; query/detail fixtures neither read nor modify command state.</en></lang>
  const acknowledgementTransaction = createEntryAcknowledgementMockTransaction({
    transactionMode: 'success'
  });

  /**
   * <lang><zh-CN>按当前 fixture 处理规范化 catalog query。</zh-CN><en>Handles a canonical catalog query for the current fixture.</en></lang>
   *
   * @param {unknown} request 公开 query 输入。 / Public query input.
   * @returns {object} canonical page 或 failure。 / Canonical page or failure.
   * @lang zh-CN 此函数先校验 query，再模拟 adapter 行为；绝不创建网络请求。
   * @lang en This function validates query first and then simulates adapter behavior; it never creates a network request.
   */
  const query = (request) => {
    // <lang><zh-CN>最小 query 校验失败时返回其 canonical failure，不进入 fixture 分支。</zh-CN><en>When minimum query validation fails, return its canonical failure and do not enter fixture branches.</en></lang>
    const queryFailure = validatePageQuery(request);

    // <lang><zh-CN>非空 failure 表示调用方请求不合法，而不是 adapter 不可用。</zh-CN><en>A non-null failure means the caller request is invalid rather than the adapter being unavailable.</en></lang>
    if (queryFailure !== null) {
      // <lang><zh-CN>直接返回 request scope failure，保持错误来源与重试语义不变。</zh-CN><en>Return the request-scope failure directly, preserving source and retry semantics.</en></lang>
      return queryFailure;
    }

    // <lang><zh-CN>adapter-failure fixture 只模拟已声明 adapter 不可用，不附带 HTTP 或 backend 细节。</zh-CN><en>The adapter-failure fixture simulates only an unavailable declared adapter and attaches no HTTP or backend detail.</en></lang>
    if (fixtureCase === 'adapter-failure') {
      // <lang><zh-CN>该失败可重试，因为请求本身已通过最小校验。</zh-CN><en>This failure is retryable because the request itself passed minimum validation.</en></lang>
      return createFailure('adapter-unavailable', '示例 adapter 暂时不可用。', 'The example adapter is temporarily unavailable.', true, 'adapter');
    }

    // <lang><zh-CN>empty-query fixture 返回成功但空的 page，便于验证 UI/host 的 empty state。</zh-CN><en>The empty-query fixture returns a successful but empty page, enabling UI/host empty-state validation.</en></lang>
    if (fixtureCase === 'empty-query') {
      // <lang><zh-CN>page/pageSize 回显输入，确保 empty state 仍遵守相同分页契约。</zh-CN><en>Echo page/pageSize from input so the empty state still obeys the same pagination contract.</en></lang>
      return {
        contractVersion: CONTRACT_VERSION,
        kind: 'page',
        entries: [],
        page: request.page,
        pageSize: request.pageSize,
        total: 0,
        hasNext: false
      };
    }

    // <lang><zh-CN>last-page fixture 使用第二个自有 entry，并明确没有下一页。</zh-CN><en>The last-page fixture uses a second owned entry and explicitly has no next page.</en></lang>
    if (fixtureCase === 'last-page') {
      // <lang><zh-CN>末页条目只服务确定性测试，不代表真实目录长度或业务排序。</zh-CN><en>The final-page entry serves only deterministic testing and represents neither real catalog size nor business ordering.</en></lang>
      const lastEntry = createEntry('entry-002', '002');

      // <lang><zh-CN>返回合法末页 result，total 与 hasNext 共同表达页码语义。</zh-CN><en>Return a valid final-page result whose total and hasNext jointly express page semantics.</en></lang>
      return {
        contractVersion: CONTRACT_VERSION,
        kind: 'page',
        entries: [lastEntry],
        page: request.page,
        pageSize: request.pageSize,
        total: 2,
        hasNext: false
      };
    }

    // <lang><zh-CN>first-page 与 detail-section-failure 都从第一页返回同一中性 entry，差异只发生在 detail fixture。</zh-CN><en>Both first-page and detail-section-failure return the same neutral entry from the first page; their difference occurs only in the detail fixture.</en></lang>
    const firstEntry = createEntry('entry-001', '001');

    // <lang><zh-CN>返回有下一页的成功 page，不泄漏 cursor、offset 或 backend 字段。</zh-CN><en>Return a successful page with a next page and leak no cursor, offset, or backend field.</en></lang>
    return {
      contractVersion: CONTRACT_VERSION,
      kind: 'page',
      entries: [firstEntry],
      page: request.page,
      pageSize: request.pageSize,
      total: 2,
      hasNext: true
    };
  };

  /**
   * <lang><zh-CN>按当前 fixture 处理 entry detail 请求。</zh-CN><en>Handles an entry-detail request for the current fixture.</en></lang>
   *
   * @param {unknown} request 公开 detail 输入。 / Public detail input.
   * @returns {object} canonical detail 或 failure。 / Canonical detail or failure.
   * @lang zh-CN detail 仅识别本模块自有的 `entry-001`，避免形成通用数据检索器。
   * @lang en Detail recognizes only this module's owned `entry-001`, avoiding formation of a general data retriever.
   */
  const detail = (request) => {
    // <lang><zh-CN>非对象或未知 entry ID 统一成为 request scope 的 not-found，而不透露可用 ID 集合。</zh-CN><en>A non-object or unknown entry ID becomes a request-scope not-found failure without revealing the available ID set.</en></lang>
    if (typeof request !== 'object' || request === null || request.contractVersion !== CONTRACT_VERSION || request.entryId !== 'entry-001') {
      // <lang><zh-CN>not-found 不可重试，因为该 mock 的本地数据集不会因重试而增加条目。</zh-CN><en>Not-found is non-retryable because this mock's local data set cannot gain an entry through retrying.</en></lang>
      return createFailure('not-found', '未找到请求的示例 entry。', 'The requested example entry was not found.', false, 'request');
    }

    // <lang><zh-CN>详情主 entry 与查询首项一致，使纵切可以验证 selection 到 detail 的稳定 ID 关系。</zh-CN><en>The detail primary entry matches the first query item, allowing the vertical slice to verify the stable ID relation from selection to detail.</en></lang>
    const entry = createEntry('entry-001', '001');

    // <lang><zh-CN>主 section 始终 ready，证明附属失败不会覆盖已成功加载的主体。</zh-CN><en>The primary section is always ready, proving a supplementary failure does not override successfully loaded primary content.</en></lang>
    const primarySection = { id: 'primary', state: 'ready' };

    // <lang><zh-CN>detail-section-failure fixture 只让附属 section 失败；其他 fixture 返回空附属 section。</zh-CN><en>The detail-section-failure fixture fails only the supplementary section; other fixtures return an empty supplementary section.</en></lang>
    const supplementarySection = fixtureCase === 'detail-section-failure'
      ? {
          id: 'supplementary',
          state: 'failure',
          failure: createFailure('section-unavailable', '附属区块暂时不可用。', 'The supplementary section is temporarily unavailable.', true, 'section')
        }
      : { id: 'supplementary', state: 'empty' };

    // <lang><zh-CN>返回 canonical detail，sections 顺序固定，便于 fixture 测试和可重复的呈现投影。</zh-CN><en>Return canonical detail with fixed section order for fixture tests and repeatable presentation projection.</en></lang>
    return {
      contractVersion: CONTRACT_VERSION,
      kind: 'detail',
      entry,
      sections: [primarySection, supplementarySection]
    };
  };

  /**
   * <lang><zh-CN>返回匿名且无 capability 的 mock session。</zh-CN><en>Returns an anonymous mock session with no capabilities.</en></lang>
   *
   * @returns {{contractVersion: string, mode: string, subject: null, capabilities: string[]}} mock session。 / Mock session.
   * @lang zh-CN session 不读取 token、cookie、storage 或任何身份提供方。
   * @lang en The session reads no token, cookie, storage, or identity provider.
   */
  const getSession = () => {
    // <lang><zh-CN>返回新 session 值，避免调用方修改后影响后续 fixture 调用。</zh-CN><en>Return a new session value so caller mutation cannot affect a later fixture invocation.</en></lang>
    return {
      contractVersion: CONTRACT_VERSION,
      mode: 'mock',
      subject: null,
      capabilities: []
    };
  };

  /**
   * <lang><zh-CN>通过当前 mock 的明确 required port 执行一个 canonical acknowledge command。</zh-CN><en>Executes one canonical acknowledge command through current mock's explicit required port.</en></lang>
   *
   * @param {unknown} command <lang><zh-CN>调用方提供的候选 command。</zh-CN><en>Candidate command supplied by caller.</en></lang>
   * @returns {object} <lang><zh-CN>command receipt 或 canonical failure。</zh-CN><en>Command receipt or canonical failure.</en></lang>
   * @lang zh-CN provider 只委托 instance-local transaction；不创建 adapter exchange、HTTP、storage、session mutation 或 UI side effect。
   * @lang en Provider delegates only to instance-local transaction; it creates no adapter exchange, HTTP, storage, session mutation, or UI side effect.
   */
  const acknowledgeEntry = (command) => {
    // <lang><zh-CN>transaction 负责完整 validation/idempotency/rollback；mock provider 不复制或解释 command 字段。</zh-CN><en>Transaction owns complete validation, idempotency, and rollback; mock provider neither copies nor interprets command fields.</en></lang>
    return acknowledgementTransaction.invoke(command);
  };

  // <lang><zh-CN>route projection 只含已登记 ID；它不携带页面路径、URL 或组件 import 信息。</zh-CN><en>The route projection contains only registered IDs and carries no page path, URL, or component-import information.</en></lang>
  const routeProjection = {
    contractVersion: CONTRACT_VERSION,
    channel: 'mp-weixin',
    screens: [
      { intent: 'catalog', screenId: 'catalog-list', blocks: ['catalog-list'] },
      { intent: 'entry-detail', screenId: 'entry-detail', blocks: ['entry-detail'] }
    ],
    actions: [
      { id: 'select-entry', from: 'catalog-list', to: 'entry-detail' }
    ]
  };

  /**
   * <lang><zh-CN>按稳定 action ID 解析受限 route action。</zh-CN><en>Resolves a restricted route action by stable action ID.</en></lang>
   *
   * @param {string} actionId 要解析的 action 标识。 / Action identifier to resolve.
   * @returns {object|undefined} 已登记 action 的副本，未知时为 undefined。 / A copy of the registered action, or undefined when unknown.
   * @lang zh-CN 未知 action 不回退为 URL 或 host 导航；宿主可自行把 undefined 呈现为受控诊断。
 * @lang en An unknown action does not fall back to a URL or host navigation; a host may present undefined as a controlled diagnostic.
   */
  const resolveRouteAction = (actionId) => {
    // <lang><zh-CN>在静态 allowlist 中查找 action，不运行表达式或外部路由规则。</zh-CN><en>Find the action in the static allowlist and run no expression or external routing rule.</en></lang>
    const action = routeProjection.actions.find((candidate) => candidate.id === actionId);

    // <lang><zh-CN>未知 action 返回 undefined；已知 action 返回新对象，避免调用方修改 routeProjection 内部状态。</zh-CN><en>Return undefined for an unknown action; return a new object for a known action so callers cannot mutate routeProjection internal state.</en></lang>
    return action === undefined ? undefined : { ...action };
  };

  // <lang><zh-CN>四个 provider 使用公开 contract reference，供 core 精确验证 query/detail/command/session required port 对应关系。</zh-CN><en>The four providers use public contract references so core can precisely validate query/detail/command/session required-port correspondence.</en></lang>
  const portProviders = {
    'catalog-query': {
      contract: { id: 'catalog-query-detail.query', version: CONTRACT_VERSION },
      invoke: query
    },
    'entry-detail': {
      contract: { id: 'catalog-query-detail.detail', version: CONTRACT_VERSION },
      invoke: detail
    },
    [ENTRY_ACKNOWLEDGE_PORT_ID]: {
      contract: { id: ENTRY_ACKNOWLEDGEMENT_CONTRACT_ID, version: CONTRACT_VERSION },
      invoke: acknowledgeEntry
    },
    'session-state': {
      contract: { id: 'catalog-query-detail.session', version: CONTRACT_VERSION },
      invoke: getSession
    }
  };

  // <lang><zh-CN>返回显式 mock 能力集合；不暴露 fixtureCase 的可变控制面给 composition 或业务数据。</zh-CN><en>Return the explicit mock capability collection and expose no mutable fixture-case control surface to composition or business data.</en></lang>
  return { portProviders, routeProjection, resolveRouteAction };
}
