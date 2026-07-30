/**
 * <lang><zh-CN>中性目录—查询—详情小程序应用模板：创建版本化声明式模板与完整显式 capability candidate。</zh-CN><en>Neutral catalog-query-detail mini-program application template: creates a versioned declarative template and a complete explicit capability candidate.</en></lang>
 * @lang zh-CN 本模块只组合仓内确定性 mock/wire fixture；不读取文件、网络、环境、storage、credential、package registry 或动态代码。
 * @lang en This module composes only checked-in deterministic mock or wire fixtures; it reads no file, network, environment, storage, credential, package registry, or dynamic code.
 */

// <lang><zh-CN>从业务模块取得自有 manifest 与必备 mock provider，不把模板字段混入 module manifest。</zh-CN><en>Obtain owned manifests and mandatory mock providers from the business module without mixing template fields into a module manifest.</en></lang>
import {
  createCatalogQueryDetailMock,
  createExampleManifests
} from '@hia-uview/biz-example-catalog-query-detail';

// <lang><zh-CN>wire adapter 是显式替代实现；模板不会在其失败时回退到 mock。</zh-CN><en>The wire adapter is an explicit alternative implementation; the template never falls back to mock when it fails.</en></lang>
import {
  createCatalogQueryDetailAdapterFixture
} from '@hia-uview/biz-example-catalog-query-detail-adapter-fixture';

// <lang><zh-CN>reference-data v1 作为完整候选中的显式依赖单元提供。</zh-CN><en>Reference-data v1 is supplied as an explicit dependency unit in the complete candidate.</en></lang>
import {
  createReferenceDataCapabilityUnit
} from '@hia-uview/biz-example-reference-data';

/**
 * <lang><zh-CN>当前模板与采用 profile 的固定契约版本。</zh-CN><en>Fixed contract version of the current template and adoption profile.</en></lang>
 * @lang zh-CN 该版本不从环境、package 或 adapter 推断。
 * @lang en This version is inferred from neither environment, package, nor adapter.
 */
const CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>模板绑定的完整采用 profile ID。</zh-CN><en>Complete adoption-profile ID bound by the template.</en></lang>
 * @lang zh-CN integration runtime 要求精确匹配，不支持 alias 或隐式迁移。
 * @lang en The integration runtime requires an exact match and supports neither aliases nor implicit migration.
 */
const ADOPTION_PROFILE_ID = 'example.catalog-composed';

/**
 * <lang><zh-CN>模板固定的主业务模块 ID。</zh-CN><en>Primary business-module ID fixed by the template.</en></lang>
 * @lang zh-CN app shell 只能通过该主模块调用 canonical ports。
 * @lang en The app shell may invoke canonical ports only through this primary module.
 */
const PRIMARY_MODULE_ID = 'example.catalog-query-detail';

/**
 * <lang><zh-CN>模板候选 options 允许的精确根键。</zh-CN><en>Exact root keys allowed for template-candidate options.</en></lang>
 * @lang zh-CN 所有调用方必须明确 source、fixture、分页和已编译 block，不存在隐式 source 默认值。
 * @lang en Every caller must explicitly state source, fixture, paging, and compiled blocks; no implicit source default exists.
 */
const CANDIDATE_OPTION_KEYS = Object.freeze([
  'sourceMode',
  'fixtureCase',
  'pageSize',
  'enabledBlocks'
]);

/**
 * <lang><zh-CN>模板支持的本地 source mode。</zh-CN><en>Local source modes supported by the template.</en></lang>
 * @lang zh-CN 值只选择已 import 的工厂，不成为 package、URL 或文件路径。
 * @lang en A value selects only an already imported factory and never becomes a package, URL, or file path.
 */
const ALLOWED_SOURCE_MODES = new Set(['mock', 'wire-fixture']);

/**
 * <lang><zh-CN>mock 与 wire 各自拥有的 fixture case allowlist。</zh-CN><en>Fixture-case allowlists owned separately by mock and wire.</en></lang>
 * @lang zh-CN 两个集合互不回退；不匹配的组合立即作为开发配置错误拒绝。
 * @lang en The sets never fall back to one another; a mismatched pair is rejected immediately as a development-configuration error.
 */
const FIXTURE_CASES_BY_SOURCE = Object.freeze({
  mock: new Set([
    'first-page',
    'last-page',
    'empty-query',
    'adapter-failure',
    'detail-section-failure'
  ]),
  'wire-fixture': new Set([
    'success',
    'exchange-failure',
    'malformed-wire',
    'detail-section-failure'
  ])
});

/**
 * <lang><zh-CN>模板宿主允许的有限 page size。</zh-CN><en>Finite page sizes allowed by the template host.</en></lang>
 * @lang zh-CN page size 是声明式呈现参数，不透传到 adapter 私有协议。
 * @lang en Page size is a declarative presentation parameter and is not passed through to an adapter-private protocol.
 */
const ALLOWED_PAGE_SIZES = new Set([1, 5, 10, 20]);

/**
 * <lang><zh-CN>应用已编译 block 与其固定 visibility 的映射。</zh-CN><en>Mapping from app-compiled blocks to their fixed visibility.</en></lang>
 * @lang zh-CN block ID 不解析为组件路径，visibility 不执行表达式。
 * @lang en A block ID is not resolved as a component path, and visibility executes no expression.
 */
const VISIBILITY_BY_BLOCK = Object.freeze({
  'runtime-status': 'always',
  'query-context': 'always',
  'catalog-list': 'always',
  'entry-detail': 'has-selection'
});

/**
 * <lang><zh-CN>保持目录—详情纵切完整所必需的 block。</zh-CN><en>Blocks required to keep the catalog-to-detail slice complete.</en></lang>
 * @lang zh-CN 状态与查询上下文可以隐藏，目录与详情不可从该模板候选移除。
 * @lang en Runtime status and query context may be hidden, but catalog and detail cannot be removed from this template candidate.
 */
const REQUIRED_BLOCK_IDS = Object.freeze(['catalog-list', 'entry-detail']);

/**
 * <lang><zh-CN>判断未知值是否为可安全读取自有字段的普通记录。</zh-CN><en>Determines whether an unknown value is a plain record whose own fields may be read safely.</en></lang>
 *
 * @param {unknown} value <lang><zh-CN>待检查值。</zh-CN><en>Value to inspect.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否满足最小记录 shape。</zh-CN><en>Whether the minimum record shape is satisfied.</en></lang>
 */
function isRecord(value) {
  // <lang><zh-CN>排除 null 与数组，避免把位置数据误当命名配置。</zh-CN><en>Exclude null and arrays so positional data is not mistaken for named configuration.</en></lang>
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * <lang><zh-CN>检查记录的 enumerable 自有键是否精确匹配。</zh-CN><en>Checks whether a record's enumerable own keys match exactly.</en></lang>
 *
 * @param {object} record <lang><zh-CN>已通过最小记录检查的值。</zh-CN><en>Value that passed the minimum record check.</en></lang>
 * @param {string[]} expectedKeys <lang><zh-CN>完整允许键集合。</zh-CN><en>Complete allowed-key set.</en></lang>
 * @returns {boolean} <lang><zh-CN>是否无缺失、无额外字段。</zh-CN><en>Whether no field is missing or extra.</en></lang>
 */
function hasExactOwnKeys(record, expectedKeys) {
  // <lang><zh-CN>JSON 风格 options 不支持 symbol/non-enumerable 配置面。</zh-CN><en>JSON-style options support no symbol or non-enumerable configuration surface.</en></lang>
  const actualKeys = Object.keys(record);

  // <lang><zh-CN>先比较数量，再逐项确认自有字段。</zh-CN><en>Compare counts first and then confirm every own field.</en></lang>
  return actualKeys.length === expectedKeys.length
    && expectedKeys.every((key) => Object.hasOwn(record, key));
}

/**
 * <lang><zh-CN>创建与公开 JSON example 等值的新应用模板。</zh-CN><en>Creates a fresh application template equal to the public JSON example.</en></lang>
 *
 * @returns {object} <lang><zh-CN>完整、可序列化、无可执行字段的模板。</zh-CN><en>Complete serializable template containing no executable field.</en></lang>
 * @lang zh-CN 每次调用创建新对象；runtime 不读取文档文件，也不共享可变数组。
 * @lang en Every call creates a new object; runtime reads no documentation file and shares no mutable array.
 */
export function createExampleCatalogApplicationTemplate() {
  // <lang><zh-CN>字段顺序与公开 example 保持一致，便于人工 diff 与证据核对。</zh-CN><en>Keep field order aligned with the public example for human diff and evidence review.</en></lang>
  return {
    manifestVersion: CONTRACT_VERSION,
    kind: 'application-template',
    id: 'example.catalog-query-detail.mp-weixin',
    adoptionProfileId: ADOPTION_PROFILE_ID,
    primaryModuleId: PRIMARY_MODULE_ID,
    capabilitySlots: [
      {
        id: 'reference-data',
        moduleId: 'example.reference-data',
        requiredState: 'enabled',
        requiredSurfaces: ['adapter']
      },
      {
        id: 'catalog-adapter',
        moduleId: PRIMARY_MODULE_ID,
        requiredState: 'enabled',
        requiredSurfaces: ['adapter', 'mock-session']
      }
    ],
    hostPolicy: {
      registeredBlocks: [
        'runtime-status',
        'query-context',
        'catalog-list',
        'entry-detail'
      ],
      registeredVisibility: [
        'always',
        'has-results',
        'has-selection'
      ],
      allowedPageSizes: [1, 5, 10, 20]
    },
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
    },
    screenCapabilityPolicy: {
      'catalog-list': [],
      'entry-detail': []
    }
  };
}

/**
 * <lang><zh-CN>完整校验并复制模板候选 options。</zh-CN><en>Fully validates and copies template-candidate options.</en></lang>
 *
 * @param {unknown} options <lang><zh-CN>调用方声明的本地候选选项。</zh-CN><en>Caller-declared local candidate options.</en></lang>
 * @returns {object} <lang><zh-CN>与输入分离的受限 options。</zh-CN><en>Bounded options detached from the input.</en></lang>
 * @throws {TypeError|RangeError} <lang><zh-CN>shape 或 allowlist 不合法时抛出固定错误。</zh-CN><en>Throws a fixed error for an invalid shape or allowlist value.</en></lang>
 */
function validateCandidateOptions(options) {
  // <lang><zh-CN>根对象必须精确包含四个声明字段，拒绝 callback、连接与控制字段。</zh-CN><en>The root must contain exactly four declarative fields, rejecting callback, connection, and control fields.</en></lang>
  if (!isRecord(options) || !hasExactOwnKeys(options, CANDIDATE_OPTION_KEYS)) {
    throw new TypeError('Application-template candidate options are invalid.');
  }

  // <lang><zh-CN>source 必须显式命中本地固定集合。</zh-CN><en>The source must explicitly match the fixed local set.</en></lang>
  if (!ALLOWED_SOURCE_MODES.has(options.sourceMode)) {
    throw new RangeError('Application-template source mode is unsupported.');
  }

  // <lang><zh-CN>fixture case 必须属于所选 source，自始至终不执行 fallback。</zh-CN><en>The fixture case must belong to the selected source, with no fallback at any point.</en></lang>
  if (!FIXTURE_CASES_BY_SOURCE[options.sourceMode].has(options.fixtureCase)) {
    throw new RangeError('Application-template fixture case is unsupported.');
  }

  // <lang><zh-CN>pageSize 只允许模板宿主已登记值。</zh-CN><en>Page size accepts only values registered by the template host.</en></lang>
  if (!ALLOWED_PAGE_SIZES.has(options.pageSize)) {
    throw new RangeError('Application-template page size is unsupported.');
  }

  // <lang><zh-CN>enabledBlocks 必须是非空且唯一的已编译 ID 列表。</zh-CN><en>Enabled blocks must be a non-empty unique list of compiled IDs.</en></lang>
  const hasValidBlocks = Array.isArray(options.enabledBlocks)
    && options.enabledBlocks.length > 0
    && options.enabledBlocks.every(
      (blockId) => typeof blockId === 'string' && Object.hasOwn(VISIBILITY_BY_BLOCK, blockId)
    )
    && new Set(options.enabledBlocks).size === options.enabledBlocks.length
    && REQUIRED_BLOCK_IDS.every((blockId) => options.enabledBlocks.includes(blockId));

  // <lang><zh-CN>非法 block 不尝试解析为组件、路径或远端资源。</zh-CN><en>An invalid block is not interpreted as a component, path, or remote resource.</en></lang>
  if (!hasValidBlocks) {
    throw new RangeError('Application-template enabled blocks are unsupported.');
  }

  // <lang><zh-CN>返回自有数组副本，使候选不受调用方后续修改影响。</zh-CN><en>Return an owned array copy so later caller mutation cannot affect the candidate.</en></lang>
  return {
    sourceMode: options.sourceMode,
    fixtureCase: options.fixtureCase,
    pageSize: options.pageSize,
    enabledBlocks: [...options.enabledBlocks]
  };
}

/**
 * <lang><zh-CN>创建显式 catalog capability unit 与受限 observation。</zh-CN><en>Creates an explicit catalog capability unit and bounded observation.</en></lang>
 *
 * @param {string} sourceMode <lang><zh-CN>已验证 source mode。</zh-CN><en>Validated source mode.</en></lang>
 * @param {string} fixtureCase <lang><zh-CN>已验证 fixture case。</zh-CN><en>Validated fixture case.</en></lang>
 * @returns {{unit: object, getObservation: Function}} <lang><zh-CN>完整单元与只读 observation closure。</zh-CN><en>Complete unit and read-only observation closure.</en></lang>
 * @lang zh-CN 两个分支都使用相同 business module；只有显式 implementation/provider 不同。
 * @lang en Both branches use the same business module; only the explicit implementation and providers differ.
 */
function createCatalogUnit(sourceMode, fixtureCase) {
  // <lang><zh-CN>创建新的业务声明和 core profile，避免候选间共享可变 manifest。</zh-CN><en>Create fresh business declarations and a core profile, avoiding mutable manifests shared across candidates.</en></lang>
  const manifests = createExampleManifests();

  // <lang><zh-CN>wire 分支只创建本地 injected fixture，不携带 endpoint、credential 或真实 transport。</zh-CN><en>The wire branch creates only a local injected fixture and carries no endpoint, credential, or real transport.</en></lang>
  if (sourceMode === 'wire-fixture') {
    const fixture = createCatalogQueryDetailAdapterFixture({ fixtureCase });

    // <lang><zh-CN>core profile 精确选择 wire implementation；不保留 mock ID 作为回退。</zh-CN><en>The core profile selects the wire implementation exactly and retains no mock ID as fallback.</en></lang>
    manifests.profile.implementationPackageIds = [fixture.implementationPackage.id];

    /**
     * <lang><zh-CN>取得带显式 source 标签的计数 observation。</zh-CN><en>Obtains a count-only observation labelled with the explicit source.</en></lang>
     *
     * @returns {object} <lang><zh-CN>query/detail adapter 的受限计数。</zh-CN><en>Bounded counts for query and detail adapters.</en></lang>
     */
    const getObservation = () => {
      // <lang><zh-CN>底层每次返回新计数对象；不含 request、wire、cache value 或异常。</zh-CN><en>The lower layer returns fresh count objects containing no request, wire value, cache value, or exception.</en></lang>
      const observation = fixture.getObservation();

      // <lang><zh-CN>source 标签说明这是显式选择，而不是自动探测结果。</zh-CN><en>The source label denotes an explicit selection rather than an auto-detected result.</en></lang>
      return {
        sourceMode,
        query: observation.query,
        detail: observation.detail
      };
    };

    // <lang><zh-CN>只把 lifecycle/core 所需字段放入 unit。</zh-CN><en>Place only lifecycle/core-required fields in the unit.</en></lang>
    return {
      unit: {
        businessModule: manifests.businessModule,
        implementationPackage: fixture.implementationPackage,
        profile: manifests.profile,
        portProviders: fixture.portProviders
      },
      getObservation
    };
  }

  // <lang><zh-CN>mock 是显式一等实现；创建过程不依赖 wire 状态。</zh-CN><en>Mock is an explicit first-class implementation whose creation does not depend on wire state.</en></lang>
  const fixture = createCatalogQueryDetailMock({ fixtureCase });

  /**
   * <lang><zh-CN>mock observation 只报告显式 source mode。</zh-CN><en>Mock observation reports only the explicit source mode.</en></lang>
   *
   * @returns {{sourceMode: string}} <lang><zh-CN>无伪造 exchange 计数的受限结果。</zh-CN><en>Bounded result with no fabricated exchange count.</en></lang>
   */
  const getObservation = () => ({ sourceMode });

  // <lang><zh-CN>mock manifest、core profile 与 providers 来自同一次全新构造。</zh-CN><en>The mock manifest, core profile, and providers come from the same fresh construction.</en></lang>
  return {
    unit: {
      businessModule: manifests.businessModule,
      implementationPackage: manifests.implementationPackage,
      profile: manifests.profile,
      portProviders: fixture.portProviders
    },
    getObservation
  };
}

/**
 * <lang><zh-CN>创建一个可交给 application-integration runtime 的完整显式候选。</zh-CN><en>Creates a complete explicit candidate for the application-integration runtime.</en></lang>
 *
 * @param {unknown} options <lang><zh-CN>精确声明 source、fixture、分页与已编译 block 的选项。</zh-CN><en>Options explicitly declaring source, fixture, paging, and compiled blocks.</en></lang>
 * @returns {object} <lang><zh-CN>enumerable template/profile/units 与 non-enumerable observation helper。</zh-CN><en>Enumerable template/profile/units and a non-enumerable observation helper.</en></lang>
 * @lang zh-CN 候选完整列出两个 slot，不发现、下载、安装或补齐任何能力包。
 * @lang en The candidate lists both slots completely and discovers, downloads, installs, or auto-fills no capability package.
 */
export function createExampleCatalogTemplateCandidate(options) {
  // <lang><zh-CN>先校验全部 plain-data options，后创建任一 provider。</zh-CN><en>Validate all plain-data options before creating any provider.</en></lang>
  const validatedOptions = validateCandidateOptions(options);

  // <lang><zh-CN>reference-data v1 是显式固定依赖单元，不由 module ID 发现。</zh-CN><en>Reference-data v1 is an explicitly fixed dependency unit and is not discovered from a module ID.</en></lang>
  const referenceDataUnit = createReferenceDataCapabilityUnit({
    fixtureVersion: 'v1'
  });

  // <lang><zh-CN>按已验证 source 构造唯一 catalog 单元。</zh-CN><en>Construct the sole catalog unit from the validated source.</en></lang>
  const selectedCatalog = createCatalogUnit(
    validatedOptions.sourceMode,
    validatedOptions.fixtureCase
  );

  // <lang><zh-CN>presentation 对每个已编译 block 使用固定 visibility，不执行表达式。</zh-CN><en>Presentation uses fixed visibility for every compiled block and executes no expression.</en></lang>
  const blocks = validatedOptions.enabledBlocks.map((blockId) => ({
    id: blockId,
    visibility: VISIBILITY_BY_BLOCK[blockId]
  }));

  // <lang><zh-CN>完整 adoption profile 与 app profile/template/business manifests 保持独立。</zh-CN><en>The complete adoption profile remains separate from the app profile, template, and business manifests.</en></lang>
  const profile = {
    adoptionVersion: CONTRACT_VERSION,
    kind: 'capability-adoption-profile',
    profileId: ADOPTION_PROFILE_ID,
    capabilities: [
      {
        moduleId: 'example.reference-data',
        implementationPackageId: referenceDataUnit.implementationPackage.id,
        state: 'enabled'
      },
      {
        moduleId: PRIMARY_MODULE_ID,
        implementationPackageId: selectedCatalog.unit.implementationPackage.id,
        state: 'enabled'
      }
    ],
    presentation: {
      blocks,
      order: [...validatedOptions.enabledBlocks],
      pageSize: validatedOptions.pageSize
    }
  };

  // <lang><zh-CN>三个 enumerable 字段精确满足 integration 输入门禁。</zh-CN><en>The three enumerable fields exactly satisfy the integration input gate.</en></lang>
  const candidate = {
    template: createExampleCatalogApplicationTemplate(),
    profile,
    units: [referenceDataUnit, selectedCatalog.unit]
  };

  // <lang><zh-CN>observation helper 只服务本地 fixture/UI 证据，不属于可序列化 integration candidate。</zh-CN><en>The observation helper serves only local fixture/UI evidence and is not part of the serializable integration candidate.</en></lang>
  Object.defineProperty(candidate, 'getObservation', {
    value: selectedCatalog.getObservation,
    enumerable: false,
    configurable: false,
    writable: false
  });

  // <lang><zh-CN>返回可供负向测试复制/修改 metadata 的新候选；integration 会自行隔离活动状态。</zh-CN><en>Return a fresh candidate whose metadata may be copied or mutated by negative tests; integration isolates active state itself.</en></lang>
  return candidate;
}
