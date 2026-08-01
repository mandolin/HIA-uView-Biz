/**
 * <lang><zh-CN>受限 solution-profile runtime：用调用方显式提供的 capability package registry 与 anonymous mock session 解析产品级 capability availability。</zh-CN><en>Bounded solution-profile runtime: resolves product-level capability availability from caller-explicit capability-package registry and anonymous mock session.</en></lang>
 * @lang zh-CN 本模块不读取文件、环境、网络、storage、credential、workspace 或 package registry，不发现、安装、import 或执行未知 package、组件、模板、脚本或 provider。
 * @lang en This module reads no file, environment, network, storage, credential, workspace, or package registry and discovers, installs, imports, or executes no unknown package, component, template, script, or provider.
 */

/**
 * <lang><zh-CN>solution profile 首版固定契约版本。</zh-CN><en>Fixed initial contract version of a solution profile.</en></lang>
 * @lang zh-CN 这是数据契约版本，不是 npm package 版本或发布标签。
 * @lang en This is a data-contract version, not an npm package version or release tag.
 */
const SOLUTION_PROFILE_VERSION = '1.0';

/**
 * <lang><zh-CN>区分 solution profile 与 channel/adoption profile 的固定 kind。</zh-CN><en>Fixed kind distinguishing a solution profile from channel or adoption profiles.</en></lang>
 * @lang zh-CN runtime 不根据相似字段猜测 profile 类型。
 * @lang en Runtime does not infer profile type from similar fields.
 */
const SOLUTION_PROFILE_KIND = 'solution-profile';

/**
 * <lang><zh-CN>已登记 capability package descriptor 的固定 kind。</zh-CN><en>Fixed kind of a registered capability-package descriptor.</en></lang>
 * @lang zh-CN descriptor 只表达允许的产品组合 metadata，不是工程 package manifest 或 import 指令。
 * @lang en A descriptor expresses only allowed product-composition metadata and is not an engineering package manifest or import instruction.
 */
const CAPABILITY_PACKAGE_KIND = 'solution-capability-package';

/**
 * <lang><zh-CN>anonymous mock session 的固定契约版本。</zh-CN><en>Fixed contract version of an anonymous mock session.</en></lang>
 * @lang zh-CN session 只服务本地 availability 验证，不代表真实身份或授权系统。
 * @lang en The session serves only local availability validation and represents neither real identity nor an authorization system.
 */
const MOCK_SESSION_VERSION = '1.0';

/**
 * <lang><zh-CN>没有个人主体的 mock session 固定 kind。</zh-CN><en>Fixed kind of a mock session with no personal subject.</en></lang>
 * @lang zh-CN 该值不能触发登录、token 处理、用户查找或会话持久化。
 * @lang en This value cannot trigger login, token handling, user lookup, or session persistence.
 */
const ANONYMOUS_MOCK_SESSION_KIND = 'anonymous-mock-session';

/**
 * <lang><zh-CN>公开稳定 dotted identifier 的 JSON-compatible 规则。</zh-CN><en>JSON-compatible rule for a public stable dotted identifier.</en></lang>
 * @lang zh-CN 规则排除路径、URL、空白、表达式和脚本标点。
 * @lang en The rule excludes paths, URLs, whitespace, expressions, and script punctuation.
 */
const DOTTED_IDENTIFIER_PATTERN = /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/;

/**
 * <lang><zh-CN>runtime 创建 options 必需的精确字段集合。</zh-CN><en>Exact required field set for runtime-creation options.</en></lang>
 * @lang zh-CN 不接受隐含 mode、loader、resolver callback 或环境开关。
 * @lang en No implicit mode, loader, resolver callback, or environment switch is accepted.
 */
const RUNTIME_OPTION_KEYS = Object.freeze([
  'allowedChannelProfileIds',
  'capabilityPackages'
]);

/**
 * <lang><zh-CN>solution profile 必需的精确字段集合。</zh-CN><en>Exact required field set of a solution profile.</en></lang>
 * @lang zh-CN profile 本身不保存 grant、session、组件、URL 或连接配置。
 * @lang en The profile itself stores no grant, session, component, URL, or connection configuration.
 */
const SOLUTION_PROFILE_KEYS = Object.freeze([
  'solutionProfileVersion',
  'kind',
  'id',
  'channelProfileId',
  'capabilityPackageIds'
]);

/**
 * <lang><zh-CN>capability package descriptor 必需的精确字段集合。</zh-CN><en>Exact required field set of a capability-package descriptor.</en></lang>
 * @lang zh-CN 所有数组均为 metadata ID 集合，不接受对象、函数、表达式或未审计 code。
 * @lang en Every array is a metadata-ID set and accepts no object, function, expression, or unaudited code.
 */
const CAPABILITY_PACKAGE_KEYS = Object.freeze([
  'packageVersion',
  'kind',
  'id',
  'dependsOn',
  'requiredModuleIds',
  'requiredGrantIds'
]);

/**
 * <lang><zh-CN>anonymous mock session 必需的精确字段集合。</zh-CN><en>Exact required field set of an anonymous mock session.</en></lang>
 * @lang zh-CN session 不接收 subject、token、expiry、cookie、provider 或 claims 原文。
 * @lang en The session accepts no subject, token, expiry, cookie, provider, or raw claims.
 */
const MOCK_SESSION_KEYS = Object.freeze([
  'sessionVersion',
  'kind',
  'grantIds'
]);

/**
 * <lang><zh-CN>判断未知值是否为可按 JSON object 读取的非数组记录。</zh-CN><en>Determines whether an unknown value is a non-array record readable as a JSON object.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待检查值。</zh-CN><en>Value to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>值为非 null object 且不是数组时为 true。</zh-CN><en>True when the value is a non-null object and not an array.</en></lang>
 * @lang zh-CN shape guard 不调用 getter、不执行用户代码，也不把对象视为可信配置。
 * @lang en The shape guard invokes no getter, executes no user code, and does not treat an object as trusted configuration.
 */
function isRecord(value) {
  // <lang><zh-CN>排除 null 与数组，使字段验证只面向命名 JSON object。</zh-CN><en>Exclude null and arrays so field validation targets only named JSON objects.</en></lang>
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * <lang><zh-CN>判断一个值是否为公开允许的稳定 dotted identifier。</zh-CN><en>Determines whether a value is an allowed public stable dotted identifier.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>候选标识。</zh-CN><en>Candidate identifier.</en></lang>
 * @returns {boolean} <lang><zh-CN>匹配固定规则时为 true。</zh-CN><en>True when it matches the fixed rule.</en></lang>
 * @lang zh-CN 不规范化大小写、namespace 或调用方字符串。
 * @lang en It normalizes neither case nor namespace nor caller string.
 */
function isDottedIdentifier(value) {
  // <lang><zh-CN>先限制 primitive 类型，后执行固定正则。</zh-CN><en>Restrict primitive type before applying the fixed regular expression.</en></lang>
  return typeof value === 'string' && DOTTED_IDENTIFIER_PATTERN.test(value);
}

/**
 * <lang><zh-CN>确认记录恰好拥有所给 enumerable own keys。</zh-CN><en>Confirms that a record has exactly the supplied enumerable own keys.</en></lang>
 *
 * @param {object} record <lang><zh-CN>已通过最小 record guard 的对象。</zh-CN><en>Object that passed the minimum record guard.</en></lang>
 * @param {string[]} expectedKeys <lang><zh-CN>完整允许字段集。</zh-CN><en>Complete allowed field set.</en></lang>
 * @returns {boolean} <lang><zh-CN>缺失或额外字段均不存在时为 true。</zh-CN><en>True when neither missing nor extra fields exist.</en></lang>
 * @lang zh-CN 精确检查阻止声明面被静默扩展为 loader、script 或连接配置。
 * @lang en Exact checking prevents silent expansion of declaration surface into loader, script, or connection configuration.
 */
function hasExactOwnKeys(record, expectedKeys) {
  // <lang><zh-CN>JSON-compatible 输入只读取 enumerable own keys，不接受原型链补充配置。</zh-CN><en>JSON-compatible input reads only enumerable own keys and accepts no configuration supplied through prototype chain.</en></lang>
  const actualKeys = Object.keys(record);

  // <lang><zh-CN>长度不同必然存在缺失或额外字段，不再暴露实际键名。</zh-CN><en>A different length proves a missing or extra field, without exposing actual key names.</en></lang>
  if (actualKeys.length !== expectedKeys.length) {
    return false;
  }

  // <lang><zh-CN>逐项确认允许字段是自有字段，保持数据面完全静态。</zh-CN><en>Confirm every allowed field is an own field, keeping data surface fully static.</en></lang>
  return expectedKeys.every((expectedKey) => Object.hasOwn(record, expectedKey));
}

/**
 * <lang><zh-CN>创建不回显输入的双语 diagnostic。</zh-CN><en>Creates a bilingual diagnostic that echoes no input.</en></lang>
 *
 * @param {string} code <lang><zh-CN>稳定机器代码。</zh-CN><en>Stable machine code.</en></lang>
 * @param {string} zhHans <lang><zh-CN>中文说明。</zh-CN><en>Chinese explanation.</en></lang>
 * @param {string} english <lang><zh-CN>英文说明。</zh-CN><en>English explanation.</en></lang>
 * @returns {object} <lang><zh-CN>只含 code 与两种 locale message 的新对象。</zh-CN><en>New object containing only code and two-locale message.</en></lang>
 * @lang zh-CN API 没有 subject/input 参数，因此 profile、session、grant、path 或 raw error 无法进入结果。
 * @lang en The API has no subject or input parameter, so profile, session, grant, path, or raw error cannot enter result.
 */
function createDiagnostic(code, zhHans, english) {
  // <lang><zh-CN>每次构造新 message，避免调用方修改一个结果影响其他 resolve。</zh-CN><en>Construct a new message every time so caller mutation of one result cannot affect another resolve.</en></lang>
  return {
    code,
    message: {
      'zh-Hans': zhHans,
      en: english
    }
  };
}

/**
 * <lang><zh-CN>复制受限 diagnostics，避免调用方获得 runtime 内部数组或 message 引用。</zh-CN><en>Copies bounded diagnostics so callers obtain neither runtime-internal arrays nor message references.</en></lang>
 *
 * @param {object[]} diagnostics <lang><zh-CN>runtime 自有 diagnostic 列表。</zh-CN><en>Runtime-owned diagnostic list.</en></lang>
 * @returns {object[]} <lang><zh-CN>安全的新 diagnostic 数组。</zh-CN><en>Safe new diagnostic array.</en></lang>
 * @lang zh-CN helper 只复制固定公开 shape，不序列化未知错误或输入。
 * @lang en The helper copies only fixed public shape and serializes no unknown error or input.
 */
function copyDiagnostics(diagnostics) {
  // <lang><zh-CN>每个 message 层都重新创建，保证下次 resolve 不受调用方 mutation 影响。</zh-CN><en>Recreate every message layer, ensuring next resolve is unaffected by caller mutation.</en></lang>
  return diagnostics.map((diagnostic) => ({
    code: diagnostic.code,
    message: {
      'zh-Hans': diagnostic.message['zh-Hans'],
      en: diagnostic.message.en
    }
  }));
}

/**
 * <lang><zh-CN>创建没有 partial availability surface 的失败结果。</zh-CN><en>Creates a failure result with no partial availability surface.</en></lang>
 *
 * @param {object[]} diagnostics <lang><zh-CN>受限 diagnostics。</zh-CN><en>Bounded diagnostics.</en></lang>
 * @returns {{ok: false, diagnostics: object[]}} <lang><zh-CN>只有状态和诊断的失败对象。</zh-CN><en>Failure object containing only status and diagnostics.</en></lang>
 * @lang zh-CN 失败不会公开 registry、profile、session、grant、provider 或已解析 dependency。
 * @lang en Failure exposes no registry, profile, session, grant, provider, or resolved dependency.
 */
function createFailure(diagnostics) {
  // <lang><zh-CN>复制 diagnostics 后冻结根对象，避免错误结果被扩展为伪成功 API。</zh-CN><en>Copy diagnostics then freeze root object, preventing a failure result from being extended into a false success API.</en></lang>
  return Object.freeze({
    ok: false,
    diagnostics: copyDiagnostics(diagnostics)
  });
}

/**
 * <lang><zh-CN>验证并复制 capability package descriptor 的静态 metadata。</zh-CN><en>Validates and copies static metadata of a capability-package descriptor.</en></lang>
 *
 * @param {unknown} candidate <lang><zh-CN>调用方提供的候选 descriptor。</zh-CN><en>Candidate descriptor supplied by caller.</en></lang>
 * @returns {{ok: true, descriptor: object}|{ok: false}} <lang><zh-CN>安全副本或失败标记。</zh-CN><en>Safe copy or failure marker.</en></lang>
 * @lang zh-CN descriptor 不含文件位置、工程 package 名、function、provider 或动态加载表达式。
 * @lang en A descriptor contains no file location, engineering package name, function, provider, or dynamic-loading expression.
 */
function validateCapabilityPackage(candidate) {
  // <lang><zh-CN>先要求 exact root，任何非法 shape 都不继续读取字段。</zh-CN><en>Require exact root first and read no field further from any invalid shape.</en></lang>
  if (!isRecord(candidate) || !hasExactOwnKeys(candidate, CAPABILITY_PACKAGE_KEYS)) {
    return { ok: false };
  }

  // <lang><zh-CN>所有 ID 数组均须非空或可为空的明确数组、稳定且无重复；依赖数组可为空但不接受任意值。</zh-CN><en>Every ID array must be an explicit stable duplicate-free array, with required arrays non-empty; dependency array may be empty but accepts no arbitrary value.</en></lang>
  const hasValidDependencies = Array.isArray(candidate.dependsOn)
    && new Set(candidate.dependsOn).size === candidate.dependsOn.length
    && candidate.dependsOn.every(isDottedIdentifier);
  const hasValidModules = Array.isArray(candidate.requiredModuleIds)
    && candidate.requiredModuleIds.length > 0
    && new Set(candidate.requiredModuleIds).size === candidate.requiredModuleIds.length
    && candidate.requiredModuleIds.every(isDottedIdentifier);
  const hasValidGrants = Array.isArray(candidate.requiredGrantIds)
    && candidate.requiredGrantIds.length > 0
    && new Set(candidate.requiredGrantIds).size === candidate.requiredGrantIds.length
    && candidate.requiredGrantIds.every(isDottedIdentifier);

  // <lang><zh-CN>版本、kind、ID 与三个数组同时必须合法；不试图自动修复或补全任一 descriptor。</zh-CN><en>Version, kind, ID, and all three arrays must be valid together; no descriptor is auto-repaired or completed.</en></lang>
  if (
    candidate.packageVersion !== SOLUTION_PROFILE_VERSION
    || candidate.kind !== CAPABILITY_PACKAGE_KIND
    || !isDottedIdentifier(candidate.id)
    || !hasValidDependencies
    || !hasValidModules
    || !hasValidGrants
  ) {
    return { ok: false };
  }

  // <lang><zh-CN>只复制 fixed metadata 数组，切断调用方后续 mutation 与原型状态。</zh-CN><en>Copy only fixed metadata arrays, cutting off later caller mutation and prototype state.</en></lang>
  return {
    ok: true,
    descriptor: {
      id: candidate.id,
      dependsOn: [...candidate.dependsOn],
      requiredModuleIds: [...candidate.requiredModuleIds],
      requiredGrantIds: [...candidate.requiredGrantIds]
    }
  };
}

/**
 * <lang><zh-CN>判断已复制 registry 是否有 dependency cycle。</zh-CN><en>Determines whether a copied registry has a dependency cycle.</en></lang>
 *
 * @param {Map<string, object>} registryById <lang><zh-CN>已验证 descriptor 的 ID Map。</zh-CN><en>ID map of validated descriptors.</en></lang>
 * @returns {boolean} <lang><zh-CN>发现任一闭环时为 true。</zh-CN><en>True when any cycle is found.</en></lang>
 * @lang zh-CN 图遍历只读取 descriptor metadata，不加载 package 或调用 capability/provider。
 * @lang en Graph traversal reads only descriptor metadata and loads no package or invokes no capability or provider.
 */
function hasDependencyCycle(registryById) {
  // <lang><zh-CN>visiting 标记当前 DFS 路径，visited 标记已完全验证的节点。</zh-CN><en>Visiting marks current DFS path while visited marks nodes fully verified.</en></lang>
  const visiting = new Set();
  const visited = new Set();

  /**
   * <lang><zh-CN>递归检查一个稳定 descriptor ID 的依赖边。</zh-CN><en>Recursively checks dependency edges of one stable descriptor ID.</en></lang>
   *
   * @param {string} packageId <lang><zh-CN>已存在 registry ID。</zh-CN><en>Existing registry ID.</en></lang>
   * @returns {boolean} <lang><zh-CN>当前分支存在闭环时为 true。</zh-CN><en>True when current branch has a cycle.</en></lang>
   * @lang zh-CN 调用仅发生在依赖已确认存在后，因此不会读取未知 descriptor。
   * @lang en Invocation occurs only after dependencies are confirmed to exist, so no unknown descriptor is read.
   */
  const visit = (packageId) => {
    // <lang><zh-CN>重复进入当前路径即证明闭环，不需要披露路径或调用方输入。</zh-CN><en>Re-entering current path proves a cycle and need not disclose a path or caller input.</en></lang>
    if (visiting.has(packageId)) {
      return true;
    }

    // <lang><zh-CN>已完全验证的节点不会再次遍历，保持确定性与有限成本。</zh-CN><en>A fully verified node is not traversed again, retaining determinism and finite cost.</en></lang>
    if (visited.has(packageId)) {
      return false;
    }

    // <lang><zh-CN>当前 descriptor 来自已复制 registry，依赖数组也已通过稳定 ID 校验。</zh-CN><en>Current descriptor comes from copied registry and its dependency array already passed stable-ID validation.</en></lang>
    const descriptor = registryById.get(packageId);
    visiting.add(packageId);

    // <lang><zh-CN>任一依赖闭环立即向上返回，避免继续构造 partial composition。</zh-CN><en>Return upward immediately on any dependency cycle, avoiding construction of partial composition.</en></lang>
    for (const dependencyId of descriptor.dependsOn) {
      if (visit(dependencyId)) {
        return true;
      }
    }

    // <lang><zh-CN>离开当前 DFS 路径后标记完成，供其他 package 重用结果。</zh-CN><en>After leaving current DFS path mark completion so other packages can reuse result.</en></lang>
    visiting.delete(packageId);
    visited.add(packageId);
    return false;
  };

  // <lang><zh-CN>遍历 registry 的 insertion order，错误结论不依赖对象键或环境顺序。</zh-CN><en>Traverse registry insertion order so error conclusion depends on neither object keys nor environment order.</en></lang>
  for (const packageId of registryById.keys()) {
    if (visit(packageId)) {
      return true;
    }
  }

  // <lang><zh-CN>全部节点完成且没有 back edge 时 registry 无闭环。</zh-CN><en>When all nodes complete with no back edge, registry has no cycle.</en></lang>
  return false;
}

/**
 * <lang><zh-CN>验证并隔离 runtime 创建 options 与静态 registry。</zh-CN><en>Validates and isolates runtime-creation options and static registry.</en></lang>
 *
 * @param {unknown} options <lang><zh-CN>调用方显式提供的 host options。</zh-CN><en>Host options explicitly supplied by caller.</en></lang>
 * @returns {{diagnostics: object[], channelProfileIds: Set<string>, registryById: Map<string, object>}} <lang><zh-CN>受限 diagnostics 与仅内部使用的安全数据。</zh-CN><en>Bounded diagnostics and safe data for internal use only.</en></lang>
 * @lang zh-CN 无效配置不会 throw 原始输入；它被保留为所有 resolve 都会复制的固定 diagnostic。
 * @lang en Invalid configuration does not throw raw input; it is retained as a fixed diagnostic copied by every resolve.
 */
function createRuntimeConfiguration(options) {
  // <lang><zh-CN>初始化独立 diagnostics 与空内部容器，保证无效 options 也不泄露原始对象。</zh-CN><en>Initialize independent diagnostics and empty internal containers, ensuring invalid options leak no raw object.</en></lang>
  const diagnostics = [];
  const channelProfileIds = new Set();
  const registryById = new Map();

  // <lang><zh-CN>options 必须精确拥有两项静态数组，拒绝 resolver/loader/connection 等额外字段。</zh-CN><en>Options must own exactly two static arrays, rejecting extra resolver, loader, connection, and similar fields.</en></lang>
  if (!isRecord(options) || !hasExactOwnKeys(options, RUNTIME_OPTION_KEYS)) {
    diagnostics.push(createDiagnostic(
      'solution-profile.runtime.options.invalid',
      'solution profile runtime 的宿主配置无效。',
      'The solution-profile runtime host configuration is invalid.'
    ));
    return { diagnostics, channelProfileIds, registryById };
  }

  // <lang><zh-CN>channel profile allowlist 必须是非空、无重复的稳定 dotted ID 集合。</zh-CN><en>The channel-profile allowlist must be a non-empty duplicate-free set of stable dotted IDs.</en></lang>
  const hasValidChannels = Array.isArray(options.allowedChannelProfileIds)
    && options.allowedChannelProfileIds.length > 0
    && new Set(options.allowedChannelProfileIds).size === options.allowedChannelProfileIds.length
    && options.allowedChannelProfileIds.every(isDottedIdentifier);
  if (!hasValidChannels) {
    diagnostics.push(createDiagnostic(
      'solution-profile.runtime.channels.invalid',
      'solution profile runtime 的 channel profile 白名单无效。',
      'The solution-profile runtime channel-profile allowlist is invalid.'
    ));
  } else {
    // <lang><zh-CN>只写入已验证 ID，避免后续 profile 校验读取 caller 原数组。</zh-CN><en>Write only validated IDs, avoiding later profile validation reading caller original array.</en></lang>
    for (const channelProfileId of options.allowedChannelProfileIds) {
      channelProfileIds.add(channelProfileId);
    }
  }

  // <lang><zh-CN>registry 必须是非空数组；每项先独立复制后才检查 global identity 与 dependency 图。</zh-CN><en>Registry must be a non-empty array; copy every item independently before checking global identity and dependency graph.</en></lang>
  if (!Array.isArray(options.capabilityPackages) || options.capabilityPackages.length === 0) {
    diagnostics.push(createDiagnostic(
      'solution-profile.registry.invalid',
      'solution capability package registry 必须非空。',
      'The solution capability-package registry must be non-empty.'
    ));
    return { diagnostics, channelProfileIds, registryById };
  }

  // <lang><zh-CN>逐项收集已验证 descriptor；任一非法 shape 只保留固定类别 diagnostic。</zh-CN><en>Collect validated descriptors one by one; any invalid shape retains only fixed-category diagnostic.</en></lang>
  for (const candidatePackage of options.capabilityPackages) {
    const packageValidation = validateCapabilityPackage(candidatePackage);
    if (!packageValidation.ok) {
      diagnostics.push(createDiagnostic(
        'solution-profile.registry.package.invalid',
        'solution capability package descriptor 无效。',
        'A solution capability-package descriptor is invalid.'
      ));
      continue;
    }

    // <lang><zh-CN>同一 capability package ID 不可注册两次，避免组合顺序随调用方数组歧义变化。</zh-CN><en>The same capability-package ID cannot register twice, avoiding composition order ambiguity from caller array.</en></lang>
    if (registryById.has(packageValidation.descriptor.id)) {
      diagnostics.push(createDiagnostic(
        'solution-profile.registry.package.duplicate',
        'solution capability package registry 含有重复标识。',
        'The solution capability-package registry contains a duplicate identifier.'
      ));
      continue;
    }

    // <lang><zh-CN>Map 只保存 validator 的复制结果，不保存调用方 descriptor 引用。</zh-CN><en>Map stores only validator copy and retains no caller descriptor reference.</en></lang>
    registryById.set(packageValidation.descriptor.id, packageValidation.descriptor);
  }

  // <lang><zh-CN>descriptor 局部失败时不再解析 dependency，防止半个 registry 产生误导性 closure。</zh-CN><en>On local descriptor failure do not resolve dependencies further, preventing half a registry from forming misleading closure.</en></lang>
  if (diagnostics.length > 0) {
    return { diagnostics, channelProfileIds, registryById };
  }

  // <lang><zh-CN>每条 dependency 必须指向同一显式 registry 内 ID，不能成为 package lookup 或 import 名称。</zh-CN><en>Every dependency must point to an ID within the same explicit registry and cannot become package lookup or import name.</en></lang>
  for (const descriptor of registryById.values()) {
    const hasUnknownDependency = descriptor.dependsOn.some(
      (dependencyId) => !registryById.has(dependencyId)
    );
    if (hasUnknownDependency) {
      diagnostics.push(createDiagnostic(
        'solution-profile.registry.dependency-unknown',
        'solution capability package registry 含有未登记依赖。',
        'The solution capability-package registry contains an unregistered dependency.'
      ));
      break;
    }
  }

  // <lang><zh-CN>所有 dependency 均存在后才检查闭环，避免对未定义节点进行图遍历。</zh-CN><en>Check cycles only after every dependency exists, avoiding graph traversal of an undefined node.</en></lang>
  if (diagnostics.length === 0 && hasDependencyCycle(registryById)) {
    diagnostics.push(createDiagnostic(
      'solution-profile.registry.dependency-cycle',
      'solution capability package registry 含有依赖闭环。',
      'The solution capability-package registry contains a dependency cycle.'
    ));
  }

  // <lang><zh-CN>返回仅被 runtime closure 使用的 Set/Map；公开 API 不暴露它们。</zh-CN><en>Return Set and Map used only by runtime closure; public API exposes neither.</en></lang>
  return { diagnostics, channelProfileIds, registryById };
}

/**
 * <lang><zh-CN>校验并复制调用方提供的 solution profile。</zh-CN><en>Validates and copies a solution profile supplied by caller.</en></lang>
 *
 * @param {unknown} profile <lang><zh-CN>候选 solution profile。</zh-CN><en>Candidate solution profile.</en></lang>
 * @param {Set<string>} channelProfileIds <lang><zh-CN>runtime 自有 channel profile allowlist。</zh-CN><en>Runtime-owned channel-profile allowlist.</en></lang>
 * @param {Map<string, object>} registryById <lang><zh-CN>runtime 自有 capability registry。</zh-CN><en>Runtime-owned capability registry.</en></lang>
 * @returns {{ok: true, profile: object}|{ok: false, diagnostics: object[]}} <lang><zh-CN>安全副本或受限 diagnostics。</zh-CN><en>Safe copy or bounded diagnostics.</en></lang>
 * @lang zh-CN 任何错误都在 package closure 前返回；diagnostic 不复制调用方 ID 或数组值。
 * @lang en Any error returns before package closure; diagnostics copy no caller ID or array value.
 */
function validateSolutionProfile(profile, channelProfileIds, registryById) {
  // <lang><zh-CN>顶层不合法时不读取字段，保持 profile body 完全脱敏。</zh-CN><en>On invalid top level read no field, keeping profile body completely redacted.</en></lang>
  if (!isRecord(profile) || !hasExactOwnKeys(profile, SOLUTION_PROFILE_KEYS)) {
    return {
      ok: false,
      diagnostics: [createDiagnostic(
        'solution-profile.profile.invalid',
        'solution profile 的顶层结构无效。',
        'The solution profile has an invalid top-level shape.'
      )]
    };
  }

  // <lang><zh-CN>独立收集版本、kind、ID、channel 和 selection 的固定类别失败。</zh-CN><en>Collect fixed-category failures independently for version, kind, ID, channel, and selection.</en></lang>
  const diagnostics = [];
  if (profile.solutionProfileVersion !== SOLUTION_PROFILE_VERSION) {
    diagnostics.push(createDiagnostic(
      'solution-profile.profile.version-unsupported',
      'solution profile 版本不受支持。',
      'The solution profile version is unsupported.'
    ));
  }
  if (profile.kind !== SOLUTION_PROFILE_KIND) {
    diagnostics.push(createDiagnostic(
      'solution-profile.profile.kind-invalid',
      'solution profile kind 无效。',
      'The solution profile kind is invalid.'
    ));
  }
  if (!isDottedIdentifier(profile.id)) {
    diagnostics.push(createDiagnostic(
      'solution-profile.profile.id-invalid',
      'solution profile 标识无效。',
      'The solution profile identifier is invalid.'
    ));
  }
  if (!isDottedIdentifier(profile.channelProfileId) || !channelProfileIds.has(profile.channelProfileId)) {
    diagnostics.push(createDiagnostic(
      'solution-profile.profile.channel-profile.invalid',
      'solution profile 选择了不受支持的 channel profile。',
      'The solution profile selects an unsupported channel profile.'
    ));
  }

  // <lang><zh-CN>capability selection 必须非空、稳定、无重复且全部已经登记；它不接受 package 路径或下载来源。</zh-CN><en>Capability selection must be non-empty, stable, duplicate-free, and fully registered; it accepts no package path or download source.</en></lang>
  const hasValidSelection = Array.isArray(profile.capabilityPackageIds)
    && profile.capabilityPackageIds.length > 0
    && new Set(profile.capabilityPackageIds).size === profile.capabilityPackageIds.length
    && profile.capabilityPackageIds.every(
      (packageId) => isDottedIdentifier(packageId) && registryById.has(packageId)
    );
  if (!hasValidSelection) {
    diagnostics.push(createDiagnostic(
      'solution-profile.profile.capability-package.invalid',
      'solution profile 的 capability package 选择无效。',
      'The solution profile capability-package selection is invalid.'
    ));
  }

  // <lang><zh-CN>任何 profile 失败都阻止 session/grant/closure 处理，避免 partial solution surface。</zh-CN><en>Any profile failure blocks session, grant, and closure handling, avoiding a partial solution surface.</en></lang>
  if (diagnostics.length > 0) {
    return { ok: false, diagnostics };
  }

  // <lang><zh-CN>成功后只保留公开静态字段副本。</zh-CN><en>On success retain copies of only public static fields.</en></lang>
  return {
    ok: true,
    profile: {
      id: profile.id,
      channelProfileId: profile.channelProfileId,
      capabilityPackageIds: [...profile.capabilityPackageIds]
    }
  };
}

/**
 * <lang><zh-CN>校验并复制 anonymous mock session 的有限 grant 集合。</zh-CN><en>Validates and copies finite grant set of an anonymous mock session.</en></lang>
 *
 * @param {unknown} session <lang><zh-CN>调用方提供的候选 mock session。</zh-CN><en>Candidate mock session supplied by caller.</en></lang>
 * @returns {{ok: true, grantIds: Set<string>}|{ok: false, diagnostics: object[]}} <lang><zh-CN>runtime 自有 grant Set 或受限 diagnostics。</zh-CN><en>Runtime-owned grant set or bounded diagnostics.</en></lang>
 * @lang zh-CN session 不返回到公开 success API，避免把本地 grant 当作用户权限或身份事实泄露。
 * @lang en Session never returns through public success API, avoiding leakage of local grants as user authorization or identity fact.
 */
function validateAnonymousMockSession(session) {
  // <lang><zh-CN>无效 root 只产生一个类别 diagnostic，且不访问未知字段。</zh-CN><en>An invalid root produces only one category diagnostic and reads no unknown field.</en></lang>
  if (!isRecord(session) || !hasExactOwnKeys(session, MOCK_SESSION_KEYS)) {
    return {
      ok: false,
      diagnostics: [createDiagnostic(
        'solution-profile.session.invalid',
        'anonymous mock session 的顶层结构无效。',
        'The anonymous mock session has an invalid top-level shape.'
      )]
    };
  }

  // <lang><zh-CN>版本、kind 和 grant 集合分别检查，所有 failure 都不回显 session 值。</zh-CN><en>Check version, kind, and grant set separately; every failure echoes no session value.</en></lang>
  const diagnostics = [];
  if (session.sessionVersion !== MOCK_SESSION_VERSION) {
    diagnostics.push(createDiagnostic(
      'solution-profile.session.version-unsupported',
      'anonymous mock session 版本不受支持。',
      'The anonymous mock session version is unsupported.'
    ));
  }
  if (session.kind !== ANONYMOUS_MOCK_SESSION_KIND) {
    diagnostics.push(createDiagnostic(
      'solution-profile.session.kind-invalid',
      'anonymous mock session kind 无效。',
      'The anonymous mock session kind is invalid.'
    ));
  }
  const hasValidGrants = Array.isArray(session.grantIds)
    && new Set(session.grantIds).size === session.grantIds.length
    && session.grantIds.every(isDottedIdentifier);
  if (!hasValidGrants) {
    diagnostics.push(createDiagnostic(
      'solution-profile.session.grants-invalid',
      'anonymous mock session 的 grant 集合无效。',
      'The anonymous mock session grant set is invalid.'
    ));
  }

  // <lang><zh-CN>失败时不创建可查询的 Set，调用方无法误把 malformed session 当作空授权成功。</zh-CN><en>On failure create no queryable set, so callers cannot mistake malformed session for successful empty authorization.</en></lang>
  if (diagnostics.length > 0) {
    return { ok: false, diagnostics };
  }

  // <lang><zh-CN>Set 与调用方 grantIds 数组分离，后续原数组 mutation 不影响当前 resolve。</zh-CN><en>Set is detached from caller grantIds array, so later original-array mutation cannot affect current resolve.</en></lang>
  return {
    ok: true,
    grantIds: new Set(session.grantIds)
  };
}

/**
 * <lang><zh-CN>以 dependency-first 顺序解析显式选择的 capability package closure。</zh-CN><en>Resolves explicitly selected capability-package closure in dependency-first order.</en></lang>
 *
 * @param {string[]} selectedPackageIds <lang><zh-CN>已验证的 profile capability 选择。</zh-CN><en>Validated profile capability selection.</en></lang>
 * @param {Map<string, object>} registryById <lang><zh-CN>已验证 runtime registry。</zh-CN><en>Validated runtime registry.</en></lang>
 * @returns {object[]} <lang><zh-CN>去重且依赖在前的 descriptor 副本引用列表。</zh-CN><en>Deduplicated descriptor-reference list with dependencies first.</en></lang>
 * @lang zh-CN 配置阶段已拒绝未知 dependency/cycle；本 helper 不做 package lookup、网络、import 或副作用。
 * @lang en Configuration stage already rejects unknown dependency or cycle; this helper performs no package lookup, network, import, or side effect.
 */
function resolveCapabilityClosure(selectedPackageIds, registryById) {
  // <lang><zh-CN>resolved 记录稳定输出顺序，visited 防止多个选择共享 dependency 时重复出现。</zh-CN><en>Resolved records stable output order while visited prevents duplicates when selections share a dependency.</en></lang>
  const resolved = [];
  const visited = new Set();

  /**
   * <lang><zh-CN>把一个已登记 package 及其依赖放入 dependency-first closure。</zh-CN><en>Adds one registered package and its dependencies to dependency-first closure.</en></lang>
   *
   * @param {string} packageId <lang><zh-CN>已验证 registry package ID。</zh-CN><en>Validated registry package ID.</en></lang>
   * @returns {void} <lang><zh-CN>无返回值；写入本地 closure。</zh-CN><en>No return value; writes local closure.</en></lang>
   * @lang zh-CN 调用仅操作 descriptor metadata，绝不构造业务 module、implementation 或 provider。
   * @lang en Invocation operates only on descriptor metadata and constructs no business module, implementation, or provider.
   */
  const visit = (packageId) => {
    // <lang><zh-CN>已访问节点不重复添加，保持 selected array 的稳定语义。</zh-CN><en>Do not add an already visited node twice, preserving stable semantics of selected array.</en></lang>
    if (visited.has(packageId)) {
      return;
    }

    // <lang><zh-CN>当前 descriptor 已在创建期验证且依赖均存在。</zh-CN><en>Current descriptor was validated at creation and every dependency exists.</en></lang>
    const descriptor = registryById.get(packageId);
    for (const dependencyId of descriptor.dependsOn) {
      visit(dependencyId);
    }

    // <lang><zh-CN>依赖完成后才写入自己，确保顺序可用于后续确定性 module 组合。</zh-CN><en>Add itself only after dependencies complete, ensuring order can support later deterministic module composition.</en></lang>
    visited.add(packageId);
    resolved.push(descriptor);
  };

  // <lang><zh-CN>按 profile 声明顺序访问顶层选择；该顺序来自已验证静态数组。</zh-CN><en>Visit top-level selections in profile declaration order; that order comes from validated static array.</en></lang>
  for (const packageId of selectedPackageIds) {
    visit(packageId);
  }

  // <lang><zh-CN>返回内部 descriptor 列表只供当前 resolve 使用，公开 API 另行投影安全 metadata。</zh-CN><en>Return internal descriptor list only for current resolve; public API separately projects safe metadata.</en></lang>
  return resolved;
}

/**
 * <lang><zh-CN>从已解析 closure 创建只读、脱敏 solution availability API。</zh-CN><en>Creates read-only redacted solution-availability API from resolved closure.</en></lang>
 *
 * @param {object} profile <lang><zh-CN>runtime 自有 profile 副本。</zh-CN><en>Runtime-owned profile copy.</en></lang>
 * @param {object[]} closure <lang><zh-CN>dependency-first descriptor closure。</zh-CN><en>Dependency-first descriptor closure.</en></lang>
 * @returns {object} <lang><zh-CN>固定 success API 容器。</zh-CN><en>Fixed success API container.</en></lang>
 * @lang zh-CN API 不公开 grant/session/descriptor/provider；它只让调用方读取已验证 availability 与 module ID metadata。
 * @lang en The API exposes no grant, session, descriptor, or provider; it lets callers read only validated availability and module-ID metadata.
 */
function createSuccess(profile, closure) {
  // <lang><zh-CN>capability snapshots 只包含 stable package ID 与固定 available state。</zh-CN><en>Capability snapshots contain only stable package ID and fixed available state.</en></lang>
  const capabilitySnapshots = closure.map((descriptor) => ({
    id: descriptor.id,
    state: 'available'
  }));

  // <lang><zh-CN>module IDs 依 closure 顺序去重；这里不包含 implementation package 或 provider surface。</zh-CN><en>Module IDs are deduplicated in closure order; no implementation package or provider surface appears here.</en></lang>
  const requiredModuleIds = [];
  const requiredModuleIdSet = new Set();
  for (const descriptor of closure) {
    for (const moduleId of descriptor.requiredModuleIds) {
      if (!requiredModuleIdSet.has(moduleId)) {
        requiredModuleIdSet.add(moduleId);
        requiredModuleIds.push(moduleId);
      }
    }
  }

  // <lang><zh-CN>available package ID Set 只支持精确 stable-ID 判断，不能解析 alias、URL 或动态 package 名。</zh-CN><en>Available package-ID set supports only exact stable-ID decision and resolves no alias, URL, or dynamic package name.</en></lang>
  const availablePackageIds = new Set(capabilitySnapshots.map((snapshot) => snapshot.id));

  /**
   * <lang><zh-CN>返回 solution profile 的最小公开身份副本。</zh-CN><en>Returns minimum public identity copy of solution profile.</en></lang>
   *
   * @returns {{id: string, channelProfileId: string, capabilityPackageIds: string[]}} <lang><zh-CN>不含 grant 或 session 的新 metadata。</zh-CN><en>New metadata containing no grant or session.</en></lang>
   * @lang zh-CN profile capability 列表保持原始顶层选择，不泄露 resolver 的 descriptor 内容。
   * @lang en Profile capability list preserves original top-level selection and leaks no resolver descriptor content.
   */
  const getSolutionSnapshot = () => ({
    id: profile.id,
    channelProfileId: profile.channelProfileId,
    capabilityPackageIds: [...profile.capabilityPackageIds]
  });

  /**
   * <lang><zh-CN>返回 dependency-first 的 capability availability metadata 副本。</zh-CN><en>Returns dependency-first copy of capability-availability metadata.</en></lang>
   *
   * @returns {object[]} <lang><zh-CN>只含 stable ID 与 available state 的新数组。</zh-CN><en>New array containing only stable IDs and available state.</en></lang>
   * @lang zh-CN 每项都新建，调用方 mutation 不会影响后续查询。
   * @lang en Every item is new, so caller mutation cannot affect later query.
   */
  const getCapabilitySnapshot = () => capabilitySnapshots.map((snapshot) => ({
    id: snapshot.id,
    state: snapshot.state
  }));

  /**
   * <lang><zh-CN>返回 dependency-first 的必需业务 module ID 副本。</zh-CN><en>Returns dependency-first copy of required business-module IDs.</en></lang>
   *
   * @returns {string[]} <lang><zh-CN>新 module ID 数组。</zh-CN><en>New module-ID array.</en></lang>
   * @lang zh-CN ID 只用于与既有显式 template/adoption candidate 对应，不构造 module/provider。
   * @lang en IDs are used only to correspond to existing explicit template/adoption candidate and construct no module/provider.
   */
  const getRequiredModuleIds = () => [...requiredModuleIds];

  /**
   * <lang><zh-CN>判断一个稳定 capability package ID 是否属于当前 available closure。</zh-CN><en>Determines whether a stable capability-package ID belongs to current available closure.</en></lang>
   *
   * @param {unknown} packageId <lang><zh-CN>待检查 package ID。</zh-CN><en>Package ID to inspect.</en></lang>
   * @returns {boolean} <lang><zh-CN>已解析可用时为 true。</zh-CN><en>True when resolved as available.</en></lang>
   * @lang zh-CN 未知值只返回 false，不能触发 package discovery、import 或 session 访问。
   * @lang en Unknown value returns only false and cannot trigger package discovery, import, or session access.
   */
  const isCapabilityAvailable = (packageId) => (
    typeof packageId === 'string' && availablePackageIds.has(packageId)
  );

  // <lang><zh-CN>冻结 API 外壳；其中不含 registry、grant Set、session、profile 原对象或 descriptor 引用。</zh-CN><en>Freeze API envelope; it contains no registry, grant set, session, original profile object, or descriptor reference.</en></lang>
  return Object.freeze({
    ok: true,
    diagnostics: [],
    getSolutionSnapshot,
    getCapabilitySnapshot,
    getRequiredModuleIds,
    isCapabilityAvailable
  });
}

/**
 * <lang><zh-CN>创建一个可重复 resolve 的纯 solution-profile runtime。</zh-CN><en>Creates a pure solution-profile runtime that can resolve repeatedly.</en></lang>
 *
 * @param {unknown} options <lang><zh-CN>显式 channel allowlist 与 capability package registry。</zh-CN><en>Explicit channel allowlist and capability-package registry.</en></lang>
 * @returns {object} <lang><zh-CN>只含 pure resolve 的冻结 runtime。</zh-CN><en>Frozen runtime containing only pure resolve.</en></lang>
 * @lang zh-CN 创建阶段仅校验/copy host metadata；resolve 不读取文件、网络、环境、storage 或 provider，也不改变输入。
 * @lang en Creation validates and copies host metadata only; resolve reads no file, network, environment, storage, or provider and mutates no input.
 */
export function createSolutionProfileRuntime(options) {
  // <lang><zh-CN>先完全隔离 host options，使每次 resolve 都使用一致的内部配置。</zh-CN><en>Fully isolate host options first so every resolve uses consistent internal configuration.</en></lang>
  const configuration = createRuntimeConfiguration(options);

  /**
   * <lang><zh-CN>在当前静态 registry 与 anonymous mock session 下解析一个 solution profile。</zh-CN><en>Resolves one solution profile under current static registry and anonymous mock session.</en></lang>
   *
   * @param {unknown} profile <lang><zh-CN>调用方提供的候选 solution profile。</zh-CN><en>Candidate solution profile supplied by caller.</en></lang>
   * @param {unknown} session <lang><zh-CN>调用方提供的候选 anonymous mock session。</zh-CN><en>Candidate anonymous mock session supplied by caller.</en></lang>
   * @returns {object} <lang><zh-CN>失败时只含 diagnostics；成功时只含脱敏 availability 查询。</zh-CN><en>On failure contains only diagnostics; on success contains only redacted availability queries.</en></lang>
   * @lang zh-CN 配置/profile/session/grant 任一失败均先于 closure 外的 app/template/provider 创建；函数不执行任意输入。
   * @lang en Any configuration, profile, session, or grant failure precedes app/template/provider creation outside closure; function executes no arbitrary input.
   */
  const resolve = (profile, session) => {
    // <lang><zh-CN>无效 host 配置直接返回稳定 failure；不读取本次 profile/session，避免把它们混入 registry diagnostic。</zh-CN><en>Return stable failure directly for invalid host configuration; read neither current profile nor session, avoiding mixing them into registry diagnostic.</en></lang>
    if (configuration.diagnostics.length > 0) {
      return createFailure(configuration.diagnostics);
    }

    // <lang><zh-CN>profile 在 session 之前校验，非法 selection 不能触及 grant 集合。</zh-CN><en>Validate profile before session so invalid selection cannot touch grant set.</en></lang>
    const profileValidation = validateSolutionProfile(
      profile,
      configuration.channelProfileIds,
      configuration.registryById
    );
    if (!profileValidation.ok) {
      return createFailure(profileValidation.diagnostics);
    }

    // <lang><zh-CN>只有合法 profile 才校验 session；失败不形成任何 partial capability availability。</zh-CN><en>Validate session only for a valid profile; failure forms no partial capability availability.</en></lang>
    const sessionValidation = validateAnonymousMockSession(session);
    if (!sessionValidation.ok) {
      return createFailure(sessionValidation.diagnostics);
    }

    // <lang><zh-CN>以 dependency-first 计算 closure；registry 已无未知依赖或 cycle，因此该步骤纯且确定。</zh-CN><en>Compute closure dependency-first; registry has no unknown dependency or cycle, so this step is pure and deterministic.</en></lang>
    const closure = resolveCapabilityClosure(
      profileValidation.profile.capabilityPackageIds,
      configuration.registryById
    );

    // <lang><zh-CN>每个 closure package 的所有 required grant 都必须存在；缺失时不返回部分可用 package/module。</zh-CN><en>Every required grant of each closure package must exist; when missing return no partial available package or module.</en></lang>
    const hasMissingGrant = closure.some((descriptor) => (
      descriptor.requiredGrantIds.some(
        (grantId) => !sessionValidation.grantIds.has(grantId)
      )
    ));
    if (hasMissingGrant) {
      return createFailure([createDiagnostic(
        'solution-profile.session.grants-missing',
        'anonymous mock session 缺少所选 capability 所需 grant。',
        'The anonymous mock session lacks a grant required by selected capability.'
      )]);
    }

    // <lang><zh-CN>所有 capability 仅在完整 closure/grant 成功后同时标记 available。</zh-CN><en>Mark all capabilities available together only after complete closure and grants succeed.</en></lang>
    return createSuccess(profileValidation.profile, closure);
  };

  // <lang><zh-CN>冻结 runtime API，调用方不能替换 resolver 或写入隐藏选项。</zh-CN><en>Freeze runtime API so callers cannot replace resolver or write hidden options.</en></lang>
  return Object.freeze({ resolve });
}
