/**
 * <lang><zh-CN>显式能力采用 runtime：校验完整 adoption profile 与调用方提供的单元，在隔离候选中完成装配/启用，再原子切换活动进程内 runtime。</zh-CN><en>Explicit capability-adoption runtime: validates a complete adoption profile and caller-supplied units, assembles/enables them in an isolated candidate, and then atomically switches the active process-local runtime.</en></lang>
 * @lang zh-CN 本模块不发现、下载、读取、import 或执行未知 package，不访问文件、网络、环境、registry、storage、credential，也不运行 lifecycle/migration hook。
 * @lang en This module does not discover, download, read, import, or execute unknown packages; access files, network, environment, registry, storage, or credentials; or run lifecycle/migration hooks.
 */

// <lang><zh-CN>采用 runtime 只复用既有同仓 capability lifecycle，不建立第二套 manifest/provider 解释器。</zh-CN><en>The adoption runtime reuses only the existing same-repository capability lifecycle and creates no second manifest/provider interpreter.</en></lang>
import {
  createCapabilityRuntime
} from '@hia-uview/biz-capability-runtime';

/**
 * <lang><zh-CN>首版 adoption profile contract version。</zh-CN><en>The initial adoption-profile contract version.</en></lang>
 * @lang zh-CN 该值描述采用声明，不是 npm package version。
 * @lang en This value describes an adoption declaration and is not an npm package version.
 */
const ADOPTION_VERSION = '1.0';

/**
 * <lang><zh-CN>用于区分 adoption profile 与其他 manifest/profile 的固定 kind。</zh-CN><en>The fixed kind that distinguishes an adoption profile from other manifests/profiles.</en></lang>
 * @lang zh-CN runtime 不根据相似 shape 猜测声明类型。
 * @lang en The runtime does not guess a declaration type from a similar shape.
 */
const ADOPTION_PROFILE_KIND = 'capability-adoption-profile';

/**
 * <lang><zh-CN>稳定 module/profile/implementation ID 的 JSON-compatible 模式。</zh-CN><en>JSON-compatible pattern for stable module/profile/implementation IDs.</en></lang>
 * @lang zh-CN 至少包含一个点，防止普通 display text 被误作全局标识。
 * @lang en At least one dot is required, preventing ordinary display text from being mistaken for a global identifier.
 */
const DOTTED_IDENTIFIER_PATTERN = /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/;

/**
 * <lang><zh-CN>稳定 block/visibility ID 的简单标识模式。</zh-CN><en>The simple-identifier pattern for stable block/visibility IDs.</en></lang>
 * @lang zh-CN 该模式拒绝路径、URL、空白、表达式和脚本标点。
 * @lang en The pattern rejects paths, URLs, whitespace, expressions, and script punctuation.
 */
const SIMPLE_IDENTIFIER_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * <lang><zh-CN>可公开 diagnostic subject 的宽松稳定 ID 模式。</zh-CN><en>The bounded stable-ID pattern for a public diagnostic subject.</en></lang>
 * @lang zh-CN subject 可为 simple 或 dotted ID，但不能包含调用输入、路径或任意文本。
 * @lang en A subject may be a simple or dotted ID but cannot contain invocation input, a path, or arbitrary text.
 */
const PUBLIC_IDENTIFIER_PATTERN = /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/;

/**
 * <lang><zh-CN>判断未知值是否为可按 JSON object 读取的非数组记录。</zh-CN><en>Determines whether an unknown value is a non-array record readable as a JSON object.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>候选值。</zh-CN><en>Candidate value.</en></lang>
 * @returns {boolean} <lang><zh-CN>值为非 null object 且不是数组时为 true。</zh-CN><en>True when the value is a non-null object and not an array.</en></lang>
 * @lang zh-CN profile contract 面向已解析 JSON-compatible 数据；函数不执行 schema、getter 或目标代码。
 * @lang en The profile contract targets parsed JSON-compatible data; this function executes no schema, getter, or target code.
 */
function isRecord(value) {
  // <lang><zh-CN>使用最小 shape 判断；更细字段由独立 validator 逐项处理。</zh-CN><en>Use a minimal shape test; a separate validator handles fields individually.</en></lang>
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * <lang><zh-CN>判断字符串是否为稳定 dotted ID。</zh-CN><en>Determines whether a string is a stable dotted ID.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>候选标识。</zh-CN><en>Candidate identifier.</en></lang>
 * @returns {boolean} <lang><zh-CN>匹配公开 dotted 规则时为 true。</zh-CN><en>True when the value matches the public dotted rule.</en></lang>
 * @lang zh-CN 校验不规范化大小写或猜测 namespace。
 * @lang en Validation neither normalizes case nor guesses a namespace.
 */
function isDottedIdentifier(value) {
  // <lang><zh-CN>先限制类型，再执行固定正则。</zh-CN><en>Restrict the type before applying the fixed regular expression.</en></lang>
  return typeof value === 'string' && DOTTED_IDENTIFIER_PATTERN.test(value);
}

/**
 * <lang><zh-CN>判断字符串是否为稳定 simple ID。</zh-CN><en>Determines whether a string is a stable simple ID.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>候选 block/visibility 标识。</zh-CN><en>Candidate block/visibility identifier.</en></lang>
 * @returns {boolean} <lang><zh-CN>匹配 simple 规则时为 true。</zh-CN><en>True when the value matches the simple rule.</en></lang>
 * @lang zh-CN simple ID 不能成为 URL、路径或表达式。
 * @lang en A simple ID cannot become a URL, path, or expression.
 */
function isSimpleIdentifier(value) {
  // <lang><zh-CN>只接受固定 ASCII lowercase identifier surface。</zh-CN><en>Accept only the fixed ASCII lowercase identifier surface.</en></lang>
  return typeof value === 'string' && SIMPLE_IDENTIFIER_PATTERN.test(value);
}

/**
 * <lang><zh-CN>确认记录恰好拥有给定 enumerable own keys。</zh-CN><en>Confirms that a record has exactly the given enumerable own keys.</en></lang>
 *
 * @param {object} record <lang><zh-CN>已确认的记录。</zh-CN><en>Confirmed record.</en></lang>
 * @param {string[]} expectedKeys <lang><zh-CN>允许且必需的键。</zh-CN><en>Allowed and required keys.</en></lang>
 * @returns {boolean} <lang><zh-CN>键集合完全相等时为 true。</zh-CN><en>True when the key sets are exactly equal.</en></lang>
 * @lang zh-CN 额外字段不会被容忍或转交给 provider。
 * @lang en Extra fields are neither tolerated nor forwarded to a provider.
 */
function hasExactKeys(record, expectedKeys) {
  // <lang><zh-CN>读取 JSON-compatible enumerable own keys。</zh-CN><en>Read JSON-compatible enumerable own keys.</en></lang>
  const actualKeys = Object.keys(record);

  // <lang><zh-CN>长度不同即可拒绝，避免遗漏额外字段。</zh-CN><en>Reject immediately when lengths differ, avoiding an overlooked extra field.</en></lang>
  if (actualKeys.length !== expectedKeys.length) {
    // <lang><zh-CN>false 只表达 shape mismatch，不暴露实际键名。</zh-CN><en>False reports only a shape mismatch and exposes no actual key name.</en></lang>
    return false;
  }

  // <lang><zh-CN>逐个要求 expected key 为自有属性。</zh-CN><en>Require every expected key to be an own property.</en></lang>
  return expectedKeys.every((key) => Object.hasOwn(record, key));
}

/**
 * <lang><zh-CN>创建一个新的双语 diagnostic message。</zh-CN><en>Creates a new bilingual diagnostic message.</en></lang>
 *
 * @param {string} zhHans <lang><zh-CN>简体中文说明。</zh-CN><en>Simplified-Chinese explanation.</en></lang>
 * @param {string} english <lang><zh-CN>英文说明。</zh-CN><en>English explanation.</en></lang>
 * @returns {object} <lang><zh-CN>新的 locale 映射。</zh-CN><en>A new locale map.</en></lang>
 * @lang zh-CN runtime locale 使用 `zh-Hans`；代码文档继续使用 `zh-CN`。
 * @lang en Runtime locale uses `zh-Hans`; code documentation continues to use `zh-CN`.
 */
function createLocalizedText(zhHans, english) {
  // <lang><zh-CN>每次创建新对象，防止调用方修改共享消息。</zh-CN><en>Create a new object each time, preventing callers from mutating a shared message.</en></lang>
  return {
    'zh-Hans': zhHans,
    en: english
  };
}

/**
 * <lang><zh-CN>创建只含稳定 metadata 的 adoption diagnostic。</zh-CN><en>Creates an adoption diagnostic containing only stable metadata.</en></lang>
 *
 * @param {string} code <lang><zh-CN>稳定 diagnostic code。</zh-CN><en>Stable diagnostic code.</en></lang>
 * @param {string} zhHans <lang><zh-CN>中文说明。</zh-CN><en>Chinese explanation.</en></lang>
 * @param {string} english <lang><zh-CN>英文说明。</zh-CN><en>English explanation.</en></lang>
 * @param {unknown} [subjectId] <lang><zh-CN>可选、已验证的稳定 ID。</zh-CN><en>Optional validated stable ID.</en></lang>
 * @returns {object} <lang><zh-CN>不含输入或底层错误的 diagnostic。</zh-CN><en>A diagnostic containing no input or underlying error.</en></lang>
 * @lang zh-CN 无效 subject 被省略，防止任意 profile/unit 文本进入日志。
 * @lang en An invalid subject is omitted, preventing arbitrary profile/unit text from entering logs.
 */
function createDiagnostic(code, zhHans, english, subjectId) {
  // <lang><zh-CN>先创建固定 code/message 基础对象。</zh-CN><en>First create the fixed code/message base object.</en></lang>
  const diagnostic = {
    code,
    message: createLocalizedText(zhHans, english)
  };

  // <lang><zh-CN>只有稳定 simple/dotted ID 才可加入公开 subject。</zh-CN><en>Only a stable simple/dotted ID may enter the public subject.</en></lang>
  if (typeof subjectId === 'string' && PUBLIC_IDENTIFIER_PATTERN.test(subjectId)) {
    // <lang><zh-CN>subject 只用于定位声明关系，不包含 provider 或 payload。</zh-CN><en>The subject locates a declaration relation and contains no provider or payload.</en></lang>
    diagnostic.subjectId = subjectId;
  }

  // <lang><zh-CN>返回新对象，调用方修改不会影响内部状态。</zh-CN><en>Return a new object so caller mutation cannot affect internal state.</en></lang>
  return diagnostic;
}

/**
 * <lang><zh-CN>创建失败协调结果。</zh-CN><en>Creates a failed reconciliation result.</en></lang>
 *
 * @param {object[]} diagnostics <lang><zh-CN>受限 diagnostic 列表。</zh-CN><en>Bounded diagnostic list.</en></lang>
 * @returns {{ok: false, diagnostics: object[]}} <lang><zh-CN>不含 receipt 的失败结果。</zh-CN><en>A failure result containing no receipt.</en></lang>
 * @lang zh-CN 失败结果永远不暗示部分采用动作。
 * @lang en A failure result never implies partial adoption actions.
 */
function createFailure(diagnostics) {
  // <lang><zh-CN>复制数组容器，避免调用方重排内部 validator 集合。</zh-CN><en>Copy the array container so callers cannot reorder an internal validator collection.</en></lang>
  return {
    ok: false,
    diagnostics: [...diagnostics]
  };
}

/**
 * <lang><zh-CN>复制并验证 runtime 创建时的宿主 presentation policy。</zh-CN><en>Copies and validates the host presentation policy supplied at runtime creation.</en></lang>
 *
 * @param {unknown} options <lang><zh-CN>宿主 allowlist 配置。</zh-CN><en>Host allowlist configuration.</en></lang>
 * @returns {object} <lang><zh-CN>三个只读 Set 组成的内部 policy。</zh-CN><en>An internal policy made of three read-only-use sets.</en></lang>
 * @throws {TypeError} <lang><zh-CN>宿主 policy shape/值无效时抛出固定错误。</zh-CN><en>Throws a fixed error when host-policy shape or values are invalid.</en></lang>
 * @lang zh-CN policy 是开发期显式参数；失败消息不复制任意配置内容。
 * @lang en Policy is an explicit development-time argument; failure messages copy no arbitrary configuration content.
 */
function createPresentationPolicy(options) {
  // <lang><zh-CN>要求恰好三个 allowlist 字段，避免隐藏 policy 开关。</zh-CN><en>Require exactly three allowlist fields, avoiding hidden policy switches.</en></lang>
  const hasValidShape = isRecord(options)
    && hasExactKeys(options, [
      'registeredBlocks',
      'registeredVisibility',
      'allowedPageSizes'
    ])
    && Array.isArray(options.registeredBlocks)
    && Array.isArray(options.registeredVisibility)
    && Array.isArray(options.allowedPageSizes);

  // <lang><zh-CN>shape 无效时在创建 runtime 阶段停止。</zh-CN><en>Stop during runtime creation when the shape is invalid.</en></lang>
  if (!hasValidShape) {
    // <lang><zh-CN>固定 TypeError 不回显 options。</zh-CN><en>The fixed TypeError does not echo options.</en></lang>
    throw new TypeError('Capability adoption presentation policy is invalid.');
  }

  // <lang><zh-CN>检查 block 数组非空、每项为 simple ID 且无重复。</zh-CN><en>Check that the block array is non-empty, consists of simple IDs, and has no duplicates.</en></lang>
  const blockSet = new Set(options.registeredBlocks);
  const hasValidBlocks = options.registeredBlocks.length > 0
    && blockSet.size === options.registeredBlocks.length
    && options.registeredBlocks.every(isSimpleIdentifier);

  // <lang><zh-CN>visibility 同样必须为非空稳定枚举集合。</zh-CN><en>Visibility must likewise be a non-empty stable enum set.</en></lang>
  const visibilitySet = new Set(options.registeredVisibility);
  const hasValidVisibility = options.registeredVisibility.length > 0
    && visibilitySet.size === options.registeredVisibility.length
    && options.registeredVisibility.every(isSimpleIdentifier);

  // <lang><zh-CN>pageSize 必须为非空、唯一、正整数 allowlist。</zh-CN><en>Page sizes must form a non-empty unique allowlist of positive integers.</en></lang>
  const pageSizeSet = new Set(options.allowedPageSizes);
  const hasValidPageSizes = options.allowedPageSizes.length > 0
    && pageSizeSet.size === options.allowedPageSizes.length
    && options.allowedPageSizes.every(
      (pageSize) => Number.isInteger(pageSize) && pageSize > 0
    );

  // <lang><zh-CN>任一 allowlist 无效都拒绝创建 runtime。</zh-CN><en>Reject runtime creation when any allowlist is invalid.</en></lang>
  if (!hasValidBlocks || !hasValidVisibility || !hasValidPageSizes) {
    // <lang><zh-CN>使用同一固定错误，避免暴露哪项任意 host input 被读取。</zh-CN><en>Use the same fixed error, avoiding disclosure of which arbitrary host input was read.</en></lang>
    throw new TypeError('Capability adoption presentation policy is invalid.');
  }

  // <lang><zh-CN>返回仅由闭包读取的 Set；不暴露原数组引用。</zh-CN><en>Return sets read only by the closure and expose no original array reference.</en></lang>
  return {
    blockSet,
    visibilitySet,
    pageSizeSet
  };
}

/**
 * <lang><zh-CN>校验 adoption profile 的完整 shape、唯一性与 presentation allowlist。</zh-CN><en>Validates the complete shape, uniqueness, and presentation allowlists of an adoption profile.</en></lang>
 *
 * @param {unknown} profile <lang><zh-CN>已解析 JSON-compatible adoption profile。</zh-CN><en>Parsed JSON-compatible adoption profile.</en></lang>
 * @param {object} policy <lang><zh-CN>宿主 presentation policy。</zh-CN><en>Host presentation policy.</en></lang>
 * @returns {object[]} <lang><zh-CN>受限 diagnostic；空数组表示合法。</zh-CN><en>Bounded diagnostics; an empty array indicates validity.</en></lang>
 * @lang zh-CN validator 不容忍额外字段，不执行表达式，也不把字段值复制到 message。
 * @lang en The validator tolerates no extra fields, executes no expressions, and copies no field value into messages.
 */
function validateAdoptionProfile(profile, policy) {
  // <lang><zh-CN>收集独立、受限的 profile diagnostic。</zh-CN><en>Collect independent bounded profile diagnostics.</en></lang>
  const diagnostics = [];

  // <lang><zh-CN>顶层必须是恰含五个公开字段的记录。</zh-CN><en>The top level must be a record containing exactly five public fields.</en></lang>
  const hasValidTopLevel = isRecord(profile)
    && hasExactKeys(profile, [
      'adoptionVersion',
      'kind',
      'profileId',
      'capabilities',
      'presentation'
    ]);

  // <lang><zh-CN>shape 无效时只返回固定类别，避免继续访问未知输入。</zh-CN><en>Return only a fixed category on invalid shape, avoiding further access to unknown input.</en></lang>
  if (!hasValidTopLevel) {
    // <lang><zh-CN>不列出实际额外字段名。</zh-CN><en>Do not list actual extra field names.</en></lang>
    return [
      createDiagnostic(
        'capability-adoption.profile.invalid',
        '能力采用 profile 的顶层结构无效。',
        'The capability-adoption profile has an invalid top-level shape.'
      )
    ];
  }

  // <lang><zh-CN>版本必须与当前 runtime 精确一致。</zh-CN><en>The version must exactly match the current runtime.</en></lang>
  if (profile.adoptionVersion !== ADOPTION_VERSION) {
    // <lang><zh-CN>固定错误不回显未知版本字符串。</zh-CN><en>The fixed error does not echo an unknown version string.</en></lang>
    diagnostics.push(createDiagnostic(
      'capability-adoption.profile.version-unsupported',
      '能力采用 profile 版本不受支持。',
      'The capability-adoption profile version is unsupported.'
    ));
  }

  // <lang><zh-CN>kind 精确区分 adoption profile。</zh-CN><en>The kind exactly distinguishes an adoption profile.</en></lang>
  if (profile.kind !== ADOPTION_PROFILE_KIND) {
    // <lang><zh-CN>无效 kind 不进入 subject。</zh-CN><en>An invalid kind does not enter the subject.</en></lang>
    diagnostics.push(createDiagnostic(
      'capability-adoption.profile.kind-invalid',
      '能力采用 profile kind 无效。',
      'The capability-adoption profile kind is invalid.'
    ));
  }

  // <lang><zh-CN>profile ID 必须是稳定 dotted identifier。</zh-CN><en>The profile ID must be a stable dotted identifier.</en></lang>
  if (!isDottedIdentifier(profile.profileId)) {
    // <lang><zh-CN>无效 ID 不被复制。</zh-CN><en>An invalid ID is not copied.</en></lang>
    diagnostics.push(createDiagnostic(
      'capability-adoption.profile.id-invalid',
      '能力采用 profile ID 无效。',
      'The capability-adoption profile ID is invalid.'
    ));
  }

  // <lang><zh-CN>能力集合必须为非空数组。</zh-CN><en>The capability set must be a non-empty array.</en></lang>
  if (!Array.isArray(profile.capabilities) || profile.capabilities.length === 0) {
    // <lang><zh-CN>数组缺失时记录固定类别并跳过逐项读取。</zh-CN><en>Record a fixed category when the array is missing and skip item reads.</en></lang>
    diagnostics.push(createDiagnostic(
      'capability-adoption.profile.capabilities-invalid',
      '能力采用 profile 必须声明非空能力集合。',
      'The capability-adoption profile must declare a non-empty capability set.'
    ));
  } else {
    // <lang><zh-CN>module ID 集合用于拒绝重复业务主责选择。</zh-CN><en>The module-ID set rejects duplicate business-ownership selections.</en></lang>
    const moduleIds = new Set();

    // <lang><zh-CN>implementation ID 集合用于拒绝一个工程 owner 被多次选择。</zh-CN><en>The implementation-ID set rejects selecting one engineering owner more than once.</en></lang>
    const implementationPackageIds = new Set();

    // <lang><zh-CN>逐项校验 exactly-three-field selection。</zh-CN><en>Validate every exact-three-field selection.</en></lang>
    for (const selection of profile.capabilities) {
      // <lang><zh-CN>非法 shape 只产生固定类别，不访问字段。</zh-CN><en>An invalid shape produces only a fixed category and no field access.</en></lang>
      if (!isRecord(selection) || !hasExactKeys(selection, [
        'moduleId',
        'implementationPackageId',
        'state'
      ])) {
        // <lang><zh-CN>继续检查其他条目以形成完整受限诊断集合。</zh-CN><en>Continue with other entries to form a complete bounded diagnostic set.</en></lang>
        diagnostics.push(createDiagnostic(
          'capability-adoption.profile.selection-invalid',
          '能力选择结构无效。',
          'A capability selection has an invalid shape.'
        ));
        continue;
      }

      // <lang><zh-CN>分别记录 module ID 是否可安全使用。</zh-CN><en>Record separately whether the module ID is safe to use.</en></lang>
      const hasValidModuleId = isDottedIdentifier(selection.moduleId);

      // <lang><zh-CN>分别记录 implementation ID 是否可安全使用。</zh-CN><en>Record separately whether the implementation ID is safe to use.</en></lang>
      const hasValidImplementationId = isDottedIdentifier(selection.implementationPackageId);

      // <lang><zh-CN>无效 module ID 使用固定错误。</zh-CN><en>An invalid module ID uses a fixed error.</en></lang>
      if (!hasValidModuleId) {
        // <lang><zh-CN>不复制无效值。</zh-CN><en>Do not copy the invalid value.</en></lang>
        diagnostics.push(createDiagnostic(
          'capability-adoption.profile.module-id-invalid',
          '能力选择的 module ID 无效。',
          'A capability selection has an invalid module ID.'
        ));
      } else if (moduleIds.has(selection.moduleId)) {
        // <lang><zh-CN>重复 stable ID 可作为 subject 定位。</zh-CN><en>The duplicate stable ID may be used as a locating subject.</en></lang>
        diagnostics.push(createDiagnostic(
          'capability-adoption.profile.module-duplicate',
          '能力采用 profile 重复选择了业务模块。',
          'The capability-adoption profile selects a business module more than once.',
          selection.moduleId
        ));
      } else {
        // <lang><zh-CN>首次合法 module ID 加入唯一性集合。</zh-CN><en>Add the first valid module ID to the uniqueness set.</en></lang>
        moduleIds.add(selection.moduleId);
      }

      // <lang><zh-CN>无效 implementation ID 使用固定错误。</zh-CN><en>An invalid implementation ID uses a fixed error.</en></lang>
      if (!hasValidImplementationId) {
        // <lang><zh-CN>不把无效值加入集合或 diagnostic。</zh-CN><en>Add the invalid value to neither the set nor a diagnostic.</en></lang>
        diagnostics.push(createDiagnostic(
          'capability-adoption.profile.implementation-id-invalid',
          '能力选择的 implementation package ID 无效。',
          'A capability selection has an invalid implementation-package ID.'
        ));
      } else if (implementationPackageIds.has(selection.implementationPackageId)) {
        // <lang><zh-CN>重复合法 ID 可安全作为 subject。</zh-CN><en>The duplicate valid ID is safe as a subject.</en></lang>
        diagnostics.push(createDiagnostic(
          'capability-adoption.profile.implementation-duplicate',
          '能力采用 profile 重复选择了实现包。',
          'The capability-adoption profile selects an implementation package more than once.',
          selection.implementationPackageId
        ));
      } else {
        // <lang><zh-CN>首次合法 implementation ID 加入唯一性集合。</zh-CN><en>Add the first valid implementation ID to the uniqueness set.</en></lang>
        implementationPackageIds.add(selection.implementationPackageId);
      }

      // <lang><zh-CN>首轮只接受 enabled/disabled 两种期望状态。</zh-CN><en>The initial version accepts only the enabled/disabled desired states.</en></lang>
      if (selection.state !== 'enabled' && selection.state !== 'disabled') {
        // <lang><zh-CN>未知状态不被复制或解释为 hook。</zh-CN><en>An unknown state is neither copied nor interpreted as a hook.</en></lang>
        diagnostics.push(createDiagnostic(
          'capability-adoption.profile.state-invalid',
          '能力选择的期望状态无效。',
          'A capability selection has an invalid desired state.',
          hasValidModuleId ? selection.moduleId : undefined
        ));
      }
    }
  }

  // <lang><zh-CN>presentation 必须恰含 blocks/order/pageSize。</zh-CN><en>Presentation must contain exactly blocks/order/pageSize.</en></lang>
  const hasValidPresentationShape = isRecord(profile.presentation)
    && hasExactKeys(profile.presentation, [
      'blocks',
      'order',
      'pageSize'
    ]);

  // <lang><zh-CN>presentation shape 无效时不读取内部值。</zh-CN><en>Do not read inner values when presentation shape is invalid.</en></lang>
  if (!hasValidPresentationShape) {
    // <lang><zh-CN>追加固定类别并返回当前全部 diagnostic。</zh-CN><en>Append a fixed category and return all current diagnostics.</en></lang>
    diagnostics.push(createDiagnostic(
      'capability-adoption.profile.presentation-invalid',
      '能力采用 profile 的 presentation 结构无效。',
      'The capability-adoption profile has an invalid presentation shape.'
    ));
    return diagnostics;
  }

  // <lang><zh-CN>selected block ID 集合用于唯一性和 order set equality。</zh-CN><en>The selected-block ID set supports uniqueness and order-set equality.</en></lang>
  const selectedBlockIds = new Set();

  // <lang><zh-CN>blocks 必须是非空数组。</zh-CN><en>Blocks must be a non-empty array.</en></lang>
  if (!Array.isArray(profile.presentation.blocks) || profile.presentation.blocks.length === 0) {
    // <lang><zh-CN>缺失 blocks 记录固定错误。</zh-CN><en>Missing blocks record a fixed error.</en></lang>
    diagnostics.push(createDiagnostic(
      'capability-adoption.profile.blocks-invalid',
      'presentation 必须选择非空 block 集合。',
      'Presentation must select a non-empty block set.'
    ));
  } else {
    // <lang><zh-CN>逐个校验 block ID 与 visibility allowlist。</zh-CN><en>Validate every block ID and visibility allowlist.</en></lang>
    for (const block of profile.presentation.blocks) {
      // <lang><zh-CN>每个 block 恰含 id/visibility。</zh-CN><en>Every block contains exactly id/visibility.</en></lang>
      if (!isRecord(block) || !hasExactKeys(block, ['id', 'visibility'])) {
        // <lang><zh-CN>非法 shape 不访问内部字段。</zh-CN><en>Do not access fields of an invalid shape.</en></lang>
        diagnostics.push(createDiagnostic(
          'capability-adoption.profile.block-invalid',
          'presentation block 结构无效。',
          'A presentation block has an invalid shape.'
        ));
        continue;
      }

      // <lang><zh-CN>记录 block ID 是否符合 simple identifier。</zh-CN><en>Record whether the block ID is a simple identifier.</en></lang>
      const hasValidBlockId = isSimpleIdentifier(block.id);

      // <lang><zh-CN>无效或宿主未登记 block 一律拒绝。</zh-CN><en>Reject an invalid or host-unregistered block.</en></lang>
      if (!hasValidBlockId || !policy.blockSet.has(block.id)) {
        // <lang><zh-CN>只在 ID 合法但未登记时使用 subject。</zh-CN><en>Use a subject only when the ID is valid but unregistered.</en></lang>
        diagnostics.push(createDiagnostic(
          'capability-adoption.profile.block-unregistered',
          'presentation 选择了未登记 block。',
          'Presentation selects an unregistered block.',
          hasValidBlockId ? block.id : undefined
        ));
      } else if (selectedBlockIds.has(block.id)) {
        // <lang><zh-CN>重复合法 block 产生可定位类别。</zh-CN><en>A duplicate valid block produces a locatable category.</en></lang>
        diagnostics.push(createDiagnostic(
          'capability-adoption.profile.block-duplicate',
          'presentation 重复选择了 block。',
          'Presentation selects a block more than once.',
          block.id
        ));
      } else {
        // <lang><zh-CN>首次合法登记 block 加入集合。</zh-CN><en>Add the first valid registered block to the set.</en></lang>
        selectedBlockIds.add(block.id);
      }

      // <lang><zh-CN>visibility 必须是宿主 allowlist 成员。</zh-CN><en>Visibility must be a member of the host allowlist.</en></lang>
      if (!isSimpleIdentifier(block.visibility) || !policy.visibilitySet.has(block.visibility)) {
        // <lang><zh-CN>未知 visibility 不被当作表达式执行。</zh-CN><en>An unknown visibility value is not executed as an expression.</en></lang>
        diagnostics.push(createDiagnostic(
          'capability-adoption.profile.visibility-unregistered',
          'presentation 使用了未登记 visibility。',
          'Presentation uses an unregistered visibility value.',
          hasValidBlockId ? block.id : undefined
        ));
      }
    }
  }

  // <lang><zh-CN>order 必须为数组且与合法 selected block 数量一致。</zh-CN><en>Order must be an array with the same size as the valid selected-block set.</en></lang>
  const hasOrderArray = Array.isArray(profile.presentation.order);

  // <lang><zh-CN>把合法 order ID 转为集合，用于检测重复与集合差异。</zh-CN><en>Convert valid order IDs to a set to detect duplicates and set differences.</en></lang>
  const orderSet = hasOrderArray
    ? new Set(profile.presentation.order.filter(isSimpleIdentifier))
    : new Set();

  // <lang><zh-CN>完整 order 要求全部值合法、无重复且与 selected block 集合完全相等。</zh-CN><en>A complete order requires all values to be valid, unique, and exactly equal to the selected-block set.</en></lang>
  const hasValidOrder = hasOrderArray
    && profile.presentation.order.every(isSimpleIdentifier)
    && orderSet.size === profile.presentation.order.length
    && orderSet.size === selectedBlockIds.size
    && Array.from(selectedBlockIds).every((blockId) => orderSet.has(blockId));

  // <lang><zh-CN>order 不完整/重复/越界时使用单一稳定类别。</zh-CN><en>Use one stable category when order is incomplete, duplicate, or out of bounds.</en></lang>
  if (!hasValidOrder) {
    // <lang><zh-CN>不回显 order 内容。</zh-CN><en>Do not echo order contents.</en></lang>
    diagnostics.push(createDiagnostic(
      'capability-adoption.profile.order-invalid',
      'presentation order 必须精确排列全部已选择 block。',
      'Presentation order must list every selected block exactly once.'
    ));
  }

  // <lang><zh-CN>pageSize 必须是宿主显式 allowlist 成员。</zh-CN><en>Page size must be a member of the host's explicit allowlist.</en></lang>
  if (!Number.isInteger(profile.presentation.pageSize)
    || !policy.pageSizeSet.has(profile.presentation.pageSize)) {
    // <lang><zh-CN>越界数值不进入 diagnostic。</zh-CN><en>The out-of-policy number does not enter the diagnostic.</en></lang>
    diagnostics.push(createDiagnostic(
      'capability-adoption.profile.page-size-unregistered',
      'presentation pageSize 不在宿主 allowlist 中。',
      'Presentation pageSize is not in the host allowlist.'
    ));
  }

  // <lang><zh-CN>返回全部受限 profile diagnostic。</zh-CN><en>Return all bounded profile diagnostics.</en></lang>
  return diagnostics;
}

/**
 * <lang><zh-CN>把合法 presentation 复制为与输入分离的 public snapshot。</zh-CN><en>Copies valid presentation into a public snapshot detached from input.</en></lang>
 *
 * @param {object} presentation <lang><zh-CN>已通过 allowlist 校验的呈现声明。</zh-CN><en>Presentation declaration that passed allowlist validation.</en></lang>
 * @returns {object} <lang><zh-CN>新 blocks/order 与 pageSize。</zh-CN><en>Fresh blocks/order and pageSize.</en></lang>
 * @lang zh-CN 该副本只含 metadata，不包含 component、route、URL 或回调。
 * @lang en The copy contains only metadata and no component, route, URL, or callback.
 */
function copyPresentation(presentation) {
  // <lang><zh-CN>逐个复制 block 的两个 allowlisted 字段。</zh-CN><en>Copy the two allowlisted fields of every block.</en></lang>
  const blocks = presentation.blocks.map((block) => ({
    id: block.id,
    visibility: block.visibility
  }));

  // <lang><zh-CN>返回与输入完全分离的 presentation 容器。</zh-CN><en>Return a presentation container fully detached from input.</en></lang>
  return {
    blocks,
    order: [...presentation.order],
    pageSize: presentation.pageSize
  };
}

/**
 * <lang><zh-CN>把 lifecycle installation failure 映射为受限 adoption diagnostic。</zh-CN><en>Maps a lifecycle installation failure to a bounded adoption diagnostic.</en></lang>
 *
 * @param {object} result <lang><zh-CN>既有 lifecycle 的失败结果。</zh-CN><en>Failure result from the existing lifecycle.</en></lang>
 * @returns {object} <lang><zh-CN>不含 core/raw diagnostic 的 adoption 类别。</zh-CN><en>An adoption category containing no core/raw diagnostic.</en></lang>
 * @lang zh-CN 只映射 allowlisted code；未知底层类别收束为 candidate rejected。
 * @lang en Only allowlisted codes are mapped; an unknown underlying category collapses to candidate rejected.
 */
function mapInstallFailure(result) {
  // <lang><zh-CN>读取首个 lifecycle diagnostic code；不存在时使用空字符串。</zh-CN><en>Read the first lifecycle diagnostic code; use an empty string when absent.</en></lang>
  const lifecycleCode = result?.diagnostics?.[0]?.code ?? '';

  // <lang><zh-CN>读取可选稳定 subject；createDiagnostic 会再次校验。</zh-CN><en>Read an optional stable subject; createDiagnostic validates it again.</en></lang>
  const subjectId = result?.diagnostics?.[0]?.subjectId;

  // <lang><zh-CN>无效单元映射到公开 unit.invalid 类别。</zh-CN><en>Map an invalid unit to the public unit.invalid category.</en></lang>
  if (lifecycleCode === 'capability.unit.invalid') {
    // <lang><zh-CN>不复制 core diagnostic。</zh-CN><en>Do not copy a core diagnostic.</en></lang>
    return createDiagnostic(
      'capability-adoption.unit.invalid',
      '已提供能力单元未通过既有 core 装配。',
      'A supplied capability unit did not pass existing core assembly.'
    );
  }

  // <lang><zh-CN>重复 module owner 形成专用类别。</zh-CN><en>A duplicate module owner forms a dedicated category.</en></lang>
  if (lifecycleCode === 'capability.module.duplicate') {
    // <lang><zh-CN>仅透传已验证 stable subject。</zh-CN><en>Forward only a validated stable subject.</en></lang>
    return createDiagnostic(
      'capability-adoption.unit.module-duplicate',
      '已提供能力集合包含重复业务模块主责。',
      'The supplied capability set contains a duplicate business-module owner.',
      subjectId
    );
  }

  // <lang><zh-CN>重复 implementation owner 形成专用类别。</zh-CN><en>A duplicate implementation owner forms a dedicated category.</en></lang>
  if (lifecycleCode === 'capability.implementation.duplicate') {
    // <lang><zh-CN>不透传 lifecycle message。</zh-CN><en>Do not forward the lifecycle message.</en></lang>
    return createDiagnostic(
      'capability-adoption.unit.implementation-duplicate',
      '已提供能力集合包含重复实现包主责。',
      'The supplied capability set contains a duplicate implementation-package owner.',
      subjectId
    );
  }

  // <lang><zh-CN>未知 installation failure 收束为固定类别。</zh-CN><en>Collapse an unknown installation failure to a fixed category.</en></lang>
  return createDiagnostic(
    'capability-adoption.candidate.rejected',
    '候选能力集合未通过采用预检。',
    'The candidate capability set did not pass adoption preflight.'
  );
}

/**
 * <lang><zh-CN>验证 candidate snapshot 与 adoption selection 精确对应。</zh-CN><en>Validates that a candidate snapshot exactly corresponds to adoption selections.</en></lang>
 *
 * @param {object[]} candidateSnapshot <lang><zh-CN>既有 lifecycle 的脱敏候选 snapshot。</zh-CN><en>Redacted candidate snapshot from the existing lifecycle.</en></lang>
 * @param {object[]} selections <lang><zh-CN>已验证的 adoption selections。</zh-CN><en>Validated adoption selections.</en></lang>
 * @returns {object[]} <lang><zh-CN>missing/extra/mismatch diagnostics。</zh-CN><en>Missing/extra/mismatch diagnostics.</en></lang>
 * @lang zh-CN 比较只使用稳定 module/implementation ID，不读取 unit/provider。
 * @lang en Comparison uses only stable module/implementation IDs and reads no unit/provider.
 */
function validateCandidateMatchesProfile(candidateSnapshot, selections) {
  // <lang><zh-CN>按 module ID 建立期望 selection 索引。</zh-CN><en>Index desired selections by module ID.</en></lang>
  const desiredByModuleId = new Map(
    selections.map((selection) => [selection.moduleId, selection])
  );

  // <lang><zh-CN>按 module ID 建立候选 snapshot 索引。</zh-CN><en>Index the candidate snapshot by module ID.</en></lang>
  const candidateByModuleId = new Map(
    candidateSnapshot.map((entry) => [entry.moduleId, entry])
  );

  // <lang><zh-CN>收集 exact-set diagnostic。</zh-CN><en>Collect exact-set diagnostics.</en></lang>
  const diagnostics = [];

  // <lang><zh-CN>逐个期望 module 查找候选 owner 与精确 implementation。</zh-CN><en>For every desired module, find a candidate owner and exact implementation.</en></lang>
  for (const selection of selections) {
    // <lang><zh-CN>从候选 snapshot 读取同 ID entry。</zh-CN><en>Read the same-ID entry from the candidate snapshot.</en></lang>
    const candidate = candidateByModuleId.get(selection.moduleId);

    // <lang><zh-CN>缺失 unit 产生稳定 module subject。</zh-CN><en>A missing unit produces a stable module subject.</en></lang>
    if (candidate === undefined) {
      // <lang><zh-CN>继续检查其余项，返回完整 bounded set。</zh-CN><en>Continue checking remaining entries and return a complete bounded set.</en></lang>
      diagnostics.push(createDiagnostic(
        'capability-adoption.unit.missing',
        'adoption profile 选择的能力单元未被显式提供。',
        'A capability unit selected by the adoption profile was not supplied explicitly.',
        selection.moduleId
      ));
      continue;
    }

    // <lang><zh-CN>同 module 的 implementation 必须精确匹配 selection。</zh-CN><en>The implementation for the same module must exactly match the selection.</en></lang>
    if (candidate.implementationPackageId !== selection.implementationPackageId) {
      // <lang><zh-CN>subject 只使用 module ID，不泄露意外实现。</zh-CN><en>The subject uses only the module ID and does not leak the unexpected implementation.</en></lang>
      diagnostics.push(createDiagnostic(
        'capability-adoption.unit.implementation-mismatch',
        '已提供能力单元与 profile 选择的实现包不匹配。',
        'A supplied capability unit does not match the implementation package selected by the profile.',
        selection.moduleId
      ));
    }
  }

  // <lang><zh-CN>候选中的额外 module 不得成为隐藏采用项。</zh-CN><en>An extra module in the candidate cannot become a hidden adoption item.</en></lang>
  for (const candidate of candidateSnapshot) {
    // <lang><zh-CN>只检查稳定 module ID 是否出现在完整期望集合。</zh-CN><en>Check only whether the stable module ID appears in the complete desired set.</en></lang>
    if (!desiredByModuleId.has(candidate.moduleId)) {
      // <lang><zh-CN>额外 unit 以 candidate module ID 定位。</zh-CN><en>Locate an extra unit by its candidate module ID.</en></lang>
      diagnostics.push(createDiagnostic(
        'capability-adoption.unit.extra',
        '已提供能力集合包含 profile 未选择的额外单元。',
        'The supplied capability set contains an extra unit not selected by the profile.',
        candidate.moduleId
      ));
    }
  }

  // <lang><zh-CN>返回全部 exact-set mismatch。</zh-CN><en>Return all exact-set mismatches.</en></lang>
  return diagnostics;
}

/**
 * <lang><zh-CN>根据 candidate snapshot 与期望状态计算稳定 dependency-first enable order。</zh-CN><en>Computes a stable dependency-first enable order from the candidate snapshot and desired states.</en></lang>
 *
 * @param {object[]} candidateSnapshot <lang><zh-CN>全部已安装且 disabled 的候选 snapshot。</zh-CN><en>Candidate snapshot with every unit installed and disabled.</en></lang>
 * @param {object[]} selections <lang><zh-CN>已验证的期望状态。</zh-CN><en>Validated desired states.</en></lang>
 * @returns {object} <lang><zh-CN>稳定顺序或受限依赖失败。</zh-CN><en>A stable order or bounded dependency failure.</en></lang>
 * @lang zh-CN 算法只读取脱敏 dependency ID，不触碰 provider 或 manifest。
 * @lang en The algorithm reads only redacted dependency IDs and touches no provider or manifest.
 */
function createEnableOrder(candidateSnapshot, selections) {
  // <lang><zh-CN>按 module ID 建立期望状态索引。</zh-CN><en>Index desired states by module ID.</en></lang>
  const desiredStateByModuleId = new Map(
    selections.map((selection) => [selection.moduleId, selection.state])
  );

  // <lang><zh-CN>只把期望 enabled 的 entry 纳入拓扑图。</zh-CN><en>Include only entries desired as enabled in the topological graph.</en></lang>
  const enabledEntries = candidateSnapshot.filter(
    (entry) => desiredStateByModuleId.get(entry.moduleId) === 'enabled'
  );

  // <lang><zh-CN>module ID 到 enabled entry 的索引用于依赖查找。</zh-CN><en>An index from module ID to enabled entry supports dependency lookup.</en></lang>
  const enabledByModuleId = new Map(
    enabledEntries.map((entry) => [entry.moduleId, entry])
  );

  // <lang><zh-CN>先检查每个 enabled module 的依赖也被期望 enabled。</zh-CN><en>First check that every dependency of an enabled module is also desired as enabled.</en></lang>
  for (const entry of enabledEntries) {
    // <lang><zh-CN>逐个读取稳定 dependency ID。</zh-CN><en>Read every stable dependency ID.</en></lang>
    for (const dependencyId of entry.dependencies) {
      // <lang><zh-CN>缺失或 disabled dependency 都阻止候选。</zh-CN><en>A missing or disabled dependency blocks the candidate.</en></lang>
      if (!enabledByModuleId.has(dependencyId)) {
        // <lang><zh-CN>返回首个稳定 dependency failure，且不启用任何候选。</zh-CN><en>Return the first stable dependency failure without enabling any candidate.</en></lang>
        return {
          ok: false,
          diagnostics: [
            createDiagnostic(
              'capability-adoption.dependency.not-enabled',
              '已启用能力的依赖未在期望集合中启用。',
              'A dependency of an enabled capability is not enabled in the desired set.',
              dependencyId
            )
          ]
        };
      }
    }
  }

  // <lang><zh-CN>初始化每个 enabled node 的入度。</zh-CN><en>Initialize indegree for every enabled node.</en></lang>
  const indegreeByModuleId = new Map(
    enabledEntries.map((entry) => [entry.moduleId, 0])
  );

  // <lang><zh-CN>dependency 到 dependent 的邻接表用于 Kahn 排序。</zh-CN><en>An adjacency list from dependency to dependent supports Kahn ordering.</en></lang>
  const dependentsByModuleId = new Map(
    enabledEntries.map((entry) => [entry.moduleId, []])
  );

  // <lang><zh-CN>根据每项 dependency 构建入度与反向邻接。</zh-CN><en>Build indegree and reverse adjacency from every dependency.</en></lang>
  for (const entry of enabledEntries) {
    // <lang><zh-CN>每个 dependency 已由前序 exact enabled 检查保证存在。</zh-CN><en>Every dependency is known to exist from the prior exact-enabled check.</en></lang>
    for (const dependencyId of entry.dependencies) {
      // <lang><zh-CN>目标 node 每个依赖增加一个入度。</zh-CN><en>Increase target-node indegree for every dependency.</en></lang>
      indegreeByModuleId.set(
        entry.moduleId,
        indegreeByModuleId.get(entry.moduleId) + 1
      );

      // <lang><zh-CN>在 dependency 的 dependent 列表登记目标。</zh-CN><en>Register the target in the dependency's dependent list.</en></lang>
      dependentsByModuleId.get(dependencyId).push(entry.moduleId);
    }
  }

  // <lang><zh-CN>零入度 ready 队列按 code-point module ID 排序。</zh-CN><en>Sort the zero-indegree ready queue by code-point module ID.</en></lang>
  const readyModuleIds = Array.from(
    indegreeByModuleId.entries(),
    ([moduleId, indegree]) => ({ moduleId, indegree })
  )
    .filter((entry) => entry.indegree === 0)
    .map((entry) => entry.moduleId)
    .sort();

  // <lang><zh-CN>最终顺序只保存稳定 module ID。</zh-CN><en>The final order stores only stable module IDs.</en></lang>
  const order = [];

  // <lang><zh-CN>持续消费 ready 队列，直到没有可启用 node。</zh-CN><en>Consume the ready queue until no enableable node remains.</en></lang>
  while (readyModuleIds.length > 0) {
    // <lang><zh-CN>移除字典序最小 node，保持插入顺序无关。</zh-CN><en>Remove the lexically smallest node, keeping input insertion order irrelevant.</en></lang>
    const moduleId = readyModuleIds.shift();

    // <lang><zh-CN>把 dependency-safe node 加入启用顺序。</zh-CN><en>Add the dependency-safe node to the enable order.</en></lang>
    order.push(moduleId);

    // <lang><zh-CN>dependent ID 也按稳定顺序处理。</zh-CN><en>Process dependent IDs in stable order as well.</en></lang>
    const dependentModuleIds = [...dependentsByModuleId.get(moduleId)].sort();

    // <lang><zh-CN>移除当前 dependency 对每个 dependent 的入度贡献。</zh-CN><en>Remove the current dependency's indegree contribution from every dependent.</en></lang>
    for (const dependentModuleId of dependentModuleIds) {
      // <lang><zh-CN>计算新的非负入度。</zh-CN><en>Compute the new non-negative indegree.</en></lang>
      const nextIndegree = indegreeByModuleId.get(dependentModuleId) - 1;

      // <lang><zh-CN>写回图内局部数字状态。</zh-CN><en>Write back the graph-local numeric state.</en></lang>
      indegreeByModuleId.set(dependentModuleId, nextIndegree);

      // <lang><zh-CN>入度归零时将 dependent 插入 ready 队列。</zh-CN><en>Insert the dependent into the ready queue when its indegree reaches zero.</en></lang>
      if (nextIndegree === 0) {
        // <lang><zh-CN>加入后重新排序，确保多个分支的确定性。</zh-CN><en>Resort after insertion, ensuring determinism across multiple branches.</en></lang>
        readyModuleIds.push(dependentModuleId);
        readyModuleIds.sort();
      }
    }
  }

  // <lang><zh-CN>未输出全部 enabled node 表示 dependency cycle。</zh-CN><en>Failure to output every enabled node indicates a dependency cycle.</en></lang>
  if (order.length !== enabledEntries.length) {
    // <lang><zh-CN>cycle diagnostic 不列出整张关系图。</zh-CN><en>The cycle diagnostic does not list the whole relation graph.</en></lang>
    return {
      ok: false,
      diagnostics: [
        createDiagnostic(
          'capability-adoption.dependency.cycle',
          '期望能力集合包含依赖环。',
          'The desired capability set contains a dependency cycle.'
        )
      ]
    };
  }

  // <lang><zh-CN>返回完整稳定 dependency-first 顺序。</zh-CN><en>Return the complete stable dependency-first order.</en></lang>
  return {
    ok: true,
    order,
    diagnostics: []
  };
}

/**
 * <lang><zh-CN>把 candidate enable failure 映射为稳定 adoption 类别。</zh-CN><en>Maps a candidate enablement failure to a stable adoption category.</en></lang>
 *
 * @param {object} result <lang><zh-CN>既有 lifecycle enable 失败。</zh-CN><en>Existing lifecycle enablement failure.</en></lang>
 * @returns {object} <lang><zh-CN>受限 adoption diagnostic。</zh-CN><en>A bounded adoption diagnostic.</en></lang>
 * @lang zh-CN allowlisted lifecycle code 保留语义；raw message 与未知字段被丢弃。
 * @lang en Allowlisted lifecycle codes retain semantics; raw messages and unknown fields are discarded.
 */
function mapEnableFailure(result) {
  // <lang><zh-CN>读取首个稳定 lifecycle code。</zh-CN><en>Read the first stable lifecycle code.</en></lang>
  const lifecycleCode = result?.diagnostics?.[0]?.code ?? '';

  // <lang><zh-CN>读取可选 stable subject；后续再次校验。</zh-CN><en>Read the optional stable subject, which is validated again later.</en></lang>
  const subjectId = result?.diagnostics?.[0]?.subjectId;

  // <lang><zh-CN>首轮只透传明确受支持的 lifecycle failure categories。</zh-CN><en>Forward only explicitly supported lifecycle failure categories in the initial version.</en></lang>
  const allowedLifecycleCodes = new Set([
    'capability.module.unknown',
    'capability.state.invalid',
    'capability.dependency.unavailable',
    'capability.conflict.enabled'
  ]);

  // <lang><zh-CN>未知类别收束为通用 candidate rejection。</zh-CN><en>Collapse an unknown category to generic candidate rejection.</en></lang>
  if (!allowedLifecycleCodes.has(lifecycleCode)) {
    // <lang><zh-CN>通用类别不保留底层 subject。</zh-CN><en>The generic category retains no underlying subject.</en></lang>
    return createDiagnostic(
      'capability-adoption.candidate.rejected',
      '候选能力集合未通过启用预检。',
      'The candidate capability set did not pass enablement preflight.'
    );
  }

  // <lang><zh-CN>code 增加 adoption namespace，避免与直接 lifecycle 结果混淆。</zh-CN><en>Prefix the code with the adoption namespace, avoiding confusion with a direct lifecycle result.</en></lang>
  return createDiagnostic(
    `capability-adoption.candidate.${lifecycleCode}`,
    '候选能力集合未通过 lifecycle 启用检查。',
    'The candidate capability set did not pass a lifecycle enablement check.',
    subjectId
  );
}

/**
 * <lang><zh-CN>比较完整前后 snapshot 并创建一个每模块一项的 public-safe receipt。</zh-CN><en>Compares complete before/after snapshots and creates a one-action-per-module public-safe receipt.</en></lang>
 *
 * @param {object[]} previousSnapshot <lang><zh-CN>先前活动脱敏 snapshot。</zh-CN><en>Previous active redacted snapshot.</en></lang>
 * @param {object[]} nextSnapshot <lang><zh-CN>完整候选脱敏 snapshot。</zh-CN><en>Complete candidate redacted snapshot.</en></lang>
 * @param {string} profileId <lang><zh-CN>已验证 adoption profile ID。</zh-CN><en>Validated adoption-profile ID.</en></lang>
 * @returns {object} <lang><zh-CN>稳定 profile ID 与按 module 排序的动作。</zh-CN><en>Stable profile ID and module-sorted actions.</en></lang>
 * @lang zh-CN receipt 不含 unit、manifest、provider、配置 body 或生命周期执行日志。
 * @lang en The receipt contains no unit, manifest, provider, configuration body, or lifecycle execution log.
 */
function createReceipt(previousSnapshot, nextSnapshot, profileId) {
  // <lang><zh-CN>按 module ID 索引先前 snapshot。</zh-CN><en>Index the previous snapshot by module ID.</en></lang>
  const previousByModuleId = new Map(
    previousSnapshot.map((entry) => [entry.moduleId, entry])
  );

  // <lang><zh-CN>按 module ID 索引后继 snapshot。</zh-CN><en>Index the next snapshot by module ID.</en></lang>
  const nextByModuleId = new Map(
    nextSnapshot.map((entry) => [entry.moduleId, entry])
  );

  // <lang><zh-CN>取两个集合的并集并稳定排序。</zh-CN><en>Take the union of both sets and sort it stably.</en></lang>
  const moduleIds = Array.from(
    new Set([
      ...previousByModuleId.keys(),
      ...nextByModuleId.keys()
    ])
  ).sort();

  // <lang><zh-CN>为每个 module 创建一个高层动作。</zh-CN><en>Create one high-level action for every module.</en></lang>
  const actions = moduleIds.map((moduleId) => {
    // <lang><zh-CN>读取前后 entry；两者至少存在一个。</zh-CN><en>Read previous and next entries; at least one exists.</en></lang>
    const previous = previousByModuleId.get(moduleId);
    const next = nextByModuleId.get(moduleId);

    // <lang><zh-CN>先前不存在表示完整候选新增该 module。</zh-CN><en>Absence from the previous set means the complete candidate adds the module.</en></lang>
    if (previous === undefined) {
      // <lang><zh-CN>install receipt 同时给出显式实现与最终状态。</zh-CN><en>The install receipt also states the explicit implementation and final state.</en></lang>
      return {
        moduleId,
        action: 'install',
        nextImplementationPackageId: next.implementationPackageId,
        nextState: next.state
      };
    }

    // <lang><zh-CN>后继不存在表示完整候选移除该 module。</zh-CN><en>Absence from the next set means the complete candidate removes the module.</en></lang>
    if (next === undefined) {
      // <lang><zh-CN>uninstall receipt 只公开先前 ID/state。</zh-CN><en>The uninstall receipt exposes only the previous ID/state.</en></lang>
      return {
        moduleId,
        action: 'uninstall',
        previousImplementationPackageId: previous.implementationPackageId,
        previousState: previous.state
      };
    }

    // <lang><zh-CN>同 module 的实现 ID 改变表示显式 replace。</zh-CN><en>A changed implementation ID for the same module means explicit replacement.</en></lang>
    if (previous.implementationPackageId !== next.implementationPackageId) {
      // <lang><zh-CN>replacement receipt 不暴露两个 unit 的其他内容。</zh-CN><en>The replacement receipt exposes no other contents from either unit.</en></lang>
      return {
        moduleId,
        action: 'replace',
        previousImplementationPackageId: previous.implementationPackageId,
        nextImplementationPackageId: next.implementationPackageId,
        previousState: previous.state,
        nextState: next.state
      };
    }

    // <lang><zh-CN>同实现从 disabled 变为 enabled 记为 enable。</zh-CN><en>Record enable when the same implementation changes from disabled to enabled.</en></lang>
    if (previous.state === 'disabled' && next.state === 'enabled') {
      // <lang><zh-CN>只需一个稳定 implementation ID 与前后状态。</zh-CN><en>Only one stable implementation ID and previous/next states are needed.</en></lang>
      return {
        moduleId,
        action: 'enable',
        implementationPackageId: next.implementationPackageId,
        previousState: previous.state,
        nextState: next.state
      };
    }

    // <lang><zh-CN>同实现从 enabled 变为 disabled 记为 disable。</zh-CN><en>Record disable when the same implementation changes from enabled to disabled.</en></lang>
    if (previous.state === 'enabled' && next.state === 'disabled') {
      // <lang><zh-CN>disable receipt 不暗示 provider cleanup。</zh-CN><en>The disable receipt does not imply provider cleanup.</en></lang>
      return {
        moduleId,
        action: 'disable',
        implementationPackageId: next.implementationPackageId,
        previousState: previous.state,
        nextState: next.state
      };
    }

    // <lang><zh-CN>实现与状态相同记为 retain。</zh-CN><en>Record retain when implementation and state are unchanged.</en></lang>
    return {
      moduleId,
      action: 'retain',
      implementationPackageId: next.implementationPackageId,
      previousState: previous.state,
      nextState: next.state
    };
  });

  // <lang><zh-CN>返回与 runtime 内部引用无关的 receipt。</zh-CN><en>Return a receipt independent from runtime-internal references.</en></lang>
  return {
    profileId,
    actions
  };
}

/**
 * <lang><zh-CN>复制 receipt，防止调用方修改后影响其他观察者。</zh-CN><en>Copies a receipt so caller mutation cannot affect another observer.</en></lang>
 *
 * @param {object} receipt <lang><zh-CN>刚创建的 public-safe receipt。</zh-CN><en>Newly created public-safe receipt.</en></lang>
 * @returns {object} <lang><zh-CN>深度足够的 metadata 副本。</zh-CN><en>A sufficiently deep metadata copy.</en></lang>
 * @lang zh-CN action 字段只有 string，不包含嵌套 provider/profile。
 * @lang en Action fields contain only strings and no nested provider/profile.
 */
function copyReceipt(receipt) {
  // <lang><zh-CN>逐项浅复制扁平 action，并复制数组容器。</zh-CN><en>Shallow-copy every flat action and copy the array container.</en></lang>
  return {
    profileId: receipt.profileId,
    actions: receipt.actions.map((action) => ({
      ...action
    }))
  };
}

/**
 * <lang><zh-CN>首次成功采用前调用能力时使用的稳定错误。</zh-CN><en>Stable error used when invoking a capability before the first successful adoption.</en></lang>
 * @lang zh-CN message/code 不包含 module、port、input 或 profile。
 * @lang en The message/code contain no module, port, input, or profile.
 */
export class CapabilityAdoptionInvocationError extends RangeError {
  /**
   * <lang><zh-CN>创建固定 uninitialized invocation error。</zh-CN><en>Creates a fixed uninitialized invocation error.</en></lang>
   *
   * @lang zh-CN 构造器不接受调用方数据，避免错误日志泄露 input。
   * @lang en The constructor accepts no caller data, avoiding input leakage through error logs.
   */
  constructor() {
    // <lang><zh-CN>使用固定双语消息，不插入任意调用字段。</zh-CN><en>Use a fixed bilingual message and interpolate no invocation field.</en></lang>
    super('No capability adoption is active. / 当前没有活动能力采用集合。');

    // <lang><zh-CN>稳定 code 允许宿主映射本地提示。</zh-CN><en>A stable code lets a host map a local prompt.</en></lang>
    this.code = 'capability-adoption.invocation.uninitialized';

    // <lang><zh-CN>固定类名便于跨 realm 以 name/code 观察。</zh-CN><en>A fixed class name supports name/code observation across realms.</en></lang>
    this.name = 'CapabilityAdoptionInvocationError';
  }
}

/**
 * <lang><zh-CN>创建一个无全局状态、candidate-first 的显式能力采用 runtime。</zh-CN><en>Creates a candidate-first explicit capability-adoption runtime with no global state.</en></lang>
 *
 * @param {{registeredBlocks: string[], registeredVisibility: string[], allowedPageSizes: number[]}} options <lang><zh-CN>宿主 presentation allowlist。</zh-CN><en>Host presentation allowlists.</en></lang>
 * @returns {{reconcile: Function, invoke: Function, snapshot: Function, presentation: Function}} <lang><zh-CN>冻结的采用 API。</zh-CN><en>Frozen adoption API.</en></lang>
 * @lang zh-CN 每次 reconcile 从显式 units 构建完整候选；只有成功候选会替换活动 runtime/presentation。
 * @lang en Every reconciliation builds a complete candidate from explicit units; only a successful candidate replaces the active runtime/presentation.
 */
export function createCapabilityAdoptionRuntime(options) {
  // <lang><zh-CN>创建一次内部 presentation policy；后续 profile 只能使用其 Set。</zh-CN><en>Create one internal presentation policy; later profiles may use only its sets.</en></lang>
  const policy = createPresentationPolicy(options);

  // <lang><zh-CN>null 表示尚无首次成功采用，不创建隐式空 lifecycle。</zh-CN><en>Null means no first successful adoption yet; no implicit empty lifecycle is created.</en></lang>
  let activeRuntime = null;

  // <lang><zh-CN>活动呈现初始为空且 pageSize 未选择。</zh-CN><en>Active presentation starts empty with no selected page size.</en></lang>
  let activePresentation = {
    blocks: [],
    order: [],
    pageSize: null
  };

  /**
   * <lang><zh-CN>预检完整 profile/unit 集合并在成功时原子切换活动 runtime。</zh-CN><en>Preflights a complete profile/unit set and atomically switches the active runtime on success.</en></lang>
   *
   * @param {unknown} input <lang><zh-CN>包含 profile 与显式 units 的候选输入。</zh-CN><en>Candidate input containing profile and explicit units.</en></lang>
   * @returns {object} <lang><zh-CN>成功 receipt 或受限失败 diagnostics。</zh-CN><en>A success receipt or bounded failure diagnostics.</en></lang>
   * @lang zh-CN reconcile 同步且不调用 provider；输入无效时活动状态保持不变。
   * @lang en Reconciliation is synchronous and invokes no provider; active state remains unchanged on invalid input.
   */
  const reconcile = (input) => {
    // <lang><zh-CN>顶层必须恰含 profile/units，拒绝隐藏 option/hook。</zh-CN><en>The top level must contain exactly profile/units, rejecting hidden options/hooks.</en></lang>
    if (!isRecord(input) || !hasExactKeys(input, ['profile', 'units'])) {
      // <lang><zh-CN>在读取任一字段前返回固定失败。</zh-CN><en>Return a fixed failure before reading either field.</en></lang>
      return createFailure([
        createDiagnostic(
          'capability-adoption.input.invalid',
          '能力采用输入结构无效。',
          'The capability-adoption input has an invalid shape.'
        )
      ]);
    }

    // <lang><zh-CN>完整校验 adoption profile 与 presentation。</zh-CN><en>Fully validate the adoption profile and presentation.</en></lang>
    const profileDiagnostics = validateAdoptionProfile(input.profile, policy);

    // <lang><zh-CN>任何 profile error 都在创建 candidate lifecycle 前拒绝。</zh-CN><en>Reject any profile error before creating a candidate lifecycle.</en></lang>
    if (profileDiagnostics.length > 0) {
      // <lang><zh-CN>失败不改变活动 runtime/presentation。</zh-CN><en>Failure changes neither active runtime nor presentation.</en></lang>
      return createFailure(profileDiagnostics);
    }

    // <lang><zh-CN>units 必须为数组且数量与完整 selection 集合相同。</zh-CN><en>Units must be an array whose size equals the complete selection set.</en></lang>
    if (!Array.isArray(input.units)
      || input.units.length !== input.profile.capabilities.length) {
      // <lang><zh-CN>数量 mismatch 不安装任何单元。</zh-CN><en>A cardinality mismatch installs no unit.</en></lang>
      return createFailure([
        createDiagnostic(
          'capability-adoption.unit-set.cardinality',
          '已提供能力单元数量与 profile 选择不一致。',
          'The supplied capability-unit count does not match the profile selections.'
        )
      ]);
    }

    // <lang><zh-CN>新建隔离 lifecycle，候选失败不会接触 activeRuntime。</zh-CN><en>Create an isolated lifecycle so candidate failure cannot touch activeRuntime.</en></lang>
    const candidateRuntime = createCapabilityRuntime();

    // <lang><zh-CN>按调用方显式数组安装全部单元；install 本身不启用或调用 provider。</zh-CN><en>Install every unit from the caller's explicit array; installation itself neither enables nor invokes a provider.</en></lang>
    for (const unit of input.units) {
      // <lang><zh-CN>让既有 lifecycle/core 作为唯一 unit validator。</zh-CN><en>Let the existing lifecycle/core act as the sole unit validator.</en></lang>
      const installResult = candidateRuntime.install(unit);

      // <lang><zh-CN>首个 installation failure 立即拒绝整个候选。</zh-CN><en>Reject the entire candidate on the first installation failure.</en></lang>
      if (!installResult.ok) {
        // <lang><zh-CN>映射后丢弃 candidate runtime 与底层 diagnostic。</zh-CN><en>Discard the candidate runtime and underlying diagnostic after mapping.</en></lang>
        return createFailure([
          mapInstallFailure(installResult)
        ]);
      }
    }

    // <lang><zh-CN>只读取候选的 public-safe disabled snapshot 进行 exact matching。</zh-CN><en>Read only the candidate's public-safe disabled snapshot for exact matching.</en></lang>
    const installedSnapshot = candidateRuntime.snapshot();

    // <lang><zh-CN>验证 profile 与已安装候选一一对应。</zh-CN><en>Validate one-to-one correspondence between profile and installed candidate.</en></lang>
    const matchingDiagnostics = validateCandidateMatchesProfile(
      installedSnapshot,
      input.profile.capabilities
    );

    // <lang><zh-CN>missing/extra/mismatch 使完整候选失败。</zh-CN><en>Missing/extra/mismatch conditions fail the complete candidate.</en></lang>
    if (matchingDiagnostics.length > 0) {
      // <lang><zh-CN>不尝试容错选择替代实现。</zh-CN><en>Do not try to choose a fallback implementation.</en></lang>
      return createFailure(matchingDiagnostics);
    }

    // <lang><zh-CN>计算 dependency-first 的确定性 enabled 顺序。</zh-CN><en>Compute the deterministic dependency-first enable order.</en></lang>
    const enableOrderResult = createEnableOrder(
      installedSnapshot,
      input.profile.capabilities
    );

    // <lang><zh-CN>缺失/disabled/cycle dependency 在状态转换前拒绝。</zh-CN><en>Reject missing/disabled/cyclic dependencies before state transition.</en></lang>
    if (!enableOrderResult.ok) {
      // <lang><zh-CN>活动状态仍完全不变。</zh-CN><en>Active state remains completely unchanged.</en></lang>
      return createFailure(enableOrderResult.diagnostics);
    }

    // <lang><zh-CN>按稳定拓扑顺序逐个启用候选单元。</zh-CN><en>Enable candidate units one by one in stable topological order.</en></lang>
    for (const moduleId of enableOrderResult.order) {
      // <lang><zh-CN>既有 lifecycle 执行依赖与双向冲突检查，不运行 provider。</zh-CN><en>The existing lifecycle checks dependencies and symmetric conflicts without running a provider.</en></lang>
      const enableResult = candidateRuntime.enable(moduleId);

      // <lang><zh-CN>任何 enable failure 丢弃整个 candidate。</zh-CN><en>Any enablement failure discards the whole candidate.</en></lang>
      if (!enableResult.ok) {
        // <lang><zh-CN>只返回映射后的稳定类别。</zh-CN><en>Return only the mapped stable category.</en></lang>
        return createFailure([
          mapEnableFailure(enableResult)
        ]);
      }
    }

    // <lang><zh-CN>候选完整成功后获取最终脱敏 snapshot。</zh-CN><en>Obtain the final redacted snapshot after complete candidate success.</en></lang>
    const nextSnapshot = candidateRuntime.snapshot();

    // <lang><zh-CN>先前无 active runtime 时使用空 snapshot。</zh-CN><en>Use an empty snapshot when no active runtime exists.</en></lang>
    const previousSnapshot = activeRuntime === null
      ? []
      : activeRuntime.snapshot();

    // <lang><zh-CN>在切换前创建只含稳定 metadata 的 receipt。</zh-CN><en>Create a receipt containing only stable metadata before switching.</en></lang>
    const receipt = createReceipt(
      previousSnapshot,
      nextSnapshot,
      input.profile.profileId
    );

    // <lang><zh-CN>复制已验证 presentation，准备与 runtime 一起切换。</zh-CN><en>Copy the validated presentation, preparing to switch it with the runtime.</en></lang>
    const nextPresentation = copyPresentation(input.profile.presentation);

    // <lang><zh-CN>所有预检成功后一次替换活动 runtime 引用。</zh-CN><en>Replace the active runtime reference once after all preflight succeeds.</en></lang>
    activeRuntime = candidateRuntime;

    // <lang><zh-CN>同一提交边界切换呈现 metadata。</zh-CN><en>Switch presentation metadata at the same commit boundary.</en></lang>
    activePresentation = nextPresentation;

    // <lang><zh-CN>返回成功与独立 receipt 副本。</zh-CN><en>Return success and an independent receipt copy.</en></lang>
    return {
      ok: true,
      diagnostics: [],
      receipt: copyReceipt(receipt)
    };
  };

  /**
   * <lang><zh-CN>通过活动 lifecycle 调用已启用 capability port。</zh-CN><en>Invokes an enabled capability port through the active lifecycle.</en></lang>
   *
   * @param {string} moduleId <lang><zh-CN>显式业务模块 ID。</zh-CN><en>Explicit business-module ID.</en></lang>
   * @param {string} portId <lang><zh-CN>显式 required port ID。</zh-CN><en>Explicit required-port ID.</en></lang>
   * @param {unknown} input <lang><zh-CN>module-owned 调用输入。</zh-CN><en>Module-owned invocation input.</en></lang>
   * @returns {unknown} <lang><zh-CN>活动 provider 的 canonical result。</zh-CN><en>The active provider's canonical result.</en></lang>
   * @throws {CapabilityAdoptionInvocationError} <lang><zh-CN>首次成功采用前调用时。</zh-CN><en>When invoked before the first successful adoption.</en></lang>
   * @lang zh-CN 活动后直接委托既有 lifecycle，保留其 disabled/unknown/port 错误与 input 脱敏。
   * @lang en After activation, delegate directly to the existing lifecycle, preserving its disabled/unknown/port errors and input redaction.
   */
  const invoke = (moduleId, portId, input) => {
    // <lang><zh-CN>未初始化时不读取 module/port/input。</zh-CN><en>When uninitialized, read no module/port/input.</en></lang>
    if (activeRuntime === null) {
      // <lang><zh-CN>抛出不接受调用数据的固定错误。</zh-CN><en>Throw a fixed error that accepts no invocation data.</en></lang>
      throw new CapabilityAdoptionInvocationError();
    }

    // <lang><zh-CN>合法活动调用由既有 lifecycle 执行实际 enabled/port gate。</zh-CN><en>The existing lifecycle performs the actual enabled/port gate for an active invocation.</en></lang>
    return activeRuntime.invoke(moduleId, portId, input);
  };

  /**
   * <lang><zh-CN>返回活动 lifecycle 的脱敏 snapshot。</zh-CN><en>Returns the active lifecycle's redacted snapshot.</en></lang>
   *
   * @returns {object[]} <lang><zh-CN>无活动 runtime 时为空数组，否则为既有 detached snapshot。</zh-CN><en>An empty array without an active runtime; otherwise the existing detached snapshot.</en></lang>
   * @lang zh-CN snapshot 不含 adoption profile、unit、provider 或 presentation。
   * @lang en The snapshot contains no adoption profile, unit, provider, or presentation.
   */
  const snapshot = () => {
    // <lang><zh-CN>首次成功前返回新的空数组。</zh-CN><en>Return a new empty array before first success.</en></lang>
    if (activeRuntime === null) {
      // <lang><zh-CN>空数组不是隐式 installed 状态。</zh-CN><en>The empty array is not an implicit installed state.</en></lang>
      return [];
    }

    // <lang><zh-CN>既有 lifecycle 已返回关系数组副本。</zh-CN><en>The existing lifecycle already returns copies of relation arrays.</en></lang>
    return activeRuntime.snapshot();
  };

  /**
   * <lang><zh-CN>返回活动、allowlisted、与内部状态分离的 presentation snapshot。</zh-CN><en>Returns the active allowlisted presentation snapshot detached from internal state.</en></lang>
   *
   * @returns {object} <lang><zh-CN>blocks/order/pageSize 的新副本。</zh-CN><en>A fresh copy of blocks/order/pageSize.</en></lang>
   * @lang zh-CN snapshot 只是 metadata，不加载 component/route 或执行 visibility。
   * @lang en The snapshot is metadata only and loads no component/route or executes visibility.
   */
  const presentation = () => {
    // <lang><zh-CN>逐次复制当前内部 presentation。</zh-CN><en>Copy the current internal presentation on every call.</en></lang>
    return {
      blocks: activePresentation.blocks.map((block) => ({
        id: block.id,
        visibility: block.visibility
      })),
      order: [...activePresentation.order],
      pageSize: activePresentation.pageSize
    };
  };

  // <lang><zh-CN>冻结 API 容器，阻止宿主替换协调/调用函数。</zh-CN><en>Freeze the API container, preventing a host from replacing reconciliation/invocation functions.</en></lang>
  return Object.freeze({
    reconcile,
    invoke,
    snapshot,
    presentation
  });
}
