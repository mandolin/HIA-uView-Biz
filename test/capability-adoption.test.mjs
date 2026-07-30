/**
 * <lang><zh-CN>能力采用 runtime 的确定性 acceptance：覆盖完整集合协调、依赖、受限呈现、状态变化、实现替换、失败回退与冲突。</zh-CN><en>Deterministic acceptance for the capability-adoption runtime, covering complete-set reconciliation, dependencies, bounded presentation, state changes, implementation replacement, failure rollback, and conflicts.</en></lang>
 * @lang zh-CN 测试只使用显式进程内单元和独立编写的中性 fixture；不读取 registry、网络、环境、storage、credential 或外部项目。
 * @lang en The tests use only explicit process-local units and independently written neutral fixtures; they read no registry, network, environment, storage, credentials, or external projects.
 */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// <lang><zh-CN>从待实现的采用 package 导入公开 runtime；首轮测试应在该文件不存在时失败。</zh-CN><en>Import the public runtime from the adoption package to be implemented; the first test run should fail while that file is absent.</en></lang>
import {
  CapabilityAdoptionInvocationError,
  createCapabilityAdoptionRuntime
} from '../packages/adoption-runtime/src/index.mjs';

// <lang><zh-CN>复用既有中性 catalog 声明与 mock provider，不复制其领域实现。</zh-CN><en>Reuse the existing neutral catalog declarations and mock providers without copying their domain implementation.</en></lang>
import {
  createCatalogQueryDetailMock,
  createExampleManifests
} from '../modules/example-catalog-query-detail/src/index.mjs';

// <lang><zh-CN>从新 reference-data module 获取显式 v1/v2 fixture 单元。</zh-CN><en>Obtain explicit v1/v2 fixture units from the new reference-data module.</en></lang>
import {
  REFERENCE_DATA_MODULE_ID,
  createReferenceDataCapabilityUnit
} from '../modules/example-reference-data/src/index.mjs';

/**
 * <lang><zh-CN>当前中性目录能力的稳定 module ID。</zh-CN><en>The stable module ID of the current neutral catalog capability.</en></lang>
 * @lang zh-CN 该常量只供测试构造采用 profile，不代表行业模块。
 * @lang en This constant only constructs adoption profiles and represents no industry module.
 */
const CATALOG_MODULE_ID = 'example.catalog-query-detail';

/**
 * <lang><zh-CN>初始 catalog mock implementation 的稳定 ID。</zh-CN><en>The stable ID of the initial catalog mock implementation.</en></lang>
 * @lang zh-CN ID 来自现有公开 manifest，不是 package 路径。
 * @lang en The ID comes from the existing public manifest and is not a package path.
 */
const CATALOG_IMPLEMENTATION_ID = 'example.catalog-query-detail.mock-implementation';

/**
 * <lang><zh-CN>测试宿主允许的呈现 block。</zh-CN><en>Presentation blocks allowed by the test host.</en></lang>
 * @lang zh-CN allowlist 与代表性页面已登记 block 对齐，不接受任意组件名。
 * @lang en The allowlist aligns with blocks registered by the representative page and accepts no arbitrary component name.
 */
const REGISTERED_BLOCKS = [
  'query-context',
  'catalog-list',
  'entry-detail'
];

/**
 * <lang><zh-CN>测试宿主允许的声明式可见性值。</zh-CN><en>Declarative visibility values allowed by the test host.</en></lang>
 * @lang zh-CN 值是稳定枚举，不是表达式或脚本。
 * @lang en The values are stable enums rather than expressions or scripts.
 */
const REGISTERED_VISIBILITY = [
  'always',
  'has-results',
  'has-selection'
];

/**
 * <lang><zh-CN>测试宿主允许的分页大小。</zh-CN><en>Page sizes allowed by the test host.</en></lang>
 * @lang zh-CN 该集合验证 profile 不能自行扩大分页策略。
 * @lang en This set verifies that a profile cannot expand the paging policy by itself.
 */
const REGISTERED_PAGE_SIZES = [1, 5, 10, 20];

/**
 * <lang><zh-CN>从当前公开仓读取并解析一个 adoption profile 示例。</zh-CN><en>Reads and parses one adoption-profile example from the current public repository.</en></lang>
 *
 * @param {string} relativeUrl <lang><zh-CN>相对当前测试模块的固定仓内 URL。</zh-CN><en>Fixed repository-local URL relative to this test module.</en></lang>
 * @returns {Promise<object>} <lang><zh-CN>仍需 runtime 完整校验的普通 JSON 对象。</zh-CN><en>An ordinary JSON object that still requires complete runtime validation.</en></lang>
 * @lang zh-CN 调用点只使用测试文件中固定字面量，不接受用户路径、环境或网络 URL。
 * @lang en Call sites use only fixed literals in this test file and accept no user path, environment value, or network URL.
 */
async function loadAdoptionProfileExample(relativeUrl) {
  // <lang><zh-CN>将固定相对 URL 解析到当前仓内 docs/contracts/examples。</zh-CN><en>Resolve the fixed relative URL into this repository's docs/contracts/examples directory.</en></lang>
  const profileUrl = new URL(relativeUrl, import.meta.url);

  // <lang><zh-CN>以 UTF-8 只读加载仓内 JSON example。</zh-CN><en>Read the checked-in JSON example as UTF-8.</en></lang>
  const profileText = await readFile(profileUrl, 'utf8');

  // <lang><zh-CN>解析只生成普通数据；是否可采用仍由 runtime validator 决定。</zh-CN><en>Parsing creates ordinary data only; the runtime validator still decides whether it is adoptable.</en></lang>
  return JSON.parse(profileText);
}

/**
 * <lang><zh-CN>创建具有显式呈现 allowlist 的独立 adoption runtime。</zh-CN><en>Creates an independent adoption runtime with explicit presentation allowlists.</en></lang>
 *
 * @returns {object} <lang><zh-CN>没有活动组合的新 runtime。</zh-CN><en>A new runtime with no active composition.</en></lang>
 * @lang zh-CN 每个测试使用独立实例，避免 capability/provider 状态跨测试泄漏。
 * @lang en Every test uses an independent instance, avoiding capability/provider state leaking across tests.
 */
function createRuntime() {
  // <lang><zh-CN>复制数组，使 runtime 的 policy 不依赖测试常量的后续可变引用。</zh-CN><en>Copy the arrays so runtime policy does not depend on later mutation of test constants.</en></lang>
  return createCapabilityAdoptionRuntime({
    registeredBlocks: [...REGISTERED_BLOCKS],
    registeredVisibility: [...REGISTERED_VISIBILITY],
    allowedPageSizes: [...REGISTERED_PAGE_SIZES]
  });
}

/**
 * <lang><zh-CN>创建当前 catalog mock 的显式 capability unit。</zh-CN><en>Creates an explicit capability unit for the current catalog mock.</en></lang>
 *
 * @returns {object} <lang><zh-CN>可交给 adoption runtime 的完整 catalog 单元。</zh-CN><en>A complete catalog unit that can be supplied to the adoption runtime.</en></lang>
 * @lang zh-CN 单元显式包含声明与 provider，不通过包名或文件系统发现。
 * @lang en The unit explicitly contains declarations and providers and is not discovered by package name or filesystem.
 */
function createCatalogCapabilityUnit() {
  // <lang><zh-CN>每次创建新的 manifest/profile 对象，允许失败测试独立修改候选。</zh-CN><en>Create fresh manifest/profile objects each time so failure tests can mutate a candidate independently.</en></lang>
  const manifests = createExampleManifests();

  // <lang><zh-CN>创建确定性 first-page mock provider 与 route projection。</zh-CN><en>Create deterministic first-page mock providers and route projection.</en></lang>
  const capability = createCatalogQueryDetailMock({
    fixtureCase: 'first-page'
  });

  // <lang><zh-CN>组合既有 lifecycle unit shape，不添加旁路 ID 或隐藏 metadata。</zh-CN><en>Compose the existing lifecycle-unit shape without side-channel IDs or hidden metadata.</en></lang>
  return {
    businessModule: manifests.businessModule,
    implementationPackage: manifests.implementationPackage,
    profile: manifests.profile,
    portProviders: capability.portProviders
  };
}

/**
 * <lang><zh-CN>创建首批两能力 adoption profile。</zh-CN><en>Creates the initial two-capability adoption profile.</en></lang>
 *
 * @param {object} [options] <lang><zh-CN>reference implementation、能力状态和呈现覆盖。</zh-CN><en>Reference implementation, capability states, and presentation overrides.</en></lang>
 * @returns {object} <lang><zh-CN>新的 JSON-compatible 采用声明。</zh-CN><en>A new JSON-compatible adoption declaration.</en></lang>
 * @lang zh-CN helper 只接受测试内显式值；runtime 仍独立执行完整校验。
 * @lang en The helper accepts only explicit test values; the runtime still performs complete independent validation.
 */
function createAdoptionProfile(options = {}) {
  // <lang><zh-CN>默认选择 reference-data v1，以固定首次采用预期。</zh-CN><en>Select reference-data v1 by default to fix initial-adoption expectations.</en></lang>
  const referenceImplementationPackageId = options.referenceImplementationPackageId
    ?? 'example.reference-data.fixture-v1';

  // <lang><zh-CN>reference 默认启用，因为 catalog 声明依赖它。</zh-CN><en>Reference data is enabled by default because the catalog declares it as a dependency.</en></lang>
  const referenceState = options.referenceState ?? 'enabled';

  // <lang><zh-CN>catalog 默认启用以形成可调用组合。</zh-CN><en>The catalog is enabled by default to form an invokable composition.</en></lang>
  const catalogState = options.catalogState ?? 'enabled';

  // <lang><zh-CN>pageSize 默认使用公开示例的 5。</zh-CN><en>Page size defaults to the public example's value of 5.</en></lang>
  const pageSize = options.pageSize ?? 5;

  // <lang><zh-CN>catalog visibility 可在 allowlist 内覆盖，用于验证呈现变更。</zh-CN><en>Catalog visibility may be overridden within the allowlist to verify presentation changes.</en></lang>
  const catalogVisibility = options.catalogVisibility ?? 'always';

  // <lang><zh-CN>返回完整期望集合；顺序不承担 dependency order 语义。</zh-CN><en>Return the complete desired set; array order does not carry dependency-order semantics.</en></lang>
  return {
    adoptionVersion: '1.0',
    kind: 'capability-adoption-profile',
    profileId: 'example.catalog-composed',
    capabilities: [
      {
        moduleId: REFERENCE_DATA_MODULE_ID,
        implementationPackageId: referenceImplementationPackageId,
        state: referenceState
      },
      {
        moduleId: CATALOG_MODULE_ID,
        implementationPackageId: CATALOG_IMPLEMENTATION_ID,
        state: catalogState
      }
    ],
    presentation: {
      blocks: [
        {
          id: 'query-context',
          visibility: 'always'
        },
        {
          id: 'catalog-list',
          visibility: catalogVisibility
        },
        {
          id: 'entry-detail',
          visibility: 'has-selection'
        }
      ],
      order: [
        'query-context',
        'catalog-list',
        'entry-detail'
      ],
      pageSize
    }
  };
}

/**
 * <lang><zh-CN>创建与给定 profile 精确匹配的显式单元数组。</zh-CN><en>Creates an explicit unit array exactly matching the given profile.</en></lang>
 *
 * @param {object} profile <lang><zh-CN>要读取 reference implementation ID 的采用 profile。</zh-CN><en>Adoption profile from which to read the reference implementation ID.</en></lang>
 * @returns {object[]} <lang><zh-CN>reference 与 catalog 两个完整单元。</zh-CN><en>Complete reference and catalog units.</en></lang>
 * @lang zh-CN factory 只根据已知 fixture ID 选择 v1/v2；未知值用于制造显式失败。
 * @lang en The factory selects v1/v2 only for known fixture IDs; an unknown value produces an explicit failure.
 */
function createUnitsForProfile(profile) {
  // <lang><zh-CN>在声明数组中按稳定 module ID 查找 reference selection。</zh-CN><en>Find the reference selection in the declaration array by stable module ID.</en></lang>
  const referenceSelection = profile.capabilities.find(
    (selection) => selection.moduleId === REFERENCE_DATA_MODULE_ID
  );

  // <lang><zh-CN>将已知 v2 ID 映射到 fixture version，其余值保持 v1 以便 runtime 检出 mismatch。</zh-CN><en>Map the known v2 ID to its fixture version; keep v1 for other values so the runtime detects a mismatch.</en></lang>
  const referenceVersion = referenceSelection?.implementationPackageId === 'example.reference-data.fixture-v2'
    ? 'v2'
    : 'v1';

  // <lang><zh-CN>返回显式单元，不让 runtime 根据 adoption ID 自动创建代码。</zh-CN><en>Return explicit units rather than letting the runtime create code from an adoption ID.</en></lang>
  return [
    createReferenceDataCapabilityUnit({
      fixtureVersion: referenceVersion
    }),
    createCatalogCapabilityUnit()
  ];
}

/**
 * <lang><zh-CN>创建一个与 reference-data 双向语义冲突的中性测试单元。</zh-CN><en>Creates a neutral test unit that semantically conflicts with reference-data in either direction.</en></lang>
 *
 * @returns {object} <lang><zh-CN>显式 conflicting capability unit。</zh-CN><en>An explicit conflicting capability unit.</en></lang>
 * @lang zh-CN 测试单元从新建 reference fixture 深复制后改为独立 owner；不在公开产品集合中登记。
 * @lang en The test unit deep-copies a fresh reference fixture and changes it to an independent owner; it is not registered in the public product set.
 */
function createConflictingUnit() {
  // <lang><zh-CN>先创建无共享状态的 v1 reference unit 作为合法结构样本。</zh-CN><en>First create a state-independent v1 reference unit as a valid shape sample.</en></lang>
  const sourceUnit = createReferenceDataCapabilityUnit({
    fixtureVersion: 'v1'
  });

  // <lang><zh-CN>深复制纯数据声明；provider 在后面显式复用同契约 invoke。</zh-CN><en>Deep-copy the pure-data declarations; the provider is explicitly reused later with the same invoke contract.</en></lang>
  const businessModule = structuredClone(sourceUnit.businessModule);

  // <lang><zh-CN>给测试 module 分配独立稳定 ID 并声明对 reference-data 的冲突。</zh-CN><en>Assign the test module an independent stable ID and declare a conflict with reference-data.</en></lang>
  businessModule.id = 'example.conflicting-reference';
  businessModule.dependencies = [];
  businessModule.conflicts = [REFERENCE_DATA_MODULE_ID];

  // <lang><zh-CN>深复制工程 manifest，避免改变 source unit。</zh-CN><en>Deep-copy the engineering manifest to avoid changing the source unit.</en></lang>
  const implementationPackage = structuredClone(sourceUnit.implementationPackage);

  // <lang><zh-CN>实现包改为独立 owner，并指向测试 module。</zh-CN><en>Change the implementation package to an independent owner pointing to the test module.</en></lang>
  implementationPackage.id = 'example.conflicting-reference.fixture';
  implementationPackage.moduleId = businessModule.id;
  implementationPackage.package.identity = 'example-conflicting-reference-fixture';

  // <lang><zh-CN>深复制 profile 后显式选择测试 module 与实现。</zh-CN><en>Deep-copy the profile and explicitly select the test module and implementation.</en></lang>
  const profile = structuredClone(sourceUnit.profile);
  profile.id = businessModule.id;
  // <lang><zh-CN>单元自身 profile 不启用 conflict target，使 core 装配通过；跨单元冲突由 adoption/lifecycle 的完整集合检查。</zh-CN><en>The unit's own profile does not enable the conflict target, allowing core assembly; adoption/lifecycle checks the cross-unit conflict in the complete set.</en></lang>
  profile.enabledModuleIds = [businessModule.id];
  profile.implementationPackageIds = [implementationPackage.id];

  // <lang><zh-CN>返回新 unit；provider 保持相同 contract，但 owner/manifests 已完全独立。</zh-CN><en>Return the new unit; the provider keeps the same contract while ownership and manifests are fully independent.</en></lang>
  return {
    businessModule,
    implementationPackage,
    profile,
    portProviders: sourceUnit.portProviders
  };
}

/**
 * <lang><zh-CN>验证首次采用的依赖顺序、调用、呈现 snapshot 与公开 receipt。</zh-CN><en>Verifies dependency ordering, invocation, presentation snapshot, and public receipt for initial adoption.</en></lang>
 * @lang zh-CN profile 故意按 reference 后 catalog 编写，但 runtime 仍必须从 manifest 关系决定启用顺序。
 * @lang en The profile happens to list reference before catalog, but the runtime must still determine enablement order from manifest relations.
 */
function testAdoptsCompleteCapabilitySet() {
  // <lang><zh-CN>创建空 runtime 与初始 profile。</zh-CN><en>Create an empty runtime and initial profile.</en></lang>
  const runtime = createRuntime();
  const profile = createAdoptionProfile();

  // <lang><zh-CN>提供与 profile 精确匹配的两个显式能力单元。</zh-CN><en>Supply two explicit capability units exactly matching the profile.</en></lang>
  const result = runtime.reconcile({
    profile,
    units: createUnitsForProfile(profile)
  });

  // <lang><zh-CN>首次采用必须成功并按 module ID 产生两个 install receipt。</zh-CN><en>Initial adoption must succeed and produce two install receipts in module-ID order.</en></lang>
  assert.equal(result.ok, true);
  assert.deepEqual(
    result.receipt.actions.map((action) => [action.moduleId, action.action, action.nextState]),
    [
      [CATALOG_MODULE_ID, 'install', 'enabled'],
      [REFERENCE_DATA_MODULE_ID, 'install', 'enabled']
    ]
  );

  // <lang><zh-CN>活动 snapshot 必须表明 catalog 依赖已启用 reference-data。</zh-CN><en>The active snapshot must show that the catalog depends on enabled reference-data.</en></lang>
  assert.deepEqual(
    runtime.snapshot().map((entry) => [entry.moduleId, entry.state, entry.dependencies]),
    [
      [CATALOG_MODULE_ID, 'enabled', [REFERENCE_DATA_MODULE_ID]],
      [REFERENCE_DATA_MODULE_ID, 'enabled', []]
    ]
  );

  // <lang><zh-CN>reference port 返回中性 v1 option，不含行业数据。</zh-CN><en>The reference port returns neutral v1 options containing no industry data.</en></lang>
  const referenceResult = runtime.invoke(REFERENCE_DATA_MODULE_ID, 'reference-options', {
    contractVersion: '1.0'
  });
  assert.equal(referenceResult.kind, 'reference-options');
  assert.equal(referenceResult.revision, 'fixture-v1');
  assert.deepEqual(referenceResult.options.map((option) => option.id), ['all', 'featured']);

  // <lang><zh-CN>catalog 仍通过原 canonical query port 返回既有中性 entry。</zh-CN><en>The catalog still returns the existing neutral entry through its canonical query port.</en></lang>
  const catalogResult = runtime.invoke(CATALOG_MODULE_ID, 'catalog-query', {
    contractVersion: '1.0',
    filter: {},
    page: 1,
    pageSize: 1
  });
  assert.equal(catalogResult.kind, 'page');
  assert.equal(catalogResult.entries[0].id, 'entry-001');

  // <lang><zh-CN>呈现 snapshot 必须与输入分离且保持受限顺序。</zh-CN><en>The presentation snapshot must be detached from input and preserve bounded order.</en></lang>
  const presentation = runtime.presentation();
  assert.deepEqual(presentation.order, ['query-context', 'catalog-list', 'entry-detail']);
  assert.equal(presentation.pageSize, 5);
  profile.presentation.order.reverse();
  assert.deepEqual(runtime.presentation().order, ['query-context', 'catalog-list', 'entry-detail']);
}

/**
 * <lang><zh-CN>验证同实现的 disabled 状态协调与依赖保护后的安全调用边界。</zh-CN><en>Verifies reconciliation to a disabled state for the same implementation and the safe invocation boundary after dependency protection.</en></lang>
 * @lang zh-CN catalog 停用时 reference 仍保持启用，避免破坏未来其他 dependent。
 * @lang en Reference data remains enabled while the catalog is disabled, avoiding disruption to future dependents.
 */
function testDisablesWithoutRemovingDependency() {
  // <lang><zh-CN>先采用完整启用集合。</zh-CN><en>First adopt the fully enabled set.</en></lang>
  const runtime = createRuntime();
  const initialProfile = createAdoptionProfile();
  assert.equal(runtime.reconcile({
    profile: initialProfile,
    units: createUnitsForProfile(initialProfile)
  }).ok, true);

  // <lang><zh-CN>新 profile 只把 catalog 设为 disabled，并调整合法 visibility。</zh-CN><en>The new profile only makes the catalog disabled and adjusts visibility to another legal value.</en></lang>
  const disabledProfile = createAdoptionProfile({
    catalogState: 'disabled',
    catalogVisibility: 'has-results'
  });

  // <lang><zh-CN>完整候选协调必须成功，且 receipt 区分 disable 与 retain。</zh-CN><en>Complete candidate reconciliation must succeed, and the receipt must distinguish disable from retain.</en></lang>
  const result = runtime.reconcile({
    profile: disabledProfile,
    units: createUnitsForProfile(disabledProfile)
  });
  assert.equal(result.ok, true);
  assert.deepEqual(
    result.receipt.actions.map((action) => [action.moduleId, action.action]),
    [
      [CATALOG_MODULE_ID, 'disable'],
      [REFERENCE_DATA_MODULE_ID, 'retain']
    ]
  );

  // <lang><zh-CN>catalog 已停用，而 reference 仍可调用。</zh-CN><en>The catalog is disabled while reference data remains invokable.</en></lang>
  assert.equal(runtime.snapshot().find((entry) => entry.moduleId === CATALOG_MODULE_ID).state, 'disabled');
  assert.equal(runtime.invoke(REFERENCE_DATA_MODULE_ID, 'reference-options', {
    contractVersion: '1.0'
  }).revision, 'fixture-v1');

  // <lang><zh-CN>停用后的 catalog 调用必须由既有 lifecycle 稳定拒绝。</zh-CN><en>Invocation of the disabled catalog must be rejected stably by the existing lifecycle.</en></lang>
  assert.throws(
    () => runtime.invoke(CATALOG_MODULE_ID, 'catalog-query', {
      secretProbe: 'must-not-enter-error'
    }),
    (error) => error.code === 'capability.invocation.disabled'
      && !error.message.includes('must-not-enter-error')
  );
}

/**
 * <lang><zh-CN>验证显式 reference 实现替换与失败候选回退。</zh-CN><en>Verifies explicit reference implementation replacement and rollback from a failed candidate.</en></lang>
 * @lang zh-CN 成功替换只切换完整 runtime；失败候选不得改变 v2 活动结果。
 * @lang en Successful replacement switches only a complete runtime; a failed candidate must not change the active v2 result.
 */
function testReplacesAtomicallyAndRollsBackFailure() {
  // <lang><zh-CN>建立使用 v1 的活动组合。</zh-CN><en>Establish an active composition using v1.</en></lang>
  const runtime = createRuntime();
  const v1Profile = createAdoptionProfile();
  assert.equal(runtime.reconcile({
    profile: v1Profile,
    units: createUnitsForProfile(v1Profile)
  }).ok, true);

  // <lang><zh-CN>通过完整 profile 与显式 v2 单元请求 replacement。</zh-CN><en>Request replacement through a complete profile and explicit v2 unit.</en></lang>
  const v2Profile = createAdoptionProfile({
    referenceImplementationPackageId: 'example.reference-data.fixture-v2',
    pageSize: 10
  });
  const replacementResult = runtime.reconcile({
    profile: v2Profile,
    units: createUnitsForProfile(v2Profile)
  });

  // <lang><zh-CN>receipt 必须只把 reference 标记为 replace，并保留 catalog。</zh-CN><en>The receipt must mark only reference data as replaced and retain the catalog.</en></lang>
  assert.equal(replacementResult.ok, true);
  assert.deepEqual(
    replacementResult.receipt.actions.map((action) => [action.moduleId, action.action]),
    [
      [CATALOG_MODULE_ID, 'retain'],
      [REFERENCE_DATA_MODULE_ID, 'replace']
    ]
  );
  assert.equal(
    replacementResult.receipt.actions[1].previousImplementationPackageId,
    'example.reference-data.fixture-v1'
  );
  assert.equal(
    replacementResult.receipt.actions[1].nextImplementationPackageId,
    'example.reference-data.fixture-v2'
  );

  // <lang><zh-CN>活动调用与呈现必须同时切换到完整 v2 候选。</zh-CN><en>Active invocation and presentation must switch together to the complete v2 candidate.</en></lang>
  assert.equal(runtime.invoke(REFERENCE_DATA_MODULE_ID, 'reference-options', {
    contractVersion: '1.0'
  }).revision, 'fixture-v2');
  assert.equal(runtime.presentation().pageSize, 10);

  // <lang><zh-CN>制造缺失 required provider 的 v1 replacement 候选。</zh-CN><en>Create a v1 replacement candidate missing its required provider.</en></lang>
  const invalidProfile = createAdoptionProfile();
  const invalidUnits = createUnitsForProfile(invalidProfile);
  invalidUnits[0] = {
    ...invalidUnits[0],
    portProviders: {}
  };

  // <lang><zh-CN>候选装配必须失败且不返回动作 receipt。</zh-CN><en>Candidate assembly must fail and return no action receipt.</en></lang>
  const failedResult = runtime.reconcile({
    profile: invalidProfile,
    units: invalidUnits
  });
  assert.equal(failedResult.ok, false);
  assert.equal('receipt' in failedResult, false);
  assert.equal(
    failedResult.diagnostics.some((diagnostic) => diagnostic.code === 'capability-adoption.unit.invalid'),
    true
  );

  // <lang><zh-CN>失败后 snapshot、provider 与 presentation 均保持 v2。</zh-CN><en>After failure, snapshot, provider, and presentation all remain on v2.</en></lang>
  assert.equal(
    runtime.snapshot().find((entry) => entry.moduleId === REFERENCE_DATA_MODULE_ID).implementationPackageId,
    'example.reference-data.fixture-v2'
  );
  assert.equal(runtime.invoke(REFERENCE_DATA_MODULE_ID, 'reference-options', {
    contractVersion: '1.0'
  }).revision, 'fixture-v2');
  assert.equal(runtime.presentation().pageSize, 10);
}

/**
 * <lang><zh-CN>验证非法呈现/额外字段在任何单元安装前被拒绝。</zh-CN><en>Verifies that invalid presentation and extra fields are rejected before any unit installation.</en></lang>
 * @lang zh-CN 失败 diagnostic 不得复制任意 URL/script 字符串。
 * @lang en Failure diagnostics must not copy arbitrary URL/script strings.
 */
function testRejectsUnboundedProfile() {
  // <lang><zh-CN>创建空 runtime 与合法基线 profile。</zh-CN><en>Create an empty runtime and a valid baseline profile.</en></lang>
  const runtime = createRuntime();
  const profile = createAdoptionProfile();

  // <lang><zh-CN>注入未知 block、越界 pageSize 与禁止的顶层 script 字段。</zh-CN><en>Inject an unknown block, an out-of-policy page size, and a forbidden top-level script field.</en></lang>
  profile.presentation.blocks.push({
    id: 'remote-component',
    visibility: 'always'
  });
  profile.presentation.order.push('remote-component');
  profile.presentation.pageSize = 999;
  profile.script = 'https://invalid.example/remote.js';

  // <lang><zh-CN>runtime 必须返回受限 profile failure，且保持未初始化。</zh-CN><en>The runtime must return a bounded profile failure and remain uninitialized.</en></lang>
  const result = runtime.reconcile({
    profile,
    units: createUnitsForProfile(profile)
  });
  assert.equal(result.ok, false);
  assert.deepEqual(runtime.snapshot(), []);
  assert.deepEqual(runtime.presentation(), {
    blocks: [],
    order: [],
    pageSize: null
  });

  // <lang><zh-CN>序列化 diagnostic 不得出现任意 host、script 字段或 URL。</zh-CN><en>Serialized diagnostics must contain no arbitrary host, script field, or URL.</en></lang>
  const serializedDiagnostics = JSON.stringify(result.diagnostics);
  assert.equal(serializedDiagnostics.includes('invalid.example'), false);
  assert.equal(serializedDiagnostics.includes('remote.js'), false);

  // <lang><zh-CN>首次成功采用前的 invoke 使用专用稳定错误。</zh-CN><en>Invocation before the first successful adoption uses a dedicated stable error.</en></lang>
  assert.throws(
    () => runtime.invoke(REFERENCE_DATA_MODULE_ID, 'reference-options', {
      secretProbe: 'uninitialized-input'
    }),
    (error) => error instanceof CapabilityAdoptionInvocationError
      && error.code === 'capability-adoption.invocation.uninitialized'
      && !error.message.includes('uninitialized-input')
  );
}

/**
 * <lang><zh-CN>验证双向 lifecycle 冲突在 candidate 中被拒绝且不产生部分活动状态。</zh-CN><en>Verifies that a symmetric lifecycle conflict is rejected in the candidate without producing partial active state.</en></lang>
 * @lang zh-CN conflict unit 仅为当前测试构造，不进入首批公开能力清单。
 * @lang en The conflict unit exists only for this test and does not enter the initial public capability set.
 */
function testRejectsConflictingCandidate() {
  // <lang><zh-CN>创建只包含 reference 与 conflict 的完整 profile。</zh-CN><en>Create a complete profile containing only reference and conflict.</en></lang>
  const profile = {
    adoptionVersion: '1.0',
    kind: 'capability-adoption-profile',
    profileId: 'example.conflict-check',
    capabilities: [
      {
        moduleId: REFERENCE_DATA_MODULE_ID,
        implementationPackageId: 'example.reference-data.fixture-v1',
        state: 'enabled'
      },
      {
        moduleId: 'example.conflicting-reference',
        implementationPackageId: 'example.conflicting-reference.fixture',
        state: 'enabled'
      }
    ],
    presentation: {
      blocks: [
        {
          id: 'query-context',
          visibility: 'always'
        }
      ],
      order: ['query-context'],
      pageSize: 5
    }
  };

  // <lang><zh-CN>显式提供两个合法单元，让冲突只在 enable 阶段出现。</zh-CN><en>Explicitly supply two valid units so the conflict appears only during enablement.</en></lang>
  const runtime = createRuntime();
  const result = runtime.reconcile({
    profile,
    units: [
      createReferenceDataCapabilityUnit({
        fixtureVersion: 'v1'
      }),
      createConflictingUnit()
    ]
  });

  // <lang><zh-CN>候选失败只返回稳定冲突类别，并保持活动 runtime 为空。</zh-CN><en>Candidate failure returns only a stable conflict category and leaves the active runtime empty.</en></lang>
  assert.equal(result.ok, false);
  assert.equal(
    result.diagnostics.some(
      (diagnostic) => diagnostic.code === 'capability-adoption.candidate.capability.conflict.enabled'
    ),
    true
  );
  assert.deepEqual(runtime.snapshot(), []);
}

/**
 * <lang><zh-CN>验证两个公开 JSON 示例可直接驱动首次采用与显式 replacement。</zh-CN><en>Verifies that both public JSON examples directly drive initial adoption and explicit replacement.</en></lang>
 * @lang zh-CN 测试只把已解析对象交给 runtime；runtime 不承担文件或 JSON loader 主责。
 * @lang en The test only passes parsed objects to the runtime; the runtime owns neither file nor JSON loading.
 */
async function testRunsPublicProfileExamples() {
  // <lang><zh-CN>加载公开初始 profile，并提供精确匹配的 v1/reference + catalog 单元。</zh-CN><en>Load the public initial profile and supply exactly matching v1/reference plus catalog units.</en></lang>
  const initialProfile = await loadAdoptionProfileExample(
    '../docs/contracts/examples/example.catalog-composed.adoption.profile.json'
  );

  // <lang><zh-CN>独立 runtime 从公开初始 profile 开始。</zh-CN><en>An independent runtime starts from the public initial profile.</en></lang>
  const runtime = createRuntime();
  const initialResult = runtime.reconcile({
    profile: initialProfile,
    units: createUnitsForProfile(initialProfile)
  });

  // <lang><zh-CN>初始示例必须采用成功并启用两项中性能力。</zh-CN><en>The initial example must adopt successfully and enable both neutral capabilities.</en></lang>
  assert.equal(initialResult.ok, true);
  assert.deepEqual(runtime.snapshot().map((entry) => entry.state), ['enabled', 'enabled']);

  // <lang><zh-CN>加载公开 replacement profile，其 reference ID 显式选择 v2。</zh-CN><en>Load the public replacement profile, whose reference ID explicitly selects v2.</en></lang>
  const replacementProfile = await loadAdoptionProfileExample(
    '../docs/contracts/examples/example.catalog-composed.replacement.profile.json'
  );

  // <lang><zh-CN>以完整 v2/reference + catalog 单元协调 replacement。</zh-CN><en>Reconcile replacement with the complete v2/reference plus catalog unit set.</en></lang>
  const replacementResult = runtime.reconcile({
    profile: replacementProfile,
    units: createUnitsForProfile(replacementProfile)
  });

  // <lang><zh-CN>公开示例必须产生一个 reference replace 动作和更新后的 pageSize。</zh-CN><en>The public example must produce one reference replace action and the updated page size.</en></lang>
  assert.equal(replacementResult.ok, true);
  assert.equal(
    replacementResult.receipt.actions.find(
      (action) => action.moduleId === REFERENCE_DATA_MODULE_ID
    ).action,
    'replace'
  );
  assert.equal(runtime.presentation().pageSize, 10);
  assert.equal(runtime.invoke(REFERENCE_DATA_MODULE_ID, 'reference-options', {
    contractVersion: '1.0'
  }).revision, 'fixture-v2');
}

// <lang><zh-CN>注册六组独立 acceptance；Node runner 不需要浏览器、编译器、网络或外部服务。</zh-CN><en>Register six independent acceptance cases; the Node runner needs no browser, compiler, network, or external service.</en></lang>
test('capability adoption reconciles a complete dependent set', testAdoptsCompleteCapabilitySet);
test('capability adoption disables one capability without removing its dependency', testDisablesWithoutRemovingDependency);
test('capability adoption replaces an implementation atomically and rolls back failure', testReplacesAtomicallyAndRollsBackFailure);
test('capability adoption rejects an unbounded profile before activation', testRejectsUnboundedProfile);
test('capability adoption rejects a conflicting candidate atomically', testRejectsConflictingCandidate);
test('capability adoption runs the public initial and replacement profiles', testRunsPublicProfileExamples);
