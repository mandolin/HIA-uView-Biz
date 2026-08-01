/**
 * <lang><zh-CN>solution profile runtime 的纯 Node 验收：验证受限 capability package 组合、anonymous mock-session grant 与脱敏 availability 投影。</zh-CN><en>Pure-Node acceptance for solution-profile runtime: verifies bounded capability-package composition, anonymous mock-session grants, and redacted availability projection.</en></lang>
 * @lang zh-CN 测试只构造本地 plain-data registry/profile/session；不读取文件、环境、网络、storage、provider 或动态代码。
 * @lang en The tests construct only local plain-data registry, profile, and session; they read no file, environment, network, storage, provider, or dynamic code.
 */

// <lang><zh-CN>使用严格断言验证稳定 metadata、失败边界与隔离副本。</zh-CN><en>Use strict assertions to verify stable metadata, failure boundaries, and detached copies.</en></lang>
import assert from 'node:assert/strict';

// <lang><zh-CN>使用 Node 原生测试运行器，避免引入外部测试依赖。</zh-CN><en>Use the native Node test runner, avoiding an external test dependency.</en></lang>
import test from 'node:test';

// <lang><zh-CN>被测 runtime 只解析显式传入的数据，不发现或加载 package。</zh-CN><en>The runtime under test resolves only explicitly supplied data and discovers or loads no package.</en></lang>
import {
  createSolutionProfileRuntime
} from '@hia-uview/biz-solution-profile-runtime';

/**
 * <lang><zh-CN>代表性 channel profile 的稳定 ID。</zh-CN><en>Stable ID of the representative channel profile.</en></lang>
 * @lang zh-CN 该 ID 仅用于 solution-to-channel 对应，不是用户、租户、后端或 package 位置。
 * @lang en This ID is used only for solution-to-channel correspondence and is not a user, tenant, backend, or package location.
 */
const CHANNEL_PROFILE_ID = 'example.catalog-query-detail.representative-mp-weixin';

/**
 * <lang><zh-CN>创建中性 solution profile 的固定 JSON-compatible 输入。</zh-CN><en>Creates the fixed JSON-compatible input of the neutral solution profile.</en></lang>
 *
 * @returns {object} <lang><zh-CN>调用方独立拥有的 solution profile。</zh-CN><en>Solution profile independently owned by the caller.</en></lang>
 * @lang zh-CN profile 只选择 capability package 与 channel profile，不包含 grant、身份、URL、组件或脚本。
 * @lang en The profile selects only capability packages and a channel profile; it contains no grant, identity, URL, component, or script.
 */
function createSolutionProfile() {
  // <lang><zh-CN>每次返回新数组，便于负向测试局部修改而不污染其他案例。</zh-CN><en>Return a new array every time so negative tests can mutate locally without contaminating other cases.</en></lang>
  return {
    solutionProfileVersion: '1.0',
    kind: 'solution-profile',
    id: 'example.catalog-query-detail.neutral',
    channelProfileId: CHANNEL_PROFILE_ID,
    capabilityPackageIds: ['example.catalog-query-detail.read']
  };
}

/**
 * <lang><zh-CN>创建不含个人主体的匿名 mock session。</zh-CN><en>Creates an anonymous mock session containing no personal subject.</en></lang>
 *
 * @param {string[]} [grantIds] <lang><zh-CN>测试显式提供的稳定 grant ID 集合。</zh-CN><en>Stable grant-ID set explicitly supplied by the test.</en></lang>
 * @returns {object} <lang><zh-CN>调用方独立拥有的 mock session。</zh-CN><en>Mock session independently owned by the caller.</en></lang>
 * @lang zh-CN grant 仅验证本地 availability，不等同真实授权、用户身份或 token。
 * @lang en Grants verify only local availability and are not real authorization, user identity, or token.
 */
function createAnonymousMockSession(grantIds = ['reference-data.read', 'catalog.read']) {
  // <lang><zh-CN>复制调用方数组，避免后续改变同一引用影响 fixture 原始输入的可读性。</zh-CN><en>Copy caller array so later change to the same reference cannot affect readability of fixture input.</en></lang>
  return {
    sessionVersion: '1.0',
    kind: 'anonymous-mock-session',
    grantIds: [...grantIds]
  };
}

/**
 * <lang><zh-CN>创建两个具有依赖关系的已登记中性 capability package。</zh-CN><en>Creates two registered neutral capability packages with a dependency relationship.</en></lang>
 *
 * @returns {object[]} <lang><zh-CN>reference-data 在前、catalog read 在后的 package 描述符。</zh-CN><en>Package descriptors with reference data first and catalog read second.</en></lang>
 * @lang zh-CN 描述符是 runtime 的明确数据输入，不是 npm manifest、远端 catalog 或 import 指令。
 * @lang en Descriptors are explicit runtime data input, not npm manifests, remote catalogs, or import instructions.
 */
function createCapabilityPackages() {
  // <lang><zh-CN>每次创建新对象，避免 registry 负向变更跨测试共享。</zh-CN><en>Create new objects every time, avoiding cross-test sharing of negative registry mutations.</en></lang>
  return [
    {
      packageVersion: '1.0',
      kind: 'solution-capability-package',
      id: 'example.reference-data.read',
      dependsOn: [],
      requiredModuleIds: ['example.reference-data'],
      requiredGrantIds: ['reference-data.read']
    },
    {
      packageVersion: '1.0',
      kind: 'solution-capability-package',
      id: 'example.catalog-query-detail.read',
      dependsOn: ['example.reference-data.read'],
      requiredModuleIds: ['example.catalog-query-detail'],
      requiredGrantIds: ['catalog.read']
    }
  ];
}

/**
 * <lang><zh-CN>创建代表性 allowlisted solution runtime。</zh-CN><en>Creates the representative allowlisted solution runtime.</en></lang>
 *
 * @param {object[]} [capabilityPackages] <lang><zh-CN>测试可替换的 capability package registry。</zh-CN><en>Capability-package registry replaceable by the test.</en></lang>
 * @returns {object} <lang><zh-CN>仅含纯 resolve API 的 runtime。</zh-CN><en>Runtime containing only pure resolve API.</en></lang>
 * @lang zh-CN host 配置显式提供 channel allowlist 与 registry，不读取 workspace 或 package manager。
 * @lang en Host configuration explicitly provides channel allowlist and registry and reads neither workspace nor package manager.
 */
function createRuntime(capabilityPackages = createCapabilityPackages()) {
  // <lang><zh-CN>runtime 创建不处理 profile/session；每次 resolve 都必须重新完成独立校验。</zh-CN><en>Runtime creation processes no profile or session; every resolve must independently validate them anew.</en></lang>
  return createSolutionProfileRuntime({
    allowedChannelProfileIds: [CHANNEL_PROFILE_ID],
    capabilityPackages
  });
}

/**
 * <lang><zh-CN>验证 dependency-first capability closure、grant 可用性和 detached safe snapshots。</zh-CN><en>Verifies dependency-first capability closure, grant availability, and detached safe snapshots.</en></lang>
 * @lang zh-CN 成功结果不暴露 session grant、registry descriptor、provider、module implementation 或输入对象。
 * @lang en A successful result exposes no session grant, registry descriptor, provider, module implementation, or input object.
 */
function testResolvesNeutralCapabilityClosure() {
  // <lang><zh-CN>使用完整 anonymous mock session 解析只选择 catalog read 的 solution profile。</zh-CN><en>Use a complete anonymous mock session to resolve a solution profile selecting only catalog read.</en></lang>
  const resolution = createRuntime().resolve(
    createSolutionProfile(),
    createAnonymousMockSession()
  );

  // <lang><zh-CN>公开成功 API 只提供稳定 solution/capability/module metadata 查询。</zh-CN><en>The public successful API provides only stable solution, capability, and module-metadata queries.</en></lang>
  assert.deepEqual(Object.keys(resolution).sort(), [
    'diagnostics',
    'getCapabilitySnapshot',
    'getRequiredModuleIds',
    'getSolutionSnapshot',
    'isCapabilityAvailable',
    'ok'
  ]);
  assert.equal(resolution.ok, true);

  // <lang><zh-CN>依赖必须先于依赖者出现，且只包含所选 closure；这不是 package discovery。</zh-CN><en>A dependency must appear before its dependent and include only selected closure; this is not package discovery.</en></lang>
  assert.deepEqual(resolution.getCapabilitySnapshot(), [
    { id: 'example.reference-data.read', state: 'available' },
    { id: 'example.catalog-query-detail.read', state: 'available' }
  ]);
  assert.deepEqual(resolution.getRequiredModuleIds(), [
    'example.reference-data',
    'example.catalog-query-detail'
  ]);
  assert.deepEqual(resolution.getSolutionSnapshot(), {
    id: 'example.catalog-query-detail.neutral',
    channelProfileId: CHANNEL_PROFILE_ID,
    capabilityPackageIds: ['example.catalog-query-detail.read']
  });
  assert.equal(resolution.isCapabilityAvailable('example.catalog-query-detail.read'), true);
  assert.equal(resolution.isCapabilityAvailable('example.unknown.read'), false);

  // <lang><zh-CN>调用方修改 snapshot 不会改变 runtime 闭包中的 capability 顺序或 module 对应。</zh-CN><en>Caller mutation of a snapshot cannot change capability order or module correspondence held in runtime closure.</en></lang>
  const snapshot = resolution.getCapabilitySnapshot();
  snapshot[0].id = 'caller.changed';
  assert.equal(resolution.getCapabilitySnapshot()[0].id, 'example.reference-data.read');
}

/**
 * <lang><zh-CN>验证未登记或类似脚本的 capability ID 在解析时被拒绝且不回显。</zh-CN><en>Verifies an unregistered or script-like capability ID is rejected during resolution and is not echoed.</en></lang>
 * @lang zh-CN 该失败发生在任何 app/template/provider 创建之前；result 不形成 partial availability API。
 * @lang en This failure occurs before any app, template, or provider creation; result forms no partial availability API.
 */
function testRejectsUnregisteredCapabilityWithoutEcho() {
  // <lang><zh-CN>只篡改 capability ID，保持其他 solution profile 字段合法以隔离拒绝原因。</zh-CN><en>Corrupt only capability ID while retaining other valid solution-profile fields to isolate rejection cause.</en></lang>
  const profile = createSolutionProfile();
  profile.capabilityPackageIds = ['javascript:untrusted'];

  // <lang><zh-CN>失败只返回结构化 diagnostics，不返回 session、registry 或 partial snapshot。</zh-CN><en>Failure returns only structured diagnostics and no session, registry, or partial snapshot.</en></lang>
  const resolution = createRuntime().resolve(profile, createAnonymousMockSession());
  assert.deepEqual(Object.keys(resolution).sort(), ['diagnostics', 'ok']);
  assert.equal(resolution.ok, false);
  assert.equal(
    resolution.diagnostics.some(
      (diagnostic) => diagnostic.code === 'solution-profile.profile.capability-package.invalid'
    ),
    true
  );
  assert.equal(JSON.stringify(resolution).includes('javascript:untrusted'), false);
}

/**
 * <lang><zh-CN>验证缺少 mock grant 时整个 solution closure 在返回 availability 前失败。</zh-CN><en>Verifies the whole solution closure fails before returning availability when a mock grant is missing.</en></lang>
 * @lang zh-CN grant ID 不进入公开 diagnostic subject，避免把 session 输入当作公开权限记录。
 * @lang en Grant ID enters no public diagnostic subject, avoiding treating session input as a public permission record.
 */
function testRejectsMissingMockGrantBeforeAvailability() {
  // <lang><zh-CN>保留 profile/registry，只让 anonymous session 缺少 catalog read grant。</zh-CN><en>Retain profile and registry while allowing anonymous session to lack only catalog-read grant.</en></lang>
  const resolution = createRuntime().resolve(
    createSolutionProfile(),
    createAnonymousMockSession(['reference-data.read'])
  );

  // <lang><zh-CN>失败不返回任何 capability/module API，调用方不能把部分 dependency 当作可用功能。</zh-CN><en>Failure returns no capability or module API, so callers cannot treat a partial dependency as available functionality.</en></lang>
  assert.deepEqual(Object.keys(resolution).sort(), ['diagnostics', 'ok']);
  assert.equal(resolution.ok, false);
  assert.equal(
    resolution.diagnostics.some(
      (diagnostic) => diagnostic.code === 'solution-profile.session.grants-missing'
    ),
    true
  );
}

/**
 * <lang><zh-CN>验证 registry dependency cycle 在 profile/session 解析前由受限诊断拒绝。</zh-CN><en>Verifies a registry dependency cycle is rejected by bounded diagnostics before profile or session resolution.</en></lang>
 * @lang zh-CN cycle 测试只修改本地 descriptor；runtime 不尝试从 package ID 寻找其他 package 或执行修复。
 * @lang en The cycle test changes only local descriptors; runtime neither looks up another package from an ID nor attempts repair.
 */
function testRejectsRegistryDependencyCycle() {
  // <lang><zh-CN>将 reference-data 声明为依赖 catalog，从而形成二项闭环。</zh-CN><en>Declare reference data to depend on catalog, forming a two-item cycle.</en></lang>
  const packages = createCapabilityPackages();
  packages[0].dependsOn = ['example.catalog-query-detail.read'];

  // <lang><zh-CN>无效 registry 仍可创建受限 resolver，但任何 resolve 都只返回稳定配置失败。</zh-CN><en>An invalid registry may still create a bounded resolver, but every resolve returns only stable configuration failure.</en></lang>
  const resolution = createRuntime(packages).resolve(
    createSolutionProfile(),
    createAnonymousMockSession()
  );
  assert.deepEqual(Object.keys(resolution).sort(), ['diagnostics', 'ok']);
  assert.equal(resolution.ok, false);
  assert.equal(
    resolution.diagnostics.some(
      (diagnostic) => diagnostic.code === 'solution-profile.registry.dependency-cycle'
    ),
    true
  );
}

// <lang><zh-CN>按公开行为登记测试，不在标题泄露内部路径、私有周期或用户会话上下文。</zh-CN><en>Register tests by public behavior and expose no internal path, private cycle, or user-session context in titles.</en></lang>
test('resolves a neutral solution capability closure', testResolvesNeutralCapabilityClosure);
test('rejects an unregistered solution capability without echo', testRejectsUnregisteredCapabilityWithoutEcho);
test('rejects a missing anonymous mock grant before availability', testRejectsMissingMockGrantBeforeAvailability);
test('rejects a solution capability registry dependency cycle', testRejectsRegistryDependencyCycle);
