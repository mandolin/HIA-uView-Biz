/**
 * <lang><zh-CN>中性 reference-data 示例能力：创建两个同契约、显式选择的确定性 fixture unit，用于依赖组合与原子实现替换。</zh-CN><en>Neutral reference-data example capability: creates two explicitly selected deterministic fixture units with one contract for dependency composition and atomic implementation replacement.</en></lang>
 * @lang zh-CN 本模块只拥有独立编写的测试 option；不读取网络、文件、环境、storage、credential、行业字典、用户偏好或后端响应。
 * @lang en This module owns only independently written test options; it reads no network, files, environment, storage, credentials, industry dictionary, user preference, or backend response.
 */

/**
 * <lang><zh-CN>reference-data module 与 port 的固定契约版本。</zh-CN><en>The fixed contract version for the reference-data module and port.</en></lang>
 * @lang zh-CN v1/v2 fixture 实现同一 `1.0` contract，replacement 不改变业务请求/结果 shape。
 * @lang en The v1/v2 fixtures implement the same `1.0` contract, so replacement does not change business request/result shape.
 */
const CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>中性 reference-data 业务模块的稳定 ID。</zh-CN><en>The stable ID of the neutral reference-data business module.</en></lang>
 * @lang zh-CN 该 ID 不声明任何行业字典、生产主数据或发布包。
 * @lang en This ID declares no industry dictionary, production master data, or published package.
 */
export const REFERENCE_DATA_MODULE_ID = 'example.reference-data';

/**
 * <lang><zh-CN>fixture version 到 implementation package ID 的固定映射。</zh-CN><en>Fixed mapping from fixture version to implementation-package ID.</en></lang>
 * @lang zh-CN allowlist 防止任意字符串成为文件、包或动态 import 指令。
 * @lang en The allowlist prevents an arbitrary string from becoming a file, package, or dynamic-import instruction.
 */
const IMPLEMENTATION_ID_BY_FIXTURE_VERSION = Object.freeze({
  v1: 'example.reference-data.fixture-v1',
  v2: 'example.reference-data.fixture-v2'
});

/**
 * <lang><zh-CN>创建新的双语显示文本。</zh-CN><en>Creates new bilingual display text.</en></lang>
 *
 * @param {string} zhHans <lang><zh-CN>简体中文文本。</zh-CN><en>Simplified-Chinese text.</en></lang>
 * @param {string} english <lang><zh-CN>英文文本。</zh-CN><en>English text.</en></lang>
 * @returns {object} <lang><zh-CN>包含 `zh-Hans` 与 `en` 的新对象。</zh-CN><en>A new object containing `zh-Hans` and `en`.</en></lang>
 * @lang zh-CN 每次调用返回新对象，避免 fixture result 共享可变 label。
 * @lang en Every call returns a new object, avoiding mutable labels shared across fixture results.
 */
function createLocalizedText(zhHans, english) {
  // <lang><zh-CN>保留 runtime locale 标识 `zh-Hans`；它与代码文档 `zh-CN` 标识用途不同。</zh-CN><en>Keep the runtime locale identifier `zh-Hans`; it serves a different purpose from the code-documentation identifier `zh-CN`.</en></lang>
  return {
    'zh-Hans': zhHans,
    en: english
  };
}

/**
 * <lang><zh-CN>为指定 fixture version 创建独立 option 数组。</zh-CN><en>Creates an independent option array for a specified fixture version.</en></lang>
 *
 * @param {'v1'|'v2'} fixtureVersion <lang><zh-CN>已验证的 fixture allowlist 值。</zh-CN><en>Validated fixture allowlist value.</en></lang>
 * @returns {object[]} <lang><zh-CN>中性、确定性的 reference option。</zh-CN><en>Neutral deterministic reference options.</en></lang>
 * @lang zh-CN v2 只增加一个中性 option，以证明 replacement 切换结果；不模拟数据迁移。
 * @lang en V2 only adds one neutral option to prove result switching during replacement; it does not simulate data migration.
 */
function createOptions(fixtureVersion) {
  // <lang><zh-CN>两版共享的基础 option 每次都重新创建。</zh-CN><en>Create fresh base options shared by both versions.</en></lang>
  const options = [
    {
      id: 'all',
      label: createLocalizedText('全部', 'All')
    },
    {
      id: 'featured',
      label: createLocalizedText('精选', 'Featured')
    }
  ];

  // <lang><zh-CN>只有显式 v2 才加入第三个中性 option。</zh-CN><en>Add the third neutral option only for explicit v2.</en></lang>
  if (fixtureVersion === 'v2') {
    // <lang><zh-CN>追加新对象，不修改任何持久化或共享数据。</zh-CN><en>Append a new object without modifying persistent or shared data.</en></lang>
    options.push({
      id: 'recommended',
      label: createLocalizedText('推荐', 'Recommended')
    });
  }

  // <lang><zh-CN>返回本次调用自有数组。</zh-CN><en>Return the array owned by this call.</en></lang>
  return options;
}

/**
 * <lang><zh-CN>创建 reference-data business-module manifest。</zh-CN><en>Creates the reference-data business-module manifest.</en></lang>
 *
 * @returns {object} <lang><zh-CN>中性只读业务声明。</zh-CN><en>A neutral read-only business declaration.</en></lang>
 * @lang zh-CN module 只拥有 option lookup contract，不拥有实现版本、package 路径或行业值。
 * @lang en The module owns only the option-lookup contract and owns no implementation version, package path, or industry value.
 */
function createBusinessModule() {
  // <lang><zh-CN>每次返回新 manifest，使候选失败测试不会污染其他单元。</zh-CN><en>Return a new manifest each time so candidate-failure tests cannot contaminate other units.</en></lang>
  return {
    manifestVersion: CONTRACT_VERSION,
    kind: 'business-module',
    id: REFERENCE_DATA_MODULE_ID,
    displayName: createLocalizedText('通用参考选项示例', 'Generic reference options example'),
    business: {
      responsibility: createLocalizedText(
        '为已声明的中性筛选提供只读参考选项。',
        'Provides read-only reference options for declared neutral filters.'
      ),
      lifecycle: 'profile-selected',
      permissions: []
    },
    contracts: {
      ports: [
        {
          id: 'reference-options',
          direction: 'required',
          contract: {
            id: 'reference-data.options',
            version: CONTRACT_VERSION
          }
        }
      ],
      filterSchema: {
        id: 'reference-data.request',
        version: CONTRACT_VERSION
      },
      outcomes: [
        {
          id: 'reference-data.options-result',
          version: CONTRACT_VERSION
        },
        {
          id: 'reference-data.failure',
          version: CONTRACT_VERSION
        }
      ]
    },
    configuration: {
      registeredBlocks: [],
      paginationModes: [],
      visibilityConditions: [],
      ordering: 'fixed'
    },
    dependencies: [],
    conflicts: []
  };
}

/**
 * <lang><zh-CN>创建一个显式 fixture implementation-package manifest。</zh-CN><en>Creates one explicit fixture implementation-package manifest.</en></lang>
 *
 * @param {'v1'|'v2'} fixtureVersion <lang><zh-CN>实现 fixture 的 allowlist version。</zh-CN><en>Allowlisted version of the implementation fixture.</en></lang>
 * @returns {object} <lang><zh-CN>仅描述工程交付的实现声明。</zh-CN><en>An implementation declaration describing engineering delivery only.</en></lang>
 * @lang zh-CN 两版提供相同 port contract；implementation ID 只用于显式 replacement。
 * @lang en Both versions provide the same port contract; the implementation ID exists only for explicit replacement.
 */
function createImplementationPackage(fixtureVersion) {
  // <lang><zh-CN>从固定 allowlist 取得实现 ID，不拼接任意外部字符串。</zh-CN><en>Obtain the implementation ID from the fixed allowlist rather than concatenating arbitrary external text.</en></lang>
  const implementationPackageId = IMPLEMENTATION_ID_BY_FIXTURE_VERSION[fixtureVersion];

  // <lang><zh-CN>返回 fixture-only 工程声明，不把 version 误作已发布 npm version。</zh-CN><en>Return a fixture-only engineering declaration without presenting the version as a published npm version.</en></lang>
  return {
    manifestVersion: CONTRACT_VERSION,
    kind: 'implementation-package',
    id: implementationPackageId,
    moduleId: REFERENCE_DATA_MODULE_ID,
    package: {
      identity: 'example-reference-data-fixture',
      distribution: 'fixture-only'
    },
    runtime: {
      targets: ['node', 'mp-weixin'],
      surfaces: ['adapter']
    },
    provides: [
      {
        id: 'reference-options',
        kind: 'adapter',
        contract: {
          id: 'reference-data.options',
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
 * <lang><zh-CN>创建与指定实现精确对应的 core profile。</zh-CN><en>Creates a core profile exactly corresponding to a specified implementation.</en></lang>
 *
 * @param {string} implementationPackageId <lang><zh-CN>已从 allowlist 解析的实现 ID。</zh-CN><en>Implementation ID resolved from the allowlist.</en></lang>
 * @returns {object} <lang><zh-CN>不含 UI/route 的最小显式 profile。</zh-CN><en>A minimal explicit profile containing no UI or route.</en></lang>
 * @lang zh-CN profile 只选择当前 module/implementation；它不是 adoption profile。
 * @lang en The profile selects only the current module/implementation; it is not an adoption profile.
 */
function createCoreProfile(implementationPackageId) {
  // <lang><zh-CN>reference-data 没有 presentation block 或 route，故使用空选择。</zh-CN><en>Reference data has no presentation block or route, so use empty selections.</en></lang>
  return {
    id: REFERENCE_DATA_MODULE_ID,
    enabledModuleIds: [REFERENCE_DATA_MODULE_ID],
    implementationPackageIds: [implementationPackageId],
    selectedBlocks: [],
    visibilityByBlock: {},
    blockOrder: []
  };
}

/**
 * <lang><zh-CN>创建只读 reference-options provider。</zh-CN><en>Creates a read-only reference-options provider.</en></lang>
 *
 * @param {'v1'|'v2'} fixtureVersion <lang><zh-CN>决定稳定 revision 与 option 集合的版本。</zh-CN><en>Version determining the stable revision and option set.</en></lang>
 * @returns {object} <lang><zh-CN>匹配 `reference-data.options@1.0` 的 provider。</zh-CN><en>A provider matching `reference-data.options@1.0`.</en></lang>
 * @lang zh-CN provider 只接受最小 versioned request，并为每次成功调用创建新结果。
 * @lang en The provider accepts only the minimal versioned request and creates a new result for every successful invocation.
 */
function createReferenceOptionsProvider(fixtureVersion) {
  // <lang><zh-CN>返回 core 所需的 contract + invoke 对象。</zh-CN><en>Return the contract-plus-invoke object required by the core.</en></lang>
  return {
    contract: {
      id: 'reference-data.options',
      version: CONTRACT_VERSION
    },
    invoke(request) {
      // <lang><zh-CN>只接受包含唯一 contractVersion 字段的普通对象。</zh-CN><en>Accept only an ordinary object containing the sole contractVersion field.</en></lang>
      const hasValidRequest = typeof request === 'object'
        && request !== null
        && !Array.isArray(request)
        && Object.keys(request).length === 1
        && request.contractVersion === CONTRACT_VERSION;

      // <lang><zh-CN>无效输入返回 module-owned failure，不回显 request。</zh-CN><en>Invalid input returns a module-owned failure without echoing the request.</en></lang>
      if (!hasValidRequest) {
        // <lang><zh-CN>failure 只含稳定 code、双语 message、重试性与 scope。</zh-CN><en>The failure contains only a stable code, bilingual message, retryability, and scope.</en></lang>
        return {
          contractVersion: CONTRACT_VERSION,
          kind: 'failure',
          code: 'invalid-reference-request',
          message: createLocalizedText(
            '参考选项请求不符合最小契约。',
            'The reference-options request does not satisfy the minimum contract.'
          ),
          retryable: false,
          scope: 'request'
        };
      }

      // <lang><zh-CN>成功结果公开稳定 fixture revision 和全新 option 副本。</zh-CN><en>The successful result exposes a stable fixture revision and fresh option copies.</en></lang>
      return {
        contractVersion: CONTRACT_VERSION,
        kind: 'reference-options',
        revision: `fixture-${fixtureVersion}`,
        options: createOptions(fixtureVersion)
      };
    }
  };
}

/**
 * <lang><zh-CN>创建一个完整、显式、可由 core/lifecycle 校验的 reference-data capability unit。</zh-CN><en>Creates a complete explicit reference-data capability unit that core/lifecycle can validate.</en></lang>
 *
 * @param {object} [options] <lang><zh-CN>仅允许选择本模块自有 fixture。</zh-CN><en>Selects only this module's owned fixture.</en></lang>
 * @param {'v1'|'v2'} [options.fixtureVersion] <lang><zh-CN>显式 v1/v2 allowlist 值。</zh-CN><en>Explicit v1/v2 allowlist value.</en></lang>
 * @returns {object} <lang><zh-CN>包含 business manifest、implementation manifest、core profile 与 provider 的新单元。</zh-CN><en>A new unit containing business manifest, implementation manifest, core profile, and provider.</en></lang>
 * @throws {RangeError} <lang><zh-CN>fixtureVersion 不在 allowlist 时抛出固定错误。</zh-CN><en>Throws a fixed error when fixtureVersion is outside the allowlist.</en></lang>
 * @lang zh-CN factory 不读 registry、文件、环境或网络，也不执行 lifecycle hook。
 * @lang en The factory reads no registry, files, environment, or network and executes no lifecycle hook.
 */
export function createReferenceDataCapabilityUnit(options = {}) {
  // <lang><zh-CN>缺省选择 v1，保持首次采用确定性。</zh-CN><en>Select v1 by default to keep initial adoption deterministic.</en></lang>
  const fixtureVersion = options.fixtureVersion ?? 'v1';

  // <lang><zh-CN>拒绝未知字符串，避免把版本输入解释为 package/path/code。</zh-CN><en>Reject an unknown string so version input cannot be interpreted as a package, path, or code.</en></lang>
  if (!Object.hasOwn(IMPLEMENTATION_ID_BY_FIXTURE_VERSION, fixtureVersion)) {
    // <lang><zh-CN>固定消息不插入调用方值。</zh-CN><en>The fixed message does not interpolate caller input.</en></lang>
    throw new RangeError('Unsupported reference-data fixture version.');
  }

  // <lang><zh-CN>从 allowlist 读取精确 implementation ID。</zh-CN><en>Read the exact implementation ID from the allowlist.</en></lang>
  const implementationPackageId = IMPLEMENTATION_ID_BY_FIXTURE_VERSION[fixtureVersion];

  // <lang><zh-CN>创建四个相互对应的新单元成员。</zh-CN><en>Create four fresh corresponding unit members.</en></lang>
  const businessModule = createBusinessModule();
  const implementationPackage = createImplementationPackage(fixtureVersion);
  const profile = createCoreProfile(implementationPackageId);
  const portProviders = {
    'reference-options': createReferenceOptionsProvider(fixtureVersion)
  };

  // <lang><zh-CN>返回既有 capability lifecycle 认可的显式 shape。</zh-CN><en>Return the explicit shape recognized by the existing capability lifecycle.</en></lang>
  return {
    businessModule,
    implementationPackage,
    profile,
    portProviders
  };
}
