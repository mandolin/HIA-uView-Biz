/**
 * <lang><zh-CN>显式、进程内的 Biz 能力生命周期 runtime；只组合已提供单元，不发现包、不执行 hook，也不访问外部资源。</zh-CN><en>Explicit process-local Biz capability lifecycle runtime; it composes only supplied units, discovers no packages, executes no hooks, and accesses no external resources.</en></lang>
 * @lang zh-CN runtime 复用 core 装配并管理 disabled/enabled 状态、模块依赖、双向冲突、唯一 owner、显式调用与脱敏 snapshot。
 * @lang en The runtime reuses core assembly and manages disabled/enabled state, module dependencies, symmetric conflicts, unique ownership, explicit invocation, and redacted snapshots.
 */

import { assembleComposition } from '@hia-uview/biz-core';

/**
 * <lang><zh-CN>判断未知输入是否为可安全读取自有字段的普通记录。</zh-CN><en>Determines whether unknown input is a record whose own fields can be read safely.</en></lang>
 *
 * @param {unknown} value 待检查值。 / Value to inspect.
 * @returns {boolean} 是否为非数组对象。 / Whether the value is a non-array object.
 * @lang zh-CN 本检查只建立最小 shape guard，不把 class instance 或 provider 当作可序列化数据。
 * @lang en This check provides only a minimum shape guard and does not treat class instances or providers as serializable data.
 */
function isRecord(value) {
  // <lang><zh-CN>排除 null 与数组，避免后续字段读取产生误导性关系判断。</zh-CN><en>Exclude null and arrays, avoiding misleading relationship checks during later field reads.</en></lang>
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * <lang><zh-CN>判断值是否可作为长度受限的公开稳定标识进入 diagnostic。</zh-CN><en>Determines whether a value may enter a diagnostic as a bounded public stable identifier.</en></lang>
 *
 * @param {unknown} value 候选标识。 / Candidate identifier.
 * @returns {boolean} 是否满足小写 dotted/dashed ID 与长度边界。 / Whether it satisfies the lowercase dotted/dashed ID and length bound.
 * @lang zh-CN guard 防止 unknown 操作把任意调用方文本、路径或长 payload 误放入 subjectId。
 * @lang en The guard prevents an unknown operation from placing arbitrary caller text, paths, or long payloads into subjectId.
 */
function isPublicIdentifier(value) {
  // <lang><zh-CN>先约束类型与 128 字符上限，再执行无回溯风险的稳定 ID 匹配。</zh-CN><en>Constrain type and the 128-character maximum before matching the stable ID with no backtracking risk.</en></lang>
  return typeof value === 'string'
    && value.length <= 128
    && /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(value);
}

/**
 * <lang><zh-CN>创建不含输入、manifest、provider 或原始异常的双语 lifecycle 诊断。</zh-CN><en>Creates a bilingual lifecycle diagnostic containing no input, manifest, provider, or raw exception.</en></lang>
 *
 * @param {string} code 稳定机器代码。 / Stable machine code.
 * @param {string} zhHans 中文说明。 / Chinese explanation.
 * @param {string} english 英文说明。 / English explanation.
 * @param {string} [subjectId] 可公开的相关稳定 ID。 / Relevant public-safe stable ID.
 * @returns {object} public-safe diagnostic。 / Public-safe diagnostic.
 * @lang zh-CN subjectId 只接受 runtime 已验证或调用方显式提供的标识；诊断不回显候选对象。
 * @lang en subjectId accepts only a runtime-validated or caller-explicit identifier; diagnostics never echo candidate objects.
 */
function createDiagnostic(code, zhHans, english, subjectId) {
  // <lang><zh-CN>先构造固定字段，确保所有操作结果都具有相同的中英 message shape。</zh-CN><en>Construct fixed fields first so every operation result has the same Chinese-English message shape.</en></lang>
  const diagnostic = {
    code,
    message: {
      'zh-Hans': zhHans,
      en: english
    }
  };

  // <lang><zh-CN>仅在 subjectId 通过公开稳定 ID guard 时添加，避免序列化任意调用方文本。</zh-CN><en>Add subjectId only after it passes the public stable-ID guard, avoiding serialization of arbitrary caller text.</en></lang>
  if (isPublicIdentifier(subjectId)) {
    // <lang><zh-CN>稳定 ID 只用于定位关系，不携带输入、路径或实现内容。</zh-CN><en>The stable ID locates only a relationship and carries no input, path, or implementation content.</en></lang>
    diagnostic.subjectId = subjectId;
  }

  // <lang><zh-CN>返回新对象，使一次操作的诊断不会被其他操作共享。</zh-CN><en>Return a new object so one operation's diagnostic is not shared with another operation.</en></lang>
  return diagnostic;
}

/**
 * <lang><zh-CN>创建 lifecycle 操作成功结果。</zh-CN><en>Creates a successful lifecycle operation result.</en></lang>
 *
 * @returns {{ok: true, diagnostics: object[]}} 无诊断的成功结果。 / Successful result without diagnostics.
 * @lang zh-CN 操作结果不附带内部 record 或 snapshot，调用方需要时须显式调用 snapshot。
 * @lang en Operation results expose no internal record or snapshot; callers explicitly request a snapshot when needed.
 */
function createSuccess() {
  // <lang><zh-CN>每次返回新数组，避免调用方修改影响后续操作。</zh-CN><en>Return a fresh array each time so caller mutation cannot affect later operations.</en></lang>
  return { ok: true, diagnostics: [] };
}

/**
 * <lang><zh-CN>创建只含一个 public-safe 诊断的 lifecycle 失败结果。</zh-CN><en>Creates a lifecycle failure result containing one public-safe diagnostic.</en></lang>
 *
 * @param {object} diagnostic 当前失败的稳定诊断。 / Stable diagnostic for the current failure.
 * @returns {{ok: false, diagnostics: object[]}} 失败结果。 / Failure result.
 * @lang zh-CN 首轮每次转换在首个阻断条件处停止，避免同一状态产生顺序不稳定的复合诊断。
 * @lang en The first runtime stops each transition at its first blocker, avoiding order-unstable compound diagnostics for one state.
 */
function createFailure(diagnostic) {
  // <lang><zh-CN>以新数组包装诊断，保持返回对象与内部状态完全分离。</zh-CN><en>Wrap the diagnostic in a new array, keeping the result fully separate from internal state.</en></lang>
  return { ok: false, diagnostics: [diagnostic] };
}

/**
 * <lang><zh-CN>复制显式 provider 表面，使安装后的路由不受调用方替换 provider 对象影响。</zh-CN><en>Copies the explicit provider surface so post-install routing is unaffected by caller replacement of provider objects.</en></lang>
 *
 * @param {unknown} portProviders 候选 provider 集合。 / Candidate provider collection.
 * @returns {unknown} 可交给 core 的隔离表面，或原无效值。 / An isolated surface for core, or the original invalid value.
 * @lang zh-CN 只浅复制 contract/invoke 所在对象并保留函数引用；不执行、序列化或深读 provider。
 * @lang en Only objects containing contract/invoke are shallow-copied while function references are retained; providers are not executed, serialized, or deeply read.
 */
function copyPortProviders(portProviders) {
  // <lang><zh-CN>无效集合原样交给 core 生成既有 shape 诊断，不在 lifecycle 层猜测修复。</zh-CN><en>Pass an invalid collection unchanged to core for its existing shape diagnostic instead of guessing a repair in the lifecycle layer.</en></lang>
  if (!isRecord(portProviders)) {
    // <lang><zh-CN>直接返回只用于校验，不会保留在成功 record 中。</zh-CN><en>The direct return is used only for validation and is never retained in a successful record.</en></lang>
    return portProviders;
  }

  // <lang><zh-CN>新对象作为本次装配的 provider 索引，切断调用方对索引本身的后续替换。</zh-CN><en>A new object indexes providers for this assembly, cutting off later caller replacement of the index itself.</en></lang>
  const copiedProviders = {};

  // <lang><zh-CN>只遍历显式自有条目，不使用全局 registry 或原型链发现。</zh-CN><en>Iterate only explicit own entries, using neither global registry nor prototype-chain discovery.</en></lang>
  for (const [portId, provider] of Object.entries(portProviders)) {
    // <lang><zh-CN>合法 provider 以浅副本保留；无效值原样交给 core 报告缺失或 shape 错误。</zh-CN><en>Retain a valid provider as a shallow copy; pass invalid values unchanged so core can report missing or shape errors.</en></lang>
    copiedProviders[portId] = isRecord(provider) ? { ...provider } : provider;
  }

  // <lang><zh-CN>返回隔离索引；本函数不冻结 provider 函数或其私有闭包。</zh-CN><en>Return the isolated index; this function freezes neither provider functions nor their private closures.</en></lang>
  return copiedProviders;
}

/**
 * <lang><zh-CN>表示显式 capability route 无法调用的稳定、脱敏错误。</zh-CN><en>Represents a stable redacted error for an explicit capability route that cannot be invoked.</en></lang>
 *
 * @augments RangeError
 * @lang zh-CN 错误 message 不包含 moduleId、portId 或 input；机器调用方应读取 code。
 * @lang en The error message contains no moduleId, portId, or input; machine callers should read code.
 */
export class CapabilityInvocationError extends RangeError {
  /**
   * <lang><zh-CN>创建具有稳定 code 的受控调用错误。</zh-CN><en>Creates a controlled invocation error with a stable code.</en></lang>
   *
   * @param {string} code 稳定调用错误代码。 / Stable invocation error code.
   * @lang zh-CN 构造器不接收 payload，从 API 形状上阻止输入被拼入错误。
   * @lang en The constructor accepts no payload, preventing input from being added to the error by API shape.
   */
  constructor(code) {
    // <lang><zh-CN>固定 message 只提示调用边界被拒绝，不暴露失败对象或路由标识。</zh-CN><en>The fixed message states only that the invocation boundary rejected the call and exposes no failed object or route identifier.</en></lang>
    super('The capability invocation is not available.');

    // <lang><zh-CN>稳定 name 便于日志分类，同时不引入本机或业务上下文。</zh-CN><en>The stable name supports log classification without introducing local-machine or business context.</en></lang>
    this.name = 'CapabilityInvocationError';

    // <lang><zh-CN>code 是唯一机器可读分类，不包含调用输入。</zh-CN><en>The code is the sole machine-readable category and contains no invocation input.</en></lang>
    this.code = code;
  }
}

/**
 * <lang><zh-CN>创建一个无全局状态的显式能力生命周期 runtime。</zh-CN><en>Creates an explicit capability lifecycle runtime with no global state.</en></lang>
 *
 * @returns {{install: Function, enable: Function, disable: Function, uninstall: Function, invoke: Function, snapshot: Function}} lifecycle API。 / Lifecycle API.
 * @lang zh-CN 每次调用返回独立 Map 状态；runtime 不读写网络、文件、环境、registry、storage、credential 或生命周期 hook。
 * @lang en Each call returns independent Map state; the runtime reads or writes no network, files, environment, registry, storage, credentials, or lifecycle hooks.
 */
export function createCapabilityRuntime() {
  // <lang><zh-CN>module Map 是唯一 capability record 所有者，不暴露给返回 API。</zh-CN><en>The module map is the sole owner of capability records and is not exposed by the returned API.</en></lang>
  const unitsByModuleId = new Map();

  // <lang><zh-CN>反向实现包索引只保存稳定 ID，用于在安装前拒绝重复 owner。</zh-CN><en>The reverse implementation-package index stores only stable IDs and rejects duplicate ownership before installation.</en></lang>
  const moduleIdByImplementationPackageId = new Map();

  /**
   * <lang><zh-CN>把一个已通过 core 装配的显式能力单元加入当前 runtime，并置为 disabled。</zh-CN><en>Adds an explicitly supplied capability unit that passes core assembly to this runtime in the disabled state.</en></lang>
   *
   * @param {unknown} unit 候选 capability unit。 / Candidate capability unit.
   * @returns {{ok: boolean, diagnostics: object[]}} 原子安装结果。 / Atomic installation result.
   * @lang zh-CN 安装不执行 provider/hook，不自动启用依赖，也不进行 npm、registry、目录或远程发现。
   * @lang en Installation executes no provider/hook, automatically enables no dependency, and performs no npm, registry, directory, or remote discovery.
   */
  const install = (unit) => {
    // <lang><zh-CN>只为合法对象读取四项 core 输入；其他值交给 core 产生结构化失败。</zh-CN><en>Read the four core inputs only from a valid object; other values go to core for structured failure.</en></lang>
    const assemblyInput = isRecord(unit)
      ? {
          businessModule: unit.businessModule,
          implementationPackage: unit.implementationPackage,
          profile: unit.profile,
          portProviders: copyPortProviders(unit.portProviders)
        }
      : unit;

    // <lang><zh-CN>复用 core 作为唯一 manifest/profile/port 解释器，不复制其校验规则。</zh-CN><en>Reuse core as the sole manifest/profile/port interpreter rather than duplicating its validation rules.</en></lang>
    const assembly = assembleComposition(assemblyInput);

    // <lang><zh-CN>装配失败只返回 lifecycle 类别，不保留候选或 core diagnostic 内容。</zh-CN><en>On assembly failure, return only a lifecycle category and retain neither candidate nor core diagnostic contents.</en></lang>
    if (!assembly.ok) {
      // <lang><zh-CN>稳定类别允许宿主回到 manifest/core 校验工具查看独立详情。</zh-CN><en>The stable category lets a host return to manifest/core validation tooling for separate details.</en></lang>
      return createFailure(createDiagnostic(
        'capability.unit.invalid',
        '能力单元未通过既有 core 装配。',
        'The capability unit did not pass existing core assembly.'
      ));
    }

    // <lang><zh-CN>成功 composition 的标识已由 core manifest pair 校验，可安全用于 runtime 索引。</zh-CN><en>The successful composition identifiers were validated by the core manifest pair and are safe for runtime indexing.</en></lang>
    const moduleId = assembly.composition.moduleId;

    // <lang><zh-CN>实现包 ID 同样来自已验证 composition，而不是候选的任意旁路字段。</zh-CN><en>The implementation-package ID also comes from the validated composition rather than an arbitrary candidate side field.</en></lang>
    const implementationPackageId = assembly.composition.implementationPackageId;

    // <lang><zh-CN>module owner 已存在时，在任何 Map 变更前拒绝候选。</zh-CN><en>When the module owner already exists, reject the candidate before any map change.</en></lang>
    if (unitsByModuleId.has(moduleId)) {
      // <lang><zh-CN>诊断只包含已验证 module ID，不回显候选实现对象。</zh-CN><en>The diagnostic contains only the validated module ID and does not echo the candidate implementation object.</en></lang>
      return createFailure(createDiagnostic(
        'capability.module.duplicate',
        '当前 runtime 已有该业务模块主责。',
        'The current runtime already has an owner for this business module.',
        moduleId
      ));
    }

    // <lang><zh-CN>implementation owner 已存在时也在状态提交前拒绝，防止一包多主责的隐式别名。</zh-CN><en>Also reject an existing implementation owner before state commit, preventing an implicit alias that gives one package multiple owners.</en></lang>
    if (moduleIdByImplementationPackageId.has(implementationPackageId)) {
      // <lang><zh-CN>相关 ID 是公开 manifest 标识，不含 package 路径或 registry 信息。</zh-CN><en>The relevant ID is a public manifest identifier containing no package path or registry information.</en></lang>
      return createFailure(createDiagnostic(
        'capability.implementation.duplicate',
        '当前 runtime 已登记该实现包主责。',
        'The current runtime already registers this implementation-package owner.',
        implementationPackageId
      ));
    }

    // <lang><zh-CN>依赖从已通过 core 校验的 manifest 复制并排序，避免候选后续修改与遍历顺序漂移。</zh-CN><en>Copy and sort dependencies from the core-validated manifest, avoiding later candidate mutation and traversal-order drift.</en></lang>
    const dependencies = [...unit.businessModule.dependencies].sort();

    // <lang><zh-CN>冲突也只保留稳定 ID 副本，不保留整个 manifest。</zh-CN><en>Also retain only a stable-ID copy of conflicts and not the full manifest.</en></lang>
    const conflicts = [...unit.businessModule.conflicts].sort();

    // <lang><zh-CN>required port ID 集合用于在委托 composition 前提供稳定未知-port 错误。</zh-CN><en>The required-port ID set provides a stable unknown-port error before delegating to the composition.</en></lang>
    const portIds = unit.businessModule.contracts.ports
      .filter((port) => port.direction === 'required')
      .map((port) => port.id);

    // <lang><zh-CN>先构造完整私有 record，尚不改变任一索引。</zh-CN><en>Construct the complete private record before changing either index.</en></lang>
    const record = {
      moduleId,
      implementationPackageId,
      state: 'disabled',
      dependencies,
      conflicts,
      portIds,
      composition: assembly.composition
    };

    // <lang><zh-CN>在所有检查通过后一次登记 module record。</zh-CN><en>Register the module record once after all checks pass.</en></lang>
    unitsByModuleId.set(moduleId, record);

    // <lang><zh-CN>同步登记反向 owner，使两个索引始终在成功操作后保持一致。</zh-CN><en>Register the reverse owner at the same successful-operation boundary, keeping both indexes consistent.</en></lang>
    moduleIdByImplementationPackageId.set(implementationPackageId, moduleId);

    // <lang><zh-CN>成功不自动 enable 或调用任何 provider。</zh-CN><en>Success neither automatically enables the unit nor invokes any provider.</en></lang>
    return createSuccess();
  };

  /**
   * <lang><zh-CN>在依赖已启用且不存在双向冲突时显式启用一个已安装单元。</zh-CN><en>Explicitly enables an installed unit when dependencies are enabled and no symmetric conflict exists.</en></lang>
   *
   * @param {string} moduleId 目标业务模块 ID。 / Target business-module ID.
   * @returns {{ok: boolean, diagnostics: object[]}} 原子启用结果。 / Atomic enablement result.
   * @lang zh-CN 启用不自动转换依赖，不运行 provider/hook，也不改变其他单元。
   * @lang en Enablement automatically transitions no dependency, runs no provider/hook, and changes no other unit.
   */
  const enable = (moduleId) => {
    // <lang><zh-CN>按显式 ID 查找目标，不使用实现包名、路径或函数名猜测。</zh-CN><en>Find the target by explicit ID and never guess from implementation-package name, path, or function name.</en></lang>
    const record = unitsByModuleId.get(moduleId);

    // <lang><zh-CN>未知模块在读取 state 前返回稳定失败。</zh-CN><en>An unknown module returns a stable failure before any state read.</en></lang>
    if (record === undefined) {
      // <lang><zh-CN>调用方 ID 可用于定位配置错误，但不会触发 discovery。</zh-CN><en>The caller ID can locate a configuration error but triggers no discovery.</en></lang>
      return createFailure(createDiagnostic(
        'capability.module.unknown',
        '当前 runtime 未安装该业务模块。',
        'The business module is not installed in this runtime.',
        moduleId
      ));
    }

    // <lang><zh-CN>首轮状态机要求 disabled → enabled，不把重复 enable 静默当成功。</zh-CN><en>The first state machine requires disabled-to-enabled and does not silently treat repeated enablement as success.</en></lang>
    if (record.state !== 'disabled') {
      // <lang><zh-CN>稳定 state 诊断不返回完整 record。</zh-CN><en>The stable state diagnostic does not return the complete record.</en></lang>
      return createFailure(createDiagnostic(
        'capability.state.invalid',
        '当前状态不允许启用该业务模块。',
        'The current state does not allow enabling this business module.',
        moduleId
      ));
    }

    // <lang><zh-CN>逐个验证依赖实际处于 enabled，而不只相信 profile 中出现了 ID。</zh-CN><en>Validate every dependency as actually enabled rather than merely trusting that its ID appears in a profile.</en></lang>
    for (const dependencyId of record.dependencies) {
      // <lang><zh-CN>依赖 record 只在当前 runtime 内查找，不自动下载或安装。</zh-CN><en>Look up the dependency record only in this runtime and never download or install it automatically.</en></lang>
      const dependency = unitsByModuleId.get(dependencyId);

      // <lang><zh-CN>缺失与 disabled 使用同一 actionable 类别，宿主据此显式准备或启用依赖。</zh-CN><en>Missing and disabled dependencies share one actionable category so the host can explicitly prepare or enable the dependency.</en></lang>
      if (dependency === undefined || dependency.state !== 'enabled') {
        // <lang><zh-CN>subject 指向依赖 ID，不包含目标单元或 provider。</zh-CN><en>The subject points to the dependency ID and contains no target unit or provider.</en></lang>
        return createFailure(createDiagnostic(
          'capability.dependency.unavailable',
          '业务模块依赖尚未安装并启用。',
          'A business-module dependency is not installed and enabled.',
          dependencyId
        ));
      }
    }

    // <lang><zh-CN>检查全部已启用单元，以任一方声明的并集形成对称冲突。</zh-CN><en>Inspect all enabled units and form a symmetric conflict from the union of either side's declarations.</en></lang>
    for (const enabledRecord of unitsByModuleId.values()) {
      // <lang><zh-CN>disabled 单元不构成活动冲突；目标自身此时也仍为 disabled。</zh-CN><en>A disabled unit creates no active conflict; the target itself is also still disabled here.</en></lang>
      if (enabledRecord.state !== 'enabled') {
        // <lang><zh-CN>跳过不活动单元，不改变其状态。</zh-CN><en>Skip inactive units without changing their state.</en></lang>
        continue;
      }

      // <lang><zh-CN>目标声明对方或对方声明目标都构成阻断。</zh-CN><en>Either the target declaring the other side or the other side declaring the target creates a blocker.</en></lang>
      const conflictsInEitherDirection = record.conflicts.includes(enabledRecord.moduleId)
        || enabledRecord.conflicts.includes(record.moduleId);

      // <lang><zh-CN>发现首个稳定排序无关的活动冲突即拒绝状态提交。</zh-CN><en>Reject state commit upon the first active conflict independent of declaration direction.</en></lang>
      if (conflictsInEitherDirection) {
        // <lang><zh-CN>subject 只标识当前已启用冲突模块。</zh-CN><en>The subject identifies only the currently enabled conflicting module.</en></lang>
        return createFailure(createDiagnostic(
          'capability.conflict.enabled',
          '存在与目标冲突的已启用业务模块。',
          'An enabled business module conflicts with the target.',
          enabledRecord.moduleId
        ));
      }
    }

    // <lang><zh-CN>所有依赖与冲突检查通过后才提交唯一状态变化。</zh-CN><en>Commit the sole state change only after every dependency and conflict check passes.</en></lang>
    record.state = 'enabled';

    // <lang><zh-CN>启用成功不执行 provider 或 hook。</zh-CN><en>Successful enablement executes no provider or hook.</en></lang>
    return createSuccess();
  };

  /**
   * <lang><zh-CN>当没有已启用 dependent 时停用一个已启用单元。</zh-CN><en>Disables an enabled unit when no enabled dependent remains.</en></lang>
   *
   * @param {string} moduleId 目标业务模块 ID。 / Target business-module ID.
   * @returns {{ok: boolean, diagnostics: object[]}} 原子停用结果。 / Atomic disablement result.
   * @lang zh-CN 停用只阻止后续路由，不取消 provider 已返回的调用，也不执行 cleanup hook。
   * @lang en Disablement only prevents later routing; it neither cancels a call already returned by a provider nor executes a cleanup hook.
   */
  const disable = (moduleId) => {
    // <lang><zh-CN>从私有 module 索引读取目标。</zh-CN><en>Read the target from the private module index.</en></lang>
    const record = unitsByModuleId.get(moduleId);

    // <lang><zh-CN>未知模块不能产生隐式空记录。</zh-CN><en>An unknown module cannot create an implicit empty record.</en></lang>
    if (record === undefined) {
      // <lang><zh-CN>返回与 enable 相同的 unknown 类别，便于宿主统一处理。</zh-CN><en>Return the same unknown category as enablement so a host can handle it consistently.</en></lang>
      return createFailure(createDiagnostic(
        'capability.module.unknown',
        '当前 runtime 未安装该业务模块。',
        'The business module is not installed in this runtime.',
        moduleId
      ));
    }

    // <lang><zh-CN>只有 enabled → disabled 是合法停用转换。</zh-CN><en>Only enabled-to-disabled is a valid disablement transition.</en></lang>
    if (record.state !== 'enabled') {
      // <lang><zh-CN>重复停用保持失败原子性，不更改其他单元。</zh-CN><en>Repeated disablement remains an atomic failure and changes no other unit.</en></lang>
      return createFailure(createDiagnostic(
        'capability.state.invalid',
        '当前状态不允许停用该业务模块。',
        'The current state does not allow disabling this business module.',
        moduleId
      ));
    }

    // <lang><zh-CN>遍历已安装单元查找仍活动的 dependent。</zh-CN><en>Iterate installed units to find an active dependent.</en></lang>
    for (const candidateDependent of unitsByModuleId.values()) {
      // <lang><zh-CN>只有 enabled 且声明目标为依赖的单元可以阻止停用。</zh-CN><en>Only an enabled unit declaring the target as a dependency can prevent disablement.</en></lang>
      const isEnabledDependent = candidateDependent.state === 'enabled'
        && candidateDependent.dependencies.includes(moduleId);

      // <lang><zh-CN>发现 dependent 时拒绝，不自动递归停用。</zh-CN><en>Reject when a dependent is found and do not recursively disable it.</en></lang>
      if (isEnabledDependent) {
        // <lang><zh-CN>subject 指向应先停用的 dependent。</zh-CN><en>The subject points to the dependent that must be disabled first.</en></lang>
        return createFailure(createDiagnostic(
          'capability.dependent.enabled',
          '仍有已启用业务模块依赖该目标。',
          'An enabled business module still depends on the target.',
          candidateDependent.moduleId
        ));
      }
    }

    // <lang><zh-CN>没有活动 dependent 后提交单一状态变化。</zh-CN><en>Commit the single state change after no active dependent remains.</en></lang>
    record.state = 'disabled';

    // <lang><zh-CN>返回成功且不调用 provider/hook。</zh-CN><en>Return success without invoking a provider or hook.</en></lang>
    return createSuccess();
  };

  /**
   * <lang><zh-CN>从当前 runtime 移除一个已停用能力单元及其两个 owner 索引。</zh-CN><en>Removes a disabled capability unit and both of its owner indexes from this runtime.</en></lang>
   *
   * @param {string} moduleId 目标业务模块 ID。 / Target business-module ID.
   * @returns {{ok: boolean, diagnostics: object[]}} 原子卸载结果。 / Atomic uninstallation result.
   * @lang zh-CN 卸载不是 npm 行为，不执行文件删除、package script、provider 或 cleanup hook。
   * @lang en Uninstallation is not npm behavior and executes no file deletion, package script, provider, or cleanup hook.
   */
  const uninstall = (moduleId) => {
    // <lang><zh-CN>只从当前 runtime 的私有索引解析目标。</zh-CN><en>Resolve the target only from this runtime's private index.</en></lang>
    const record = unitsByModuleId.get(moduleId);

    // <lang><zh-CN>未知目标不能触发 registry 或文件搜索。</zh-CN><en>An unknown target cannot trigger registry or file search.</en></lang>
    if (record === undefined) {
      // <lang><zh-CN>返回稳定 unknown，而不是将重复卸载视为成功。</zh-CN><en>Return stable unknown rather than treating repeated uninstallation as success.</en></lang>
      return createFailure(createDiagnostic(
        'capability.module.unknown',
        '当前 runtime 未安装该业务模块。',
        'The business module is not installed in this runtime.',
        moduleId
      ));
    }

    // <lang><zh-CN>enabled 单元必须先经过 dependent-safe disable。</zh-CN><en>An enabled unit must first pass dependent-safe disablement.</en></lang>
    if (record.state === 'enabled') {
      // <lang><zh-CN>专用代码使宿主明确先停用，而不是把错误误认为未知模块。</zh-CN><en>A dedicated code tells the host to disable first rather than mistaking the error for an unknown module.</en></lang>
      return createFailure(createDiagnostic(
        'capability.uninstall.enabled',
        '已启用业务模块必须先停用再卸载。',
        'An enabled business module must be disabled before uninstallation.',
        moduleId
      ));
    }

    // <lang><zh-CN>先移除 module record，使后续 invocation 不再能取得 composition。</zh-CN><en>Remove the module record first so later invocation can no longer obtain the composition.</en></lang>
    unitsByModuleId.delete(moduleId);

    // <lang><zh-CN>同步移除实现包 owner，允许以后显式安装替代或同 ID 单元。</zh-CN><en>Also remove the implementation-package owner, allowing a later explicit replacement or same-ID unit installation.</en></lang>
    moduleIdByImplementationPackageId.delete(record.implementationPackageId);

    // <lang><zh-CN>record 不再由 runtime Map 引用；没有 retained removed 状态。</zh-CN><en>The runtime maps no longer reference the record; there is no retained removed state.</en></lang>
    return createSuccess();
  };

  /**
   * <lang><zh-CN>通过显式 module/port ID 调用已启用单元的已验证 composition。</zh-CN><en>Invokes the validated composition of an enabled unit through explicit module and port IDs.</en></lang>
   *
   * @param {string} moduleId 目标业务模块 ID。 / Target business-module ID.
   * @param {string} portId 已声明 required-port ID。 / Declared required-port ID.
   * @param {unknown} input 传给 provider 的 module-owned 输入。 / Module-owned input passed to the provider.
   * @returns {unknown} provider 的 canonical result。 / Provider canonical result.
   * @throws {CapabilityInvocationError} 当 module 未安装、未启用或 port 未登记。 / When the module is not installed, not enabled, or the port is unregistered.
   * @lang zh-CN lifecycle 错误不序列化 input；合法路由不包裹 provider 返回值。
   * @lang en Lifecycle errors do not serialize input; a valid route does not wrap the provider return value.
   */
  const invoke = (moduleId, portId, input) => {
    // <lang><zh-CN>只从当前 runtime 查找模块，不使用全局 fallback。</zh-CN><en>Look up the module only in this runtime and use no global fallback.</en></lang>
    const record = unitsByModuleId.get(moduleId);

    // <lang><zh-CN>未知模块以固定错误拒绝，且不读取 input。</zh-CN><en>Reject an unknown module with a fixed error without reading input.</en></lang>
    if (record === undefined) {
      // <lang><zh-CN>错误构造器不接收 moduleId 或 payload。</zh-CN><en>The error constructor receives neither moduleId nor payload.</en></lang>
      throw new CapabilityInvocationError('capability.invocation.unknown');
    }

    // <lang><zh-CN>disabled 模块不对调用方暴露 composition。</zh-CN><en>A disabled module does not expose its composition to callers.</en></lang>
    if (record.state !== 'enabled') {
      // <lang><zh-CN>固定 code 允许宿主提示先启用，而不泄漏输入。</zh-CN><en>The fixed code lets a host request enablement without leaking input.</en></lang>
      throw new CapabilityInvocationError('capability.invocation.disabled');
    }

    // <lang><zh-CN>未登记 port 在进入 core/provider 前被稳定拒绝。</zh-CN><en>An unregistered port is rejected stably before entering core/provider.</en></lang>
    if (!record.portIds.includes(portId)) {
      // <lang><zh-CN>错误不拼接 portId，避免任意调用方字符串进入日志。</zh-CN><en>The error does not interpolate portId, preventing an arbitrary caller string from entering logs.</en></lang>
      throw new CapabilityInvocationError('capability.invocation.port-unregistered');
    }

    // <lang><zh-CN>仅合法显式路由委托给既有 composition；返回值保持 module canonical 语义。</zh-CN><en>Delegate only a valid explicit route to the existing composition; its return preserves module canonical semantics.</en></lang>
    return record.composition.invoke(portId, input);
  };

  /**
   * <lang><zh-CN>返回按 module ID 排序、与内部 record 分离的 public-safe lifecycle snapshot。</zh-CN><en>Returns a module-ID-sorted public-safe lifecycle snapshot detached from internal records.</en></lang>
   *
   * @returns {Array<{moduleId: string, implementationPackageId: string, state: string, dependencies: string[], conflicts: string[]}>} 脱敏状态列表。 / Redacted state list.
   * @lang zh-CN snapshot 不含 composition、manifest、profile、provider、hook、port、调用输入/输出或原始错误。
   * @lang en The snapshot contains no composition, manifest, profile, provider, hook, port, invocation input/output, or raw error.
   */
  const snapshot = () => {
    // <lang><zh-CN>从私有 record 投影白名单字段，并复制关系数组。</zh-CN><en>Project allowlisted fields from private records and copy relationship arrays.</en></lang>
    const entries = Array.from(unitsByModuleId.values(), (record) => ({
      moduleId: record.moduleId,
      implementationPackageId: record.implementationPackageId,
      state: record.state,
      dependencies: [...record.dependencies],
      conflicts: [...record.conflicts]
    }));

    // <lang><zh-CN>使用 code-point 比较形成不依赖插入顺序或系统 locale 的稳定排序。</zh-CN><en>Use code-point comparison for stable ordering independent of insertion order or system locale.</en></lang>
    entries.sort((left, right) => {
      // <lang><zh-CN>相等 ID 理论上被唯一 owner 门禁阻止；仍显式返回 0 保持比较器完整。</zh-CN><en>Equal IDs are theoretically prevented by unique ownership; still return zero explicitly for comparator completeness.</en></lang>
      if (left.moduleId === right.moduleId) {
        // <lang><zh-CN>相等时不重排。</zh-CN><en>Do not reorder equal values.</en></lang>
        return 0;
      }

      // <lang><zh-CN>布尔比较转为固定 -1/1，不调用 locale-sensitive API。</zh-CN><en>Convert the Boolean comparison to fixed -1/1 without a locale-sensitive API.</en></lang>
      return left.moduleId < right.moduleId ? -1 : 1;
    });

    // <lang><zh-CN>返回新数组；调用方修改 snapshot 不会写回 Map record。</zh-CN><en>Return a new array; caller mutation of the snapshot cannot write back to map records.</en></lang>
    return entries;
  };

  // <lang><zh-CN>冻结 API 容器，防止宿主替换操作函数；内部 Map 仍只由闭包管理。</zh-CN><en>Freeze the API container to prevent host replacement of operation functions; internal maps remain managed only by closure.</en></lang>
  return Object.freeze({
    install,
    enable,
    disable,
    uninstall,
    invoke,
    snapshot
  });
}
