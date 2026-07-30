/**
 * <lang><zh-CN>HIA-uView-Biz 的纯应用 shell：把已装配 composition、声明式 route projection 与 mock capability 投影为可观察页面状态，不拥有 Vue、UniApp、传输、存储或真实身份。</zh-CN><en>The pure HIA-uView-Biz application shell: projects an assembled composition, declarative route projection, and mock capabilities into observable page state and owns no Vue, UniApp, transport, storage, or real identity.</en></lang>
 * @lang zh-CN 本模块不读取文件、环境变量、网络、全局 router 或 UI registry；宿主必须显式传入已验证的运行时对象。
 * @lang en This module reads no file, environment variable, network, global router, or UI registry; a host must explicitly provide validated runtime objects.
 */

/**
 * <lang><zh-CN>当前 shell 支持的唯一状态与失败契约版本。</zh-CN><en>The sole state and failure contract version supported by the current shell.</en></lang>
 * @lang zh-CN 该常量表示当前最小可运行表面，不构成发布版本、身份协议或跨版本兼容承诺。
 * @lang en This constant denotes the current smallest runnable surface and is not a release version, identity protocol, or cross-version compatibility promise.
 */
export const APP_SHELL_CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>构造不包含调用方输入或身份细节的稳定双语诊断。</zh-CN><en>Constructs a stable bilingual diagnostic that includes neither caller input nor identity details.</en></lang>
 * @param {string} code <lang><zh-CN>供程序分支使用的稳定代码。</zh-CN><en>Stable code for programmatic branching.</en></lang>
 * @param {string} zhHans <lang><zh-CN>面向 `zh-Hans` 呈现层的中文文案。</zh-CN><en>Chinese copy for a `zh-Hans` presentation layer.</en></lang>
 * @param {string} en <lang><zh-CN>面向英文呈现层的英文文案。</zh-CN><en>English copy for an English presentation layer.</en></lang>
 * @returns {{code: string, message: {'zh-Hans': string, en: string}}} <lang><zh-CN>不携带原始值的诊断。</zh-CN><en>Diagnostic that carries no raw values.</en></lang>
 * @lang zh-CN shell 初始化失败必须可由 app 记录和呈现，但不得把 route、session 或 caller payload 原样扩散。
 * @lang en Shell initialization failures must be recordable and presentable by an app but must not spread route, session, or caller payload verbatim.
 */
function createDiagnostic(code, zhHans, en) {
  // <lang><zh-CN>返回新的 plain-data 对象，避免多个初始化结果共享可变 message 容器。</zh-CN><en>Return a new plain-data object, avoiding multiple initialization results that share a mutable message container.</en></lang>
  return {
    code,
    message: {
      'zh-Hans': zhHans,
      en
    }
  };
}

/**
 * <lang><zh-CN>构造符合 Biz canonical failure 外形的 shell 失败。</zh-CN><en>Constructs a shell failure matching the Biz canonical-failure shape.</en></lang>
 * @param {string} code <lang><zh-CN>稳定失败代码。</zh-CN><en>Stable failure code.</en></lang>
 * @param {string} zhHans <lang><zh-CN>中文失败文案。</zh-CN><en>Chinese failure copy.</en></lang>
 * @param {string} en <lang><zh-CN>英文失败文案。</zh-CN><en>English failure copy.</en></lang>
 * @param {boolean} retryable <lang><zh-CN>调用方是否可以通过显式 retry 重放最后命令。</zh-CN><en>Whether a caller may replay the last command through explicit retry.</en></lang>
 * @param {'request'|'session'} scope <lang><zh-CN>失败作用域。</zh-CN><en>Failure scope.</en></lang>
 * @returns {{contractVersion: string, kind: 'failure', code: string, message: {'zh-Hans': string, en: string}, retryable: boolean, scope: 'request'|'session'}} <lang><zh-CN>可由 app 安全呈现的失败。</zh-CN><en>Failure safe for application presentation.</en></lang>
 * @lang zh-CN shell 只为自身 route/input/capability 边界创建失败；adapter 与 module 的失败保持原样。
 * @lang en The shell creates failures only for its own route, input, and capability boundaries; adapter and module failures remain unchanged.
 */
function createFailure(code, zhHans, en, retryable, scope) {
  // <lang><zh-CN>使用既有 canonical failure contract 一致的最小字段，使 app 无需为 shell 再引入另一种错误 envelope。</zh-CN><en>Use the minimum fields consistent with the existing canonical-failure contract so an app need not introduce a second error envelope for the shell.</en></lang>
  return {
    contractVersion: APP_SHELL_CONTRACT_VERSION,
    kind: 'failure',
    code,
    message: {
      'zh-Hans': zhHans,
      en
    },
    retryable,
    scope
  };
}

/**
 * <lang><zh-CN>判断值是否为可安全读取自身字段的非数组对象。</zh-CN><en>Determines whether a value is a non-array object whose own fields can be read safely.</en></lang>
 * @param {unknown} value <lang><zh-CN>待判断的值。</zh-CN><en>Value to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否可作为声明或 canonical result 容器。</zh-CN><en>Whether the value can act as a declaration or canonical-result container.</en></lang>
 * @lang zh-CN shell 不接受数组、null 或 primitive 充当 composition、route projection 或 policy 容器。
 * @lang en The shell accepts no array, null, or primitive as a composition, route-projection, or policy container.
 */
function isRecord(value) {
  // <lang><zh-CN>显式排除 null 与数组，避免其在字段读取时伪装为普通声明对象。</zh-CN><en>Explicitly exclude null and arrays so field reads cannot mistake them for ordinary declaration objects.</en></lang>
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * <lang><zh-CN>判断字符串是否可作为已声明的稳定 identifier。</zh-CN><en>Determines whether a string can act as a declared stable identifier.</en></lang>
 * @param {unknown} value <lang><zh-CN>待判断值。</zh-CN><en>Value to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否为非空白字符串。</zh-CN><en>Whether the value is a non-whitespace string.</en></lang>
 * @lang zh-CN 此处只验证最小运行时形状；完整 identifier pattern 仍由相邻 JSON Schema/contract 负责。
 * @lang en This verifies only the minimum runtime shape; the adjacent JSON Schema or contract still owns the full identifier pattern.
 */
function isIdentifier(value) {
  // <lang><zh-CN>trim 长度拒绝空字符串和只含空白的输入，防止它们成为 route/policy 键。</zh-CN><en>The trimmed length rejects empty and whitespace-only input, preventing either from becoming a route or policy key.</en></lang>
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * <lang><zh-CN>复制只包含 plain data 的 shell 状态或 canonical result。</zh-CN><en>Copies shell state or canonical result containing plain data only.</en></lang>
 * @param {unknown} value <lang><zh-CN>需要与内部状态隔离的值。</zh-CN><en>Value that must be isolated from internal state.</en></lang>
 * @returns {unknown} <lang><zh-CN>不会共享可变 array/object 容器的副本。</zh-CN><en>Copy that shares no mutable array or object container.</en></lang>
 * @lang zh-CN shell contract 只处理 JSON-like data；本 helper 不调用 getter、不克隆函数，也不序列化未声明对象。
 * @lang en The shell contract handles JSON-like data only; this helper calls no getter, clones no function, and serializes no undeclared object.
 */
function cloneData(value) {
  // <lang><zh-CN>数组按元素递归复制，避免 snapshot 调用方改写 entries、sections 或 capability 列表。</zh-CN><en>Copy arrays recursively by item so a snapshot caller cannot rewrite entries, sections, or capability lists.</en></lang>
  if (Array.isArray(value)) {
    // <lang><zh-CN>map 返回新数组；每个 item 继续遵守 plain-data 克隆边界。</zh-CN><en>Map returns a new array; every item continues to obey the plain-data cloning boundary.</en></lang>
    return value.map((item) => cloneData(item));
  }

  // <lang><zh-CN>普通对象逐个 own entry 复制；shell 自己创建/接收的 contract 数据不依赖 prototype 行为。</zh-CN><en>Copy ordinary objects by own entry; contract data created or received by the shell relies on no prototype behavior.</en></lang>
  if (isRecord(value)) {
    // <lang><zh-CN>新对象只保存递归复制字段，保持外部 mutation 不会回流到内部 state。</zh-CN><en>The new object stores only recursively copied fields, keeping external mutation from flowing back into internal state.</en></lang>
    const copiedRecord = {};

    // <lang><zh-CN>遍历 own enumerable entries，不读取原型、getter 或环境信息。</zh-CN><en>Iterate own enumerable entries and read no prototype, getter, or environment information.</en></lang>
    for (const [key, nestedValue] of Object.entries(value)) {
      // <lang><zh-CN>逐字段复制 nested plain data，保留 contract 中的稳定标识和值。</zh-CN><en>Copy nested plain data field by field, preserving stable identifiers and values in the contract.</en></lang>
      copiedRecord[key] = cloneData(nestedValue);
    }

    // <lang><zh-CN>完成对象复制后返回，避免落入 primitive 分支。</zh-CN><en>Return after completing the object copy, avoiding fall-through to the primitive branch.</en></lang>
    return copiedRecord;
  }

  // <lang><zh-CN>primitive 没有可变容器，按值返回即可。</zh-CN><en>Primitives have no mutable container and can be returned by value.</en></lang>
  return value;
}

/**
 * <lang><zh-CN>校验 route projection 的最小 screen/action 关系并收集可安全呈现的 diagnostics。</zh-CN><en>Validates minimum screen and action relationships of a route projection and collects diagnostics safe for presentation.</en></lang>
 * @param {unknown} routeProjection <lang><zh-CN>调用方显式提供的 projection。</zh-CN><en>Projection explicitly provided by the caller.</en></lang>
 * @param {Array<object>} diagnostics <lang><zh-CN>要追加的初始化问题列表。</zh-CN><en>Initialization-issue list to append to.</en></lang>
 * @returns {{screensById: Map<string, object>, actionsById: Map<string, object>, catalogScreenId: string|null}} <lang><zh-CN>已验证索引与目录 screen ID。</zh-CN><en>Validated indexes and catalog screen ID.</en></lang>
 * @lang zh-CN projection 不含 URL、组件 import 或 host router；此函数只接受静态 ID 关系。
 * @lang en Projection contains no URL, component import, or host router; this function accepts only static ID relationships.
 */
function validateRouteProjection(routeProjection, diagnostics) {
  // <lang><zh-CN>screen index 让 action/policy 校验按稳定 ID 查找，而不依赖数组位置。</zh-CN><en>The screen index lets action and policy validation look up stable IDs rather than depend on array position.</en></lang>
  const screensById = new Map();

  // <lang><zh-CN>action index 同样按 ID 建立，未知 action 不会回退到动态路由逻辑。</zh-CN><en>The action index is likewise built by ID, and unknown actions never fall back to dynamic routing logic.</en></lang>
  const actionsById = new Map();

  // <lang><zh-CN>catalog screen 初始为空，随后只由 intent 为 catalog 的已声明 screen 填充。</zh-CN><en>The catalog screen starts empty and is filled only by a declared screen whose intent is catalog.</en></lang>
  let catalogScreenId = null;

  // <lang><zh-CN>非对象 projection 无法安全读取 screens/actions，记录一个根级 diagnostic 后返回空索引。</zh-CN><en>A non-object projection cannot safely expose screens or actions, so record one root diagnostic and return empty indexes.</en></lang>
  if (!isRecord(routeProjection)) {
    // <lang><zh-CN>根级 diagnostic 不回显调用方输入，避免不可信 route 内容进入日志或 UI。</zh-CN><en>The root diagnostic does not echo caller input, preventing untrusted route content from entering logs or UI.</en></lang>
    diagnostics.push(createDiagnostic('shell.route-projection.invalid', 'route projection 必须是对象。', 'Route projection must be an object.'));
    return { screensById, actionsById, catalogScreenId };
  }

  // <lang><zh-CN>screens 必须是数组；缺失时无法定义初始 screen 或 action 端点。</zh-CN><en>Screens must be an array; without it no initial screen or action endpoint can be defined.</en></lang>
  if (!Array.isArray(routeProjection.screens)) {
    // <lang><zh-CN>将容器错误单独报告，使调用方不会误把问题修到单个 action。</zh-CN><en>Report the container error separately so callers do not mistakenly repair an individual action.</en></lang>
    diagnostics.push(createDiagnostic('shell.route-projection.screens.invalid', 'route projection 的 screens 必须是数组。', 'Route-projection screens must be an array.'));
  } else {
    // <lang><zh-CN>逐个 screen 建立 ID index，并确认唯一、静态的 intent/screenId 关系。</zh-CN><en>Index each screen by ID and confirm unique static intent and screen-ID relationships.</en></lang>
    for (const screen of routeProjection.screens) {
      // <lang><zh-CN>screen 必须提供可读 intent 和 screenId；未知对象不能成为导航目的地。</zh-CN><en>A screen must provide readable intent and screenId; an unknown object cannot become a navigation destination.</en></lang>
      if (!isRecord(screen) || !isIdentifier(screen.intent) || !isIdentifier(screen.screenId)) {
        // <lang><zh-CN>无效 screen 不进入 index，防止后续 policy/action 基于不完整定义继续运行。</zh-CN><en>An invalid screen does not enter the index, preventing later policy or action processing from using an incomplete definition.</en></lang>
        diagnostics.push(createDiagnostic('shell.route-projection.screen.invalid', 'route projection 含有无效 screen。', 'Route projection contains an invalid screen.'));
        continue;
      }

      // <lang><zh-CN>重复 screen ID 会使 policy/action 指向不确定，必须在初始化时拒绝。</zh-CN><en>A duplicate screen ID makes policy or action targets ambiguous and must be rejected during initialization.</en></lang>
      if (screensById.has(screen.screenId)) {
        // <lang><zh-CN>重复 diagnostic 不包含具体输入值，稳定代码已足以让 contract 测试定位问题类别。</zh-CN><en>The duplicate diagnostic includes no concrete input value; the stable code already lets contract tests locate the problem class.</en></lang>
        diagnostics.push(createDiagnostic('shell.route-projection.screen.duplicate', 'route projection 含有重复 screen ID。', 'Route projection contains a duplicate screen ID.'));
        continue;
      }

      // <lang><zh-CN>保存 screen 的数据副本，避免调用方随后修改 routeProjection 改变 shell 允许的目的地。</zh-CN><en>Store a data copy of the screen, preventing later caller mutation of routeProjection from changing shell-allowed destinations.</en></lang>
      screensById.set(screen.screenId, cloneData(screen));

      // <lang><zh-CN>catalog intent 只允许一个初始 screen；多个候选会让 shell 初始状态不可预测。</zh-CN><en>Catalog intent permits only one initial screen; multiple candidates would make shell initial state unpredictable.</en></lang>
      if (screen.intent === 'catalog') {
        // <lang><zh-CN>已存在 catalog screen 时记录冲突；仍保留最先声明的 screen 供后续诊断完整返回。</zh-CN><en>When a catalog screen already exists, record conflict while retaining the first declared screen for a complete later diagnostic return.</en></lang>
        if (catalogScreenId !== null) {
          diagnostics.push(createDiagnostic('shell.route-projection.catalog.duplicate', 'route projection 只能声明一个 catalog screen。', 'Route projection may declare only one catalog screen.'));
        } else {
          // <lang><zh-CN>首个 catalog screen 成为 shell 的唯一初始 screen ID。</zh-CN><en>The first catalog screen becomes the shell's sole initial screen ID.</en></lang>
          catalogScreenId = screen.screenId;
        }
      }
    }
  }

  // <lang><zh-CN>未声明 catalog screen 时不能创建 shell，因为没有安全的初始导航状态。</zh-CN><en>Without a declared catalog screen the shell cannot be created because it has no safe initial navigation state.</en></lang>
  if (catalogScreenId === null) {
    diagnostics.push(createDiagnostic('shell.route-projection.catalog.missing', 'route projection 必须声明一个 catalog screen。', 'Route projection must declare one catalog screen.'));
  }

  // <lang><zh-CN>actions 必须是数组；缺失动作时 shell 仍可 query，但无法声明从目录到详情的转换。</zh-CN><en>Actions must be an array; without actions shell may still query but cannot declare a catalog-to-detail transition.</en></lang>
  if (!Array.isArray(routeProjection.actions)) {
    diagnostics.push(createDiagnostic('shell.route-projection.actions.invalid', 'route projection 的 actions 必须是数组。', 'Route-projection actions must be an array.'));
  } else {
    // <lang><zh-CN>逐个 action 校验 ID、from 与 to，且端点必须是先前登记的 screen。</zh-CN><en>Validate every action ID, from, and to, and require endpoints to be previously registered screens.</en></lang>
    for (const action of routeProjection.actions) {
      // <lang><zh-CN>无效 action 不进入 index，避免任意对象在运行时触发 state change。</zh-CN><en>An invalid action does not enter the index, preventing an arbitrary object from triggering state change at runtime.</en></lang>
      if (!isRecord(action) || !isIdentifier(action.id) || !isIdentifier(action.from) || !isIdentifier(action.to)) {
        diagnostics.push(createDiagnostic('shell.route-projection.action.invalid', 'route projection 含有无效 action。', 'Route projection contains an invalid action.'));
        continue;
      }

      // <lang><zh-CN>重复 action ID 与未知端点都破坏声明式导航的可审计性，必须拒绝。</zh-CN><en>Duplicate action IDs and unknown endpoints both break auditable declarative navigation and must be rejected.</en></lang>
      if (actionsById.has(action.id) || !screensById.has(action.from) || !screensById.has(action.to)) {
        diagnostics.push(createDiagnostic('shell.route-projection.action.relation.invalid', 'route action 的 ID 或 screen 关系无效。', 'A route action has an invalid ID or screen relationship.'));
        continue;
      }

      // <lang><zh-CN>保存 action 副本，防止 host 修改原始 projection 后改变 shell 状态转换。</zh-CN><en>Store an action copy, preventing host mutation of original projection from changing shell state transitions.</en></lang>
      actionsById.set(action.id, cloneData(action));
    }
  }

  // <lang><zh-CN>返回索引与初始 screen；调用方根据 diagnostics 决定是否可创建 shell。</zh-CN><en>Return indexes and initial screen; caller decides from diagnostics whether a shell may be created.</en></lang>
  return { screensById, actionsById, catalogScreenId };
}

/**
 * <lang><zh-CN>校验 screen capability policy 只引用已登记 screen 和稳定 capability 字符串。</zh-CN><en>Validates that a screen-capability policy references only registered screens and stable capability strings.</en></lang>
 * @param {unknown} policy <lang><zh-CN>调用方声明的 policy。</zh-CN><en>Caller-declared policy.</en></lang>
 * @param {Map<string, object>} screensById <lang><zh-CN>route projection 已验证的 screen index。</zh-CN><en>Validated screen index of the route projection.</en></lang>
 * @param {Array<object>} diagnostics <lang><zh-CN>要追加的初始化 diagnostics。</zh-CN><en>Initialization diagnostics to append.</en></lang>
 * @returns {Map<string, string[]>} <lang><zh-CN>复制后的 policy index。</zh-CN><en>Copied policy index.</en></lang>
 * @lang zh-CN policy 只声明 capability allowlist；它不执行脚本、表达式、角色继承或账户查询。
 * @lang en Policy declares only capability allowlists; it executes no script, expression, role inheritance, or account lookup.
 */
function validateScreenCapabilityPolicy(policy, screensById, diagnostics) {
  // <lang><zh-CN>policy index 按 screen ID 保存复制后的 capability 数组，避免 caller mutation 改变运行时授权。</zh-CN><en>The policy index stores copied capability arrays by screen ID, preventing caller mutation from changing runtime authorization.</en></lang>
  const capabilitiesByScreenId = new Map();

  // <lang><zh-CN>policy 不是对象时拒绝；shell 不补默认或推断真实身份规则。</zh-CN><en>Reject a non-object policy; shell supplies no default and infers no real identity rule.</en></lang>
  if (!isRecord(policy)) {
    diagnostics.push(createDiagnostic('shell.policy.invalid', 'screen capability policy 必须是对象。', 'Screen-capability policy must be an object.'));
    return capabilitiesByScreenId;
  }

  // <lang><zh-CN>逐条读取 own policy entry，避免 prototype 赋予未声明 screen capability。</zh-CN><en>Read own policy entries one by one, preventing prototypes from granting capability to undeclared screens.</en></lang>
  for (const [screenId, capabilities] of Object.entries(policy)) {
    // <lang><zh-CN>未知 screen policy 不能被静默忽略，否则配置拼写错误会降低实际保护。</zh-CN><en>An unknown screen policy cannot be silently ignored because a configuration typo would weaken actual protection.</en></lang>
    if (!screensById.has(screenId)) {
      diagnostics.push(createDiagnostic('shell.policy.screen.unknown', 'screen capability policy 引用了未登记 screen。', 'Screen-capability policy references an unregistered screen.'));
      continue;
    }

    // <lang><zh-CN>每个 screen 的 capability 必须是字符串数组；shell 不接受 role object、函数或动态条件。</zh-CN><en>Every screen's capabilities must be a string array; shell accepts no role object, function, or dynamic condition.</en></lang>
    if (!Array.isArray(capabilities) || capabilities.some((capability) => !isIdentifier(capability))) {
      diagnostics.push(createDiagnostic('shell.policy.capabilities.invalid', 'screen capability policy 含有无效 capability 列表。', 'Screen-capability policy contains an invalid capability list.'));
      continue;
    }

    // <lang><zh-CN>复制 capability 列表，使 host 对原始数组的后续修改不影响 shell。</zh-CN><en>Copy the capability list so later host mutation of the original array cannot affect shell behavior.</en></lang>
    capabilitiesByScreenId.set(screenId, [...capabilities]);
  }

  // <lang><zh-CN>每个已登记 screen 都必须具有显式 policy entry，避免遗漏被解释为隐式公开或隐式拒绝。</zh-CN><en>Every registered screen must have an explicit policy entry, preventing an omission from becoming implicit public access or implicit denial.</en></lang>
  for (const screenId of screensById.keys()) {
    // <lang><zh-CN>缺失 entry 以稳定 diagnostic 拒绝，调用方必须明确写出空数组或要求 capability。</zh-CN><en>Reject a missing entry with a stable diagnostic; callers must explicitly write an empty array or require a capability.</en></lang>
    if (!capabilitiesByScreenId.has(screenId)) {
      diagnostics.push(createDiagnostic('shell.policy.screen.missing', 'screen capability policy 缺少已登记 screen。', 'Screen-capability policy is missing a registered screen.'));
    }
  }

  // <lang><zh-CN>返回已复制 index，供成功 shell 的每次导航 capability gate 使用。</zh-CN><en>Return the copied index for capability gates on every navigation of a successful shell.</en></lang>
  return capabilitiesByScreenId;
}

/**
 * <lang><zh-CN>从 composition 的 mock session port 读取 capability，并判断目标 screen 是否允许。</zh-CN><en>Reads capabilities from a composition's mock session port and determines whether a target screen is allowed.</en></lang>
 * @param {object} composition <lang><zh-CN>已验证的 Biz composition。</zh-CN><en>Validated Biz composition.</en></lang>
 * @param {string} screenId <lang><zh-CN>准备进入的已登记 screen ID。</zh-CN><en>Registered screen ID about to be entered.</en></lang>
 * @param {Map<string, string[]>} capabilitiesByScreenId <lang><zh-CN>复制后的声明 policy。</zh-CN><en>Copied declarative policy.</en></lang>
 * @returns {object|null} <lang><zh-CN>拒绝时的 session failure；允许时为 null。</zh-CN><en>Session failure on denial; null when allowed.</en></lang>
 * @lang zh-CN 此函数每次导航都重新读取 mock session，避免把一次读取误写成真实身份或持久缓存。
 * @lang en This function rereads mock session on every navigation, avoiding a single read that would be misrepresented as real identity or persisted cache.
 */
function getCapabilityDenial(composition, screenId, capabilitiesByScreenId) {
  // <lang><zh-CN>目标 screen 的 requirement 已在初始化中复制；缺失 entry 不应到达成功 shell。</zh-CN><en>The target screen's requirement was copied during initialization; a missing entry must not reach a successful shell.</en></lang>
  const requiredCapabilities = capabilitiesByScreenId.get(screenId) ?? [];

  // <lang><zh-CN>无需 capability 时直接允许，且不读取 session port，保持匿名目录路径最小。</zh-CN><en>Allow immediately when no capability is required and do not read the session port, keeping the anonymous catalog path minimal.</en></lang>
  if (requiredCapabilities.length === 0) {
    return null;
  }

  // <lang><zh-CN>通过已登记 composition port 取得 mock session；shell 不读取 header、token、cookie 或 storage。</zh-CN><en>Obtain mock session through a registered composition port; shell reads no header, token, cookie, or storage.</en></lang>
  const session = composition.invoke('session-state', undefined);

  // <lang><zh-CN>可用 capability 只接受字符串数组；畸形 session 视为不具备 capability 而不暴露其原始内容。</zh-CN><en>Accept available capabilities only as a string array; treat malformed session as lacking capability without exposing its raw content.</en></lang>
  const availableCapabilities = isRecord(session) && Array.isArray(session.capabilities) ? session.capabilities.filter((capability) => isIdentifier(capability)) : [];

  // <lang><zh-CN>找到第一个未满足 requirement 即拒绝；结果不回显 capability 名称，避免把 policy 细节当作 UI 文案。</zh-CN><en>Reject on the first unmet requirement; result does not echo capability names, avoiding policy detail presented as UI copy.</en></lang>
  const missingCapability = requiredCapabilities.find((capability) => !availableCapabilities.includes(capability));

  // <lang><zh-CN>有缺失 capability 时返回公开 contract 已定义的 session scope failure。</zh-CN><en>Return the session-scope failure defined by the public contract when a capability is missing.</en></lang>
  if (missingCapability !== undefined) {
    return createFailure('session-not-capable', '当前 mock session 不具备进入该页面所需的声明 capability。', 'The current mock session lacks a declared capability required to enter this screen.', false, 'session');
  }

  // <lang><zh-CN>所有 requirement 已满足时返回 null，允许后续 route 或 provider 行为继续。</zh-CN><en>Return null when every requirement is met, allowing subsequent route or provider behavior to continue.</en></lang>
  return null;
}

/**
 * <lang><zh-CN>创建声明式应用 shell，并返回结构化初始化结果。</zh-CN><en>Creates a declarative application shell and returns a structured initialization result.</en></lang>
 * @param {{composition: object, routeProjection: object, screenCapabilityPolicy: Record<string, string[]>}} input <lang><zh-CN>显式 composition、route projection 与 screen policy。</zh-CN><en>Explicit composition, route projection, and screen policy.</en></lang>
 * @returns {object} <lang><zh-CN>成功时包含 shell；失败时只包含安全 diagnostics。</zh-CN><en>Contains shell on success and only safe diagnostics on failure.</en></lang>
 * @lang zh-CN 创建过程不调用 query/detail port；它只校验可运行状态边界，避免初始化产生业务数据读取副作用。
 * @lang en Creation invokes no query or detail port; it validates only runnable state boundaries, avoiding business-data read side effects during initialization.
 */
export function createApplicationShell(input) {
  // <lang><zh-CN>每次创建维护独立 diagnostics，防止不同 host 之间共享或清空初始化错误。</zh-CN><en>Maintain independent diagnostics on every creation, preventing hosts from sharing or clearing initialization errors.</en></lang>
  const diagnostics = [];

  // <lang><zh-CN>非对象 input 无法可靠解构，返回单一根级 diagnostic 而不是抛出 TypeError。</zh-CN><en>A non-object input cannot be reliably destructured, so return one root diagnostic rather than throw TypeError.</en></lang>
  if (!isRecord(input)) {
    return {
      ok: false,
      diagnostics: [createDiagnostic('shell.input.invalid', '应用 shell 输入必须是对象。', 'Application-shell input must be an object.')]
    };
  }

  // <lang><zh-CN>composition 仅需已声明 invoke 函数；其 manifest/port 关系已由既有 core 在装配时负责。</zh-CN><en>Composition requires only a declared invoke function here; the existing core owns manifest and port relationships during assembly.</en></lang>
  const composition = input.composition;

  // <lang><zh-CN>缺失 composition 会使 shell 无法调用已登记 port，必须在创建时拒绝。</zh-CN><en>A missing composition leaves shell unable to invoke registered ports and must be rejected during creation.</en></lang>
  if (!isRecord(composition) || typeof composition.invoke !== 'function') {
    diagnostics.push(createDiagnostic('shell.composition.invalid', '应用 shell 需要具有 invoke(portId, input) 的 composition。', 'Application shell requires a composition exposing invoke(portId, input).'));
  }

  // <lang><zh-CN>route projection 的静态关系会被复制为内部 index；它不被视为 host router 配置。</zh-CN><en>Static route-projection relationships are copied into internal indexes and are not treated as host-router configuration.</en></lang>
  const route = validateRouteProjection(input.routeProjection, diagnostics);

  // <lang><zh-CN>screen policy 在已验证 route index 上检查，确保未知 screen 不能借 policy 进入 shell。</zh-CN><en>Check screen policy against validated route index, ensuring an unknown screen cannot enter shell through policy.</en></lang>
  const capabilitiesByScreenId = validateScreenCapabilityPolicy(input.screenCapabilityPolicy, route.screensById, diagnostics);

  // <lang><zh-CN>任一诊断存在时不创建 partial shell，避免调用方获得可执行但不完整的导航表面。</zh-CN><en>Do not create a partial shell when any diagnostic exists, avoiding callers that receive an executable but incomplete navigation surface.</en></lang>
  if (diagnostics.length > 0) {
    return { ok: false, diagnostics };
  }

  // <lang><zh-CN>内部状态只保存 presentation projection；它不保存 session、route 原对象、provider 或未声明业务输入。</zh-CN><en>Internal state stores only presentation projection and stores no session, original route object, provider, or undeclared business input.</en></lang>
  const state = {
    screenId: route.catalogScreenId,
    selectedEntryId: null,
    page: null,
    detail: null,
    failure: null,
    retryCommand: null
  };

  /**
   * <lang><zh-CN>返回与内部可变 state 隔离的 snapshot。</zh-CN><en>Returns a snapshot isolated from mutable internal state.</en></lang>
   * @returns {{contractVersion: string, screenId: string, selectedEntryId: string|null, page: object|null, detail: object|null, failure: object|null}} <lang><zh-CN>当前安全呈现输入。</zh-CN><en>Current safe presentation input.</en></lang>
   * @lang zh-CN snapshot 不暴露 provider、session、policy、route 原对象或 retry payload，避免 app 获得隐式控制面。
   * @lang en Snapshot exposes no provider, session, policy, original route object, or retry payload, preventing app from receiving an implicit control surface.
   */
  function getSnapshot() {
    // <lang><zh-CN>复制所有可呈现 data，防止 Vue/UI 调用方改变返回对象后污染下一次 shell 观察。</zh-CN><en>Copy all presentable data, preventing a Vue or UI caller from polluting the next shell observation by changing returned objects.</en></lang>
    return {
      contractVersion: APP_SHELL_CONTRACT_VERSION,
      screenId: state.screenId,
      selectedEntryId: state.selectedEntryId,
      page: cloneData(state.page),
      detail: cloneData(state.detail),
      failure: cloneData(state.failure)
    };
  }

  /**
   * <lang><zh-CN>保存 shell 最近可重放的 canonical command。</zh-CN><en>Stores the shell's most recent replayable canonical command.</en></lang>
   * @param {object|null} command <lang><zh-CN>成功或 retryable failure 后应保留的命令。</zh-CN><en>Command to retain after success or retryable failure.</en></lang>
   * @returns {void} <lang><zh-CN>无返回值；只更新内部 retry 状态。</zh-CN><en>Returns no value and updates only internal retry state.</en></lang>
   * @lang zh-CN command 只保存 canonical request 或 entry ID，不保存结果、session 或 UI event。
   * @lang en Command stores only canonical request or entry ID and stores no result, session, or UI event.
   */
  function setRetryCommand(command) {
    // <lang><zh-CN>空 command 明确清除 retry，避免上一次失败在新成功结果之后被错误重放。</zh-CN><en>A null command explicitly clears retry, preventing a prior failure from replaying after a new successful result.</en></lang>
    if (command === null) {
      state.retryCommand = null;
      return;
    }

    // <lang><zh-CN>复制 command，防止调用方或局部 request 对象在返回后改写内部 retry 输入。</zh-CN><en>Copy command, preventing a caller or local request object from rewriting internal retry input after return.</en></lang>
    state.retryCommand = cloneData(command);
  }

  /**
   * <lang><zh-CN>将 query 的 canonical page 或 failure 投影到目录 state。</zh-CN><en>Projects a query's canonical page or failure into catalog state.</en></lang>
   * @param {object} result <lang><zh-CN>catalog-query port 的返回值。</zh-CN><en>Return value of the catalog-query port.</en></lang>
   * @param {object} request <lang><zh-CN>已提交给 port 的 canonical query。</zh-CN><en>Canonical query already submitted to the port.</en></lang>
   * @returns {object} <lang><zh-CN>未经 UI 改写的 result 副本。</zh-CN><en>Result copy not rewritten by UI.</en></lang>
   * @lang zh-CN page 是成功，entries 为空仍是成功；failure 只占据顶层失败槽，不伪造 empty page。
   * @lang en Page is success even when entries are empty; failure occupies only the top-level failure slot and does not fabricate an empty page.
   */
  function projectQueryResult(result, request) {
    // <lang><zh-CN>canonical page 保留完整 result，供 app 决定普通列表或 empty state 的呈现。</zh-CN><en>Retain the full canonical page so app can decide ordinary list or empty-state presentation.</en></lang>
    if (isRecord(result) && result.kind === 'page') {
      state.page = cloneData(result);
      state.failure = null;
      setRetryCommand(null);
      return cloneData(result);
    }

    // <lang><zh-CN>非 page 结果只在其为 canonical failure 时占据 failure；畸形 provider 输出也被限制为安全 request failure。</zh-CN><en>A non-page result occupies failure only when it is canonical failure; malformed provider output is constrained to a safe request failure as well.</en></lang>
    const failure = isRecord(result) && result.kind === 'failure'
      ? cloneData(result)
      : createFailure('query-result-invalid', '查询 port 返回了无效结果。', 'The query port returned an invalid result.', false, 'request');

    // <lang><zh-CN>failure 不保留旧 page，避免 UI 把新失败与陈旧结果混合呈现为当前数据。</zh-CN><en>Failure retains no old page, preventing UI from presenting a new failure mixed with stale result as current data.</en></lang>
    state.page = null;
    state.failure = failure;

    // <lang><zh-CN>只有 retryable failure 保存 canonical query，输入错误或畸形结果不能触发自动重放。</zh-CN><en>Only a retryable failure stores canonical query; input error or malformed result cannot trigger replay.</en></lang>
    setRetryCommand(failure.retryable === true ? { kind: 'query', request } : null);
    return cloneData(failure);
  }

  /**
   * <lang><zh-CN>在当前目录 screen 上执行 canonical query。</zh-CN><en>Executes a canonical query on the current catalog screen.</en></lang>
   * @param {object} request <lang><zh-CN>模块拥有的 query 输入。</zh-CN><en>Query input owned by the module.</en></lang>
   * @returns {object} <lang><zh-CN>canonical page 或 failure。</zh-CN><en>Canonical page or failure.</en></lang>
   * @lang zh-CN shell 不解析 filter、不设置默认 page/pageSize，也不把 request 发送到任何 transport。
   * @lang en Shell parses no filter, supplies no default page or pageSize, and sends request to no transport.
   */
  function query(request) {
    // <lang><zh-CN>目录 capability gate 使用 catalog screen policy；若将来 policy 收紧，query 先被拒绝而不调用 provider。</zh-CN><en>The catalog capability gate uses catalog screen policy; if policy tightens later, query is denied before provider invocation.</en></lang>
    const denial = getCapabilityDenial(composition, route.catalogScreenId, capabilitiesByScreenId);

    // <lang><zh-CN>拒绝写入 failure 并清除 retry，避免 capability 错误被误当作 transport 故障重放。</zh-CN><en>Write denial into failure and clear retry, preventing a capability error from replaying as a transport failure.</en></lang>
    if (denial !== null) {
      state.failure = denial;
      setRetryCommand(null);
      return cloneData(denial);
    }

    // <lang><zh-CN>通过显式 composition port 调用模块 query；调用边界不暴露 HTTP、adapter 或 UI 细节。</zh-CN><en>Invoke module query through explicit composition port; invocation boundary exposes no HTTP, adapter, or UI detail.</en></lang>
    const result = composition.invoke('catalog-query', cloneData(request));

    // <lang><zh-CN>将 result 交给统一投影逻辑，保持成功、empty 与 failure 的状态规则一致。</zh-CN><en>Hand result to shared projection logic, keeping state rules consistent for success, empty, and failure.</en></lang>
    return projectQueryResult(result, request);
  }

  /**
   * <lang><zh-CN>在已经允许的 detail screen 上读取一个 canonical entry detail。</zh-CN><en>Reads one canonical entry detail on an already allowed detail screen.</en></lang>
   * @param {string} entryId <lang><zh-CN>来自 canonical page 的 stable entry ID。</zh-CN><en>Stable entry ID from a canonical page.</en></lang>
   * @returns {object} <lang><zh-CN>canonical detail 或 failure。</zh-CN><en>Canonical detail or failure.</en></lang>
   * @lang zh-CN 函数只调用 detail port；route action 与 capability 已由外层分开审核，避免隐式跳转。
   * @lang en The function invokes only detail port; outer layers review route action and capability separately, avoiding implicit navigation.
   */
  function loadDetail(entryId) {
    // <lang><zh-CN>构造最小 canonical detail request，不附加 UI object、route URL 或 session 数据。</zh-CN><en>Construct the minimum canonical detail request and append no UI object, route URL, or session data.</en></lang>
    const request = {
      contractVersion: APP_SHELL_CONTRACT_VERSION,
      entryId
    };

    // <lang><zh-CN>调用已登记 detail port；composition 保证 provider contract 在装配时已被审核。</zh-CN><en>Invoke the registered detail port; composition guarantees provider contract was reviewed during assembly.</en></lang>
    const result = composition.invoke('entry-detail', request);

    // <lang><zh-CN>canonical detail 保留 primary entry/section 状态，并清除顶层 failure。</zh-CN><en>Canonical detail retains primary-entry and section state and clears top-level failure.</en></lang>
    if (isRecord(result) && result.kind === 'detail') {
      state.selectedEntryId = entryId;
      state.detail = cloneData(result);
      state.failure = null;
      setRetryCommand(null);
      return cloneData(result);
    }

    // <lang><zh-CN>canonical failure 或畸形 provider 输出都映射到 detail screen 的顶层 failure 槽。</zh-CN><en>Both canonical failure and malformed provider output map to detail screen's top-level failure slot.</en></lang>
    const failure = isRecord(result) && result.kind === 'failure'
      ? cloneData(result)
      : createFailure('detail-result-invalid', '详情 port 返回了无效结果。', 'The detail port returned an invalid result.', false, 'request');

    // <lang><zh-CN>失败仍保留 selected ID 与 detail screen，使应用可呈现 retry/反馈而不伪造目录回退。</zh-CN><en>Failure retains selected ID and detail screen so app can present retry or feedback without fabricating a catalog return.</en></lang>
    state.selectedEntryId = entryId;
    state.detail = null;
    state.failure = failure;

    // <lang><zh-CN>只有 adapter 明确标注 retryable 时保存 detail command；其他失败不重放。</zh-CN><en>Store detail command only when adapter explicitly marks it retryable; other failures do not replay.</en></lang>
    setRetryCommand(failure.retryable === true ? { kind: 'detail', entryId } : null);
    return cloneData(failure);
  }

  /**
   * <lang><zh-CN>按照已登记 action 进入目标 screen，并在 detail action 时读取 entry。</zh-CN><en>Enters a target screen through a registered action and reads entry for a detail action.</en></lang>
   * @param {string} actionId <lang><zh-CN>调用方请求的 action ID。</zh-CN><en>Action ID requested by the caller.</en></lang>
   * @param {object} [input={}] <lang><zh-CN>action 所需的最小输入。</zh-CN><en>Minimum input required by the action.</en></lang>
   * @returns {object} <lang><zh-CN>detail、capability failure 或 route/input failure。</zh-CN><en>Detail, capability failure, or route/input failure.</en></lang>
   * @lang zh-CN 只有 projection action 才能改变 detail screen；未知字符串永不映射为 URL、组件路径或 host navigation。
   * @lang en Only a projection action can change detail screen; an unknown string never maps to a URL, component path, or host navigation.
   */
  function navigate(actionId, input = {}) {
    // <lang><zh-CN>从内部静态 index 查找 action；未登记 action 立即拒绝。</zh-CN><en>Look up action from internal static index and reject an unregistered action immediately.</en></lang>
    const action = route.actionsById.get(actionId);

    // <lang><zh-CN>未知 action 不改变 screen 或 retry 状态，返回受控 request failure。</zh-CN><en>An unknown action changes neither screen nor retry state and returns controlled request failure.</en></lang>
    if (action === undefined) {
      const failure = createFailure('route-action-unknown', '请求的 route action 未登记。', 'The requested route action is not registered.', false, 'request');
      state.failure = failure;
      setRetryCommand(null);
      return cloneData(failure);
    }

    // <lang><zh-CN>action 的 from 必须等于当前 screen，防止调用方跳过 projection 声明的导航来源。</zh-CN><en>Action from must equal current screen, preventing callers from skipping a navigation source declared by projection.</en></lang>
    if (action.from !== state.screenId) {
      const failure = createFailure('route-action-source-mismatch', 'route action 不适用于当前页面。', 'The route action does not apply to the current screen.', false, 'request');
      state.failure = failure;
      setRetryCommand(null);
      return cloneData(failure);
    }

    // <lang><zh-CN>目标 screen capability 在状态转换和 detail port 调用前审核，拒绝不会泄露详情读取行为。</zh-CN><en>Review target-screen capability before state transition and detail-port invocation; denial leaks no detail-read behavior.</en></lang>
    const denial = getCapabilityDenial(composition, action.to, capabilitiesByScreenId);

    // <lang><zh-CN>capability 拒绝保持当前 screen，并清除 retry，因为授权状态不是可自动重放的 adapter 故障。</zh-CN><en>Capability denial retains current screen and clears retry because authorization state is not an adapter failure safe for automatic replay.</en></lang>
    if (denial !== null) {
      state.failure = denial;
      setRetryCommand(null);
      return cloneData(denial);
    }

    // <lang><zh-CN>首轮只实现声明的 entry-detail target；其他 future screen 不能被此 shell 静默承载。</zh-CN><en>The first round implements only declared entry-detail target; no other future screen can be silently carried by this shell.</en></lang>
    if (action.to !== 'entry-detail') {
      const failure = createFailure('route-target-unsupported', 'route action 指向当前 shell 未支持的页面。', 'The route action targets a screen unsupported by the current shell.', false, 'request');
      state.failure = failure;
      setRetryCommand(null);
      return cloneData(failure);
    }

    // <lang><zh-CN>detail action 必须带有非空 entryId；shell 不从 page、URL 或 UI 事件对象猜测选择值。</zh-CN><en>A detail action must carry a non-empty entryId; shell guesses no selection from page, URL, or UI event object.</en></lang>
    if (!isRecord(input) || !isIdentifier(input.entryId)) {
      const failure = createFailure('entry-id-invalid', '详情 action 缺少有效 entry ID。', 'The detail action lacks a valid entry ID.', false, 'request');
      state.failure = failure;
      setRetryCommand(null);
      return cloneData(failure);
    }

    // <lang><zh-CN>先切换到已授权 detail screen；detail port 的 retryable failure 因而可以在同一 screen 上被呈现和重放。</zh-CN><en>Switch first to the authorized detail screen so a retryable detail-port failure can be presented and replayed on the same screen.</en></lang>
    state.screenId = action.to;

    // <lang><zh-CN>将 canonical ID 交给 detail loader；该 loader 决定 detail/failure state，而不接触 route 规则。</zh-CN><en>Pass canonical ID to detail loader; loader decides detail or failure state and does not touch route rules.</en></lang>
    return loadDetail(input.entryId);
  }

  /**
   * <lang><zh-CN>通过固定 `select-entry` action 选择目录中的 canonical entry。</zh-CN><en>Selects a canonical catalog entry through the fixed `select-entry` action.</en></lang>
   * @param {string} entryId <lang><zh-CN>来自当前 canonical page 的 entry ID。</zh-CN><en>Entry ID from the current canonical page.</en></lang>
   * @returns {object} <lang><zh-CN>detail 或受控 failure。</zh-CN><en>Detail or controlled failure.</en></lang>
   * @lang zh-CN 此 convenience API 不绕过 route projection；它只把 entry ID 放入固定 action 的最小输入。
   * @lang en This convenience API does not bypass route projection; it only places entry ID in minimum input of the fixed action.
   */
  function selectEntry(entryId) {
    // <lang><zh-CN>委托统一 navigate 逻辑，确保 source/capability/target/input gate 对 direct 与 UI 调用一致。</zh-CN><en>Delegate to unified navigate logic, keeping source, capability, target, and input gates consistent for direct and UI calls.</en></lang>
    return navigate('select-entry', { entryId });
  }

  /**
   * <lang><zh-CN>显式回到 projection 的 catalog screen，并清理 detail presentation state。</zh-CN><en>Explicitly returns to projection's catalog screen and clears detail presentation state.</en></lang>
   * @returns {object} <lang><zh-CN>更新后的安全 snapshot。</zh-CN><en>Updated safe snapshot.</en></lang>
   * @lang zh-CN 这是单页 state reset，不是 host router back、历史栈操作或数据重新加载。
   * @lang en This is a single-page state reset, not host-router back, history-stack operation, or data reload.
   */
  function showCatalog() {
    // <lang><zh-CN>catalog screen 也需通过自身 policy；未来收紧时回退不会绕过 capability gate。</zh-CN><en>Catalog screen also passes its own policy so a future tightening cannot bypass capability gate on return.</en></lang>
    const denial = getCapabilityDenial(composition, route.catalogScreenId, capabilitiesByScreenId);

    // <lang><zh-CN>被拒绝时不清理当前 detail，避免 capability policy 变化导致应用丢失可见 state。</zh-CN><en>On denial do not clear current detail, avoiding loss of visible state due to capability-policy change.</en></lang>
    if (denial !== null) {
      state.failure = denial;
      setRetryCommand(null);
      return getSnapshot();
    }

    // <lang><zh-CN>回到唯一 catalog screen，并只清理 selection/detail/failure/retry，不触碰已加载 page。</zh-CN><en>Return to the sole catalog screen and clear only selection, detail, failure, and retry without touching loaded page.</en></lang>
    state.screenId = route.catalogScreenId;
    state.selectedEntryId = null;
    state.detail = null;
    state.failure = null;
    setRetryCommand(null);

    // <lang><zh-CN>以 fresh snapshot 返回，调用方不能借返回对象修改内部 state。</zh-CN><en>Return a fresh snapshot so caller cannot change internal state through the returned object.</en></lang>
    return getSnapshot();
  }

  /**
   * <lang><zh-CN>重放最近一次由 retryable canonical failure 保存的 command。</zh-CN><en>Replays the most recent command saved by a retryable canonical failure.</en></lang>
   * @returns {object} <lang><zh-CN>重放后的 canonical result 或 retry failure。</zh-CN><en>Canonical result after replay or retry failure.</en></lang>
   * @lang zh-CN retry 从不猜测动作、重建 UI input 或读取缓存；没有明确 command 时返回受控失败。
   * @lang en Retry never guesses an action, reconstructs UI input, or reads cache; it returns controlled failure when no explicit command exists.
   */
  function retry() {
    // <lang><zh-CN>没有 retry command 时不能发起任何 provider 调用，避免普通按钮误触变成隐藏数据读取。</zh-CN><en>When no retry command exists, start no provider invocation, preventing an ordinary button click from becoming hidden data read.</en></lang>
    if (state.retryCommand === null) {
      const failure = createFailure('retry-unavailable', '当前没有可重试的请求。', 'There is no request available for retry.', false, 'request');
      state.failure = failure;
      return cloneData(failure);
    }

    // <lang><zh-CN>复制保存的 command，防止重放中 state 更新影响本次分支选择。</zh-CN><en>Copy saved command so state updates during replay cannot affect this branch selection.</en></lang>
    const command = cloneData(state.retryCommand);

    // <lang><zh-CN>query retry 使用原 canonical request，并重新经过当前 catalog capability gate。</zh-CN><en>Query retry uses original canonical request and passes current catalog capability gate again.</en></lang>
    if (command.kind === 'query') {
      return query(command.request);
    }

    // <lang><zh-CN>detail retry 仅在仍处于 detail screen 时调用 port；不借重试隐式跳过 route action。</zh-CN><en>Detail retry invokes port only while still on detail screen and never uses retry to skip route action implicitly.</en></lang>
    if (command.kind === 'detail' && state.screenId === 'entry-detail') {
      return loadDetail(command.entryId);
    }

    // <lang><zh-CN>畸形/过期 command 被安全拒绝并清理，避免 future command shape 被旧 shell 误执行。</zh-CN><en>Reject and clear malformed or stale command safely, preventing old shell from executing a future command shape.</en></lang>
    const failure = createFailure('retry-command-invalid', '可重试命令已失效。', 'The retryable command is no longer valid.', false, 'request');
    state.failure = failure;
    setRetryCommand(null);
    return cloneData(failure);
  }

  // <lang><zh-CN>只公开可观察 state 与四个显式 intent；不暴露内部 policy、provider、route index 或 mutable state。</zh-CN><en>Expose only observable state and four explicit intents; do not expose internal policy, provider, route index, or mutable state.</en></lang>
  return {
    ok: true,
    diagnostics: [],
    shell: Object.freeze({ getSnapshot, query, navigate, selectEntry, showCatalog, retry })
  };
}
