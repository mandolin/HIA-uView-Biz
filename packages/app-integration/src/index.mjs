/**
 * <lang><zh-CN>Application-template 集成 runtime：校验声明式模板与完整显式能力候选，再建立固定 primary-module 的应用 shell bridge。</zh-CN><en>Application-template integration runtime: validates a declarative template and a complete explicit capability candidate, then establishes an application-shell bridge fixed to the primary module.</en></lang>
 *
 * @lang zh-CN 本模块不加载文件/package、不发现 unit、不执行动态代码，也不暴露 manifest、provider、profile 或调用 payload。
 * @lang en This module loads no file or package, discovers no unit, executes no dynamic code, and exposes no manifest, provider, profile, or invocation payload.
 */

// <lang><zh-CN>复用 candidate-first adoption runtime，保持完整候选与原子切换语义唯一。</zh-CN><en>Reuse the candidate-first adoption runtime so complete-candidate and atomic-switch semantics have one owner.</en></lang>
import {
  createCapabilityAdoptionRuntime
} from '@hia-uview/biz-adoption-runtime';

// <lang><zh-CN>复用既有 application shell，避免 integration 层重新定义 query/detail/navigation 状态机。</zh-CN><en>Reuse the existing application shell so the integration layer does not redefine the query, detail, or navigation state machine.</en></lang>
import {
  createApplicationShell
} from '@hia-uview/biz-app-shell';

/**
 * <lang><zh-CN>Application-template manifest 当前支持的契约版本。</zh-CN><en>Currently supported application-template manifest contract version.</en></lang>
 *
 * @type {string}
 * @lang zh-CN 版本只匹配精确 `1.0`，不执行隐式迁移。
 * @lang en The version matches exact `1.0` only and performs no implicit migration.
 */
const TEMPLATE_VERSION = '1.0';

/**
 * <lang><zh-CN>Template root 的精确字段集合。</zh-CN><en>Exact field set for a template root.</en></lang>
 *
 * @type {string[]}
 * @lang zh-CN 未知字段不能成为脚本、连接或隐式扩展入口。
 * @lang en Unknown fields cannot become script, connection, or implicit-extension entry points.
 */
const TEMPLATE_ROOT_KEYS = Object.freeze([
  'manifestVersion',
  'kind',
  'id',
  'adoptionProfileId',
  'primaryModuleId',
  'capabilitySlots',
  'hostPolicy',
  'routeProjection',
  'screenCapabilityPolicy'
]);

/**
 * <lang><zh-CN>Capability slot 的精确字段集合。</zh-CN><en>Exact field set for a capability slot.</en></lang>
 *
 * @type {string[]}
 */
const SLOT_KEYS = Object.freeze([
  'id',
  'moduleId',
  'requiredState',
  'requiredSurfaces'
]);

/**
 * <lang><zh-CN>宿主采用 policy 的精确字段集合。</zh-CN><en>Exact field set for the host adoption policy.</en></lang>
 *
 * @type {string[]}
 */
const HOST_POLICY_KEYS = Object.freeze([
  'registeredBlocks',
  'registeredVisibility',
  'allowedPageSizes'
]);

/**
 * <lang><zh-CN>静态 route projection 的精确字段集合。</zh-CN><en>Exact field set for a static route projection.</en></lang>
 *
 * @type {string[]}
 */
const ROUTE_KEYS = Object.freeze(['channel', 'screens', 'actions']);

/**
 * <lang><zh-CN>Route screen 的精确字段集合。</zh-CN><en>Exact field set for a route screen.</en></lang>
 *
 * @type {string[]}
 */
const SCREEN_KEYS = Object.freeze(['intent', 'screenId', 'blocks']);

/**
 * <lang><zh-CN>Route action 的精确字段集合。</zh-CN><en>Exact field set for a route action.</en></lang>
 *
 * @type {string[]}
 */
const ACTION_KEYS = Object.freeze(['id', 'from', 'to']);

/**
 * <lang><zh-CN>首版 template 可要求的 implementation surface kind。</zh-CN><en>Implementation surface kinds that the first template contract may require.</en></lang>
 *
 * @type {ReadonlySet<string>}
 * @lang zh-CN 这些值只检查 manifest metadata，不加载或执行对应实现。
 * @lang en These values inspect manifest metadata only and neither load nor execute the implementation.
 */
const ALLOWED_SURFACES = new Set([
  'adapter',
  'channel-projection',
  'mock-command',
  'mock-session',
  'presentation-block'
]);

/**
 * <lang><zh-CN>首版 template 可声明的 channel。</zh-CN><en>Channels that the first template contract may declare.</en></lang>
 *
 * @type {ReadonlySet<string>}
 */
const ALLOWED_CHANNELS = new Set([
  'mp-weixin',
  'uni-app',
  'web',
  'native-app'
]);

/**
 * <lang><zh-CN>判断未知值是否为可审阅的非数组记录。</zh-CN><en>Determines whether an unknown value is a reviewable non-array record.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待检查值。</zh-CN><en>Value to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否具有最小 record shape。</zh-CN><en>Whether it has the minimum record shape.</en></lang>
 * @lang zh-CN 该 guard 只建立 shape 前提，不把对象视为可信配置。
 * @lang en This guard establishes only a shape precondition and does not treat the object as trusted configuration.
 */
function isRecord(value) {
  // <lang><zh-CN>排除 null 与 array，避免后续自有字段读取产生歧义。</zh-CN><en>Exclude null and arrays so later own-field reads remain unambiguous.</en></lang>
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * <lang><zh-CN>检查 record 是否只包含期望字段且没有缺失。</zh-CN><en>Checks whether a record contains exactly the expected fields with none missing.</en></lang>
 *
 * @param {object} record <lang><zh-CN>已通过最小 shape guard 的记录。</zh-CN><en>Record that passed the minimum shape guard.</en></lang>
 * @param {string[]} expectedKeys <lang><zh-CN>允许且必需的字段。</zh-CN><en>Allowed and required fields.</en></lang>
 * @returns {boolean} <lang><zh-CN>字段集合是否精确相同。</zh-CN><en>Whether the field sets are exactly equal.</en></lang>
 */
function hasExactOwnKeys(record, expectedKeys) {
  // <lang><zh-CN>只读取 enumerable own keys，不遍历 prototype。</zh-CN><en>Read enumerable own keys only and never traverse the prototype.</en></lang>
  const actualKeys = Object.keys(record).sort();

  // <lang><zh-CN>复制并排序 expected keys，以确定性顺序逐项比较。</zh-CN><en>Copy and sort expected keys for deterministic item-by-item comparison.</en></lang>
  const sortedExpectedKeys = [...expectedKeys].sort();

  // <lang><zh-CN>长度不同可立即判定存在未知字段或缺失字段。</zh-CN><en>A length difference immediately proves an unknown or missing field.</en></lang>
  if (actualKeys.length !== sortedExpectedKeys.length) {
    return false;
  }

  // <lang><zh-CN>每个排序位置必须一致，避免只检查部分字段。</zh-CN><en>Every sorted position must match so no field is checked only partially.</en></lang>
  return actualKeys.every((key, index) => key === sortedExpectedKeys[index]);
}

/**
 * <lang><zh-CN>检查 stable simple identifier。</zh-CN><en>Checks a stable simple identifier.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待检查标识。</zh-CN><en>Identifier to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否为小写连字符标识。</zh-CN><en>Whether it is a lowercase hyphenated identifier.</en></lang>
 */
function isSimpleIdentifier(value) {
  // <lang><zh-CN>simple ID 不允许点、斜杠、冒号、空白或路径字符。</zh-CN><en>A simple ID permits no dot, slash, colon, whitespace, or path character.</en></lang>
  return typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value);
}

/**
 * <lang><zh-CN>检查 stable dotted identifier。</zh-CN><en>Checks a stable dotted identifier.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待检查标识。</zh-CN><en>Identifier to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否由合法 simple segments 构成。</zh-CN><en>Whether it consists of valid simple segments.</en></lang>
 */
function isDottedIdentifier(value) {
  // <lang><zh-CN>dotted ID 只允许点分小写 segments，不允许 package scope 或路径。</zh-CN><en>A dotted ID permits only lowercase dot-separated segments and no package scope or path.</en></lang>
  return typeof value === 'string'
    && /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)*$/.test(value);
}

/**
 * <lang><zh-CN>检查有限、唯一且满足 predicate 的数组。</zh-CN><en>Checks a finite, unique array whose items satisfy a predicate.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待检查数组。</zh-CN><en>Array to inspect.</en></lang>
 * @param {number} minimum <lang><zh-CN>允许的最小长度。</zh-CN><en>Minimum allowed length.</en></lang>
 * @param {number} maximum <lang><zh-CN>允许的最大长度。</zh-CN><en>Maximum allowed length.</en></lang>
 * @param {Function} predicate <lang><zh-CN>逐项合法性检查。</zh-CN><en>Per-item validity check.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否满足全部数组边界。</zh-CN><en>Whether all array boundaries are satisfied.</en></lang>
 */
function isBoundedUniqueArray(value, minimum, maximum, predicate) {
  // <lang><zh-CN>先检查 array 与长度，阻止无界配置进入 Set。</zh-CN><en>Check array shape and length first so unbounded configuration never enters a Set.</en></lang>
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    return false;
  }

  // <lang><zh-CN>所有元素都必须满足调用方提供的有限 predicate。</zh-CN><en>Every item must satisfy the bounded predicate supplied by the caller.</en></lang>
  if (!value.every((item) => predicate(item))) {
    return false;
  }

  // <lang><zh-CN>Set size 必须与数组长度一致，拒绝重复选择。</zh-CN><en>The Set size must equal the array length, rejecting duplicate selections.</en></lang>
  return new Set(value).size === value.length;
}

/**
 * <lang><zh-CN>复制已验证的 plain metadata。</zh-CN><en>Copies validated plain metadata.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>只含 scalar、array 与 plain record 的 metadata。</zh-CN><en>Metadata containing only scalars, arrays, and plain records.</en></lang>
 * @returns {unknown} <lang><zh-CN>完全分离的 metadata 副本。</zh-CN><en>A fully detached metadata copy.</en></lang>
 * @lang zh-CN 函数不复制 function、class、provider 或特殊对象；这些值不会通过前置校验。
 * @lang en The function does not copy functions, classes, providers, or special objects; such values do not pass prior validation.
 */
function copyMetadata(value) {
  // <lang><zh-CN>数组逐项递归复制，避免 caller 修改 nested order/blocks。</zh-CN><en>Recursively copy array items so caller mutation cannot affect nested order or blocks.</en></lang>
  if (Array.isArray(value)) {
    return value.map((item) => copyMetadata(item));
  }

  // <lang><zh-CN>plain record 只复制自有 enumerable 字段。</zh-CN><en>Copy only enumerable own fields of a plain record.</en></lang>
  if (isRecord(value)) {
    // <lang><zh-CN>新对象从空 record 开始，不继承候选 prototype。</zh-CN><en>Start the new object from an empty record without inheriting the candidate prototype.</en></lang>
    const copy = {};

    // <lang><zh-CN>逐字段递归复制已验证 metadata。</zh-CN><en>Recursively copy each validated metadata field.</en></lang>
    for (const [key, childValue] of Object.entries(value)) {
      copy[key] = copyMetadata(childValue);
    }

    // <lang><zh-CN>返回 caller 可修改但无法写回 runtime 的普通对象。</zh-CN><en>Return a plain object the caller may mutate without writing back into runtime state.</en></lang>
    return copy;
  }

  // <lang><zh-CN>string/number/boolean/null 是不可变 scalar，可直接返回。</zh-CN><en>Strings, numbers, Booleans, and null are immutable scalars and may be returned directly.</en></lang>
  return value;
}

/**
 * <lang><zh-CN>创建稳定、双语且不回显输入的 integration diagnostic。</zh-CN><en>Creates a stable bilingual integration diagnostic that never echoes input.</en></lang>
 *
 * @param {string} code <lang><zh-CN>稳定错误代码。</zh-CN><en>Stable error code.</en></lang>
 * @param {string} zhHans <lang><zh-CN>简体中文消息。</zh-CN><en>Simplified-Chinese message.</en></lang>
 * @param {string} english <lang><zh-CN>英文消息。</zh-CN><en>English message.</en></lang>
 * @param {string|undefined} subjectId <lang><zh-CN>已验证的可选稳定 subject ID。</zh-CN><en>Optional already validated stable subject ID.</en></lang>
 * @returns {object} <lang><zh-CN>metadata-only diagnostic。</zh-CN><en>Metadata-only diagnostic.</en></lang>
 */
function createDiagnostic(code, zhHans, english, subjectId) {
  // <lang><zh-CN>基础 diagnostic 只含 code 与双语固定消息。</zh-CN><en>The base diagnostic contains only a code and fixed bilingual messages.</en></lang>
  const diagnostic = {
    code,
    message: {
      'zh-Hans': zhHans,
      en: english
    }
  };

  // <lang><zh-CN>只有通过 identifier guard 的 subject 才可公开。</zh-CN><en>Only a subject passing the identifier guard may be exposed.</en></lang>
  if (isSimpleIdentifier(subjectId) || isDottedIdentifier(subjectId)) {
    diagnostic.subjectId = subjectId;
  }

  // <lang><zh-CN>返回新对象，不附加 raw error 或 lower-layer payload。</zh-CN><en>Return a new object with no raw error or lower-layer payload attached.</en></lang>
  return diagnostic;
}

/**
 * <lang><zh-CN>构造没有 partial runtime 的失败结果。</zh-CN><en>Constructs a failure result with no partial runtime.</en></lang>
 *
 * @param {object} diagnostic <lang><zh-CN>单个稳定 diagnostic。</zh-CN><en>Single stable diagnostic.</en></lang>
 * @returns {{ok: false, diagnostics: object[]}} <lang><zh-CN>冻结外壳之外不暴露任何 runtime 状态的失败。</zh-CN><en>Failure exposing no runtime state beyond its result envelope.</en></lang>
 */
function createFailure(diagnostic) {
  // <lang><zh-CN>每次创建新数组，使 caller 修改不会影响其他失败。</zh-CN><en>Create a new array every time so caller mutation cannot affect another failure.</en></lang>
  return {
    ok: false,
    diagnostics: [diagnostic]
  };
}

/**
 * <lang><zh-CN>校验并复制 application-template manifest。</zh-CN><en>Validates and copies an application-template manifest.</en></lang>
 *
 * @param {unknown} candidateTemplate <lang><zh-CN>调用方提供的未知 template。</zh-CN><en>Unknown template supplied by the caller.</en></lang>
 * @returns {object} <lang><zh-CN>成功 template 副本或失败 diagnostic。</zh-CN><en>Successful template copy or failure diagnostic.</en></lang>
 * @lang zh-CN 校验覆盖 root、slot、host policy、route 与 screen policy 的跨字段对应关系。
 * @lang en Validation covers cross-field correspondence among root, slots, host policy, routes, and screen policy.
 */
function validateTemplate(candidateTemplate) {
  // <lang><zh-CN>root 必须是精确 record，未知字段立即拒绝。</zh-CN><en>The root must be an exact record; reject unknown fields immediately.</en></lang>
  if (!isRecord(candidateTemplate) || !hasExactOwnKeys(candidateTemplate, TEMPLATE_ROOT_KEYS)) {
    return createFailure(createDiagnostic(
      'application-integration.template-invalid',
      '应用模板根结构不合法。',
      'The application-template root is invalid.'
    ));
  }

  // <lang><zh-CN>版本、kind 与三个稳定 ID 必须精确匹配首版 contract。</zh-CN><en>Version, kind, and the three stable IDs must exactly match the first contract.</en></lang>
  const rootIsValid = candidateTemplate.manifestVersion === TEMPLATE_VERSION
    && candidateTemplate.kind === 'application-template'
    && isDottedIdentifier(candidateTemplate.id)
    && isDottedIdentifier(candidateTemplate.adoptionProfileId)
    && isDottedIdentifier(candidateTemplate.primaryModuleId);

  // <lang><zh-CN>root metadata 失败不回显候选值。</zh-CN><en>Root metadata failure does not echo candidate values.</en></lang>
  if (!rootIsValid) {
    return createFailure(createDiagnostic(
      'application-integration.template-invalid',
      '应用模板版本、类型或标识不合法。',
      'The application-template version, kind, or identifier is invalid.'
    ));
  }

  // <lang><zh-CN>slot 数量被限制在 1–32，避免无界装配。</zh-CN><en>Bound slot count to 1–32 to avoid unbounded composition.</en></lang>
  if (!Array.isArray(candidateTemplate.capabilitySlots)
      || candidateTemplate.capabilitySlots.length < 1
      || candidateTemplate.capabilitySlots.length > 32) {
    return createFailure(createDiagnostic(
      'application-integration.template-invalid',
      '应用模板 capability slot 数量不合法。',
      'The application-template capability-slot count is invalid.'
    ));
  }

  // <lang><zh-CN>分别跟踪 slot ID 与 module ID，确保一对一主责。</zh-CN><en>Track slot IDs and module IDs separately to guarantee one-to-one ownership.</en></lang>
  const slotIds = new Set();
  const moduleIds = new Set();

  // <lang><zh-CN>逐个校验 slot 的 exact shape、state 与 surface allowlist。</zh-CN><en>Validate each slot's exact shape, state, and surface allowlist.</en></lang>
  for (const slot of candidateTemplate.capabilitySlots) {
    // <lang><zh-CN>slot 只允许四个声明字段。</zh-CN><en>A slot permits only its four declaration fields.</en></lang>
    const slotShapeIsValid = isRecord(slot)
      && hasExactOwnKeys(slot, SLOT_KEYS)
      && isSimpleIdentifier(slot.id)
      && isDottedIdentifier(slot.moduleId)
      && slot.requiredState === 'enabled'
      && isBoundedUniqueArray(
        slot.requiredSurfaces,
        1,
        8,
        (surface) => typeof surface === 'string' && ALLOWED_SURFACES.has(surface)
      );

    // <lang><zh-CN>不合法 slot 只公开已验证 subject，否则省略 subject。</zh-CN><en>An invalid slot exposes only an already validated subject, or omits the subject.</en></lang>
    if (!slotShapeIsValid) {
      return createFailure(createDiagnostic(
        'application-integration.template-invalid',
        '应用模板 capability slot 不合法。',
        'An application-template capability slot is invalid.',
        isSimpleIdentifier(slot?.id) ? slot.id : undefined
      ));
    }

    // <lang><zh-CN>重复 slot 或 module 会制造隐式竞争，必须拒绝。</zh-CN><en>Duplicate slots or modules would create implicit competition and must be rejected.</en></lang>
    if (slotIds.has(slot.id) || moduleIds.has(slot.moduleId)) {
      return createFailure(createDiagnostic(
        'application-integration.template-invalid',
        '应用模板 capability slot 或 module 重复。',
        'The application-template capability slot or module is duplicated.',
        slot.id
      ));
    }

    // <lang><zh-CN>登记已验证 ID，供 primary 与 candidate correspondence 使用。</zh-CN><en>Register validated IDs for primary and candidate correspondence checks.</en></lang>
    slotIds.add(slot.id);
    moduleIds.add(slot.moduleId);
  }

  // <lang><zh-CN>primary module 必须由一个明确 slot 声明。</zh-CN><en>The primary module must be declared by one explicit slot.</en></lang>
  if (!moduleIds.has(candidateTemplate.primaryModuleId)) {
    return createFailure(createDiagnostic(
      'application-integration.template-invalid',
      '应用模板 primary module 不属于 capability slots。',
      'The application-template primary module is not a capability slot.',
      candidateTemplate.primaryModuleId
    ));
  }

  // <lang><zh-CN>host policy 只允许三个有限 allowlists。</zh-CN><en>The host policy permits only three finite allowlists.</en></lang>
  const hostPolicy = candidateTemplate.hostPolicy;
  const hostPolicyIsValid = isRecord(hostPolicy)
    && hasExactOwnKeys(hostPolicy, HOST_POLICY_KEYS)
    && isBoundedUniqueArray(hostPolicy.registeredBlocks, 1, 32, isSimpleIdentifier)
    && isBoundedUniqueArray(hostPolicy.registeredVisibility, 1, 16, isSimpleIdentifier)
    && isBoundedUniqueArray(
      hostPolicy.allowedPageSizes,
      1,
      16,
      (pageSize) => Number.isInteger(pageSize) && pageSize >= 1 && pageSize <= 100
    );

  // <lang><zh-CN>非法 host policy 在 adoption runtime 创建前失败。</zh-CN><en>An invalid host policy fails before adoption-runtime creation.</en></lang>
  if (!hostPolicyIsValid) {
    return createFailure(createDiagnostic(
      'application-integration.template-invalid',
      '应用模板 host policy 不合法。',
      'The application-template host policy is invalid.'
    ));
  }

  // <lang><zh-CN>route projection 必须是 exact record 与受支持 channel。</zh-CN><en>The route projection must be an exact record with a supported channel.</en></lang>
  const routeProjection = candidateTemplate.routeProjection;
  const routeRootIsValid = isRecord(routeProjection)
    && hasExactOwnKeys(routeProjection, ROUTE_KEYS)
    && ALLOWED_CHANNELS.has(routeProjection.channel)
    && Array.isArray(routeProjection.screens)
    && routeProjection.screens.length >= 1
    && routeProjection.screens.length <= 32
    && Array.isArray(routeProjection.actions)
    && routeProjection.actions.length <= 64;

  // <lang><zh-CN>route root 失败时不进入 screen/action 遍历。</zh-CN><en>A route-root failure does not enter screen or action traversal.</en></lang>
  if (!routeRootIsValid) {
    return createFailure(createDiagnostic(
      'application-integration.template-invalid',
      '应用模板 route projection 不合法。',
      'The application-template route projection is invalid.'
    ));
  }

  // <lang><zh-CN>已登记 block Set 用于限制 screen blocks。</zh-CN><en>The registered-block Set bounds screen blocks.</en></lang>
  const registeredBlocks = new Set(hostPolicy.registeredBlocks);

  // <lang><zh-CN>screen IDs 与 intents 分开去重，避免 route ambiguity。</zh-CN><en>Deduplicate screen IDs and intents separately to avoid route ambiguity.</en></lang>
  const screenIds = new Set();
  const screenIntents = new Set();

  // <lang><zh-CN>逐个校验 screen shape 和已登记 block。</zh-CN><en>Validate every screen shape and registered block.</en></lang>
  for (const screen of routeProjection.screens) {
    // <lang><zh-CN>每个 screen 至少含一个唯一 block ID。</zh-CN><en>Every screen contains at least one unique block ID.</en></lang>
    const screenIsValid = isRecord(screen)
      && hasExactOwnKeys(screen, SCREEN_KEYS)
      && isSimpleIdentifier(screen.intent)
      && isSimpleIdentifier(screen.screenId)
      && isBoundedUniqueArray(
        screen.blocks,
        1,
        16,
        (blockId) => isSimpleIdentifier(blockId) && registeredBlocks.has(blockId)
      );

    // <lang><zh-CN>不合法 screen 不返回 block 数组或 route 对象。</zh-CN><en>An invalid screen returns neither its block array nor route object.</en></lang>
    if (!screenIsValid) {
      return createFailure(createDiagnostic(
        'application-integration.template-invalid',
        '应用模板 route screen 不合法。',
        'An application-template route screen is invalid.',
        isSimpleIdentifier(screen?.screenId) ? screen.screenId : undefined
      ));
    }

    // <lang><zh-CN>重复 screen 或 intent 会使 shell initial/action projection 不确定。</zh-CN><en>A duplicate screen or intent would make shell initial or action projection ambiguous.</en></lang>
    if (screenIds.has(screen.screenId) || screenIntents.has(screen.intent)) {
      return createFailure(createDiagnostic(
        'application-integration.template-invalid',
        '应用模板 route screen 或 intent 重复。',
        'The application-template route screen or intent is duplicated.',
        screen.screenId
      ));
    }

    // <lang><zh-CN>登记 screen metadata，供 action 与 policy correspondence 使用。</zh-CN><en>Register screen metadata for action and policy correspondence checks.</en></lang>
    screenIds.add(screen.screenId);
    screenIntents.add(screen.intent);
  }

  // <lang><zh-CN>action ID 必须唯一且 from/to 都引用已登记 screen。</zh-CN><en>Action IDs must be unique and both from and to must reference registered screens.</en></lang>
  const actionIds = new Set();

  // <lang><zh-CN>逐个校验静态 action，不解释 URL 或 callback。</zh-CN><en>Validate every static action without interpreting a URL or callback.</en></lang>
  for (const action of routeProjection.actions) {
    // <lang><zh-CN>action 只有 id/from/to 三个 stable IDs。</zh-CN><en>An action contains only stable id, from, and to IDs.</en></lang>
    const actionIsValid = isRecord(action)
      && hasExactOwnKeys(action, ACTION_KEYS)
      && isSimpleIdentifier(action.id)
      && isSimpleIdentifier(action.from)
      && isSimpleIdentifier(action.to)
      && screenIds.has(action.from)
      && screenIds.has(action.to)
      && !actionIds.has(action.id);

    // <lang><zh-CN>非法引用在 shell 创建前失败。</zh-CN><en>An invalid reference fails before shell creation.</en></lang>
    if (!actionIsValid) {
      return createFailure(createDiagnostic(
        'application-integration.template-invalid',
        '应用模板 route action 不合法。',
        'An application-template route action is invalid.',
        isSimpleIdentifier(action?.id) ? action.id : undefined
      ));
    }

    // <lang><zh-CN>登记唯一 action ID。</zh-CN><en>Register the unique action ID.</en></lang>
    actionIds.add(action.id);
  }

  // <lang><zh-CN>screen policy 必须是 plain record，且 key 集合精确等于 screen IDs。</zh-CN><en>The screen policy must be a plain record whose keys exactly equal screen IDs.</en></lang>
  const screenPolicy = candidateTemplate.screenCapabilityPolicy;
  const policyKeys = isRecord(screenPolicy) ? Object.keys(screenPolicy).sort() : [];
  const sortedScreenIds = [...screenIds].sort();
  const policyKeySetIsExact = policyKeys.length === sortedScreenIds.length
    && policyKeys.every((key, index) => key === sortedScreenIds[index]);

  // <lang><zh-CN>缺失或多余 screen policy 都会改变 capability gate，必须拒绝。</zh-CN><en>A missing or extra screen policy changes the capability gate and must be rejected.</en></lang>
  if (!isRecord(screenPolicy) || !policyKeySetIsExact) {
    return createFailure(createDiagnostic(
      'application-integration.template-invalid',
      '应用模板 screen capability policy 与 screens 不对应。',
      'The application-template screen capability policy does not correspond to its screens.'
    ));
  }

  // <lang><zh-CN>每个 policy value 都是有限唯一的 capability ID 列表；空数组表示显式匿名允许。</zh-CN><en>Every policy value is a finite unique capability-ID list; an empty array explicitly permits anonymous access.</en></lang>
  for (const screenId of sortedScreenIds) {
    if (!isBoundedUniqueArray(screenPolicy[screenId], 0, 32, isSimpleIdentifier)) {
      return createFailure(createDiagnostic(
        'application-integration.template-invalid',
        '应用模板 screen capability 列表不合法。',
        'An application-template screen capability list is invalid.',
        screenId
      ));
    }
  }

  // <lang><zh-CN>复制全部已验证 metadata，隔离 caller 后续修改。</zh-CN><en>Copy all validated metadata to isolate later caller mutation.</en></lang>
  const template = copyMetadata(candidateTemplate);

  // <lang><zh-CN>成功结果只返回 runtime 自有 plain template。</zh-CN><en>The success result returns only the runtime-owned plain template.</en></lang>
  return {
    ok: true,
    diagnostics: [],
    template
  };
}

/**
 * <lang><zh-CN>校验完整 adoption candidate 与 template slots 的对应关系。</zh-CN><en>Validates correspondence between a complete adoption candidate and template slots.</en></lang>
 *
 * @param {object} template <lang><zh-CN>已验证且隔离的 template。</zh-CN><en>Validated isolated template.</en></lang>
 * @param {unknown} profile <lang><zh-CN>待交给 adoption runtime 的完整 profile。</zh-CN><en>Complete profile to pass to the adoption runtime.</en></lang>
 * @param {unknown} units <lang><zh-CN>调用方显式提供的完整 units。</zh-CN><en>Complete units explicitly supplied by the caller.</en></lang>
 * @returns {object} <lang><zh-CN>成功标志或受限 diagnostic。</zh-CN><en>Success marker or bounded diagnostic.</en></lang>
 * @lang zh-CN 本层只检查 template-specific correspondence；完整 profile/core/lifecycle 仍由既有 runtime 校验。
 * @lang en This layer checks template-specific correspondence only; existing runtimes still validate the complete profile, core, and lifecycle.
 */
function validateCandidate(template, profile, units) {
  // <lang><zh-CN>profile 至少必须含稳定 profileId 与 capabilities 数组。</zh-CN><en>The profile must contain at least a stable profileId and capabilities array.</en></lang>
  if (!isRecord(profile) || !isDottedIdentifier(profile.profileId) || !Array.isArray(profile.capabilities)) {
    return createFailure(createDiagnostic(
      'application-integration.profile-mismatch',
      '采用 profile 与应用模板不对应。',
      'The adoption profile does not correspond to the application template.'
    ));
  }

  // <lang><zh-CN>template 只接受一个精确 profile ID，不执行 alias 或迁移。</zh-CN><en>The template accepts one exact profile ID and performs no aliasing or migration.</en></lang>
  if (profile.profileId !== template.adoptionProfileId) {
    return createFailure(createDiagnostic(
      'application-integration.profile-mismatch',
      '采用 profile ID 与应用模板不匹配。',
      'The adoption-profile ID does not match the application template.',
      profile.profileId
    ));
  }

  // <lang><zh-CN>首版 template 要求 adoption selections 与 slots 数量精确一致。</zh-CN><en>The first template contract requires adoption selections and slots to have the exact same count.</en></lang>
  if (profile.capabilities.length !== template.capabilitySlots.length) {
    return createFailure(createDiagnostic(
      'application-integration.slot-mismatch',
      '采用 profile 未完整选择应用模板 slots。',
      'The adoption profile does not select the complete application-template slots.'
    ));
  }

  // <lang><zh-CN>按 module ID 建立 selection map，拒绝重复或缺失 metadata。</zh-CN><en>Build a selection map by module ID, rejecting duplicate or missing metadata.</en></lang>
  const selectionsByModule = new Map();

  // <lang><zh-CN>逐项读取 adoption selection 的 template-relevant 字段。</zh-CN><en>Read template-relevant fields from every adoption selection.</en></lang>
  for (const selection of profile.capabilities) {
    // <lang><zh-CN>完整 shape 仍由 adoption runtime 校验；本层只要求安全访问的三个字段。</zh-CN><en>The adoption runtime validates complete shape; this layer requires only the three fields needed for safe access.</en></lang>
    const selectionIsReadable = isRecord(selection)
      && isDottedIdentifier(selection.moduleId)
      && isDottedIdentifier(selection.implementationPackageId)
      && typeof selection.state === 'string'
      && !selectionsByModule.has(selection.moduleId);

    // <lang><zh-CN>不合法 selection 使用 slot-mismatch，不序列化 profile。</zh-CN><en>An unreadable selection uses slot-mismatch without serializing the profile.</en></lang>
    if (!selectionIsReadable) {
      return createFailure(createDiagnostic(
        'application-integration.slot-mismatch',
        '采用 profile 的 capability selection 不合法。',
        'A capability selection in the adoption profile is invalid.'
      ));
    }

    // <lang><zh-CN>登记 selection 供 slot state 与 implementation correspondence 检查。</zh-CN><en>Register the selection for slot-state and implementation-correspondence checks.</en></lang>
    selectionsByModule.set(selection.moduleId, selection);
  }

  // <lang><zh-CN>units 必须与 template slots 数量精确一致；不自动发现或补齐依赖。</zh-CN><en>Units must exactly match the template-slot count; dependencies are neither discovered nor auto-filled.</en></lang>
  if (!Array.isArray(units) || units.length !== template.capabilitySlots.length) {
    return createFailure(createDiagnostic(
      'application-integration.slot-mismatch',
      '显式 capability units 未完整覆盖应用模板 slots。',
      'The explicit capability units do not completely cover application-template slots.'
    ));
  }

  // <lang><zh-CN>按 business-module ID 建立 unit map，拒绝重复主责。</zh-CN><en>Build a unit map by business-module ID, rejecting duplicate ownership.</en></lang>
  const unitsByModule = new Map();

  // <lang><zh-CN>逐 unit 检查 template 所需 manifest metadata 是否可读。</zh-CN><en>Inspect each unit for template-required readable manifest metadata.</en></lang>
  for (const unit of units) {
    // <lang><zh-CN>unit 的 provider/profile 内容不在本层展开或复制。</zh-CN><en>The unit's provider and profile contents are neither expanded nor copied in this layer.</en></lang>
    const unitIsReadable = isRecord(unit)
      && isRecord(unit.businessModule)
      && isDottedIdentifier(unit.businessModule.id)
      && isRecord(unit.implementationPackage)
      && isDottedIdentifier(unit.implementationPackage.id)
      && isDottedIdentifier(unit.implementationPackage.moduleId)
      && isRecord(unit.implementationPackage.runtime)
      && Array.isArray(unit.implementationPackage.runtime.surfaces)
      && !unitsByModule.has(unit.businessModule.id);

    // <lang><zh-CN>无法读取必要 metadata 时不把 unit 传给 adoption runtime。</zh-CN><en>Do not pass a unit to the adoption runtime if required metadata is unreadable.</en></lang>
    if (!unitIsReadable) {
      return createFailure(createDiagnostic(
        'application-integration.slot-mismatch',
        '显式 capability unit 与应用模板不对应。',
        'An explicit capability unit does not correspond to the application template.'
      ));
    }

    // <lang><zh-CN>module correspondence 必须在 surface 检查前成立。</zh-CN><en>Module correspondence must hold before surface checks.</en></lang>
    if (unit.implementationPackage.moduleId !== unit.businessModule.id) {
      return createFailure(createDiagnostic(
        'application-integration.slot-mismatch',
        'Capability unit 的 module 与 implementation 不对应。',
        'The capability unit module and implementation do not correspond.',
        unit.businessModule.id
      ));
    }

    // <lang><zh-CN>登记 unit；provider function 仍只由下层 core/adoption runtime 持有。</zh-CN><en>Register the unit while provider functions remain owned only by lower core and adoption runtimes.</en></lang>
    unitsByModule.set(unit.businessModule.id, unit);
  }

  // <lang><zh-CN>逐 slot 精确核对 selection、unit、state、implementation 与 surfaces。</zh-CN><en>Check selection, unit, state, implementation, and surfaces exactly for every slot.</en></lang>
  for (const slot of template.capabilitySlots) {
    // <lang><zh-CN>slot module 必须同时存在于 profile 与 units。</zh-CN><en>The slot module must exist in both profile and units.</en></lang>
    const selection = selectionsByModule.get(slot.moduleId);
    const unit = unitsByModule.get(slot.moduleId);

    // <lang><zh-CN>缺失任一对应物都表示 incomplete candidate。</zh-CN><en>Missing either counterpart means the candidate is incomplete.</en></lang>
    if (!selection || !unit) {
      return createFailure(createDiagnostic(
        'application-integration.slot-mismatch',
        '应用模板 slot 缺少 selection 或 unit。',
        'An application-template slot lacks a selection or unit.',
        slot.id
      ));
    }

    // <lang><zh-CN>首版所有 slot 必须显式 enabled。</zh-CN><en>Every first-contract slot must be explicitly enabled.</en></lang>
    if (selection.state !== slot.requiredState) {
      return createFailure(createDiagnostic(
        'application-integration.slot-state-mismatch',
        '应用模板 slot 的期望状态不匹配。',
        'The desired state of an application-template slot does not match.',
        slot.id
      ));
    }

    // <lang><zh-CN>profile selection 必须精确选择显式 unit 的 implementation ID。</zh-CN><en>The profile selection must exactly select the explicit unit's implementation ID.</en></lang>
    if (selection.implementationPackageId !== unit.implementationPackage.id) {
      return createFailure(createDiagnostic(
        'application-integration.slot-mismatch',
        '应用模板 slot 的 implementation selection 与 unit 不匹配。',
        'The implementation selection and unit of an application-template slot do not match.',
        slot.id
      ));
    }

    // <lang><zh-CN>把 implementation surfaces 视为 metadata Set，不调用任一 provider。</zh-CN><en>Treat implementation surfaces as a metadata Set without invoking any provider.</en></lang>
    const implementationSurfaces = new Set(unit.implementationPackage.runtime.surfaces);

    // <lang><zh-CN>slot 声明的每个 surface 都必须由显式 implementation 提供。</zh-CN><en>The explicit implementation must provide every surface declared by the slot.</en></lang>
    const hasRequiredSurfaces = slot.requiredSurfaces.every(
      (surface) => implementationSurfaces.has(surface)
    );

    // <lang><zh-CN>缺失 surface 使用 slot ID 定位，不公开 package 或 manifest body。</zh-CN><en>A missing surface uses the slot ID for location and exposes neither package nor manifest body.</en></lang>
    if (!hasRequiredSurfaces) {
      return createFailure(createDiagnostic(
        'application-integration.slot-surface-missing',
        'Capability implementation 缺少应用模板要求的 surface。',
        'The capability implementation lacks a surface required by the application template.',
        slot.id
      ));
    }
  }

  // <lang><zh-CN>全部 template-specific correspondence 已通过。</zh-CN><en>All template-specific correspondence checks passed.</en></lang>
  return {
    ok: true,
    diagnostics: []
  };
}

/**
 * <lang><zh-CN>创建 application-template 集成 runtime。</zh-CN><en>Creates an application-template integration runtime.</en></lang>
 *
 * @param {object} options <lang><zh-CN>只含 template、完整 profile 与完整显式 units 的创建参数。</zh-CN><en>Creation input containing only a template, complete profile, and complete explicit units.</en></lang>
 * @returns {object} <lang><zh-CN>失败 diagnostics，或安全 shell、receipt、reconcile 与 snapshots。</zh-CN><en>Failure diagnostics, or a safe shell, receipt, reconcile function, and snapshots.</en></lang>
 * @lang zh-CN factory 先校验所有 template/candidate metadata，后创建 adoption candidate，最后创建 shell；失败不返回 partial runtime。
 * @lang en The factory validates all template and candidate metadata before creating an adoption candidate and creates the shell last; failure returns no partial runtime.
 */
export function createApplicationIntegrationRuntime(options) {
  // <lang><zh-CN>创建 options 必须是只含三个字段的 exact record。</zh-CN><en>Creation options must be an exact record containing only three fields.</en></lang>
  if (!isRecord(options) || !hasExactOwnKeys(options, ['template', 'profile', 'units'])) {
    return createFailure(createDiagnostic(
      'application-integration.input-invalid',
      '应用集成创建参数不合法。',
      'The application-integration creation input is invalid.'
    ));
  }

  // <lang><zh-CN>template 是第一道门禁；失败不会创建 adoption runtime。</zh-CN><en>The template is the first gate; failure does not create an adoption runtime.</en></lang>
  const templateValidation = validateTemplate(options.template);

  // <lang><zh-CN>template diagnostic 已是受限副本，可直接作为失败返回。</zh-CN><en>The template diagnostic is already bounded and may be returned directly.</en></lang>
  if (!templateValidation.ok) {
    return templateValidation;
  }

  // <lang><zh-CN>后续只使用 runtime 自有 template 副本。</zh-CN><en>All later work uses only the runtime-owned template copy.</en></lang>
  const template = templateValidation.template;

  // <lang><zh-CN>template-specific candidate gate 在 adoption runtime 创建前拒绝 mismatch。</zh-CN><en>The template-specific candidate gate rejects mismatches before adoption-runtime creation.</en></lang>
  const candidateValidation = validateCandidate(template, options.profile, options.units);

  // <lang><zh-CN>candidate 失败不创建 shell、provider invocation path 或 snapshot。</zh-CN><en>A candidate failure creates no shell, provider invocation path, or snapshot.</en></lang>
  if (!candidateValidation.ok) {
    return candidateValidation;
  }

  // <lang><zh-CN>用 template host allowlists 创建独立 adoption runtime。</zh-CN><en>Create an independent adoption runtime from template host allowlists.</en></lang>
  const adoptionRuntime = createCapabilityAdoptionRuntime({
    registeredBlocks: [...template.hostPolicy.registeredBlocks],
    registeredVisibility: [...template.hostPolicy.registeredVisibility],
    allowedPageSizes: [...template.hostPolicy.allowedPageSizes]
  });

  // <lang><zh-CN>完整显式 candidate 交给 adoption runtime 作 core/lifecycle/依赖/冲突校验。</zh-CN><en>Pass the complete explicit candidate to the adoption runtime for core, lifecycle, dependency, and conflict validation.</en></lang>
  const initialAdoption = adoptionRuntime.reconcile({
    profile: options.profile,
    units: options.units
  });

  // <lang><zh-CN>下层 adoption 失败映射为稳定 integration code，不复制 lower diagnostics。</zh-CN><en>Map a lower adoption failure to a stable integration code without copying lower diagnostics.</en></lang>
  if (!initialAdoption.ok) {
    return createFailure(createDiagnostic(
      'application-integration.adoption-failed',
      '应用模板候选采用失败。',
      'The application-template candidate failed adoption.'
    ));
  }

  /**
   * <lang><zh-CN>把 app-shell port 调用固定桥接到活动 primary module。</zh-CN><en>Bridges application-shell port invocation to the active primary module.</en></lang>
   *
   * @param {string} portId <lang><zh-CN>shell 请求的已登记 port ID。</zh-CN><en>Registered port ID requested by the shell.</en></lang>
   * @param {unknown} input <lang><zh-CN>module-owned canonical 输入。</zh-CN><en>Module-owned canonical input.</en></lang>
   * @returns {unknown} <lang><zh-CN>活动 implementation 的 canonical 结果。</zh-CN><en>Canonical result from the active implementation.</en></lang>
   * @lang zh-CN bridge 不接受 module selector，因此页面无法横向调用其他 slot。
   * @lang en The bridge accepts no module selector, so the page cannot invoke another slot laterally.
   */
  const invokePrimaryModule = (portId, input) => (
    adoptionRuntime.invoke(template.primaryModuleId, portId, input)
  );

  // <lang><zh-CN>冻结最小 composition bridge；replacement 只改变 adoption runtime 内部活动 candidate。</zh-CN><en>Freeze the minimum composition bridge; replacement changes only the adoption runtime's active candidate.</en></lang>
  const compositionBridge = Object.freeze({
    invoke: invokePrimaryModule
  });

  // <lang><zh-CN>shell 使用 template 自有 route/policy 副本，不接收 unit 或 profile。</zh-CN><en>The shell uses template-owned route and policy copies and receives neither units nor profile.</en></lang>
  const shellInitialization = createApplicationShell({
    composition: compositionBridge,
    routeProjection: copyMetadata(template.routeProjection),
    screenCapabilityPolicy: copyMetadata(template.screenCapabilityPolicy)
  });

  // <lang><zh-CN>shell 失败时整个局部 adoption closure 不对外可达。</zh-CN><en>If shell creation fails, the entire local adoption closure remains unreachable externally.</en></lang>
  if (!shellInitialization.ok) {
    return createFailure(createDiagnostic(
      'application-integration.shell-failed',
      '应用模板 shell 初始化失败。',
      'The application-template shell failed to initialize.'
    ));
  }

  /**
   * <lang><zh-CN>对同一 template 原子协调一个完整 replacement candidate。</zh-CN><en>Atomically reconciles a complete replacement candidate against the same template.</en></lang>
   *
   * @param {object} candidate <lang><zh-CN>只含完整 profile 与完整显式 units。</zh-CN><en>Input containing only a complete profile and complete explicit units.</en></lang>
   * @returns {object} <lang><zh-CN>受限失败或分离 adoption receipt。</zh-CN><en>Bounded failure or detached adoption receipt.</en></lang>
   * @lang zh-CN replacement 不重建 shell；失败保持活动 adoption candidate 与 invocation path。
   * @lang en Replacement does not recreate the shell; failure preserves the active adoption candidate and invocation path.
   */
  const reconcile = (candidate) => {
    // <lang><zh-CN>replacement input 是 exact record，拒绝 callback 或控制字段。</zh-CN><en>Replacement input is an exact record, rejecting callbacks or control fields.</en></lang>
    if (!isRecord(candidate) || !hasExactOwnKeys(candidate, ['profile', 'units'])) {
      return createFailure(createDiagnostic(
        'application-integration.input-invalid',
        '应用集成 replacement 参数不合法。',
        'The application-integration replacement input is invalid.'
      ));
    }

    // <lang><zh-CN>先重跑 template slot/surface gate，阻止不兼容 candidate 进入 adoption。</zh-CN><en>Rerun the template slot and surface gate before an incompatible candidate can enter adoption.</en></lang>
    const replacementValidation = validateCandidate(
      template,
      candidate.profile,
      candidate.units
    );

    // <lang><zh-CN>template-specific failure 保持 active runtime 完全不变。</zh-CN><en>A template-specific failure leaves the active runtime completely unchanged.</en></lang>
    if (!replacementValidation.ok) {
      return replacementValidation;
    }

    // <lang><zh-CN>adoption runtime 在隔离 candidate 完成后才原子切换。</zh-CN><en>The adoption runtime switches atomically only after completing an isolated candidate.</en></lang>
    const adoptionResult = adoptionRuntime.reconcile({
      profile: candidate.profile,
      units: candidate.units
    });

    // <lang><zh-CN>下层失败不复制 raw diagnostic，且旧 candidate 仍活动。</zh-CN><en>A lower-layer failure copies no raw diagnostic and leaves the old candidate active.</en></lang>
    if (!adoptionResult.ok) {
      return createFailure(createDiagnostic(
        'application-integration.adoption-failed',
        '应用模板 replacement candidate 采用失败。',
        'The application-template replacement candidate failed adoption.'
      ));
    }

    // <lang><zh-CN>复制 receipt，避免 caller 修改 adoption runtime 返回对象。</zh-CN><en>Copy the receipt so caller mutation cannot affect the object returned by the adoption runtime.</en></lang>
    return {
      ok: true,
      diagnostics: [],
      receipt: copyMetadata(adoptionResult.receipt)
    };
  };

  /**
   * <lang><zh-CN>返回隔离的完整 template metadata snapshot。</zh-CN><en>Returns an isolated complete template-metadata snapshot.</en></lang>
   *
   * @returns {object} <lang><zh-CN>不含 unit/provider/profile 的 template 副本。</zh-CN><en>Template copy containing no unit, provider, or profile.</en></lang>
   */
  const getTemplateSnapshot = () => copyMetadata(template);

  /**
   * <lang><zh-CN>返回活动 capability lifecycle 的脱敏 snapshot。</zh-CN><en>Returns the redacted snapshot of the active capability lifecycle.</en></lang>
   *
   * @returns {object[]} <lang><zh-CN>按 module ID 排序的状态副本。</zh-CN><en>State copies sorted by module ID.</en></lang>
   */
  const getAdoptionSnapshot = () => adoptionRuntime.snapshot();

  /**
   * <lang><zh-CN>返回活动采用 profile 的受限 presentation snapshot。</zh-CN><en>Returns the bounded presentation snapshot of the active adoption profile.</en></lang>
   *
   * @returns {object} <lang><zh-CN>只含 blocks、order 与 pageSize 的新对象。</zh-CN><en>New object containing only blocks, order, and pageSize.</en></lang>
   */
  const getPresentationSnapshot = () => adoptionRuntime.presentation();

  // <lang><zh-CN>冻结 API 外壳；不暴露 adoption runtime、unit、manifest、provider 或 profile。</zh-CN><en>Freeze the API envelope and expose no adoption runtime, unit, manifest, provider, or profile.</en></lang>
  return Object.freeze({
    ok: true,
    diagnostics: [],
    receipt: copyMetadata(initialAdoption.receipt),
    shell: shellInitialization.shell,
    reconcile,
    getTemplateSnapshot,
    getAdoptionSnapshot,
    getPresentationSnapshot
  });
}
