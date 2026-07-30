/**
 * <lang><zh-CN>HIA-uView-Biz 的纯组合核心：校验已解析 manifest、受限 profile 与显式 port，并组装不含 I/O 的调用边界。</zh-CN><en>The pure composition core for HIA-uView-Biz: validates parsed manifests, restricted profiles, and explicit ports, then assembles an I/O-free invocation boundary.</en></lang>
 * @lang zh-CN 本模块不读取文件、环境变量、网络或全局注册表；宿主必须显式传入已解析的声明和 provider。
 * @lang en This module reads no file, environment variable, network, or global registry; a host must explicitly provide parsed declarations and providers.
 */

/**
 * <lang><zh-CN>当前 core 支持的唯一 manifest/port 契约版本。</zh-CN><en>The sole manifest/port contract version supported by the current core.</en></lang>
 * @lang zh-CN 这是运行时最小支持范围，不是发布版本或完整 JSON Schema 引擎声明。
 * @lang en This is the runtime's minimum supported range, not a release version or a full JSON Schema engine claim.
 */
export const BIZ_CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>业务模块 manifest 的稳定 kind 标识。</zh-CN><en>The stable kind identifier for a business-module manifest.</en></lang>
 * @lang zh-CN core 用它区分业务主责声明与工程实现声明。
 * @lang en The core uses it to distinguish a business-ownership declaration from an engineering-implementation declaration.
 */
export const BUSINESS_MODULE_KIND = 'business-module';

/**
 * <lang><zh-CN>实现包 manifest 的稳定 kind 标识。</zh-CN><en>The stable kind identifier for an implementation-package manifest.</en></lang>
 * @lang zh-CN core 用它确认工程交付声明没有被当作业务模块处理。
 * @lang en The core uses it to ensure an engineering-delivery declaration is not handled as a business module.
 */
export const IMPLEMENTATION_PACKAGE_KIND = 'implementation-package';

/**
 * <lang><zh-CN>构造可供程序和双语呈现层共同消费的稳定诊断。</zh-CN><en>Constructs a stable diagnostic consumable by both programs and bilingual presentation layers.</en></lang>
 *
 * @param {string} code 稳定机器代码。 / Stable machine code.
 * @param {string} zhHans 中文诊断文案。 / Chinese diagnostic text.
 * @param {string} en English diagnostic text.
 * @returns {{code: string, message: {'zh-Hans': string, en: string}}} 规范化诊断。 / A normalized diagnostic.
 * @lang zh-CN 诊断不携带原始 manifest、provider 或私有输入，避免它们被日志或 UI 无意扩散。
 * @lang en A diagnostic carries no raw manifest, provider, or private input, avoiding their accidental spread through logs or UI.
 */
function createDiagnostic(code, zhHans, en) {
  // <lang><zh-CN>返回新的纯数据对象，使调用方可安全汇总多个错误而不共享可变状态。</zh-CN><en>Return a fresh plain-data object so callers can safely aggregate errors without sharing mutable state.</en></lang>
  return {
    code,
    message: {
      'zh-Hans': zhHans,
      en
    }
  };
}

/**
 * <lang><zh-CN>判断输入是否为可安全读取自身字段的普通对象。</zh-CN><en>Determines whether input is a plain object whose own fields can be read safely.</en></lang>
 *
 * @param {unknown} value 待判断的输入。 / Input to inspect.
 * @returns {boolean} 是否为非数组对象。 / Whether the value is a non-array object.
 * @lang zh-CN manifest、profile 和 provider 都必须是对象；数组、null 和原始值不能承担命名字段关系。
 * @lang en Manifests, profiles, and providers must be objects; arrays, null, and primitives cannot carry named-field relations.
 */
function isRecord(value) {
  // <lang><zh-CN>排除 null 和数组，避免随后使用字段读取时把集合误当成声明对象。</zh-CN><en>Exclude null and arrays so later field reads do not mistake a collection for a declaration object.</en></lang>
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * <lang><zh-CN>判断值是否为非空字符串标识。</zh-CN><en>Determines whether a value is a non-empty string identifier.</en></lang>
 *
 * @param {unknown} value 待判断的值。 / Value to inspect.
 * @returns {boolean} 是否可作为稳定标识。 / Whether the value can act as a stable identifier.
 * @lang zh-CN 当前 core 不完整实现 schema 的正则细节，但至少拒绝空、非字符串和空白标识。
 * @lang en The current core does not fully implement schema regular-expression details, but it at least rejects empty, non-string, and whitespace identifiers.
 */
function isIdentifier(value) {
  // <lang><zh-CN>trim 后的长度确认禁止只含空白的标识进入组合关系。</zh-CN><en>The trimmed length check prevents whitespace-only identifiers from entering composition relations.</en></lang>
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * <lang><zh-CN>判断两个带版本的 contract reference 是否完全相同。</zh-CN><en>Determines whether two versioned contract references are exactly equal.</en></lang>
 *
 * @param {unknown} left 第一个 contract reference。 / The first contract reference.
 * @param {unknown} right 第二个 contract reference。 / The second contract reference.
 * @returns {boolean} ID 与版本是否都一致。 / Whether both ID and version match.
 * @lang zh-CN 名称相同但版本不同仍是错误，防止 provider 静默处理不兼容输入。
 * @lang en Matching names with different versions are still an error, preventing a provider from silently handling incompatible input.
 */
function contractsMatch(left, right) {
  // <lang><zh-CN>两侧都必须是对象；缺失的 contract 不能被视为通配符。</zh-CN><en>Both sides must be objects; a missing contract cannot be treated as a wildcard.</en></lang>
  return isRecord(left) && isRecord(right) && left.id === right.id && left.version === right.version;
}

/**
 * <lang><zh-CN>向诊断列表添加一项字段形状错误。</zh-CN><en>Adds a field-shape error to a diagnostic list.</en></lang>
 *
 * @param {Array<object>} diagnostics 当前诊断列表。 / Current diagnostic list.
 * @param {string} code 稳定错误代码。 / Stable error code.
 * @param {string} field 面向读者的字段名。 / Reader-facing field name.
 * @returns {void} 无返回值。 / Returns no value.
 * @lang zh-CN 统一创建形状错误，避免不同校验分支的双语文案漂移。
 * @lang en Creates shape errors consistently, avoiding drift in bilingual wording across validation branches.
 */
function addShapeDiagnostic(diagnostics, code, field) {
  // <lang><zh-CN>只记录字段名称，不复制可能包含不可信或私有内容的实际值。</zh-CN><en>Record only the field name and not the actual value, which may be untrusted or private.</en></lang>
  diagnostics.push(createDiagnostic(code, `字段 ${field} 的形状无效。`, `Field ${field} has an invalid shape.`));
}

/**
 * <lang><zh-CN>校验业务模块 manifest 的当前最小运行时形状。</zh-CN><en>Validates the current minimum runtime shape of a business-module manifest.</en></lang>
 *
 * @param {unknown} businessModule 已解析业务模块 manifest。 / Parsed business-module manifest.
 * @param {Array<object>} diagnostics 要追加的诊断列表。 / Diagnostic list to append to.
 * @returns {void} 无返回值；错误写入 diagnostics。 / Returns no value; errors are written to diagnostics.
 * @lang zh-CN 此校验只覆盖当前 core 的 kind/version/id、required port 与受限配置关系，不替代公开 Draft 7 schema。
 * @lang en This validation covers only the current core's kind/version/id, required ports, and restricted configuration relations; it does not replace the public Draft 7 schema.
 */
function validateBusinessModuleManifest(businessModule, diagnostics) {
  // <lang><zh-CN>非对象没有可继续读取的字段，记录错误后立即停止该 manifest 的关系校验。</zh-CN><en>A non-object has no fields that can be read further, so record an error and stop relation validation for this manifest.</en></lang>
  if (!isRecord(businessModule)) {
    // <lang><zh-CN>对象形状错误与 kind 错误分开，帮助调用方定位输入层而不是误修分类字段。</zh-CN><en>Keep an object-shape error separate from a kind error so callers fix the input layer rather than the wrong classification field.</en></lang>
    addShapeDiagnostic(diagnostics, 'manifest.business-module.invalid', 'businessModule');
    return;
  }

  // <lang><zh-CN>业务声明必须拥有固定 kind，避免实现包或任意对象进入 module 关系检查。</zh-CN><en>A business declaration must have the fixed kind, preventing an implementation package or arbitrary object from entering module relation checks.</en></lang>
  if (businessModule.kind !== BUSINESS_MODULE_KIND) {
    // <lang><zh-CN>kind 错误使用稳定代码，供测试和宿主诊断分支识别。</zh-CN><en>The kind error uses a stable code for tests and host diagnostic branches.</en></lang>
    diagnostics.push(createDiagnostic('manifest.kind.invalid', '业务模块 manifest 的 kind 必须为 business-module。', 'A business-module manifest kind must be business-module.'));
  }

  // <lang><zh-CN>当前 core 只接受公开契约已声明的 1.0 版本。</zh-CN><en>The current core accepts only the 1.0 version declared by the public contract.</en></lang>
  if (businessModule.manifestVersion !== BIZ_CONTRACT_VERSION) {
    // <lang><zh-CN>未支持版本不继续被当作兼容输入，避免隐式降级。</zh-CN><en>An unsupported version is not treated as compatible input, avoiding implicit downgrade behavior.</en></lang>
    diagnostics.push(createDiagnostic('manifest.version.unsupported', '业务模块 manifest 使用了当前 core 不支持的版本。', 'The business-module manifest uses a version unsupported by the current core.'));
  }

  // <lang><zh-CN>模块 ID 是 profile、实现包与依赖关系的共同键，不能为空。</zh-CN><en>The module ID is the shared key for profile, implementation-package, and dependency relations and cannot be empty.</en></lang>
  if (!isIdentifier(businessModule.id)) {
    // <lang><zh-CN>缺失 ID 时仍继续收集其他局部形状错误，使调用方一次获得完整反馈。</zh-CN><en>When the ID is missing, continue collecting other local shape errors so callers receive complete feedback at once.</en></lang>
    addShapeDiagnostic(diagnostics, 'manifest.id.invalid', 'businessModule.id');
  }

  // <lang><zh-CN>contracts 必须为对象，当前 core 才能找到 required port 声明。</zh-CN><en>Contracts must be an object before the current core can find required port declarations.</en></lang>
  if (!isRecord(businessModule.contracts) || !Array.isArray(businessModule.contracts.ports)) {
    // <lang><zh-CN>缺失 ports 会使后续 provider 检查失去权威输入，故单独诊断。</zh-CN><en>Missing ports leave provider checks without an authoritative input, so diagnose them separately.</en></lang>
    addShapeDiagnostic(diagnostics, 'manifest.ports.invalid', 'businessModule.contracts.ports');
  }

  // <lang><zh-CN>configuration 必须提供 block、visibility 与分页 allowlist，profile 才能受限选择。</zh-CN><en>Configuration must provide block, visibility, and pagination allowlists before a profile can make restricted selections.</en></lang>
  if (!isRecord(businessModule.configuration) || !Array.isArray(businessModule.configuration.registeredBlocks) || !Array.isArray(businessModule.configuration.visibilityConditions) || !Array.isArray(businessModule.configuration.paginationModes)) {
    // <lang><zh-CN>不完整配置不会被 core 补默认值，避免把隐式策略变成 API。</zh-CN><en>An incomplete configuration receives no core default, avoiding the conversion of an implicit policy into an API.</en></lang>
    addShapeDiagnostic(diagnostics, 'manifest.configuration.invalid', 'businessModule.configuration');
  }
}

/**
 * <lang><zh-CN>校验实现包 manifest 的当前最小运行时形状。</zh-CN><en>Validates the current minimum runtime shape of an implementation-package manifest.</en></lang>
 *
 * @param {unknown} implementationPackage 已解析实现包 manifest。 / Parsed implementation-package manifest.
 * @param {Array<object>} diagnostics 要追加的诊断列表。 / Diagnostic list to append to.
 * @returns {void} 无返回值；错误写入 diagnostics。 / Returns no value; errors are written to diagnostics.
 * @lang zh-CN 此校验不安装包、不读取 npm metadata，也不验证来源审计细节。
 * @lang en This validation installs no package, reads no npm metadata, and does not verify provenance-audit details.
 */
function validateImplementationPackageManifest(implementationPackage, diagnostics) {
  // <lang><zh-CN>非对象不能提供实现包与 module/port 的关系信息。</zh-CN><en>A non-object cannot provide implementation-package relations to a module or ports.</en></lang>
  if (!isRecord(implementationPackage)) {
    // <lang><zh-CN>记录对象层错误后立即返回，防止后续字段读取抛出无关异常。</zh-CN><en>Record the object-level error and return immediately, preventing later field reads from throwing unrelated exceptions.</en></lang>
    addShapeDiagnostic(diagnostics, 'manifest.implementation-package.invalid', 'implementationPackage');
    return;
  }

  // <lang><zh-CN>实现包必须有自己的固定 kind，不能被业务模块替代。</zh-CN><en>An implementation package must have its own fixed kind and cannot be replaced by a business module.</en></lang>
  if (implementationPackage.kind !== IMPLEMENTATION_PACKAGE_KIND) {
    // <lang><zh-CN>kind 诊断复用稳定代码，因为两种 manifest 都必须遵循分类约束。</zh-CN><en>The kind diagnostic reuses a stable code because both manifest types must obey the classification constraint.</en></lang>
    diagnostics.push(createDiagnostic('manifest.kind.invalid', '实现包 manifest 的 kind 必须为 implementation-package。', 'An implementation-package manifest kind must be implementation-package.'));
  }

  // <lang><zh-CN>实现包版本也必须与 core 当前支持范围一致。</zh-CN><en>The implementation-package version must also match the current core support range.</en></lang>
  if (implementationPackage.manifestVersion !== BIZ_CONTRACT_VERSION) {
    // <lang><zh-CN>版本不匹配不尝试猜测迁移规则或兼容行为。</zh-CN><en>A version mismatch does not attempt to guess migration rules or compatibility behavior.</en></lang>
    diagnostics.push(createDiagnostic('manifest.version.unsupported', '实现包 manifest 使用了当前 core 不支持的版本。', 'The implementation-package manifest uses a version unsupported by the current core.'));
  }

  // <lang><zh-CN>实现包 ID、目标 module ID 与 provides 是组合时的最小关系键。</zh-CN><en>The implementation-package ID, target module ID, and provides are the minimum relation keys during composition.</en></lang>
  if (!isIdentifier(implementationPackage.id) || !isIdentifier(implementationPackage.moduleId) || !Array.isArray(implementationPackage.provides)) {
    // <lang><zh-CN>将三项共同形状错误聚合为一个实现关系诊断，避免假称已完成完整 schema 报告。</zh-CN><en>Aggregate the three related shape errors into one implementation-relation diagnostic rather than claim a full schema report exists.</en></lang>
    addShapeDiagnostic(diagnostics, 'manifest.implementation-package.relation.invalid', 'implementationPackage.id/moduleId/provides');
  }
}

/**
 * <lang><zh-CN>校验已解析的业务模块与实现包是否形成合法配对。</zh-CN><en>Validates whether parsed business-module and implementation-package manifests form a valid pair.</en></lang>
 *
 * @param {{businessModule: unknown, implementationPackage: unknown}} input 成对 manifest 输入。 / Paired manifest input.
 * @returns {{ok: boolean, diagnostics: Array<object>}} 通过状态与稳定诊断。 / Pass status and stable diagnostics.
 * @lang zh-CN 该函数没有副作用，允许宿主在装配前或测试中重复调用。
 * @lang en This function has no side effects, allowing a host to call it repeatedly before assembly or in tests.
 */
export function validateManifestPair(input) {
  // <lang><zh-CN>独立诊断列表保存本次验证事实，不复用上一次调用的错误状态。</zh-CN><en>An independent diagnostic list preserves facts for this validation and never reuses errors from a prior call.</en></lang>
  const diagnostics = [];

  // <lang><zh-CN>输入容器必须是对象；否则无法解构出两个 manifest。</zh-CN><en>The input container must be an object; otherwise the two manifests cannot be extracted.</en></lang>
  if (!isRecord(input)) {
    // <lang><zh-CN>容器错误直接返回，避免将 undefined 当作两个不同 manifest 而产生噪声。</zh-CN><en>Return directly for a container error, avoiding noise from treating undefined as two different manifests.</en></lang>
    return {
      ok: false,
      diagnostics: [createDiagnostic('manifest.pair.invalid', 'manifest pair 输入必须是对象。', 'The manifest-pair input must be an object.')]
    };
  }

  // <lang><zh-CN>业务模块字段保留为局部引用，供形状和配对关系校验共用。</zh-CN><en>Keep the business-module field as a local reference shared by shape and pairing checks.</en></lang>
  const businessModule = input.businessModule;

  // <lang><zh-CN>实现包字段保留为局部引用，供形状和 moduleId 关系校验共用。</zh-CN><en>Keep the implementation-package field as a local reference shared by shape and moduleId relation checks.</en></lang>
  const implementationPackage = input.implementationPackage;

  // <lang><zh-CN>先校验两个独立声明，保证关系诊断只在字段可读取时运行。</zh-CN><en>Validate both independent declarations first so relation diagnostics run only when fields can be read.</en></lang>
  validateBusinessModuleManifest(businessModule, diagnostics);
  validateImplementationPackageManifest(implementationPackage, diagnostics);

  // <lang><zh-CN>只有两个声明对象都可读取时，才比较实现包目标与业务模块 ID。</zh-CN><en>Compare the implementation target and business-module ID only when both declarations are readable objects.</en></lang>
  if (isRecord(businessModule) && isRecord(implementationPackage) && isIdentifier(businessModule.id) && isIdentifier(implementationPackage.moduleId) && businessModule.id !== implementationPackage.moduleId) {
    // <lang><zh-CN>不允许实现包在未声明模块上悄然落位。</zh-CN><en>Do not allow an implementation package to silently attach to an undeclared module.</en></lang>
    diagnostics.push(createDiagnostic('implementation.module-id.mismatch', '实现包 moduleId 与业务模块 id 不一致。', 'The implementation-package moduleId does not match the business-module id.'));
  }

  // <lang><zh-CN>空诊断列表是唯一的通过条件，避免布尔值与错误列表不一致。</zh-CN><en>An empty diagnostic list is the sole pass condition, avoiding disagreement between a Boolean and the error list.</en></lang>
  return {
    ok: diagnostics.length === 0,
    diagnostics
  };
}

/**
 * <lang><zh-CN>校验 profile 对模块、实现包、block、依赖、冲突与 route projection 的受限选择。</zh-CN><en>Validates a profile's restricted selections of module, implementation package, blocks, dependencies, conflicts, and route projection.</en></lang>
 *
 * @param {unknown} profile 已解析 profile。 / Parsed profile.
 * @param {object} businessModule 已校验的业务模块。 / Validated business module.
 * @param {object} implementationPackage 已校验的实现包。 / Validated implementation package.
 * @param {Array<object>} diagnostics 要追加的诊断列表。 / Diagnostic list to append to.
 * @returns {void} 无返回值；错误写入 diagnostics。 / Returns no value; errors are written to diagnostics.
 * @lang zh-CN profile 只能选择公开 allowlist 内的值；它不能注入 URL、脚本、依赖或未知 block。
 * @lang en A profile may select only public allowlist values; it cannot inject a URL, script, dependency, or unknown block.
 */
function validateProfile(profile, businessModule, implementationPackage, diagnostics) {
  // <lang><zh-CN>非对象 profile 无法表达选择关系，记录错误后停止 profile 校验。</zh-CN><en>A non-object profile cannot express selection relations, so record an error and stop profile validation.</en></lang>
  if (!isRecord(profile)) {
    // <lang><zh-CN>profile 错误独立于 manifest 错误，方便宿主将配置问题归给正确输入。</zh-CN><en>Keep the profile error independent from manifest errors so a host can attribute configuration problems to the correct input.</en></lang>
    addShapeDiagnostic(diagnostics, 'profile.invalid', 'profile');
    return;
  }

  // <lang><zh-CN>启用模块列表决定 profile 是否显式选择当前业务模块及其依赖/冲突集合。</zh-CN><en>The enabled-module list determines whether the profile explicitly selects the current business module and its dependency/conflict set.</en></lang>
  const enabledModuleIds = Array.isArray(profile.enabledModuleIds) ? profile.enabledModuleIds : [];

  // <lang><zh-CN>实现包列表避免 core 根据模块 ID 隐式挑选任意工程实现。</zh-CN><en>The implementation-package list prevents the core from implicitly choosing arbitrary engineering implementation by module ID.</en></lang>
  const implementationPackageIds = Array.isArray(profile.implementationPackageIds) ? profile.implementationPackageIds : [];

  // <lang><zh-CN>已选 block 是动态呈现的实际选择集合，后续逐项与 manifest allowlist 比较。</zh-CN><en>Selected blocks are the actual dynamic-presentation selection set, compared item by item with the manifest allowlist below.</en></lang>
  const selectedBlocks = Array.isArray(profile.selectedBlocks) ? profile.selectedBlocks : [];

  // <lang><zh-CN>已登记 block 仅来自业务模块配置，不允许 profile 自行扩展。</zh-CN><en>Registered blocks come only from business-module configuration and cannot be extended by the profile itself.</en></lang>
  const registeredBlocks = isRecord(businessModule.configuration) && Array.isArray(businessModule.configuration.registeredBlocks) ? businessModule.configuration.registeredBlocks : [];

  // <lang><zh-CN>可见性 allowlist 同样仅来自模块配置，用于阻止可执行表达式进入 profile。</zh-CN><en>The visibility allowlist also comes only from module configuration, preventing executable expressions from entering a profile.</en></lang>
  const visibilityConditions = isRecord(businessModule.configuration) && Array.isArray(businessModule.configuration.visibilityConditions) ? businessModule.configuration.visibilityConditions : [];

  // <lang><zh-CN>profile 必须显式启用当前模块，core 不会默认添加它。</zh-CN><en>The profile must explicitly enable the current module; the core will not add it by default.</en></lang>
  if (!enabledModuleIds.includes(businessModule.id)) {
    // <lang><zh-CN>未启用当前模块时，后续 provider 即使存在也不能被调用。</zh-CN><en>When the current module is not enabled, providers cannot be invoked even if they exist later.</en></lang>
    diagnostics.push(createDiagnostic('profile.module.disabled', 'profile 未启用当前业务模块。', 'The profile does not enable the current business module.'));
  }

  // <lang><zh-CN>profile 必须显式选择当前实现包，避免实现选择被隐藏在文件路径或全局注册表中。</zh-CN><en>The profile must explicitly select the current implementation package, preventing implementation selection from hiding in a file path or global registry.</en></lang>
  if (!implementationPackageIds.includes(implementationPackage.id)) {
    // <lang><zh-CN>缺失实现包是组合关系错误，而不是 npm 安装或网络错误。</zh-CN><en>A missing implementation package is a composition relation error, not an npm-install or network error.</en></lang>
    diagnostics.push(createDiagnostic('profile.implementation.missing', 'profile 未选择当前实现包。', 'The profile does not select the current implementation package.'));
  }

  // <lang><zh-CN>逐个检查 block，确保动态呈现只能指向模块预先登记的标识。</zh-CN><en>Check each block so dynamic presentation can point only to identifiers registered by the module in advance.</en></lang>
  for (const blockId of selectedBlocks) {
    // <lang><zh-CN>未知 block 不能被当作未来组件或远端配置占位符接受。</zh-CN><en>An unknown block cannot be accepted as a placeholder for a future component or remote configuration.</en></lang>
    if (!registeredBlocks.includes(blockId)) {
      // <lang><zh-CN>使用稳定代码让调用方可以把配置错误呈现在 profile 审核层。</zh-CN><en>Use a stable code so callers can present the configuration error at the profile-review layer.</en></lang>
      diagnostics.push(createDiagnostic('profile.block.unregistered', 'profile 选择了未登记的呈现 block。', 'The profile selects an unregistered presentation block.'));
    }
  }

  // <lang><zh-CN>可见性映射只允许已选 block 及其声明条件，防止对隐藏或未知对象设置规则。</zh-CN><en>The visibility map permits only selected blocks and declared conditions, preventing rules from targeting hidden or unknown objects.</en></lang>
  if (isRecord(profile.visibilityByBlock)) {
    // <lang><zh-CN>逐项读取可见性规则，以检查 block 与 condition 两个维度的 allowlist。</zh-CN><en>Read visibility rules one by one to check allowlists for both the block and condition dimensions.</en></lang>
    for (const [blockId, condition] of Object.entries(profile.visibilityByBlock)) {
      // <lang><zh-CN>规则目标必须属于已选 block，不能借映射引入额外 block。</zh-CN><en>A rule target must belong to selected blocks and cannot introduce an additional block through the map.</en></lang>
      if (!selectedBlocks.includes(blockId)) {
        // <lang><zh-CN>未选 block 的规则会造成状态与呈现不一致，故拒绝。</zh-CN><en>A rule for an unselected block causes state/presentation inconsistency and is rejected.</en></lang>
        diagnostics.push(createDiagnostic('profile.visibility.block.unselected', 'profile 为未选择的 block 设置了可见性。', 'The profile sets visibility for an unselected block.'));
      }

      // <lang><zh-CN>condition 必须是声明式 allowlist 成员，而非表达式或脚本字符串。</zh-CN><en>A condition must be a declarative allowlist member rather than an expression or script string.</en></lang>
      if (!visibilityConditions.includes(condition)) {
        // <lang><zh-CN>拒绝未知 condition，确保 profile 不成为执行通道。</zh-CN><en>Reject an unknown condition, ensuring the profile does not become an execution channel.</en></lang>
        diagnostics.push(createDiagnostic('profile.visibility.unregistered', 'profile 使用了未声明的可见性条件。', 'The profile uses an undeclared visibility condition.'));
      }
    }
  }

  // <lang><zh-CN>模块依赖列表为空时不产生要求；存在时每一项都必须由 profile 显式启用。</zh-CN><en>An empty module dependency list creates no requirement; when present, every item must be explicitly enabled by the profile.</en></lang>
  const dependencies = Array.isArray(businessModule.dependencies) ? businessModule.dependencies : [];

  // <lang><zh-CN>逐个检查依赖，避免只验证数组存在而遗漏实际能力关系。</zh-CN><en>Check dependencies one by one, avoiding validation that only confirms an array exists while missing actual capability relations.</en></lang>
  for (const dependencyId of dependencies) {
    // <lang><zh-CN>缺失依赖时 core 拒绝装配，不猜测默认模块或数据来源。</zh-CN><en>When a dependency is missing, the core rejects assembly and does not guess a default module or data source.</en></lang>
    if (!enabledModuleIds.includes(dependencyId)) {
      // <lang><zh-CN>稳定依赖代码支持宿主展示可操作的组合诊断。</zh-CN><en>The stable dependency code supports actionable composition diagnostics in a host.</en></lang>
      diagnostics.push(createDiagnostic('profile.dependency.missing', 'profile 未启用业务模块所需的依赖。', 'The profile does not enable a dependency required by the business module.'));
    }
  }

  // <lang><zh-CN>模块冲突列表定义不可同时启用的能力，而不是后端或 UI 的隐藏开关。</zh-CN><en>The module conflict list defines capabilities that cannot be enabled together, not hidden backend or UI switches.</en></lang>
  const conflicts = Array.isArray(businessModule.conflicts) ? businessModule.conflicts : [];

  // <lang><zh-CN>逐个检查冲突，避免一个已启用冲突被其他合法模块掩盖。</zh-CN><en>Check conflicts one by one so an enabled conflict cannot be hidden by other valid modules.</en></lang>
  for (const conflictId of conflicts) {
    // <lang><zh-CN>冲突能力若已启用，组合必须停止在诊断阶段。</zh-CN><en>If a conflicting capability is enabled, composition must stop at the diagnostic stage.</en></lang>
    if (enabledModuleIds.includes(conflictId)) {
      // <lang><zh-CN>稳定冲突代码使 profile 工具可精确定位应移除的能力。</zh-CN><en>The stable conflict code lets a profile tool pinpoint the capability that should be removed.</en></lang>
      diagnostics.push(createDiagnostic('profile.conflict.enabled', 'profile 同时启用了冲突的业务模块。', 'The profile enables a conflicting business module.'));
    }
  }

  // <lang><zh-CN>route projection 只做受限标识关系校验；没有 projection 时让当前无 UI 的 core/mock 纵切保持可用。</zh-CN><en>Route projection performs only restricted identifier-relation validation; when absent, the current UI-free core/mock slice remains usable.</en></lang>
  validateRouteProjection(profile.routeProjection, selectedBlocks, diagnostics);
}

/**
 * <lang><zh-CN>校验 route projection 中 screen、block 与 action 的受限关系。</zh-CN><en>Validates restricted relations among screens, blocks, and actions in a route projection.</en></lang>
 *
 * @param {unknown} routeProjection 已解析渠道投影。 / Parsed channel projection.
 * @param {string[]} selectedBlocks profile 已选择的 block。 / Blocks selected by the profile.
 * @param {Array<object>} diagnostics 要追加的诊断列表。 / Diagnostic list to append to.
 * @returns {void} 无返回值；错误写入 diagnostics。 / Returns no value; errors are written to diagnostics.
 * @lang zh-CN 投影只接受 screen/action ID；不接收 URL、组件路径或任意导航参数。
 * @lang en Projection accepts only screen/action IDs and accepts no URL, component path, or arbitrary navigation parameter.
 */
function validateRouteProjection(routeProjection, selectedBlocks, diagnostics) {
  // <lang><zh-CN>没有投影时无需产生错误，因为当前 core 可以在无 UI 宿主中运行。</zh-CN><en>When no projection exists, no error is needed because the current core can run in a UI-free host.</en></lang>
  if (routeProjection === undefined) {
    // <lang><zh-CN>直接返回以保持 route projection 为可选的渠道层输入。</zh-CN><en>Return directly to keep route projection an optional channel-layer input.</en></lang>
    return;
  }

  // <lang><zh-CN>存在的 projection 必须有 screen/action 数组，才能验证引用完整性。</zh-CN><en>A present projection must have screen/action arrays before reference integrity can be validated.</en></lang>
  if (!isRecord(routeProjection) || !Array.isArray(routeProjection.screens) || !Array.isArray(routeProjection.actions)) {
    // <lang><zh-CN>形状错误不尝试容错补数组，避免空投影被误认为安全。</zh-CN><en>For a shape error, do not tolerate by adding arrays, avoiding a false belief that an empty projection is safe.</en></lang>
    addShapeDiagnostic(diagnostics, 'profile.route-projection.invalid', 'profile.routeProjection');
    return;
  }

  // <lang><zh-CN>screen ID 集合供 action 检查引用，不保留任何渠道路径或页面对象。</zh-CN><en>The screen-ID set supports action reference checks and retains no channel path or page object.</en></lang>
  const screenIds = new Set();

  // <lang><zh-CN>逐个验证 screen 的 ID 与 block 引用都来自已选 block。</zh-CN><en>Validate each screen's ID and block references against selected blocks.</en></lang>
  for (const screen of routeProjection.screens) {
    // <lang><zh-CN>screen 必须是对象并包含稳定 ID；否则 action 无法可靠引用。</zh-CN><en>A screen must be an object with a stable ID; otherwise actions cannot reliably reference it.</en></lang>
    if (!isRecord(screen) || !isIdentifier(screen.screenId) || !Array.isArray(screen.blocks)) {
      // <lang><zh-CN>不完整 screen 只记录投影错误，不读取未知字段。</zh-CN><en>An incomplete screen records only a projection error and reads no unknown field.</en></lang>
      addShapeDiagnostic(diagnostics, 'profile.route-projection.screen.invalid', 'routeProjection.screens');
      continue;
    }

    // <lang><zh-CN>登记 screen ID，供随后 action from/to 完整性检查。</zh-CN><en>Register the screen ID for subsequent action from/to integrity checks.</en></lang>
    screenIds.add(screen.screenId);

    // <lang><zh-CN>逐个检查 screen block，防止 route projection 绕过 profile 的选择集合。</zh-CN><en>Check each screen block, preventing route projection from bypassing the profile's selection set.</en></lang>
    for (const blockId of screen.blocks) {
      // <lang><zh-CN>未选 block 不能由渠道投影重新激活。</zh-CN><en>An unselected block cannot be reactivated by channel projection.</en></lang>
      if (!selectedBlocks.includes(blockId)) {
        // <lang><zh-CN>稳定代码将错误定位为 projection 对 profile allowlist 的越界。</zh-CN><en>The stable code locates the error as projection escape from the profile allowlist.</en></lang>
        diagnostics.push(createDiagnostic('profile.route-projection.block.unselected', 'route projection 引用了未选择的 block。', 'The route projection references an unselected block.'));
      }
    }
  }

  // <lang><zh-CN>逐个验证 action，确保导航只在已登记 screen ID 之间发生。</zh-CN><en>Validate actions one by one, ensuring navigation happens only between registered screen IDs.</en></lang>
  for (const action of routeProjection.actions) {
    // <lang><zh-CN>action 必须有稳定 ID、from 与 to；URL 不是允许字段。</zh-CN><en>An action must have stable ID, from, and to fields; URL is not an allowed field.</en></lang>
    if (!isRecord(action) || !isIdentifier(action.id) || !isIdentifier(action.from) || !isIdentifier(action.to)) {
      // <lang><zh-CN>无效 action 不能参与 screen 引用判断，避免访问不可信字段。</zh-CN><en>An invalid action cannot participate in screen-reference checks, avoiding reads of untrusted fields.</en></lang>
      addShapeDiagnostic(diagnostics, 'profile.route-projection.action.invalid', 'routeProjection.actions');
      continue;
    }

    // <lang><zh-CN>from/to 都必须指向当前 projection 已登记的 screen。</zh-CN><en>Both from and to must point to screens registered by the current projection.</en></lang>
    if (!screenIds.has(action.from) || !screenIds.has(action.to)) {
      // <lang><zh-CN>拒绝悬空 action，避免宿主把未知 ID 解释为任意路径。</zh-CN><en>Reject a dangling action, preventing a host from interpreting an unknown ID as an arbitrary path.</en></lang>
      diagnostics.push(createDiagnostic('profile.route-projection.action.unregistered', 'route projection action 指向了未登记的 screen。', 'The route-projection action points to an unregistered screen.'));
    }
  }
}

/**
 * <lang><zh-CN>校验 required port 是否由同一 contract 的显式 provider 提供。</zh-CN><en>Validates whether each required port is supplied by an explicit provider with the same contract.</en></lang>
 *
 * @param {object} businessModule 已校验业务模块。 / Validated business module.
 * @param {unknown} portProviders 按 port ID 索引的 provider。 / Providers indexed by port ID.
 * @param {Array<object>} diagnostics 要追加的诊断列表。 / Diagnostic list to append to.
 * @returns {void} 无返回值；错误写入 diagnostics。 / Returns no value; errors are written to diagnostics.
 * @lang zh-CN provider 只能通过显式对象传入；core 不执行自动发现或动态 import。
 * @lang en Providers may arrive only through an explicit object; the core performs no auto-discovery or dynamic import.
 */
function validatePortProviders(businessModule, portProviders, diagnostics) {
  // <lang><zh-CN>非对象 provider 集合等同于所有 required port 缺失，但保留单独形状诊断。</zh-CN><en>A non-object provider collection is equivalent to all required ports being missing, but retain a distinct shape diagnostic.</en></lang>
  if (!isRecord(portProviders)) {
    // <lang><zh-CN>记录集合形状错误后返回，避免 Object 属性读取异常。</zh-CN><en>Record the collection shape error and return, avoiding Object property-read exceptions.</en></lang>
    addShapeDiagnostic(diagnostics, 'composition.port-providers.invalid', 'portProviders');
    return;
  }

  // <lang><zh-CN>端口数组已在 manifest 校验阶段确认；此处使用空数组作为防御性回退而不抛异常。</zh-CN><en>The port array was checked during manifest validation; use an empty-array defensive fallback here rather than throw.</en></lang>
  const ports = isRecord(businessModule.contracts) && Array.isArray(businessModule.contracts.ports) ? businessModule.contracts.ports : [];

  // <lang><zh-CN>逐个检查 required port，provided port 不要求当前组合提供实现。</zh-CN><en>Check required ports one by one; provided ports do not require an implementation from the current composition.</en></lang>
  for (const port of ports) {
    // <lang><zh-CN>跳过格式不完整或非 required 的端口；其 manifest 形状错误由前序检查报告。</zh-CN><en>Skip incomplete or non-required ports; prior checks report their manifest shape errors.</en></lang>
    if (!isRecord(port) || port.direction !== 'required' || !isIdentifier(port.id)) {
      continue;
    }

    // <lang><zh-CN>按稳定 port ID 获取 provider；core 不根据函数名或顺序猜测匹配。</zh-CN><en>Get the provider by stable port ID; the core does not guess matches by function name or order.</en></lang>
    const provider = portProviders[port.id];

    // <lang><zh-CN>缺失 provider 时装配必须失败，避免在调用阶段才发现不可用能力。</zh-CN><en>When a provider is missing, assembly must fail rather than discover unavailable capability at invocation time.</en></lang>
    if (!isRecord(provider) || typeof provider.invoke !== 'function') {
      // <lang><zh-CN>稳定错误代码不含 provider 内容，避免诊断泄露实现状态或闭包数据。</zh-CN><en>The stable error code contains no provider contents, avoiding diagnostic leaks of implementation state or closure data.</en></lang>
      diagnostics.push(createDiagnostic('composition.port.missing', '组合缺少 required port 的 provider。', 'The composition lacks a provider for a required port.'));
      continue;
    }

    // <lang><zh-CN>provider contract 必须与 port contract 精确匹配，不允许同名端口跨版本替代。</zh-CN><en>The provider contract must exactly match the port contract; same-name ports cannot substitute across versions.</en></lang>
    if (!contractsMatch(port.contract, provider.contract)) {
      // <lang><zh-CN>契约不匹配时拒绝装配，避免 core 调用不兼容 adapter 或 session 实现。</zh-CN><en>On a contract mismatch, reject assembly rather than let the core invoke an incompatible adapter or session implementation.</en></lang>
      diagnostics.push(createDiagnostic('composition.port.contract.mismatch', 'provider contract 与 required port 不一致。', 'The provider contract does not match the required port.'));
    }
  }
}

/**
 * <lang><zh-CN>由已验证的显式 provider 创建只读 composition 调用面。</zh-CN><en>Creates a read-only composition invocation surface from validated explicit providers.</en></lang>
 *
 * @param {object} businessModule 已验证业务模块。 / Validated business module.
 * @param {object} implementationPackage 已验证实现包。 / Validated implementation package.
 * @param {object} profile 已验证 profile。 / Validated profile.
 * @param {object} portProviders 已验证 provider 集合。 / Validated provider collection.
 * @returns {{moduleId: string, implementationPackageId: string, routeProjection: object|undefined, invoke: (portId: string, input: unknown) => unknown}} 不可变组合调用面。 / Immutable composition invocation surface.
 * @lang zh-CN 本函数不包裹 provider 返回值，保留 module-owned canonical result/failure 语义。
 * @lang en This function does not wrap provider returns, preserving module-owned canonical result/failure semantics.
 */
function createComposition(businessModule, implementationPackage, profile, portProviders) {
  /**
   * <lang><zh-CN>仅通过已登记 provider 调用 port；未知 port 是调用方错误而不是动态发现请求。</zh-CN><en>Invokes a port only through a registered provider; an unknown port is a caller error, not a dynamic-discovery request.</en></lang>
   *
   * @param {string} portId 要调用的 required port ID。 / Required port ID to invoke.
   * @param {unknown} input 交给该 port 的已声明输入。 / Declared input passed to the port.
   * @returns {unknown} provider 的 canonical result 或 failure。 / The provider's canonical result or failure.
   * @throws {RangeError} 当 port 未被当前组合登记。 / When the port is not registered by the current composition.
   * @lang zh-CN 调用不创建 I/O；任何 I/O 仍由实现包的 provider 在其明确边界内承担。
   * @lang en Invocation creates no I/O; any I/O remains the responsibility of an implementation-package provider at its explicit boundary.
   */
  const invoke = (portId, input) => {
    // <lang><zh-CN>按 port ID 查找已验证 provider，避免调用方绕过组合边界直接访问实现对象。</zh-CN><en>Look up the validated provider by port ID, preventing callers from bypassing the composition boundary to access implementation objects directly.</en></lang>
    const provider = portProviders[portId];

    // <lang><zh-CN>未知 port 不应静默返回 undefined，因为那会把配置错误延迟成难以诊断的业务状态。</zh-CN><en>An unknown port must not silently return undefined, which would delay a configuration error into hard-to-diagnose business state.</en></lang>
    if (!isRecord(provider) || typeof provider.invoke !== 'function') {
      // <lang><zh-CN>抛出不含输入内容的范围错误，避免在异常中扩散可能敏感的 payload。</zh-CN><en>Throw a range error that contains no input contents, avoiding spread of potentially sensitive payload through an exception.</en></lang>
      throw new RangeError(`Port ${portId} is not registered by this composition.`);
    }

    // <lang><zh-CN>将原始输入只传给其已声明 provider；core 不转换 HTTP、token 或 backend envelope。</zh-CN><en>Pass raw input only to its declared provider; the core does not transform HTTP, tokens, or backend envelopes.</en></lang>
    return provider.invoke(input);
  };

  // <lang><zh-CN>冻结公开组合对象，防止宿主在装配后替换模块/实现标识或调用函数。</zh-CN><en>Freeze the public composition object, preventing a host from replacing module/implementation IDs or invocation function after assembly.</en></lang>
  return Object.freeze({
    moduleId: businessModule.id,
    implementationPackageId: implementationPackage.id,
    routeProjection: profile.routeProjection,
    invoke
  });
}

/**
 * <lang><zh-CN>装配一个受 manifest/profile/port 约束的纯 Biz composition。</zh-CN><en>Assembles a pure Biz composition constrained by manifests, a profile, and ports.</en></lang>
 *
 * @param {{businessModule: unknown, implementationPackage: unknown, profile: unknown, portProviders: unknown}} input 显式装配输入。 / Explicit assembly input.
 * @returns {{ok: boolean, diagnostics: Array<object>, composition?: object}} 装配结果。 / Assembly result.
 * @lang zh-CN 任何关系错误都会阻止 composition 创建；函数不执行 provider，不修改输入，也不访问外部资源。
 * @lang en Any relation error prevents composition creation; the function invokes no provider, mutates no input, and accesses no external resource.
 */
export function assembleComposition(input) {
  // <lang><zh-CN>独立 diagnostics 列表确保一次装配不会污染另一次调用。</zh-CN><en>An independent diagnostics list ensures one assembly cannot contaminate another call.</en></lang>
  const diagnostics = [];

  // <lang><zh-CN>非对象输入没有可解构的装配字段，直接返回结构化失败。</zh-CN><en>A non-object input has no assembly fields to extract, so return a structured failure directly.</en></lang>
  if (!isRecord(input)) {
    // <lang><zh-CN>使用单独代码区分装配容器错误与其中 manifest 的字段错误。</zh-CN><en>Use a separate code to distinguish an assembly-container error from manifest field errors inside it.</en></lang>
    return {
      ok: false,
      diagnostics: [createDiagnostic('composition.input.invalid', '组合输入必须是对象。', 'The composition input must be an object.')]
    };
  }

  // <lang><zh-CN>保留业务模块局部引用，后续 manifest、profile 与 port 校验共同使用它。</zh-CN><en>Keep the business-module local reference for subsequent manifest, profile, and port validation.</en></lang>
  const businessModule = input.businessModule;

  // <lang><zh-CN>保留实现包局部引用，后续 manifest 与 profile 校验共同使用它。</zh-CN><en>Keep the implementation-package local reference for subsequent manifest and profile validation.</en></lang>
  const implementationPackage = input.implementationPackage;

  // <lang><zh-CN>保留 profile 局部引用，避免从环境或单例获取组合配置。</zh-CN><en>Keep the profile local reference, avoiding composition configuration from environment or singleton state.</en></lang>
  const profile = input.profile;

  // <lang><zh-CN>保留 provider 集合局部引用，确保调用边界只使用本次显式输入。</zh-CN><en>Keep the provider-collection local reference, ensuring the invocation boundary uses only this call's explicit input.</en></lang>
  const portProviders = input.portProviders;

  // <lang><zh-CN>先取得 manifest 诊断，之后才在对象可读的前提下检查 profile 与 provider 关系。</zh-CN><en>Obtain manifest diagnostics first, then check profile and provider relations only when objects are readable.</en></lang>
  const manifestValidation = validateManifestPair({ businessModule, implementationPackage });

  // <lang><zh-CN>复制诊断而不共享数组，使后续 push 不会改写 validateManifestPair 的返回结果。</zh-CN><en>Copy diagnostics rather than sharing the array so later pushes cannot rewrite the validateManifestPair return value.</en></lang>
  diagnostics.push(...manifestValidation.diagnostics);

  // <lang><zh-CN>只有 pair 合法时才做依赖、配置和 port 关系检查，避免无效字段造成误导性二次错误。</zh-CN><en>Check dependency, configuration, and port relations only when the pair is valid, avoiding misleading secondary errors from invalid fields.</en></lang>
  if (manifestValidation.ok) {
    // <lang><zh-CN>profile 校验不调用任何 provider，只验证声明式选择。</zh-CN><en>Profile validation invokes no provider and verifies only declarative selections.</en></lang>
    validateProfile(profile, businessModule, implementationPackage, diagnostics);

    // <lang><zh-CN>port 校验只核对对象与 contract，不执行 query、detail 或 session 行为。</zh-CN><en>Port validation checks only objects and contracts and executes no query, detail, or session behavior.</en></lang>
    validatePortProviders(businessModule, portProviders, diagnostics);
  }

  // <lang><zh-CN>存在任一诊断时不创建 composition，防止调用方错误地获得部分可用的对象。</zh-CN><en>When any diagnostic exists, do not create a composition, preventing callers from receiving a partially usable object by mistake.</en></lang>
  if (diagnostics.length > 0) {
    // <lang><zh-CN>返回诊断副本，不在失败对象中保留不可信输入引用。</zh-CN><en>Return diagnostic copies and retain no untrusted input reference in the failure object.</en></lang>
    return {
      ok: false,
      diagnostics
    };
  }

  // <lang><zh-CN>所有关系通过后才创建无副作用 composition 调用面。</zh-CN><en>Create the side-effect-free composition invocation surface only after all relations pass.</en></lang>
  const composition = createComposition(businessModule, implementationPackage, profile, portProviders);

  // <lang><zh-CN>成功结果仍显式携带空 diagnostics，保持成功/失败返回形状稳定。</zh-CN><en>The success result still explicitly carries empty diagnostics, keeping success/failure return shape stable.</en></lang>
  return {
    ok: true,
    diagnostics,
    composition
  };
}
