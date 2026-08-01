/**
 * <lang><zh-CN>代表性小程序 fixture runtime：校验声明式 app profile，并通过版本化应用模板集成完整显式能力候选。</zh-CN><en>Representative mini-program fixture runtime: validates a declarative app profile and integrates a complete explicit capability candidate through a versioned application template.</en></lang>
 * @lang zh-CN 本模块只组合仓内确定性 mock/wire fixture；它不读取文件、环境、网络、credential、storage 或动态代码。
 * @lang en This module composes only checked-in deterministic mock and wire fixtures; it reads no file, environment, network, credential, storage, or dynamic code.
 */

// <lang><zh-CN>通用 integration runtime 校验 template/slots/surfaces，并建立固定主模块 shell bridge。</zh-CN><en>The generic integration runtime validates template, slots, and surfaces and establishes a shell bridge fixed to the primary module.</en></lang>
import {
  createApplicationIntegrationRuntime
} from '@hia-uview/biz-app-integration';

// <lang><zh-CN>私有模板包拥有显式 mock/wire 单元装配；app 不再复制 capability lifecycle 过程。</zh-CN><en>The private template package owns explicit mock or wire unit assembly; the app no longer duplicates capability-lifecycle procedures.</en></lang>
import {
  createExampleCatalogTemplateCandidate
} from '@hia-uview/biz-example-catalog-query-detail-template';

// <lang><zh-CN>app-local context 固定登记中性 package 与匿名 mock session；该层不暴露真实身份或后端实现。</zh-CN><en>The app-local context fixes neutral-package registration and anonymous mock session; this layer exposes neither real identity nor backend implementation.</en></lang>
import {
  createAnonymousMockSession,
  createRepresentativeSolutionProfileRuntime
} from './solution-context.mjs';

/**
 * <lang><zh-CN>当前代表性 app profile 与 canonical port 共享的固定契约版本。</zh-CN><en>Fixed contract version shared by the current representative app profile and canonical ports.</en></lang>
 * @lang zh-CN 版本不从 source 或环境推断，避免不同本地 fixture 悄然分叉。
 * @lang en The version is inferred from neither source nor environment, preventing local fixtures from silently diverging.
 */
const CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>代表性 profile 的固定标识。</zh-CN><en>Fixed identifier of the representative profile.</en></lang>
 * @lang zh-CN 标识只定位当前 app profile，不替代 business-module ID 或实现包 ID。
 * @lang en The identifier locates only the current app profile and replaces neither a business-module ID nor an implementation-package ID.
 */
const REPRESENTATIVE_PROFILE_ID = 'example.catalog-query-detail.representative-mp-weixin';

/**
 * <lang><zh-CN>profile 根级唯一允许的字段集合。</zh-CN><en>Only fields allowed at the profile root.</en></lang>
 * @lang zh-CN 使用冻结数组便于审阅；校验仍按精确自有键集合执行。
 * @lang en A frozen array keeps review straightforward; validation still checks the exact own-key set.
 */
const PROFILE_ROOT_KEYS = Object.freeze([
  'profileVersion',
  'id',
  'sourceMode',
  'query',
  'presentation'
]);

/**
 * <lang><zh-CN>query 对象唯一允许的字段集合。</zh-CN><en>Only fields allowed on the query object.</en></lang>
 * @lang zh-CN 首轮不接受 filter、cursor、offset 或 adapter-private 参数。
 * @lang en The first slice accepts no filter, cursor, offset, or adapter-private parameter.
 */
const QUERY_KEYS = Object.freeze(['page', 'pageSize']);

/**
 * <lang><zh-CN>presentation 对象唯一允许的字段集合。</zh-CN><en>Only fields allowed on the presentation object.</en></lang>
 * @lang zh-CN 区块选择与排序是唯一声明式呈现控制面，不包含组件路径、样式文本或表达式。
 * @lang en Block selection and order are the sole declarative presentation surface and contain no component path, style text, or expression.
 */
const PRESENTATION_KEYS = Object.freeze(['enabledBlocks', 'blockOrder']);

/**
 * <lang><zh-CN>可显式选择的本地 source mode。</zh-CN><en>Local source modes that may be selected explicitly.</en></lang>
 * @lang zh-CN 未知值直接失败，不能映射到 URL、package 名或 fallback。
 * @lang en An unknown value fails directly and cannot map to a URL, package name, or fallback.
 */
const ALLOWED_SOURCE_MODES = new Set(['wire-fixture', 'mock']);

/**
 * <lang><zh-CN>代表性 profile 允许的初始 pageSize 白名单。</zh-CN><en>Allowlist of initial page sizes for the representative profile.</en></lang>
 * @lang zh-CN 有限值覆盖最小分页观察与常用本地测试容量，不形成任意性能参数。
 * @lang en The finite values cover minimum paging observation and common local-test capacities without forming an arbitrary performance parameter.
 */
const ALLOWED_PAGE_SIZES = new Set([1, 5, 10, 20]);

/**
 * <lang><zh-CN>app 已编译且允许由 profile 投影的全部区块 ID。</zh-CN><en>All block IDs compiled by the app and allowed for profile projection.</en></lang>
 * @lang zh-CN Set membership 只决定已有 template 分支可见性，绝不产生动态 import。
 * @lang en Set membership controls only visibility of existing template branches and never creates a dynamic import.
 */
const REGISTERED_BLOCK_IDS = new Set([
  'runtime-status',
  'query-context',
  'catalog-list',
  'entry-detail'
]);

/**
 * <lang><zh-CN>保持 query-to-detail 纵切完整所必需的区块 ID。</zh-CN><en>Block IDs required to keep the query-to-detail slice complete.</en></lang>
 * @lang zh-CN 可选状态/输入区块可隐藏，但目录和详情不能被 profile 移除。
 * @lang en Optional status and input blocks may be hidden, but the profile cannot remove catalog or detail.
 */
const REQUIRED_BLOCK_IDS = Object.freeze(['catalog-list', 'entry-detail']);

/**
 * <lang><zh-CN>wire source 可供本地自动证据选择的有限 fixture case。</zh-CN><en>Finite fixture cases available to local automated evidence for the wire source.</en></lang>
 * @lang zh-CN 该集合不在 JSON profile 中公开，只限制代码调用方的第二参数。
 * @lang en The set is not exposed in the JSON profile and only restricts the second argument supplied by code.
 */
const WIRE_FIXTURE_CASES = new Set([
  'success',
  'exchange-failure',
  'malformed-wire',
  'detail-section-failure'
]);

/**
 * <lang><zh-CN>mock source 可供本地自动证据选择的有限 fixture case。</zh-CN><en>Finite fixture cases available to local automated evidence for the mock source.</en></lang>
 * @lang zh-CN 全部值由既有中性 module 拥有，不接受调用方脚本或数据体。
 * @lang en All values are owned by the existing neutral module and accept no caller script or data body.
 */
const MOCK_FIXTURE_CASES = new Set([
  'first-page',
  'last-page',
  'empty-query',
  'adapter-failure',
  'detail-section-failure'
]);

/**
 * <lang><zh-CN>判断未知值是否为可读取自有字段的非数组对象。</zh-CN><en>Determines whether an unknown value is a non-array object whose own fields can be read.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待检查值。</zh-CN><en>Value to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否满足最小记录 shape。</zh-CN><en>Whether it satisfies the minimum record shape.</en></lang>
 * @lang zh-CN 该 guard 只建立 shape 前提，不把对象视为可信配置。
 * @lang en This guard establishes only a shape precondition and does not treat an object as trusted configuration.
 */
function isRecord(value) {
  // <lang><zh-CN>排除 null 与数组，防止字段校验把位置值误当命名配置。</zh-CN><en>Exclude null and arrays so field validation does not mistake positional values for named configuration.</en></lang>
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * <lang><zh-CN>判断记录是否精确拥有指定自有键，不多也不少。</zh-CN><en>Determines whether a record has exactly the specified own keys, no more and no fewer.</en></lang>
 *
 * @param {object} record <lang><zh-CN>已通过最小 shape guard 的记录。</zh-CN><en>Record that passed the minimum shape guard.</en></lang>
 * @param {string[]} expectedKeys <lang><zh-CN>完整允许键列表。</zh-CN><en>Complete list of allowed keys.</en></lang>
 * @returns {boolean} <lang><zh-CN>自有键集合是否精确匹配。</zh-CN><en>Whether the own-key set matches exactly.</en></lang>
 * @lang zh-CN 精确键检查同时拒绝缺失与额外字段，避免配置面静默扩展。
 * @lang en Exact-key checking rejects both missing and extra fields, preventing silent expansion of the configuration surface.
 */
function hasExactOwnKeys(record, expectedKeys) {
  // <lang><zh-CN>读取 enumerable 自有键；profile 来自 JSON，因此不存在需支持的 symbol 或 non-enumerable 配置。</zh-CN><en>Read enumerable own keys; the profile comes from JSON, so no symbol or non-enumerable configuration needs support.</en></lang>
  const actualKeys = Object.keys(record);

  // <lang><zh-CN>数量不同即可确定至少有缺失或额外字段。</zh-CN><en>A different count proves at least one field is missing or extra.</en></lang>
  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }

  // <lang><zh-CN>逐项确认 expected key 是自有字段，不接受原型链补充配置。</zh-CN><en>Confirm every expected key is an own field and do not accept configuration supplied through the prototype chain.</en></lang>
  return expectedKeys.every((expectedKey) => Object.hasOwn(record, expectedKey));
}

/**
 * <lang><zh-CN>创建不回显输入值的双语代表性纵切诊断。</zh-CN><en>Creates a bilingual representative-slice diagnostic that echoes no input value.</en></lang>
 *
 * @param {string} code <lang><zh-CN>稳定机器代码。</zh-CN><en>Stable machine code.</en></lang>
 * @param {string} zhHans <lang><zh-CN>中文说明。</zh-CN><en>Chinese explanation.</en></lang>
 * @param {string} english <lang><zh-CN>英文说明。</zh-CN><en>English explanation.</en></lang>
 * @returns {object} <lang><zh-CN>只含 code 与双语 message 的公开诊断。</zh-CN><en>Public diagnostic containing only code and bilingual message.</en></lang>
 * @lang zh-CN API 不接受 subject/payload 参数，从形状上阻止 profile、路径或异常文本进入结果。
 * @lang en The API accepts no subject or payload parameter, preventing profile, path, or exception text from entering the result by shape.
 */
function createDiagnostic(code, zhHans, english) {
  // <lang><zh-CN>每次构造新的 message 对象，调用方修改一次结果不会影响其他初始化。</zh-CN><en>Create a new message object every time so caller mutation of one result cannot affect another initialization.</en></lang>
  return {
    code,
    message: {
      'zh-Hans': zhHans,
      en: english
    }
  };
}

/**
 * <lang><zh-CN>复制受限 diagnostic 数组，避免下层结果对象被调用方反向修改。</zh-CN><en>Copies a bounded diagnostic array so lower-layer result objects cannot be mutated through the caller.</en></lang>
 *
 * @param {unknown} diagnostics <lang><zh-CN>下层返回的候选诊断。</zh-CN><en>Candidate diagnostics returned by a lower layer.</en></lang>
 * @returns {object[]} <lang><zh-CN>只保留稳定 code 与双语 message 的新数组。</zh-CN><en>New array retaining only stable code and bilingual message.</en></lang>
 * @lang zh-CN 意外 shape 被统一转为初始化失败，绝不序列化下层对象。
 * @lang en An unexpected shape becomes a generic initialization failure and is never serialized.
 */
function copyDiagnostics(diagnostics) {
  // <lang><zh-CN>非数组无法安全投影，返回一个本层自有的通用诊断。</zh-CN><en>A non-array value cannot be projected safely, so return one generic diagnostic owned by this layer.</en></lang>
  if (!Array.isArray(diagnostics)) {
    return [
      createDiagnostic(
        'representative.initialization.failed',
        '代表性纵切初始化失败。',
        'The representative slice failed to initialize.'
      )
    ];
  }

  // <lang><zh-CN>只复制满足公开 shape 的条目，忽略未知字段与 subject。</zh-CN><en>Copy only entries satisfying the public shape and ignore unknown fields and subjects.</en></lang>
  const safeDiagnostics = diagnostics
    .filter((diagnostic) => (
      isRecord(diagnostic)
      && typeof diagnostic.code === 'string'
      && isRecord(diagnostic.message)
      && typeof diagnostic.message['zh-Hans'] === 'string'
      && typeof diagnostic.message.en === 'string'
    ))
    .map((diagnostic) => ({
      code: diagnostic.code,
      message: {
        'zh-Hans': diagnostic.message['zh-Hans'],
        en: diagnostic.message.en
      }
    }));

  // <lang><zh-CN>下层数组为空或全为未知 shape 时仍返回明确通用失败。</zh-CN><en>When the lower-layer array is empty or entirely unknown, still return an explicit generic failure.</en></lang>
  if (safeDiagnostics.length === 0) {
    return [
      createDiagnostic(
        'representative.initialization.failed',
        '代表性纵切初始化失败。',
        'The representative slice failed to initialize.'
      )
    ];
  }

  // <lang><zh-CN>返回新数组与新 message 对象，不共享下层引用。</zh-CN><en>Return a new array and new message objects that share no lower-layer reference.</en></lang>
  return safeDiagnostics;
}

/**
 * <lang><zh-CN>创建只含结构化 diagnostics 的失败初始化结果。</zh-CN><en>Creates a failed initialization result containing only structured diagnostics.</en></lang>
 *
 * @param {object[]} diagnostics <lang><zh-CN>已脱敏的诊断列表。</zh-CN><en>Already redacted diagnostic list.</en></lang>
 * @returns {{ok: false, diagnostics: object[]}} <lang><zh-CN>无 shell/source/provider 表面的失败结果。</zh-CN><en>Failed result with no shell, source, or provider surface.</en></lang>
 * @lang zh-CN 根对象被冻结，但 diagnostics 仍是本次结果独立拥有的数据副本。
 * @lang en The root object is frozen while diagnostics remains a data copy independently owned by this result.
 */
function createFailure(diagnostics) {
  // <lang><zh-CN>失败结果不附加 profile、options、异常、source 默认值或 partial runtime。</zh-CN><en>The failed result adds no profile, options, exception, source default, or partial runtime.</en></lang>
  return Object.freeze({
    ok: false,
    diagnostics
  });
}

/**
 * <lang><zh-CN>校验完整 app profile，并生成 runtime 自有的受限数据副本。</zh-CN><en>Validates the complete app profile and creates a bounded data copy owned by the runtime.</en></lang>
 *
 * @param {unknown} candidateProfile <lang><zh-CN>调用方提供的候选 JSON 值。</zh-CN><en>Candidate JSON value supplied by the caller.</en></lang>
 * @returns {{ok: true, profile: object}|{ok: false, diagnostics: object[]}} <lang><zh-CN>成功副本或受限诊断。</zh-CN><en>Successful copy or bounded diagnostics.</en></lang>
 * @lang zh-CN 校验收集独立 shape 错误，便于一次修正 profile；任何错误都会阻止 source 构造。
 * @lang en Validation collects independent shape errors so a profile can be corrected once; any error prevents source construction.
 */
function validateRepresentativeProfile(candidateProfile) {
  // <lang><zh-CN>本次校验独立积累 diagnostics，不共享全局状态。</zh-CN><en>This validation accumulates diagnostics independently and shares no global state.</en></lang>
  const diagnostics = [];

  // <lang><zh-CN>根值必须是 JSON object；其他类型不再读取字段。</zh-CN><en>The root value must be a JSON object; no field is read from another type.</en></lang>
  if (!isRecord(candidateProfile)) {
    diagnostics.push(createDiagnostic(
      'representative.profile.input.invalid',
      '代表性应用 profile 必须是对象。',
      'The representative application profile must be an object.'
    ));
    return { ok: false, diagnostics };
  }

  // <lang><zh-CN>额外或缺失根字段使用同一稳定类别，诊断不列出调用方键名。</zh-CN><en>Extra or missing root fields share one stable category and the diagnostic lists no caller key.</en></lang>
  if (!hasExactOwnKeys(candidateProfile, PROFILE_ROOT_KEYS)) {
    diagnostics.push(createDiagnostic(
      'representative.profile.properties.invalid',
      '代表性应用 profile 的根字段集合不合法。',
      'The representative application profile has an invalid root field set.'
    ));
  }

  // <lang><zh-CN>版本必须精确匹配，runtime 不猜测向前或向后兼容。</zh-CN><en>The version must match exactly; the runtime guesses neither forward nor backward compatibility.</en></lang>
  if (candidateProfile.profileVersion !== CONTRACT_VERSION) {
    diagnostics.push(createDiagnostic(
      'representative.profile.version.invalid',
      '代表性应用 profile 版本不受支持。',
      'The representative application profile version is unsupported.'
    ));
  }

  // <lang><zh-CN>profile ID 固定到当前 app，避免把其他模块 profile 悄然装入本纵切。</zh-CN><en>The profile ID is fixed to this app, preventing another module profile from being silently loaded into the slice.</en></lang>
  if (candidateProfile.id !== REPRESENTATIVE_PROFILE_ID) {
    diagnostics.push(createDiagnostic(
      'representative.profile.id.invalid',
      '代表性应用 profile 标识不匹配。',
      'The representative application profile identifier does not match.'
    ));
  }

  // <lang><zh-CN>source 必须来自二项白名单；未知值不会回退。</zh-CN><en>The source must come from the two-item allowlist; an unknown value does not fall back.</en></lang>
  if (!ALLOWED_SOURCE_MODES.has(candidateProfile.sourceMode)) {
    diagnostics.push(createDiagnostic(
      'representative.profile.source-mode.invalid',
      '代表性应用 profile 选择了不受支持的数据源模式。',
      'The representative application profile selects an unsupported source mode.'
    ));
  }

  // <lang><zh-CN>query 必须是精确二字段对象，否则分页字段不能安全复制。</zh-CN><en>Query must be an exact two-field object before paging fields can be copied safely.</en></lang>
  const queryIsRecord = isRecord(candidateProfile.query);
  if (!queryIsRecord || !hasExactOwnKeys(candidateProfile.query, QUERY_KEYS)) {
    diagnostics.push(createDiagnostic(
      'representative.profile.query.properties.invalid',
      '代表性应用 profile 的 query 字段集合不合法。',
      'The representative application profile has an invalid query field set.'
    ));
  }

  // <lang><zh-CN>page 只在 query 为对象时读取，并要求从一开始的整数。</zh-CN><en>Read page only when query is an object and require a one-based integer.</en></lang>
  if (!queryIsRecord || !Number.isInteger(candidateProfile.query.page) || candidateProfile.query.page < 1) {
    diagnostics.push(createDiagnostic(
      'representative.profile.query.page.invalid',
      '代表性应用 profile 的初始页码必须是从一开始的整数。',
      'The representative application profile initial page must be a one-based integer.'
    ));
  }

  // <lang><zh-CN>pageSize 只允许公开契约固定的四个值。</zh-CN><en>Page size allows only the four values fixed by the public contract.</en></lang>
  if (!queryIsRecord || !ALLOWED_PAGE_SIZES.has(candidateProfile.query.pageSize)) {
    diagnostics.push(createDiagnostic(
      'representative.profile.query.page-size.invalid',
      '代表性应用 profile 的每页数量不在允许列表中。',
      'The representative application profile page size is not allowlisted.'
    ));
  }

  // <lang><zh-CN>presentation 只能包含 enabledBlocks 与 blockOrder；其他布局字段需要未来显式版本。</zh-CN><en>Presentation can contain only enabledBlocks and blockOrder; another layout field requires a future explicit version.</en></lang>
  const presentationIsRecord = isRecord(candidateProfile.presentation);
  if (!presentationIsRecord || !hasExactOwnKeys(candidateProfile.presentation, PRESENTATION_KEYS)) {
    diagnostics.push(createDiagnostic(
      'representative.profile.presentation.properties.invalid',
      '代表性应用 profile 的 presentation 字段集合不合法。',
      'The representative application profile has an invalid presentation field set.'
    ));
  }

  // <lang><zh-CN>enabledBlocks 必须是非空数组，后续唯一性和登记检查才有意义。</zh-CN><en>Enabled blocks must be a non-empty array before uniqueness and registration checks are meaningful.</en></lang>
  const enabledBlocks = presentationIsRecord ? candidateProfile.presentation.enabledBlocks : null;
  const blocksAreArray = Array.isArray(enabledBlocks);
  if (!blocksAreArray || enabledBlocks.length < REQUIRED_BLOCK_IDS.length || enabledBlocks.length > REGISTERED_BLOCK_IDS.size) {
    diagnostics.push(createDiagnostic(
      'representative.profile.presentation.blocks.invalid',
      '代表性应用 profile 的呈现区块数量不合法。',
      'The representative application profile has an invalid presentation-block count.'
    ));
  }

  // <lang><zh-CN>只有数组才检查每个 ID，避免对错误类型执行迭代或字符串拆分。</zh-CN><en>Inspect each ID only for an array, avoiding iteration or string splitting on an invalid type.</en></lang>
  if (blocksAreArray) {
    // <lang><zh-CN>Set 用于同时验证重复值与必选区块，不改变调用方数组。</zh-CN><en>A set validates both duplicates and required blocks without changing the caller array.</en></lang>
    const uniqueBlocks = new Set(enabledBlocks);

    // <lang><zh-CN>每一项都必须是已登记字符串，未知值不能成为组件或数据字段。</zh-CN><en>Every item must be a registered string; an unknown value cannot become a component or data field.</en></lang>
    const allBlocksAreRegistered = enabledBlocks.every((blockId) => (
      typeof blockId === 'string' && REGISTERED_BLOCK_IDS.has(blockId)
    ));
    if (!allBlocksAreRegistered) {
      diagnostics.push(createDiagnostic(
        'representative.profile.presentation.block-id.invalid',
        '代表性应用 profile 含有未登记的呈现区块。',
        'The representative application profile contains an unregistered presentation block.'
      ));
    }

    // <lang><zh-CN>重复 ID 无额外语义，直接拒绝而不自动去重或重排。</zh-CN><en>A duplicate ID has no additional meaning and is rejected rather than automatically deduplicated or reordered.</en></lang>
    if (uniqueBlocks.size !== enabledBlocks.length) {
      diagnostics.push(createDiagnostic(
        'representative.profile.presentation.block-duplicate',
        '代表性应用 profile 的呈现区块不能重复。',
        'The representative application profile presentation blocks must be unique.'
      ));
    }

    // <lang><zh-CN>目录与详情共同构成验收纵切，缺失任一项都不能生成 partial app。</zh-CN><en>Catalog and detail jointly form the accepted slice; absence of either cannot produce a partial app.</en></lang>
    const hasRequiredBlocks = REQUIRED_BLOCK_IDS.every((blockId) => uniqueBlocks.has(blockId));
    if (!hasRequiredBlocks) {
      diagnostics.push(createDiagnostic(
        'representative.profile.presentation.required-block-missing',
        '代表性应用 profile 缺少必需的目录或详情区块。',
        'The representative application profile lacks a required catalog or detail block.'
      ));
    }
  }

  // <lang><zh-CN>blockOrder 必须是 enabledBlocks 的完整无重复排列；它只声明已有 block 的相对位置。</zh-CN><en>Block order must be a complete duplicate-free permutation of enabled blocks; it declares only relative positions of existing blocks.</en></lang>
  const blockOrder = presentationIsRecord ? candidateProfile.presentation.blockOrder : null;
  const blockOrderIsArray = Array.isArray(blockOrder);
  const hasValidBlockOrder = blockOrderIsArray
    && blocksAreArray
    && blockOrder.length === enabledBlocks.length
    && blockOrder.every((blockId) => (
      typeof blockId === 'string'
      && REGISTERED_BLOCK_IDS.has(blockId)
      && enabledBlocks.includes(blockId)
    ))
    && new Set(blockOrder).size === blockOrder.length;

  // <lang><zh-CN>拒绝缺失、重复、未知或不匹配排序；不自动推断默认顺序、组件、样式或 route。</zh-CN><en>Reject a missing, duplicate, unknown, or mismatched order; infer no default order, component, style, or route.</en></lang>
  if (!hasValidBlockOrder) {
    diagnostics.push(createDiagnostic(
      'representative.profile.presentation.block-order.invalid',
      '代表性应用 profile 的呈现区块排序不合法。',
      'The representative application profile has an invalid presentation-block order.'
    ));
  }

  // <lang><zh-CN>任一错误都会在 source/provider 构造前返回完整受限诊断列表。</zh-CN><en>Any error returns the complete bounded diagnostic list before source or provider construction.</en></lang>
  if (diagnostics.length > 0) {
    return { ok: false, diagnostics };
  }

  // <lang><zh-CN>校验通过后只复制公开字段，切断调用方后续修改与未枚举原型状态。</zh-CN><en>After validation, copy only public fields, cutting off later caller mutation and unenumerated prototype state.</en></lang>
  return {
    ok: true,
    profile: {
      profileVersion: candidateProfile.profileVersion,
      id: candidateProfile.id,
      sourceMode: candidateProfile.sourceMode,
      query: {
        page: candidateProfile.query.page,
        pageSize: candidateProfile.query.pageSize
      },
      presentation: {
        enabledBlocks: [...candidateProfile.presentation.enabledBlocks],
        blockOrder: [...candidateProfile.presentation.blockOrder]
      }
    }
  };
}

/**
 * <lang><zh-CN>校验代码调用方提供的本地 fixture 选择，不把它扩展到 JSON profile。</zh-CN><en>Validates the local fixture selection supplied by code without extending it into the JSON profile.</en></lang>
 *
 * @param {string} sourceMode <lang><zh-CN>已验证的显式 source mode。</zh-CN><en>Validated explicit source mode.</en></lang>
 * @param {unknown} candidateOptions <lang><zh-CN>候选本地测试 options。</zh-CN><en>Candidate local-test options.</en></lang>
 * @returns {{ok: true, fixtureCase: string}|{ok: false, diagnostics: object[]}} <lang><zh-CN>受限 fixture case 或诊断。</zh-CN><en>Bounded fixture case or diagnostics.</en></lang>
 * @lang zh-CN options 只允许可选 fixtureCase，拒绝 endpoint、callback、时钟、cache 或任意 provider 注入。
 * @lang en Options allow only optional fixtureCase and reject endpoint, callback, clock, cache, or arbitrary provider injection.
 */
function validateFixtureOptions(sourceMode, candidateOptions) {
  // <lang><zh-CN>缺省参数在公开 factory 处为新对象；此处仍校验调用方未传 null/array。</zh-CN><en>The public factory defaults to a fresh object; this layer still checks that a caller supplied neither null nor an array.</en></lang>
  if (!isRecord(candidateOptions)) {
    return {
      ok: false,
      diagnostics: [
        createDiagnostic(
          'representative.fixture-options.invalid',
          '代表性纵切的本地 fixture options 必须是对象。',
          'The representative slice local fixture options must be an object.'
        )
      ]
    };
  }

  // <lang><zh-CN>零字段或唯一 fixtureCase 字段合法；额外键不会成为隐藏配置面。</zh-CN><en>Zero fields or the sole fixtureCase field is valid; an extra key cannot become a hidden configuration surface.</en></lang>
  const optionKeys = Object.keys(candidateOptions);
  const hasAllowedKeys = optionKeys.length === 0
    || (optionKeys.length === 1 && optionKeys[0] === 'fixtureCase');
  if (!hasAllowedKeys) {
    return {
      ok: false,
      diagnostics: [
        createDiagnostic(
          'representative.fixture-options.properties.invalid',
          '代表性纵切的本地 fixture options 含有不支持的字段。',
          'The representative slice local fixture options contain an unsupported field.'
        )
      ]
    };
  }

  // <lang><zh-CN>每种 source 使用自身既有默认 fixture；这不是 source fallback。</zh-CN><en>Each source uses its own existing default fixture; this is not source fallback.</en></lang>
  const defaultFixtureCase = sourceMode === 'wire-fixture' ? 'success' : 'first-page';

  // <lang><zh-CN>调用方未提供 fixtureCase 时采用所选 source 内部的固定成功情形。</zh-CN><en>When the caller supplies no fixtureCase, use the fixed success case internal to the selected source.</en></lang>
  const fixtureCase = candidateOptions.fixtureCase ?? defaultFixtureCase;

  // <lang><zh-CN>按 source 选择对应白名单，绝不把 mock case 传给 wire 或反向猜测。</zh-CN><en>Select the corresponding allowlist by source and never pass a mock case to wire or guess in the opposite direction.</en></lang>
  const allowedFixtureCases = sourceMode === 'wire-fixture'
    ? WIRE_FIXTURE_CASES
    : MOCK_FIXTURE_CASES;

  // <lang><zh-CN>未知 fixture case 只返回类别诊断，不回显任意输入字符串。</zh-CN><en>An unknown fixture case returns only a category diagnostic and never echoes an arbitrary input string.</en></lang>
  if (!allowedFixtureCases.has(fixtureCase)) {
    return {
      ok: false,
      diagnostics: [
        createDiagnostic(
          'representative.fixture-case.invalid',
          '所选数据源不支持请求的本地 fixture case。',
          'The selected source does not support the requested local fixture case.'
        )
      ]
    };
  }

  // <lang><zh-CN>成功值来自固定 Set，后续 source factory 不再接收任意字符串。</zh-CN><en>The successful value comes from a fixed set, so the source factory receives no arbitrary string.</en></lang>
  return { ok: true, fixtureCase };
}

/**
 * <lang><zh-CN>复制 runtime 自有 profile，供 UI 读取而不取得内部数组引用。</zh-CN><en>Copies the runtime-owned profile for UI reading without exposing its internal array reference.</en></lang>
 *
 * @param {object} profile <lang><zh-CN>已验证并由 runtime 拥有的 profile。</zh-CN><en>Validated profile owned by the runtime.</en></lang>
 * @returns {object} <lang><zh-CN>完整公开 profile 的新数据副本。</zh-CN><en>New data copy of the complete public profile.</en></lang>
 * @lang zh-CN helper 只处理固定 shape，不使用通用序列化或平台专用 clone API。
 * @lang en The helper handles only the fixed shape and uses neither generic serialization nor a platform-specific clone API.
 */
function copyProfile(profile) {
  // <lang><zh-CN>每层对象以及 enabledBlocks/blockOrder 数组都重新创建。</zh-CN><en>Recreate every object layer and the enabledBlocks/blockOrder arrays.</en></lang>
  return {
    profileVersion: profile.profileVersion,
    id: profile.id,
    sourceMode: profile.sourceMode,
    query: {
      page: profile.query.page,
      pageSize: profile.query.pageSize
    },
    presentation: {
      enabledBlocks: [...profile.presentation.enabledBlocks],
      blockOrder: [...profile.presentation.blockOrder]
    }
  };
}

/**
 * <lang><zh-CN>创建代表性小程序的纯 fixture runtime。</zh-CN><en>Creates the pure fixture runtime for the representative mini-program.</en></lang>
 *
 * @param {unknown} candidateProfile <lang><zh-CN>待完整校验的声明式 app profile。</zh-CN><en>Declarative app profile to validate completely.</en></lang>
 * @param {object} [fixtureOptions={}] <lang><zh-CN>代码自有、仅含 allowlisted fixtureCase 的本地证据选择。</zh-CN><en>Code-owned local evidence selection containing only an allowlisted fixtureCase.</en></lang>
 * @param {unknown} solutionProfile <lang><zh-CN>待完整校验的版本化 solution profile。</zh-CN><en>Versioned solution profile to validate completely.</en></lang>
 * @returns {object} <lang><zh-CN>失败时只有 diagnostics；成功时包含只读 source、snapshot helpers 与 app shell。</zh-CN><en>On failure only diagnostics; on success read-only source, snapshot helpers, and app shell.</en></lang>
 * @lang zh-CN factory 先校验 app profile 与 solution availability，再校验 options、创建完整模板候选，并通过 integration runtime 原子采用和建立 shell；任一步失败都不返回 partial runtime。
 * @lang en The factory validates app profile and solution availability before options, creates a complete template candidate, and adopts it atomically through integration runtime before establishing shell; failure at any step returns no partial runtime.
 */
export function createRepresentativeFixtureRuntime(candidateProfile, fixtureOptions = {}, solutionProfile) {
  // <lang><zh-CN>profile 校验是第一道门禁；失败不会进入 options/source/core/lifecycle。</zh-CN><en>Profile validation is the first gate; failure reaches neither options, source, core, nor lifecycle.</en></lang>
  const profileValidation = validateRepresentativeProfile(candidateProfile);

  // <lang><zh-CN>返回新失败对象，不附加候选 profile 或 source 默认值。</zh-CN><en>Return a new failed object and attach neither candidate profile nor source default.</en></lang>
  if (!profileValidation.ok) {
    return createFailure(profileValidation.diagnostics);
  }

  // <lang><zh-CN>后续全部使用 runtime 自有 profile 副本，调用方修改原对象不再生效。</zh-CN><en>All later work uses the runtime-owned profile copy, so mutation of the caller's original object no longer has an effect.</en></lang>
  const profile = profileValidation.profile;

  // <lang><zh-CN>solution resolver 必须在 options/provider/template 之前完成，失败时不形成任何可调用业务纵切表面。</zh-CN><en>The solution resolver must complete before options, provider, or template; failure forms no invokable business-slice surface.</en></lang>
  const solutionResolution = createRepresentativeSolutionProfileRuntime().resolve(
    solutionProfile,
    createAnonymousMockSession()
  );

  // <lang><zh-CN>仅投影下层已脱敏 diagnostics；不回显 solution、session grant、registry 或 package 描述符。</zh-CN><en>Project only lower-layer redacted diagnostics; echo no solution, session grant, registry, or package descriptor.</en></lang>
  if (!solutionResolution.ok) {
    return createFailure(copyDiagnostics(solutionResolution.diagnostics));
  }

  // <lang><zh-CN>代表性模板当前固定提供 acknowledge command port，因此 read 与 acknowledge package 都必须可用；页面尚不投影 command control，检查只阻止未授权组合形成 provider。</zh-CN><en>The representative template currently fixes an acknowledge-command port, so both read and acknowledge packages must be available; page projects no command control yet, and this check only prevents unauthorized composition from forming provider.</en></lang>
  const hasRequiredSolutionCapabilities = solutionResolution.isCapabilityAvailable(
    'example.catalog-query-detail.read'
  ) && solutionResolution.isCapabilityAvailable(
    'example.catalog-query-detail.acknowledge'
  );

  // <lang><zh-CN>若 static solution 未选择完整中性组合，返回本层固定 diagnostic，而不以 template/source fallback 掩盖缺少 capability。</zh-CN><en>When static solution does not select complete neutral composition, return this layer's fixed diagnostic and do not hide missing capability through template/source fallback.</en></lang>
  if (!hasRequiredSolutionCapabilities) {
    return createFailure([createDiagnostic(
      'representative.solution.capability.unavailable',
      '代表性解决方案缺少必需的中性能力组合。',
      'The representative solution lacks the required neutral capability composition.'
    )]);
  }

  // <lang><zh-CN>fixture options 在 source 构造前校验，拒绝任意 callback 或连接字段。</zh-CN><en>Validate fixture options before source construction, rejecting an arbitrary callback or connection field.</en></lang>
  const fixtureValidation = validateFixtureOptions(profile.sourceMode, fixtureOptions);

  // <lang><zh-CN>options 失败同样不创建 provider，也不回退到 source 默认情形。</zh-CN><en>Options failure likewise creates no provider and does not fall back to a source default case.</en></lang>
  if (!fixtureValidation.ok) {
    return createFailure(fixtureValidation.diagnostics);
  }

  // <lang><zh-CN>模板候选显式接收 app 已验证的 source、fixture、page size、已编译 block 与 block 排序。</zh-CN><en>The template candidate explicitly receives app-validated source, fixture, page size, compiled blocks, and block order.</en></lang>
  const templateCandidate = createExampleCatalogTemplateCandidate({
    sourceMode: profile.sourceMode,
    fixtureCase: fixtureValidation.fixtureCase,
    pageSize: profile.query.pageSize,
    enabledBlocks: profile.presentation.enabledBlocks,
    blockOrder: profile.presentation.blockOrder
  });

  // <lang><zh-CN>通用 integration runtime 先校验 template/slots/surfaces，再原子采用完整 units，最后创建 shell。</zh-CN><en>The generic integration runtime validates template, slots, and surfaces before atomically adopting complete units and finally creating the shell.</en></lang>
  const integration = createApplicationIntegrationRuntime(templateCandidate);

  // <lang><zh-CN>集成失败只投影受限 diagnostics；template、profile、unit 与 partial shell 均不公开。</zh-CN><en>An integration failure projects only bounded diagnostics; template, profile, units, and a partial shell all remain private.</en></lang>
  if (!integration.ok) {
    return createFailure(copyDiagnostics(integration.diagnostics));
  }

  // <lang><zh-CN>presentation Set 从已验证副本创建，后续 caller profile/snapshot 修改不能改变可见性。</zh-CN><en>Create the presentation set from the validated copy so later caller profile or snapshot mutation cannot change visibility.</en></lang>
  const enabledBlocks = new Set(profile.presentation.enabledBlocks);

  // <lang><zh-CN>排序 Map 只从已验证的完整排列构造；整数序号可安全投影为固定页面的 flex order。</zh-CN><en>Build the order map only from the validated complete permutation; integer positions can safely project to fixed-page flex order.</en></lang>
  const orderByBlock = new Map(
    profile.presentation.blockOrder.map((blockId, index) => [blockId, index + 1])
  );

  /**
   * <lang><zh-CN>按 profile 创建完整 canonical catalog query。</zh-CN><en>Creates a complete canonical catalog query from the profile.</en></lang>
   *
   * @returns {{contractVersion: string, filter: object, page: number, pageSize: number}} <lang><zh-CN>无行业 filter 的新 query 对象。</zh-CN><en>New query object with no industry filter.</en></lang>
   * @lang zh-CN 每次返回新对象与空 filter，避免 shell/UI 修改后污染下一次请求。
   * @lang en Return a new object and empty filter every time so shell or UI mutation cannot pollute the next request.
   */
  const createQueryRequest = () => ({
    contractVersion: CONTRACT_VERSION,
    filter: {},
    page: profile.query.page,
    pageSize: profile.query.pageSize
  });

  /**
   * <lang><zh-CN>返回 runtime 自有 profile 的完整隔离副本。</zh-CN><en>Returns a complete isolated copy of the runtime-owned profile.</en></lang>
   *
   * @returns {object} <lang><zh-CN>可供 Vue 只读消费的 profile snapshot。</zh-CN><en>Profile snapshot for read-only Vue consumption.</en></lang>
   * @lang zh-CN 返回对象可由调用方修改，但修改不会写回 runtime。
   * @lang en The caller may mutate the returned object, but changes do not write back into the runtime.
   */
  const getProfileSnapshot = () => copyProfile(profile);

  /**
   * <lang><zh-CN>返回 lifecycle runtime 的脱敏隔离 snapshot。</zh-CN><en>Returns the redacted isolated snapshot of the lifecycle runtime.</en></lang>
   *
   * @returns {object[]} <lang><zh-CN>按 module ID 排序的能力状态。</zh-CN><en>Capability states sorted by module ID.</en></lang>
   * @lang zh-CN 下层 snapshot 已复制关系数组且不含 provider/manifest/composition。
   * @lang en The lower-layer snapshot already copies relationship arrays and contains no provider, manifest, or composition.
   */
  const getLifecycleSnapshot = () => integration.getAdoptionSnapshot();

  /**
   * <lang><zh-CN>返回已验证 solution 的受限稳定快照。</zh-CN><en>Returns the bounded stable snapshot of the validated solution.</en></lang>
   *
   * @returns {object} <lang><zh-CN>不含 session grant、registry 或原始 profile 的 solution metadata。</zh-CN><en>Solution metadata containing no session grant, registry, or raw profile.</en></lang>
   * @lang zh-CN snapshot 由 solution runtime 新建；调用方修改不会改变 package availability 或 app shell。
   * @lang en The solution runtime creates a fresh snapshot; caller changes cannot alter package availability or app shell.
   */
  const getSolutionSnapshot = () => solutionResolution.getSolutionSnapshot();

  /**
   * <lang><zh-CN>返回本 solution 已解析 capability package 的受限 availability 快照。</zh-CN><en>Returns the bounded availability snapshot of capability packages resolved by this solution.</en></lang>
   *
   * @returns {object[]} <lang><zh-CN>只含 package ID 与 availability state 的新数组。</zh-CN><en>New array containing only package IDs and availability states.</en></lang>
   * @lang zh-CN snapshot 不泄露 dependency descriptor、grant 集合、module 实现、provider 或注册表。
   * @lang en Snapshot leaks no dependency descriptor, grant set, module implementation, provider, or registry.
   */
  const getCapabilityAvailabilitySnapshot = () => solutionResolution.getCapabilitySnapshot();

  /**
   * <lang><zh-CN>返回所选 source 的受限 observation。</zh-CN><en>Returns the bounded observation for the selected source.</en></lang>
   *
   * @returns {object} <lang><zh-CN>wire 时为计数，mock 时只标识显式模式。</zh-CN><en>Counts for wire, or only explicit mode for mock.</en></lang>
   * @lang zh-CN observation 不包含 query/detail 输入输出、wire、cache value、session 或异常。
   * @lang en Observation contains no query or detail input/output, wire value, cache value, session, or exception.
   */
  const getObservation = () => templateCandidate.getObservation();

  /**
 * <lang><zh-CN>返回一个已登记区块的受限显示与排序投影。</zh-CN><en>Returns a bounded visibility and order projection for one registered block.</en></lang>
 *
 * @param {unknown} blockId <lang><zh-CN>待检查的区块标识。</zh-CN><en>Block identifier to inspect.</en></lang>
 * @returns {{id: string, visible: boolean, order: number|null}|null} <lang><zh-CN>已登记区块的 plain-data 投影，或未知 ID 的 null。</zh-CN><en>Plain-data projection for a registered block, or null for an unknown ID.</en></lang>
 * @lang zh-CN 不返回 component、template、style text、profile 原文或内部 Map/Set。
 * @lang en It returns no component, template, style text, raw profile, or internal map/set.
   */
  const getBlockProjection = (blockId) => {
    // <lang><zh-CN>未知值没有 projection，因而不能成为组件解析、样式来源或页面结构输入。</zh-CN><en>An unknown value has no projection and therefore cannot become component resolution, a style source, or page-structure input.</en></lang>
    if (typeof blockId !== 'string' || !REGISTERED_BLOCK_IDS.has(blockId)) {
      return null;
    }

    // <lang><zh-CN>已登记但未启用的 block 仍只暴露固定 false/null metadata；不泄露 profile、template 或实现对象。</zh-CN><en>A registered but disabled block still exposes only fixed false/null metadata and leaks no profile, template, or implementation object.</en></lang>
    if (!enabledBlocks.has(blockId)) {
      return {
        id: blockId,
        visible: false,
        order: null
      };
    }

    // <lang><zh-CN>成功排序必为从一开始的有限整数；防御性 null 保持为不可显示而非猜测默认值。</zh-CN><en>A successful order is a finite one-based integer; defensive null remains non-displayable instead of guessing a default.</en></lang>
    const order = orderByBlock.get(blockId);
    if (!Number.isInteger(order) || order < 1) {
      return {
        id: blockId,
        visible: false,
        order: null
      };
    }

    // <lang><zh-CN>返回调用方自有的 plain data，避免其修改影响 runtime Map 或 Set。</zh-CN><en>Return caller-owned plain data so mutation cannot affect runtime map or set.</en></lang>
    return {
      id: blockId,
      visible: true,
      order
    };
  };

  /**
   * <lang><zh-CN>返回当前启用 block 的已验证顺序快照。</zh-CN><en>Returns a validated ordered snapshot of currently enabled blocks.</en></lang>
   *
   * @returns {{id: string, visible: boolean, order: number}[]} <lang><zh-CN>不含 profile 原文或 UI 实现的排序 metadata。</zh-CN><en>Ordered metadata containing no raw profile or UI implementation.</en></lang>
   * @lang zh-CN 数组按声明排序而非注册顺序；每项均为新对象，调用方写入不会影响 runtime。
   * @lang en The array follows declared order rather than registration order; every item is new so caller writes cannot affect runtime.
   */
  const getPresentationSnapshot = () => profile.presentation.blockOrder.map((blockId) => (
    getBlockProjection(blockId)
  ));

  /**
   * <lang><zh-CN>判断一个调用方 ID 是否为当前 profile 已启用的已登记区块。</zh-CN><en>Determines whether a caller ID is a registered block enabled by the current profile.</en></lang>
   *
   * @param {unknown} blockId <lang><zh-CN>待检查的区块标识。</zh-CN><en>Block identifier to inspect.</en></lang>
   * @returns {boolean} <lang><zh-CN>是否可显示对应已编译 template 分支。</zh-CN><en>Whether the corresponding compiled template branch may be displayed.</en></lang>
   * @lang zh-CN 判断委托受限 projection；未知值始终为 false，不进入组件解析。
   * @lang en The decision delegates to bounded projection; an unknown value is always false and never enters component resolution.
   */
  const isBlockEnabled = (blockId) => getBlockProjection(blockId)?.visible === true;

  // <lang><zh-CN>冻结成功 API 容器；其中不含 capability runtime、provider、manifest、core profile 或 fixture controller。</zh-CN><en>Freeze the successful API container; it contains no capability runtime, provider, manifest, core profile, or fixture controller.</en></lang>
  return Object.freeze({
    ok: true,
    diagnostics: [],
    sourceMode: profile.sourceMode,
    shell: integration.shell,
    createQueryRequest,
    getBlockProjection,
    getProfileSnapshot,
    getPresentationSnapshot,
    getLifecycleSnapshot,
    getSolutionSnapshot,
    getCapabilityAvailabilitySnapshot,
    getObservation,
    isBlockEnabled
  });
}
