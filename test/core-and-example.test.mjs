/**
 * <lang><zh-CN>纯 Node 契约测试：固定 Biz core 与中性 example mock 的最小可运行边界，不依赖 UI、网络或真实数据。</zh-CN><en>Pure-Node contract tests: fix the smallest runnable boundary for the Biz core and neutral example mock without UI, network, or real data.</en></lang>
 * @lang zh-CN 本文件通过 Node 内置测试器验证 manifest/组合诊断与八类确定性 fixture；所有输入均为测试自有的中性数据。
 * @lang en This file uses the Node built-in test runner to verify manifest/composition diagnostics and eight deterministic fixtures; every input is neutral test-owned data.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assembleComposition,
  validateManifestPair
} from '../packages/core/src/index.mjs';
import {
  createCatalogQueryDetailMock,
  createExampleManifests
} from '../modules/example-catalog-query-detail/src/index.mjs';

/**
 * <lang><zh-CN>首轮 Biz 契约使用的固定版本；测试以此确认 core 不悄然接受未声明版本。</zh-CN><en>The fixed version used by the first Biz contract; tests use it to ensure the core does not silently accept an undeclared version.</en></lang>
 * @lang zh-CN 该常量只表达当前实现的最小契约版本，而不代表发布版本或跨版本兼容承诺。
 * @lang en This constant expresses only the smallest contract version currently implemented, not a release version or cross-version compatibility promise.
 */
const CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>中性示例业务模块的稳定标识，用于使测试不引入行业含义。</zh-CN><en>The stable identifier of the neutral example business module, keeping tests free of industry meaning.</en></lang>
 * @lang zh-CN 该标识与公开 manifest 和契约文档保持一致。
 * @lang en This identifier stays aligned with the public manifest and contract documentation.
 */
const EXAMPLE_MODULE_ID = 'example.catalog-query-detail';

/**
 * <lang><zh-CN>中性示例 mock 实现包的稳定标识；它不是已发布 npm 包名。</zh-CN><en>The stable identifier of the neutral example mock implementation package; it is not a published npm package name.</en></lang>
 * @lang zh-CN 该标识只用于同仓组合和测试诊断。
 * @lang en This identifier is used only for same-repository composition and test diagnostics.
 */
const EXAMPLE_IMPLEMENTATION_ID = 'example.catalog-query-detail.mock-implementation';

/**
 * <lang><zh-CN>创建符合公开 shape 的最小业务模块 manifest。</zh-CN><en>Creates the smallest business-module manifest that conforms to the public shape.</en></lang>
 *
 * @returns {object} 中性业务模块声明。 / A neutral business-module declaration.
 * @lang zh-CN 返回新的可变测试对象，调用方可以安全地制造单一非法关系而不污染其他测试。
 * @lang en Returns a new mutable test object so a caller can safely create one invalid relation without contaminating other tests.
 */
function createBusinessModuleManifest() {
  // <lang><zh-CN>模块声明以公开版本和 kind 开始，使验证器可以先区分产物类别。</zh-CN><en>The module declaration starts with the public version and kind so the validator can distinguish artifact categories first.</en></lang>
  return {
    manifestVersion: CONTRACT_VERSION,
    kind: 'business-module',
    id: EXAMPLE_MODULE_ID,
    displayName: {
      'zh-Hans': '通用目录—查询—详情示例',
      en: 'Catalog query and detail example'
    },
    business: {
      responsibility: {
        'zh-Hans': '提供只读 entry 查询与详情。',
        en: 'Provides read-only entry query and detail behavior.'
      },
      lifecycle: 'profile-selected',
      permissions: []
    },
    contracts: {
      ports: [
        {
          id: 'catalog-query',
          direction: 'required',
          contract: {
            id: 'catalog-query-detail.query',
            version: CONTRACT_VERSION
          }
        },
        {
          id: 'entry-detail',
          direction: 'required',
          contract: {
            id: 'catalog-query-detail.detail',
            version: CONTRACT_VERSION
          }
        },
        {
          id: 'session-state',
          direction: 'required',
          contract: {
            id: 'catalog-query-detail.session',
            version: CONTRACT_VERSION
          }
        }
      ],
      filterSchema: {
        id: 'catalog-query-detail.filter',
        version: CONTRACT_VERSION
      },
      outcomes: [
        {
          id: 'catalog-query-detail.query-result',
          version: CONTRACT_VERSION
        },
        {
          id: 'catalog-query-detail.detail-result',
          version: CONTRACT_VERSION
        },
        {
          id: 'catalog-query-detail.failure',
          version: CONTRACT_VERSION
        }
      ]
    },
    configuration: {
      registeredBlocks: ['catalog-list', 'entry-detail'],
      paginationModes: ['page'],
      visibilityConditions: ['always', 'has-results', 'has-selection', 'detail-ready'],
      ordering: 'profile-controlled'
    },
    dependencies: [],
    conflicts: []
  };
}

/**
 * <lang><zh-CN>创建与中性模块配对的最小实现包 manifest。</zh-CN><en>Creates the smallest implementation-package manifest paired with the neutral module.</en></lang>
 *
 * @returns {object} 中性 mock 实现包声明。 / A neutral mock implementation-package declaration.
 * @lang zh-CN 返回新对象，以便测试独立修改 moduleId 或其他工程交付字段。
 * @lang en Returns a new object so tests can independently change moduleId or other engineering-delivery fields.
 */
function createImplementationPackageManifest() {
  // <lang><zh-CN>实现包只描述同仓 fixture，不把 private package metadata 误写成已发布分发物。</zh-CN><en>The implementation package describes only a same-repository fixture and does not misstate private package metadata as a published distribution.</en></lang>
  return {
    manifestVersion: CONTRACT_VERSION,
    kind: 'implementation-package',
    id: EXAMPLE_IMPLEMENTATION_ID,
    moduleId: EXAMPLE_MODULE_ID,
    package: {
      identity: 'example-catalog-query-detail-mock',
      distribution: 'fixture-only'
    },
    runtime: {
      targets: ['mp-weixin'],
      surfaces: ['adapter', 'channel-projection', 'mock-session', 'presentation-block']
    },
    provides: [
      {
        id: 'catalog-query',
        kind: 'adapter',
        contract: {
          id: 'catalog-query-detail.query',
          version: CONTRACT_VERSION
        }
      },
      {
        id: 'entry-detail',
        kind: 'adapter',
        contract: {
          id: 'catalog-query-detail.detail',
          version: CONTRACT_VERSION
        }
      },
      {
        id: 'session-state',
        kind: 'mock-session',
        contract: {
          id: 'catalog-query-detail.session',
          version: CONTRACT_VERSION
        }
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
}

/**
 * <lang><zh-CN>创建只选择已登记 block 与条件的 profile；它不携带后端路径、URL 或脚本。</zh-CN><en>Creates a profile that selects only registered blocks and conditions; it carries no backend path, URL, or script.</en></lang>
 *
 * @returns {object} 可用于组合装配的受限 profile。 / A restricted profile usable for composition assembly.
 * @lang zh-CN profile 同时承载 route projection，使测试可验证 channel 层只引用已登记的 screen、block 和 action ID。
 * @lang en The profile also carries route projection so tests can verify the channel layer references only registered screen, block, and action IDs.
 */
function createExampleProfile() {
  // <lang><zh-CN>profile 明确选择唯一的中性模块和实现包，避免 core 从隐式全局状态推断组合。</zh-CN><en>The profile explicitly selects the sole neutral module and implementation package so the core never infers composition from implicit global state.</en></lang>
  return {
    id: EXAMPLE_MODULE_ID,
    enabledModuleIds: [EXAMPLE_MODULE_ID],
    implementationPackageIds: [EXAMPLE_IMPLEMENTATION_ID],
    selectedBlocks: ['catalog-list', 'entry-detail'],
    visibilityByBlock: {
      'catalog-list': 'always',
      'entry-detail': 'has-selection'
    },
    blockOrder: ['catalog-list', 'entry-detail'],
    routeProjection: {
      channel: 'mp-weixin',
      screens: [
        {
          intent: 'catalog',
          screenId: 'catalog-list',
          blocks: ['catalog-list']
        },
        {
          intent: 'entry-detail',
          screenId: 'entry-detail',
          blocks: ['entry-detail']
        }
      ],
      actions: [
        {
          id: 'select-entry',
          from: 'catalog-list',
          to: 'entry-detail'
        }
      ]
    }
  };
}

/**
 * <lang><zh-CN>创建满足三个 required port 的无副作用测试 provider。</zh-CN><en>Creates side-effect-free test providers for the three required ports.</en></lang>
 *
 * @returns {object} 按 port ID 索引的 provider 集合。 / A provider collection indexed by port ID.
 * @lang zh-CN 这些 provider 只服务 core relation 测试，不替代 example module 的真实 mock 行为。
 * @lang en These providers serve only core relation tests and do not replace the example module's actual mock behavior.
 */
function createPortProviders() {
  // <lang><zh-CN>每个 provider 重复声明其 contract，以便 core 检测 port 名称相同但契约不同的错误组合。</zh-CN><en>Each provider repeats its contract so the core can detect an invalid composition where a port name matches but its contract does not.</en></lang>
  return {
    'catalog-query': {
      contract: {
        id: 'catalog-query-detail.query',
        version: CONTRACT_VERSION
      },
      invoke: () => ({ kind: 'page' })
    },
    'entry-detail': {
      contract: {
        id: 'catalog-query-detail.detail',
        version: CONTRACT_VERSION
      },
      invoke: () => ({ kind: 'detail' })
    },
    'session-state': {
      contract: {
        id: 'catalog-query-detail.session',
        version: CONTRACT_VERSION
      },
      invoke: () => ({ mode: 'mock' })
    }
  };
}

/**
 * <lang><zh-CN>判断诊断列表是否包含指定稳定代码。</zh-CN><en>Determines whether a diagnostic list contains a specified stable code.</en></lang>
 *
 * @param {Array<{code: string}>} diagnostics 待检查的诊断。 / Diagnostics to inspect.
 * @param {string} code 期望的稳定诊断代码。 / The expected stable diagnostic code.
 * @returns {boolean} 是否存在匹配代码。 / Whether a matching code exists.
 * @lang zh-CN 测试只依赖稳定 code，不依赖面向人的中英文 message 文案。
 * @lang en Tests depend only on stable codes and not on human-facing Chinese or English message wording.
 */
function hasDiagnostic(diagnostics, code) {
  // <lang><zh-CN>按 code 查找可使测试关注可编程契约，而不是文案格式。</zh-CN><en>Searching by code keeps the test focused on the programmable contract rather than message formatting.</en></lang>
  return diagnostics.some((diagnostic) => diagnostic.code === code);
}

/**
 * <lang><zh-CN>验证成对 manifest 的合法最小形状。</zh-CN><en>Verifies the valid minimum shape of a manifest pair.</en></lang>
 * @lang zh-CN 合法输入必须没有 diagnostics，且不会因 fixture-only 实现包被误判为发布包。
 * @lang en Valid input must have no diagnostics and must not mistake a fixture-only implementation package for a published package.
 */
function testAcceptsValidManifestPair() {
  // <lang><zh-CN>创建彼此匹配的新 manifest，避免其他测试的非法修改泄漏到本断言。</zh-CN><en>Create fresh matching manifests so invalid changes from other tests cannot leak into this assertion.</en></lang>
  const validation = validateManifestPair({
    businessModule: createBusinessModuleManifest(),
    implementationPackage: createImplementationPackageManifest()
  });

  // <lang><zh-CN>合法 pair 应明确通过，而不是以空或未定义结果暗示成功。</zh-CN><en>A valid pair must explicitly pass rather than imply success through an empty or undefined result.</en></lang>
  assert.equal(validation.ok, true);

  // <lang><zh-CN>没有诊断证明 core 未为合法中性 fixture 制造额外的隐式前提。</zh-CN><en>No diagnostics prove the core did not invent additional implicit prerequisites for the valid neutral fixture.</en></lang>
  assert.deepEqual(validation.diagnostics, []);
}

/**
 * <lang><zh-CN>验证 manifest kind 与模块对应关系的拒绝诊断。</zh-CN><en>Verifies rejection diagnostics for manifest kind and module correspondence.</en></lang>
 * @lang zh-CN 这些错误在组合前被发现，避免错误 provider 或后端细节进入 core。
 * @lang en These errors are discovered before composition, preventing an incorrect provider or backend detail from entering the core.
 */
function testRejectsInvalidManifestRelations() {
  // <lang><zh-CN>创建独立 module 对象以只破坏 kind 字段。</zh-CN><en>Create an independent module object to corrupt only its kind field.</en></lang>
  const invalidKindModule = createBusinessModuleManifest();

  // <lang><zh-CN>将业务模块误标为实现包必须触发稳定 kind 诊断。</zh-CN><en>Mislabeling a business module as an implementation package must trigger a stable kind diagnostic.</en></lang>
  invalidKindModule.kind = 'implementation-package';

  // <lang><zh-CN>创建独立 implementation 对象以只破坏它指向的模块 ID。</zh-CN><en>Create an independent implementation object to corrupt only the module ID it targets.</en></lang>
  const mismatchedImplementation = createImplementationPackageManifest();

  // <lang><zh-CN>实现包不得在未声明的模块上悄然落位。</zh-CN><en>An implementation package must not silently attach to an undeclared module.</en></lang>
  mismatchedImplementation.moduleId = 'example.unmatched-module';

  // <lang><zh-CN>验证错误 kind 的 pair，保留其余字段以隔离诊断原因。</zh-CN><en>Validate the wrong-kind pair while retaining other fields to isolate the diagnostic cause.</en></lang>
  const kindValidation = validateManifestPair({
    businessModule: invalidKindModule,
    implementationPackage: createImplementationPackageManifest()
  });

  // <lang><zh-CN>kind 诊断必须可供测试和调用方稳定识别。</zh-CN><en>The kind diagnostic must be stably recognizable by tests and callers.</en></lang>
  assert.equal(hasDiagnostic(kindValidation.diagnostics, 'manifest.kind.invalid'), true);

  // <lang><zh-CN>验证模块不对应的 pair，确认关系错误不会依赖 kind 错误才被发现。</zh-CN><en>Validate the mismatched pair to confirm relation errors are found independently of a kind error.</en></lang>
  const relationValidation = validateManifestPair({
    businessModule: createBusinessModuleManifest(),
    implementationPackage: mismatchedImplementation
  });

  // <lang><zh-CN>模块 ID 不匹配必须有独立的稳定诊断代码。</zh-CN><en>A module-ID mismatch must have its own stable diagnostic code.</en></lang>
  assert.equal(hasDiagnostic(relationValidation.diagnostics, 'implementation.module-id.mismatch'), true);
}

/**
 * <lang><zh-CN>验证组合拒绝缺失 port、未登记 block、缺失依赖与已启用冲突。</zh-CN><en>Verifies that composition rejects a missing port, unregistered block, missing dependency, and enabled conflict.</en></lang>
 * @lang zh-CN 这些关系都由 core 审核，而不是交给 mock、UI 或后端在运行时猜测。
 * @lang en The core reviews all these relations rather than leaving the mock, UI, or backend to guess them at runtime.
 */
function testRejectsInvalidCompositionRelations() {
  // <lang><zh-CN>创建会要求额外依赖并声明冲突模块的基础 manifest。</zh-CN><en>Create a base manifest that requires an extra dependency and declares a conflicting module.</en></lang>
  const businessModule = createBusinessModuleManifest();

  // <lang><zh-CN>依赖用于验证 profile 必须显式选择其业务前置能力。</zh-CN><en>The dependency verifies that a profile must explicitly select its business prerequisite capability.</en></lang>
  businessModule.dependencies = ['example.reference-data'];

  // <lang><zh-CN>冲突用于验证 profile 不能在同一组合中同时启用不兼容能力。</zh-CN><en>The conflict verifies that a profile cannot enable incompatible capabilities in the same composition.</en></lang>
  businessModule.conflicts = ['example.incompatible-module'];

  // <lang><zh-CN>创建 profile 后加入未登记 block 和冲突模块，以隔离配置关系错误。</zh-CN><en>Create a profile and then add an unregistered block and conflicting module to isolate configuration relation errors.</en></lang>
  const profile = createExampleProfile();

  // <lang><zh-CN>未知 block 不得通过 profile 引入呈现能力。</zh-CN><en>An unknown block must not introduce presentation capability through the profile.</en></lang>
  profile.selectedBlocks.push('unknown-block');

  // <lang><zh-CN>冲突模块只作为 ID 出现，不创建其实现，从而确认 core 在组合层拒绝它。</zh-CN><en>The conflicting module appears only as an ID and has no implementation, confirming the core rejects it at composition level.</en></lang>
  profile.enabledModuleIds.push('example.incompatible-module');

  // <lang><zh-CN>创建完整 provider 集合后删除一个 required port，以独立触发缺失 port 检查。</zh-CN><en>Create a complete provider collection and then remove one required port to independently trigger the missing-port check.</en></lang>
  const portProviders = createPortProviders();

  // <lang><zh-CN>删除 detail provider 不影响其他 port 的 shape，使断言聚焦 required port 关系。</zh-CN><en>Removing the detail provider leaves other port shapes intact so the assertion focuses on the required-port relation.</en></lang>
  delete portProviders['entry-detail'];

  // <lang><zh-CN>装配应返回结构化失败而不是执行任何 provider。</zh-CN><en>Assembly must return a structured failure rather than invoke any provider.</en></lang>
  const assembly = assembleComposition({
    businessModule,
    implementationPackage: createImplementationPackageManifest(),
    profile,
    portProviders
  });

  // <lang><zh-CN>缺失 required port、未登记 block、未满足依赖和已启用冲突都必须分别可诊断。</zh-CN><en>A missing required port, unregistered block, unmet dependency, and enabled conflict must each be diagnosable.</en></lang>
  assert.equal(hasDiagnostic(assembly.diagnostics, 'composition.port.missing'), true);
  assert.equal(hasDiagnostic(assembly.diagnostics, 'profile.block.unregistered'), true);
  assert.equal(hasDiagnostic(assembly.diagnostics, 'profile.dependency.missing'), true);
  assert.equal(hasDiagnostic(assembly.diagnostics, 'profile.conflict.enabled'), true);
}

/**
 * <lang><zh-CN>验证 first-page、last-page 与 empty-query 三个只读查询 fixture。</zh-CN><en>Verifies the first-page, last-page, and empty-query read-only query fixtures.</en></lang>
 * @lang zh-CN 查询 fixture 只返回自有中性 entry 标签，不读取网络、后端或行业数据。
 * @lang en Query fixtures return only owned neutral entry labels and read neither network, backend, nor industry data.
 */
function testReturnsDeterministicQueryFixtures() {
  // <lang><zh-CN>first-page mock 用于验证有下一页的规范化 page 结果。</zh-CN><en>The first-page mock verifies a canonical page result that has a next page.</en></lang>
  const firstPageMock = createCatalogQueryDetailMock({ fixtureCase: 'first-page' });

  // <lang><zh-CN>调用 query provider 时传入公开规定的 page/pageSize 形状。</zh-CN><en>Invoke the query provider with the publicly specified page/pageSize shape.</en></lang>
  const firstPage = firstPageMock.portProviders['catalog-query'].invoke({
    contractVersion: CONTRACT_VERSION,
    filter: {},
    page: 1,
    pageSize: 20
  });

  // <lang><zh-CN>首叶结果必须保留 page 语义，而不是泄漏 cursor 或后端分页字段。</zh-CN><en>The first-page result must retain page semantics rather than leak cursor or backend pagination fields.</en></lang>
  assert.equal(firstPage.kind, 'page');
  assert.equal(firstPage.page, 1);
  assert.equal(firstPage.hasNext, true);

  // <lang><zh-CN>last-page mock 用于验证末页不再宣称存在下一页。</zh-CN><en>The last-page mock verifies that the final page no longer claims another page exists.</en></lang>
  const lastPageMock = createCatalogQueryDetailMock({ fixtureCase: 'last-page' });

  // <lang><zh-CN>末页请求仍使用相同 canonical query 形状，fixture case 只控制 mock 行为。</zh-CN><en>The last-page request still uses the same canonical query shape; the fixture case controls only mock behavior.</en></lang>
  const lastPage = lastPageMock.portProviders['catalog-query'].invoke({
    contractVersion: CONTRACT_VERSION,
    filter: {},
    page: 2,
    pageSize: 20
  });

  // <lang><zh-CN>末页结果必须明确 `hasNext: false`。</zh-CN><en>The final-page result must explicitly set `hasNext: false`.</en></lang>
  assert.equal(lastPage.hasNext, false);

  // <lang><zh-CN>empty-query mock 用于验证空结果仍是成功 page，而不是后端失败。</zh-CN><en>The empty-query mock verifies that an empty result is still a successful page, not a backend failure.</en></lang>
  const emptyQueryMock = createCatalogQueryDetailMock({ fixtureCase: 'empty-query' });

  // <lang><zh-CN>空查询请求保留 page/pageSize，使 UI 能以相同契约呈现 empty state。</zh-CN><en>The empty-query request retains page/pageSize so a UI can present its empty state through the same contract.</en></lang>
  const emptyQuery = emptyQueryMock.portProviders['catalog-query'].invoke({
    contractVersion: CONTRACT_VERSION,
    filter: {},
    page: 1,
    pageSize: 20
  });

  // <lang><zh-CN>空结果必须为零条目和零总数，且不能宣称存在下一页。</zh-CN><en>An empty result must have zero entries and zero total and cannot claim a next page exists.</en></lang>
  assert.deepEqual(emptyQuery.entries, []);
  assert.equal(emptyQuery.total, 0);
  assert.equal(emptyQuery.hasNext, false);
}

/**
 * <lang><zh-CN>验证 invalid-query 与 adapter-failure 两个规范化失败 fixture。</zh-CN><en>Verifies the invalid-query and adapter-failure canonical failure fixtures.</en></lang>
 * @lang zh-CN 失败结果不得暴露 HTTP、Directus 或其他 wire 细节。
 * @lang en Failure results must not expose HTTP, Directus, or other wire details.
 */
function testReturnsCanonicalQueryFailures() {
  // <lang><zh-CN>普通 mock 负责在调用 adapter 行为前拒绝非法 page。</zh-CN><en>The ordinary mock rejects an invalid page before adapter behavior is exercised.</en></lang>
  const ordinaryMock = createCatalogQueryDetailMock({ fixtureCase: 'first-page' });

  // <lang><zh-CN>零页违反 one-based query 契约，应得到 request scope 的不可重试失败。</zh-CN><en>Page zero violates the one-based query contract and must yield a non-retryable request-scope failure.</en></lang>
  const invalidQuery = ordinaryMock.portProviders['catalog-query'].invoke({
    contractVersion: CONTRACT_VERSION,
    filter: {},
    page: 0,
    pageSize: 20
  });

  // <lang><zh-CN>错误 code 与 scope 是调用方稳定分支的依据。</zh-CN><en>The error code and scope are the caller's stable branching basis.</en></lang>
  assert.equal(invalidQuery.code, 'invalid-query');
  assert.equal(invalidQuery.scope, 'request');
  assert.equal(invalidQuery.retryable, false);

  // <lang><zh-CN>adapter-failure mock 只模拟已声明 port 不可用，不创建任何真实传输。</zh-CN><en>The adapter-failure mock simulates only an unavailable declared port and creates no real transport.</en></lang>
  const unavailableMock = createCatalogQueryDetailMock({ fixtureCase: 'adapter-failure' });

  // <lang><zh-CN>合法 query 在 adapter unavailable 情形下应得到可重试的 adapter scope 失败。</zh-CN><en>A valid query in the adapter-unavailable case must yield a retryable adapter-scope failure.</en></lang>
  const unavailable = unavailableMock.portProviders['catalog-query'].invoke({
    contractVersion: CONTRACT_VERSION,
    filter: {},
    page: 1,
    pageSize: 20
  });

  // <lang><zh-CN>该断言确认 mock 不用 HTTP status 或旧 envelope 代替 canonical failure。</zh-CN><en>This assertion confirms the mock does not substitute an HTTP status or legacy envelope for a canonical failure.</en></lang>
  assert.equal(unavailable.code, 'adapter-unavailable');
  assert.equal(unavailable.scope, 'adapter');
  assert.equal(unavailable.retryable, true);
}

/**
 * <lang><zh-CN>验证 detail section failure、mock session 与 catalog-to-detail route action fixture。</zh-CN><en>Verifies the detail-section-failure, mock-session, and catalog-to-detail route-action fixtures.</en></lang>
 * @lang zh-CN 此测试证明主 entry、附属失败、session 与渠道投影彼此分层，不把身份或路由写入领域数据。
 * @lang en This test proves that the primary entry, supplementary failure, session, and channel projection remain layered and do not put identity or routes into domain data.
 */
function testReturnsDetailSessionAndRouteFixtures() {
  // <lang><zh-CN>section-failure mock 让主 entry 成功、附属 section 失败，以验证部分失败语义。</zh-CN><en>The section-failure mock succeeds for the primary entry and fails for a supplementary section, verifying partial-failure semantics.</en></lang>
  const detailMock = createCatalogQueryDetailMock({ fixtureCase: 'detail-section-failure' });

  // <lang><zh-CN>详情请求只使用由 query 契约产生的中性 entry ID。</zh-CN><en>The detail request uses only the neutral entry ID produced by the query contract.</en></lang>
  const detail = detailMock.portProviders['entry-detail'].invoke({
    contractVersion: CONTRACT_VERSION,
    entryId: 'entry-001'
  });

  // <lang><zh-CN>主 entry 必须可用，附属 section 的失败不能把整个 detail 变为 failure。</zh-CN><en>The primary entry must remain available; a supplementary section failure cannot turn the entire detail into a failure.</en></lang>
  assert.equal(detail.kind, 'detail');
  assert.equal(detail.entry.id, 'entry-001');
  assert.equal(detail.sections[1].failure.code, 'section-unavailable');

  // <lang><zh-CN>session port 必须返回 mock 模式且不暴露 subject、capability 或 token。</zh-CN><en>The session port must return mock mode and expose no subject, capability, or token.</en></lang>
  const session = detailMock.portProviders['session-state'].invoke();

  // <lang><zh-CN>空 capability 列表使首轮示例保持匿名、只读。</zh-CN><en>An empty capability list keeps the first example anonymous and read-only.</en></lang>
  assert.equal(session.mode, 'mock');
  assert.equal(session.subject, null);
  assert.deepEqual(session.capabilities, []);

  // <lang><zh-CN>受限 route action 只能在公开契约已登记的 screen ID 之间解析。</zh-CN><en>A restricted route action may resolve only between screen IDs registered by the public contract.</en></lang>
  const routeAction = detailMock.resolveRouteAction('select-entry');

  // <lang><zh-CN>action 的 from/to 验证 catalog 到 detail 的渠道投影，不引入 URL 或 import path。</zh-CN><en>The action's from/to validates the catalog-to-detail channel projection without introducing a URL or import path.</en></lang>
  assert.deepEqual(routeAction, {
    id: 'select-entry',
    from: 'catalog-list',
    to: 'entry-detail'
  });
}

/**
 * <lang><zh-CN>验证 core 可使用 example module 的同一组 manifest、profile 和 port provider 组成可调用纵切。</zh-CN><en>Verifies that the core can assemble an invokable vertical slice from the example module's own manifests, profile, and port providers.</en></lang>
 * @lang zh-CN 该测试是同仓显式 integration fixture，不表示 HIA-uView、UniApp 或真实应用已经接入。
 * @lang en This test is an explicit same-repository integration fixture and does not mean HIA-uView, UniApp, or a real application has been integrated.
 */
function testAssemblesExampleVerticalSlice() {
  // <lang><zh-CN>example module 统一产出 manifest 与 profile，降低文档/fixture 标识漂移风险。</zh-CN><en>The example module produces its manifests and profile together, reducing identifier drift between documentation and fixtures.</en></lang>
  const manifests = createExampleManifests();

  // <lang><zh-CN>普通 first-page mock 提供三个 required port 和 route projection。</zh-CN><en>The ordinary first-page mock provides the three required ports and route projection.</en></lang>
  const mock = createCatalogQueryDetailMock({ fixtureCase: 'first-page' });

  // <lang><zh-CN>core 装配只接收显式值，不读取文件、全局单例、环境变量或网络。</zh-CN><en>The core assembly receives only explicit values and reads no file, global singleton, environment variable, or network.</en></lang>
  const assembly = assembleComposition({
    businessModule: manifests.businessModule,
    implementationPackage: manifests.implementationPackage,
    profile: manifests.profile,
    portProviders: mock.portProviders
  });

  // <lang><zh-CN>合法装配必须产生 composition，而不能把可用 provider 留在 diagnostics-only 状态。</zh-CN><en>A valid assembly must produce a composition and cannot leave available providers in a diagnostics-only state.</en></lang>
  assert.equal(assembly.ok, true);
  assert.equal(assembly.composition.moduleId, EXAMPLE_MODULE_ID);

  // <lang><zh-CN>composition 通过已登记 port 调用 query，保留 mock 返回的 canonical page。</zh-CN><en>The composition invokes query through a registered port and preserves the mock's canonical page result.</en></lang>
  const page = assembly.composition.invoke('catalog-query', {
    contractVersion: CONTRACT_VERSION,
    filter: {},
    page: 1,
    pageSize: 20
  });

  // <lang><zh-CN>page 结果证明 core 未改变 module-owned query 的输出语义。</zh-CN><en>The page result proves the core did not alter the module-owned query output semantics.</en></lang>
  assert.equal(page.kind, 'page');
  assert.equal(page.entries[0].id, 'entry-001');
}

// <lang><zh-CN>按独立职责注册测试，失败信息可精确指向 manifest、组合或某一 fixture 情形。</zh-CN><en>Register tests by independent responsibility so a failure precisely identifies a manifest, composition, or fixture case.</en></lang>
test('accepts a valid business-module and implementation-package pair', testAcceptsValidManifestPair);
test('rejects invalid manifest kind and module correspondence', testRejectsInvalidManifestRelations);
test('rejects invalid composition relations before provider invocation', testRejectsInvalidCompositionRelations);
test('returns deterministic first-page, last-page, and empty-query fixtures', testReturnsDeterministicQueryFixtures);
test('returns canonical invalid-query and adapter-failure fixtures', testReturnsCanonicalQueryFailures);
test('returns detail-section-failure, mock-session, and route fixtures', testReturnsDetailSessionAndRouteFixtures);
test('assembles the neutral example vertical slice through explicit ports', testAssemblesExampleVerticalSlice);
