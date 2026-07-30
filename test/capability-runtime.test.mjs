/**
 * <lang><zh-CN>纯 Node 能力生命周期契约测试：验证显式内存组合、依赖/冲突、原子转换、受控调用与脱敏 snapshot。</zh-CN><en>Pure-Node capability-lifecycle contract tests: verify explicit in-memory composition, dependencies/conflicts, atomic transitions, controlled invocation, and redacted snapshots.</en></lang>
 * @lang zh-CN 本文件只使用测试自有的中性 manifest/provider；不执行 npm、网络、文件发现、环境读取、storage、动态 import 或生命周期 hook。
 * @lang en This file uses only test-owned neutral manifests/providers; it executes no npm, network, file discovery, environment reads, storage, dynamic import, or lifecycle hooks.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { createCapabilityRuntime } from '../packages/capability-runtime/src/index.mjs';
import {
  createCatalogQueryDetailMock,
  createExampleManifests
} from '../modules/example-catalog-query-detail/src/index.mjs';
import { createCatalogQueryDetailAdapterFixture } from '../extensions/example-catalog-query-detail-adapter-fixture/src/index.mjs';

/**
 * <lang><zh-CN>创建可独立装配的中性能力单元，并允许测试声明依赖、冲突与调用观察。</zh-CN><en>Creates an independently assemblable neutral capability unit and lets tests declare dependencies, conflicts, and invocation observation.</en></lang>
 *
 * @param {object} options 能力标识与关系选项。 / Capability identity and relationship options.
 * @param {string} options.moduleId 业务模块 ID。 / Business-module ID.
 * @param {string} options.implementationPackageId 实现包 ID。 / Implementation-package ID.
 * @param {string[]} [options.dependencies] 业务模块依赖。 / Business-module dependencies.
 * @param {string[]} [options.conflicts] 业务模块冲突。 / Business-module conflicts.
 * @param {() => void} [options.onInvoke] catalog provider 调用观察器。 / Catalog-provider invocation observer.
 * @returns {object} 显式 capability unit。 / An explicit capability unit.
 * @lang zh-CN helper 复用现有公开 example shape，但每次返回隔离对象；额外 hook 是“不执行”探针，不是受支持 API。
 * @lang en The helper reuses the existing public example shape while returning isolated objects; the extra hook is a non-execution probe, not a supported API.
 */
function createCapabilityUnit(options) {
  // <lang><zh-CN>获取新 manifest，使各测试的 ID 与关系改写互不污染。</zh-CN><en>Obtain fresh manifests so ID and relationship changes remain isolated across tests.</en></lang>
  const declarations = createExampleManifests();

  // <lang><zh-CN>为可选关系使用新数组，避免调用方随后修改内部输入。</zh-CN><en>Use new arrays for optional relationships, avoiding later caller mutation of internal input.</en></lang>
  const {
    moduleId,
    implementationPackageId,
    dependencies = [],
    conflicts = [],
    onInvoke = () => {}
  } = options;

  // <lang><zh-CN>模块 ID 与依赖/冲突形成 runtime 要验证的业务关系。</zh-CN><en>The module ID and dependency/conflict arrays form the business relationships the runtime must validate.</en></lang>
  declarations.businessModule.id = moduleId;
  declarations.businessModule.dependencies = [...dependencies];
  declarations.businessModule.conflicts = [...conflicts];

  // <lang><zh-CN>实现包显式指向当前模块，保持 core manifest pair 合法。</zh-CN><en>The implementation package explicitly targets the current module, keeping the core manifest pair valid.</en></lang>
  declarations.implementationPackage.id = implementationPackageId;
  declarations.implementationPackage.moduleId = moduleId;
  declarations.implementationPackage.package.identity = implementationPackageId;

  // <lang><zh-CN>profile 声明当前模块及依赖；core 校验声明，runtime 校验实际启用状态。</zh-CN><en>The profile declares the current module and dependencies; core validates declarations while the runtime validates actual enabled state.</en></lang>
  declarations.profile.id = moduleId;
  declarations.profile.enabledModuleIds = [moduleId, ...dependencies];
  declarations.profile.implementationPackageIds = [implementationPackageId];

  // <lang><zh-CN>创建不读取 transport、identity 或 storage 的确定性本地 provider。</zh-CN><en>Create deterministic local providers that read no transport, identity, or storage.</en></lang>
  const mock = createCatalogQueryDetailMock();

  // <lang><zh-CN>保留原 catalog provider，使探针计数后仍返回规范化结果。</zh-CN><en>Retain the original catalog provider so the probe still returns a canonical result after counting.</en></lang>
  const catalogProvider = mock.portProviders['catalog-query'];

  // <lang><zh-CN>只包装测试自有 provider，且不改变公开 contract reference。</zh-CN><en>Wrap only the test-owned provider without changing its public contract reference.</en></lang>
  mock.portProviders['catalog-query'] = {
    contract: { ...catalogProvider.contract },
    invoke: (input) => {
      // <lang><zh-CN>观察器只证明显式 invoke 是否发生，不读取或保存输入。</zh-CN><en>The observer proves only whether explicit invocation occurred and neither reads nor stores input.</en></lang>
      onInvoke();

      // <lang><zh-CN>调用原 provider 以保持 example module 的 canonical query result。</zh-CN><en>Invoke the original provider to preserve the example module's canonical query result.</en></lang>
      return catalogProvider.invoke(input);
    }
  };

  // <lang><zh-CN>hook 探针若被误执行会立即失败，从而固定无 hook 边界。</zh-CN><en>The hook probe fails immediately if mistakenly executed, fixing the no-hook boundary.</en></lang>
  const forbiddenHook = () => {
    // <lang><zh-CN>异常不含输入或路径，只表明 runtime 违反无 hook 契约。</zh-CN><en>The exception contains no input or path and only indicates violation of the no-hook contract.</en></lang>
    throw new Error('Lifecycle hooks must not execute.');
  };

  // <lang><zh-CN>返回 core 所需四项输入与 runtime 应忽略的 hook 探针。</zh-CN><en>Return the four core inputs plus a hook probe the runtime must ignore.</en></lang>
  return {
    ...declarations,
    portProviders: mock.portProviders,
    lifecycleHooks: {
      install: forbiddenHook,
      enable: forbiddenHook,
      disable: forbiddenHook,
      uninstall: forbiddenHook
    }
  };
}

/**
 * <lang><zh-CN>判断操作诊断是否包含指定稳定代码。</zh-CN><en>Determines whether operation diagnostics contain a specified stable code.</en></lang>
 *
 * @param {object} result lifecycle 操作结果。 / Lifecycle operation result.
 * @param {string} code 期望诊断代码。 / Expected diagnostic code.
 * @returns {boolean} 是否存在该代码。 / Whether the code exists.
 * @lang zh-CN 测试只依赖机器可读 code，不耦合中英文 message。
 * @lang en Tests depend only on machine-readable codes and do not couple to Chinese-English messages.
 */
function hasDiagnostic(result, code) {
  // <lang><zh-CN>只遍历公开 diagnostics，不检查可能含实现细节的错误对象。</zh-CN><en>Inspect only public diagnostics and no error object that might contain implementation details.</en></lang>
  return result.diagnostics.some((diagnostic) => diagnostic.code === code);
}

/**
 * <lang><zh-CN>验证安装先复用 core 装配，再原子拒绝无效单元与重复主责。</zh-CN><en>Verifies that installation first reuses core assembly and then atomically rejects invalid units and duplicate ownership.</en></lang>
 * @lang zh-CN 候选失败后 snapshot 必须保持不变，且 lifecycle hook 不得执行。
 * @lang en After a candidate fails, the snapshot must remain unchanged and lifecycle hooks must not execute.
 */
function testValidatesInstallAndUniqueOwnership() {
  // <lang><zh-CN>创建独立 runtime，避免跨测试共享全局 registry。</zh-CN><en>Create an independent runtime, avoiding a global registry shared across tests.</en></lang>
  const runtime = createCapabilityRuntime();

  // <lang><zh-CN>制造缺失 required port 的单元，使 core 装配失败。</zh-CN><en>Create a unit missing a required port so core assembly fails.</en></lang>
  const invalidUnit = createCapabilityUnit({
    moduleId: 'example.invalid-capability',
    implementationPackageId: 'example.invalid-capability.fixture'
  });

  // <lang><zh-CN>删除 provider 只影响候选单元。</zh-CN><en>Deleting the provider affects only the candidate unit.</en></lang>
  delete invalidUnit.portProviders['entry-detail'];

  // <lang><zh-CN>无效装配必须转为稳定诊断且不保留部分状态。</zh-CN><en>Invalid assembly must become a stable diagnostic and retain no partial state.</en></lang>
  const invalidResult = runtime.install(invalidUnit);
  assert.equal(invalidResult.ok, false);
  assert.equal(hasDiagnostic(invalidResult, 'capability.unit.invalid'), true);
  assert.deepEqual(runtime.snapshot(), []);

  // <lang><zh-CN>安装首个合法单元后，它必须以 disabled 状态出现。</zh-CN><en>After the first valid unit is installed, it must appear in the disabled state.</en></lang>
  const primaryUnit = createCapabilityUnit({
    moduleId: 'example.primary-capability',
    implementationPackageId: 'example.primary-capability.fixture'
  });
  assert.equal(runtime.install(primaryUnit).ok, true);
  assert.equal(runtime.snapshot()[0].state, 'disabled');

  // <lang><zh-CN>相同 module ID 的第二实现不得替换既有 owner。</zh-CN><en>A second implementation for the same module ID must not replace the existing owner.</en></lang>
  const duplicateModule = createCapabilityUnit({
    moduleId: 'example.primary-capability',
    implementationPackageId: 'example.primary-capability.alternate'
  });
  assert.equal(hasDiagnostic(runtime.install(duplicateModule), 'capability.module.duplicate'), true);

  // <lang><zh-CN>相同 implementation ID 不能被另一模块重复主张。</zh-CN><en>The same implementation ID cannot be claimed again by another module.</en></lang>
  const duplicateImplementation = createCapabilityUnit({
    moduleId: 'example.secondary-capability',
    implementationPackageId: 'example.primary-capability.fixture'
  });
  assert.equal(hasDiagnostic(runtime.install(duplicateImplementation), 'capability.implementation.duplicate'), true);

  // <lang><zh-CN>两次失败后仍只保留最初单元，证明操作原子化。</zh-CN><en>Only the first unit remains after both failures, proving operation atomicity.</en></lang>
  assert.deepEqual(runtime.snapshot().map((entry) => entry.moduleId), ['example.primary-capability']);
}

/**
 * <lang><zh-CN>验证依赖优先启用、显式调用、dependent 保护与停用后卸载。</zh-CN><en>Verifies dependency-first enablement, explicit invocation, dependent protection, and uninstall after disablement.</en></lang>
 * @lang zh-CN runtime 不自动转换相关单元；宿主必须按安全顺序发出每一步。
 * @lang en The runtime automatically transitions no related unit; the host must issue every step in a safe order.
 */
function testEnforcesDependencyLifecycleAndInvocation() {
  // <lang><zh-CN>调用计数只证明 provider 不会被 lifecycle 转换执行。</zh-CN><en>The invocation count proves lifecycle transitions do not execute providers.</en></lang>
  let invocationCount = 0;

  // <lang><zh-CN>创建没有共享状态的 runtime。</zh-CN><en>Create a runtime with no shared state.</en></lang>
  const runtime = createCapabilityRuntime();

  // <lang><zh-CN>reference 单元是 consumer 的显式业务依赖。</zh-CN><en>The reference unit is the consumer's explicit business dependency.</en></lang>
  const referenceUnit = createCapabilityUnit({
    moduleId: 'example.reference-capability',
    implementationPackageId: 'example.reference-capability.fixture'
  });

  // <lang><zh-CN>consumer 只有通过显式 invoke 才增加计数。</zh-CN><en>The consumer increments its count only through explicit invocation.</en></lang>
  const consumerUnit = createCapabilityUnit({
    moduleId: 'example.consumer-capability',
    implementationPackageId: 'example.consumer-capability.fixture',
    dependencies: ['example.reference-capability'],
    onInvoke: () => {
      // <lang><zh-CN>计数器只记录次数，不存储 payload。</zh-CN><en>The counter records only invocation count and stores no payload.</en></lang>
      invocationCount += 1;
    }
  });

  // <lang><zh-CN>安装顺序不受依赖限制，但两者都保持 disabled。</zh-CN><en>Installation order is independent of dependencies, while both units remain disabled.</en></lang>
  assert.equal(runtime.install(consumerUnit).ok, true);
  assert.equal(runtime.install(referenceUnit).ok, true);
  assert.equal(invocationCount, 0);

  // <lang><zh-CN>非法 unknown ID 不得被复制到 lifecycle diagnostic。</zh-CN><en>An invalid unknown ID must not be copied into a lifecycle diagnostic.</en></lang>
  const invalidUnknownResult = runtime.enable('invalid path/secret probe');
  assert.equal(hasDiagnostic(invalidUnknownResult, 'capability.module.unknown'), true);
  assert.equal(JSON.stringify(invalidUnknownResult).includes('secret probe'), false);

  // <lang><zh-CN>依赖尚未启用时 consumer enable 必须失败且不改变 snapshot。</zh-CN><en>Consumer enablement must fail while its dependency is disabled and must not change the snapshot.</en></lang>
  const beforeDependencyFailure = runtime.snapshot();
  const dependencyFailure = runtime.enable('example.consumer-capability');
  assert.equal(hasDiagnostic(dependencyFailure, 'capability.dependency.unavailable'), true);
  assert.deepEqual(runtime.snapshot(), beforeDependencyFailure);

  // <lang><zh-CN>已停用 consumer 不得接收调用，错误不得包含 input。</zh-CN><en>A disabled consumer must not receive calls, and the error must not contain the input.</en></lang>
  assert.throws(
    () => runtime.invoke('example.consumer-capability', 'catalog-query', { secretProbe: 'not-for-error' }),
    (error) => error.code === 'capability.invocation.disabled' && !error.message.includes('not-for-error')
  );

  // <lang><zh-CN>未知 module 也使用稳定错误，且不把调用输入写入 message。</zh-CN><en>An unknown module also uses a stable error and does not write invocation input into the message.</en></lang>
  assert.throws(
    () => runtime.invoke('example.unknown-capability', 'catalog-query', { secretProbe: 'unknown-input' }),
    (error) => error.code === 'capability.invocation.unknown' && !error.message.includes('unknown-input')
  );

  // <lang><zh-CN>宿主按依赖优先顺序显式启用两个单元。</zh-CN><en>The host explicitly enables both units in dependency-first order.</en></lang>
  assert.equal(runtime.enable('example.reference-capability').ok, true);
  assert.equal(runtime.enable('example.consumer-capability').ok, true);
  assert.equal(invocationCount, 0);

  // <lang><zh-CN>已启用模块的未知 port 在 provider 前被稳定拒绝。</zh-CN><en>An unknown port on an enabled module is rejected stably before the provider.</en></lang>
  assert.throws(
    () => runtime.invoke('example.consumer-capability', 'unknown-port', { secretProbe: 'unknown-port-input' }),
    (error) => error.code === 'capability.invocation.port-unregistered' && !error.message.includes('unknown-port-input')
  );

  // <lang><zh-CN>合法调用委托给既有 composition 并返回 canonical page。</zh-CN><en>A valid invocation delegates to the existing composition and returns a canonical page.</en></lang>
  const queryResult = runtime.invoke('example.consumer-capability', 'catalog-query', {
    contractVersion: '1.0',
    filter: {},
    page: 1,
    pageSize: 1
  });
  assert.equal(queryResult.kind, 'page');
  assert.equal(invocationCount, 1);

  // <lang><zh-CN>consumer 仍启用时，reference 不能被停用或卸载。</zh-CN><en>While the consumer remains enabled, the reference cannot be disabled or uninstalled.</en></lang>
  assert.equal(hasDiagnostic(runtime.disable('example.reference-capability'), 'capability.dependent.enabled'), true);
  assert.equal(hasDiagnostic(runtime.uninstall('example.reference-capability'), 'capability.uninstall.enabled'), true);

  // <lang><zh-CN>按 dependent-first 顺序停用后，可以安全卸载两个单元。</zh-CN><en>After disabling in dependent-first order, both units can be safely uninstalled.</en></lang>
  assert.equal(runtime.disable('example.consumer-capability').ok, true);
  assert.equal(runtime.disable('example.reference-capability').ok, true);
  assert.equal(runtime.uninstall('example.consumer-capability').ok, true);
  assert.equal(runtime.uninstall('example.reference-capability').ok, true);
  assert.deepEqual(runtime.snapshot(), []);
  assert.equal(invocationCount, 1);
}

/**
 * <lang><zh-CN>验证任一方声明均会形成冲突，并确保失败启用不改变状态。</zh-CN><en>Verifies that a declaration by either side forms a conflict and that failed enablement does not change state.</en></lang>
 * @lang zh-CN 同一 pair 以两种启用顺序验证对称检查。
 * @lang en The same pair verifies the symmetric check in both enablement orders.
 */
function testEnforcesSymmetricConflicts() {
  // <lang><zh-CN>只由第二单元声明冲突，模拟一侧声明较旧。</zh-CN><en>Only the second unit declares the conflict, simulating an older declaration on one side.</en></lang>
  const runtime = createCapabilityRuntime();
  const firstUnit = createCapabilityUnit({
    moduleId: 'example.first-capability',
    implementationPackageId: 'example.first-capability.fixture'
  });
  const secondUnit = createCapabilityUnit({
    moduleId: 'example.second-capability',
    implementationPackageId: 'example.second-capability.fixture',
    conflicts: ['example.first-capability']
  });

  // <lang><zh-CN>安装不因潜在冲突失败，因为冲突只约束 enabled 集合。</zh-CN><en>Installation does not fail for a potential conflict because conflicts constrain only the enabled set.</en></lang>
  assert.equal(runtime.install(firstUnit).ok, true);
  assert.equal(runtime.install(secondUnit).ok, true);

  // <lang><zh-CN>先启用 first 后，second 自身声明的冲突会阻止 second。</zh-CN><en>After first is enabled, the conflict declared by second prevents second.</en></lang>
  assert.equal(runtime.enable('example.first-capability').ok, true);
  assert.equal(hasDiagnostic(runtime.enable('example.second-capability'), 'capability.conflict.enabled'), true);
  assert.equal(runtime.snapshot().find((entry) => entry.moduleId === 'example.second-capability').state, 'disabled');

  // <lang><zh-CN>反转活动单元后，enabled second 的声明仍会阻止 first。</zh-CN><en>After reversing the active unit, enabled second's declaration still prevents first.</en></lang>
  assert.equal(runtime.disable('example.first-capability').ok, true);
  assert.equal(runtime.enable('example.second-capability').ok, true);
  assert.equal(hasDiagnostic(runtime.enable('example.first-capability'), 'capability.conflict.enabled'), true);
  assert.equal(runtime.snapshot().find((entry) => entry.moduleId === 'example.first-capability').state, 'disabled');
}

/**
 * <lang><zh-CN>验证 snapshot 的顺序、复制与公开字段白名单。</zh-CN><en>Verifies snapshot ordering, copying, and the public-field allowlist.</en></lang>
 * @lang zh-CN provider、manifest、profile、hook 与探针值不得出现在序列化 snapshot 中。
 * @lang en Providers, manifests, profiles, hooks, and probe values must not appear in the serialized snapshot.
 */
function testReturnsDeterministicRedactedSnapshot() {
  // <lang><zh-CN>反向安装两个单元，以确认 snapshot 不依赖插入顺序。</zh-CN><en>Install two units in reverse order to confirm the snapshot does not depend on insertion order.</en></lang>
  const runtime = createCapabilityRuntime();
  const laterUnit = createCapabilityUnit({
    moduleId: 'example.zeta-capability',
    implementationPackageId: 'example.zeta-capability.fixture',
    dependencies: ['example.alpha-capability'],
    conflicts: ['example.omega-capability']
  });
  const earlierUnit = createCapabilityUnit({
    moduleId: 'example.alpha-capability',
    implementationPackageId: 'example.alpha-capability.fixture'
  });
  assert.equal(runtime.install(laterUnit).ok, true);
  assert.equal(runtime.install(earlierUnit).ok, true);

  // <lang><zh-CN>snapshot 必须按 module ID 排序且只含白名单字段。</zh-CN><en>The snapshot must be sorted by module ID and contain only allowlisted fields.</en></lang>
  const snapshot = runtime.snapshot();
  assert.deepEqual(snapshot.map((entry) => entry.moduleId), ['example.alpha-capability', 'example.zeta-capability']);
  assert.deepEqual(
    Object.keys(snapshot[1]).sort(),
    ['conflicts', 'dependencies', 'implementationPackageId', 'moduleId', 'state'].sort()
  );

  // <lang><zh-CN>修改返回数组不得改变 runtime 内部关系。</zh-CN><en>Mutating a returned array must not change the runtime's internal relationships.</en></lang>
  snapshot[1].dependencies.push('example.snapshot-mutation');
  assert.deepEqual(runtime.snapshot()[1].dependencies, ['example.alpha-capability']);

  // <lang><zh-CN>序列化结果不得出现实现对象字段或探针文本。</zh-CN><en>The serialized result must contain no implementation-object fields or probe text.</en></lang>
  const serializedSnapshot = JSON.stringify(runtime.snapshot());
  assert.equal(serializedSnapshot.includes('portProviders'), false);
  assert.equal(serializedSnapshot.includes('lifecycleHooks'), false);
  assert.equal(serializedSnapshot.includes('Lifecycle hooks must not execute'), false);
}

/**
 * <lang><zh-CN>验证现有 injected-wire extension 可作为显式 capability unit 完成完整内存生命周期。</zh-CN><en>Verifies that the existing injected-wire extension can complete the full in-memory lifecycle as an explicit capability unit.</en></lang>
 * @lang zh-CN 集成只复用公开 factory 与本地 wire fixture；不修改 adapter/core，也不连接真实后端。
 * @lang en The integration reuses only public factories and a local wire fixture; it modifies neither adapter/core nor connects to a real backend.
 */
function testRunsExistingAdapterExtensionThroughLifecycle() {
  // <lang><zh-CN>现有业务 module/profile 保持不变，implementation 由显式 wire fixture 替换。</zh-CN><en>The existing business module/profile remain unchanged while the implementation is explicitly replaced by the wire fixture.</en></lang>
  const manifests = createExampleManifests();

  // <lang><zh-CN>fixture 只创建注入式本地 exchange、mock session 与计数 observation。</zh-CN><en>The fixture creates only injected local exchanges, a mock session, and count-only observations.</en></lang>
  const adapterFixture = createCatalogQueryDetailAdapterFixture();

  // <lang><zh-CN>profile 显式选择 adapter implementation，不通过 fallback 或 discovery 替换。</zh-CN><en>The profile explicitly selects the adapter implementation without fallback or discovery.</en></lang>
  manifests.profile.implementationPackageIds = [adapterFixture.implementationPackage.id];

  // <lang><zh-CN>独立 runtime 只持有这一已审阅 capability unit。</zh-CN><en>An independent runtime holds only this reviewed capability unit.</en></lang>
  const runtime = createCapabilityRuntime();

  // <lang><zh-CN>安装与启用不执行 exchange；observation 应仍为零。</zh-CN><en>Install and enable execute no exchange, so observation must remain zero.</en></lang>
  assert.equal(runtime.install({
    businessModule: manifests.businessModule,
    implementationPackage: adapterFixture.implementationPackage,
    profile: manifests.profile,
    portProviders: adapterFixture.portProviders
  }).ok, true);
  assert.equal(runtime.enable(manifests.businessModule.id).ok, true);
  assert.equal(adapterFixture.getObservation().query.exchanges, 0);

  // <lang><zh-CN>显式 query invoke 才进入 adapter provider，并返回 canonical page。</zh-CN><en>Only an explicit query invocation enters the adapter provider and returns a canonical page.</en></lang>
  const page = runtime.invoke(manifests.businessModule.id, 'catalog-query', {
    contractVersion: '1.0',
    filter: {},
    page: 1,
    pageSize: 1
  });
  assert.equal(page.kind, 'page');
  assert.equal(page.entries[0].id, 'entry-001');
  assert.equal(adapterFixture.getObservation().query.exchanges, 1);

  // <lang><zh-CN>停用和卸载不会调用 adapter，也不会留下 lifecycle snapshot。</zh-CN><en>Disable and uninstall do not invoke the adapter and leave no lifecycle snapshot.</en></lang>
  assert.equal(runtime.disable(manifests.businessModule.id).ok, true);
  assert.equal(runtime.uninstall(manifests.businessModule.id).ok, true);
  assert.deepEqual(runtime.snapshot(), []);
  assert.equal(adapterFixture.getObservation().query.exchanges, 1);
}

// <lang><zh-CN>注册五组独立测试；Node runner 不需要网络、浏览器或外部服务。</zh-CN><en>Register five independent tests; the Node runner needs no network, browser, or external service.</en></lang>
test('capability runtime validates install and unique ownership', testValidatesInstallAndUniqueOwnership);
test('capability runtime enforces dependency lifecycle and invocation', testEnforcesDependencyLifecycleAndInvocation);
test('capability runtime enforces symmetric conflicts', testEnforcesSymmetricConflicts);
test('capability runtime returns deterministic redacted snapshots', testReturnsDeterministicRedactedSnapshot);
test('capability runtime runs an existing adapter extension through lifecycle', testRunsExistingAdapterExtensionThroughLifecycle);
