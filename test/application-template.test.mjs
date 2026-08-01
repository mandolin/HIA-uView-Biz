/**
 * <lang><zh-CN>验证 application template、显式 adapter extension 与 application-integration runtime 的完整契约。</zh-CN><en>Verifies the complete contract among application templates, explicit adapter extensions, and the application-integration runtime.</en></lang>
 *
 * @lang zh-CN 测试只使用本地中性 fixture；它不加载 package、连接 backend、读取环境或执行动态代码。
 * @lang en The tests use only local neutral fixtures; they load no package, connect to no backend, read no environment, and execute no dynamic code.
 */

// <lang><zh-CN>使用 Node 严格断言核对完整 metadata、结果与回退状态。</zh-CN><en>Use Node strict assertions to inspect complete metadata, outcomes, and rollback state.</en></lang>
import assert from 'node:assert/strict';

// <lang><zh-CN>读取仓内公开 JSON example，证明 runtime template 与文档事实一致。</zh-CN><en>Read the checked-in public JSON example to prove the runtime template matches documented facts.</en></lang>
import { readFile } from 'node:fs/promises';

// <lang><zh-CN>使用 Node 原生测试运行器保持仓库无新增测试依赖。</zh-CN><en>Use the native Node test runner so the repository gains no test dependency.</en></lang>
import test from 'node:test';

// <lang><zh-CN>被测 integration API 应只暴露安全 shell、receipt 与脱敏 snapshot。</zh-CN><en>The integration API under test should expose only a safe shell, receipt, and redacted snapshots.</en></lang>
import {
  createApplicationIntegrationRuntime
} from '@hia-uview/biz-app-integration';

// <lang><zh-CN>代表性 template factory 提供完整显式 mock/wire candidates，不执行发现或 fallback。</zh-CN><en>The representative template factory supplies complete explicit mock or wire candidates without discovery or fallback.</en></lang>
import {
  createExampleCatalogApplicationTemplate,
  createExampleCatalogTemplateCandidate
} from '@hia-uview/biz-example-catalog-query-detail-template';

/**
 * <lang><zh-CN>为测试创建完整的中性 query request。</zh-CN><en>Creates a complete neutral query request for tests.</en></lang>
 *
 * @param {number} [pageSize=1] <lang><zh-CN>与 candidate presentation 一致的 allowlisted page size。</zh-CN><en>Allowlisted page size matching candidate presentation.</en></lang>
 * @returns {object} <lang><zh-CN>module-owned canonical query。</zh-CN><en>Module-owned canonical query.</en></lang>
 * @lang zh-CN 每次返回新对象，避免 shell 对象状态跨测试共享。
 * @lang en Return a new object each time to avoid sharing shell object state across tests.
 */
function createQueryRequest(pageSize = 1) {
  // <lang><zh-CN>query 不携带行业 filter、credential、URL 或 transport 参数。</zh-CN><en>The query carries no industry filter, credential, URL, or transport parameter.</en></lang>
  return {
    contractVersion: '1.0',
    filter: {},
    page: 1,
    pageSize
  };
}

/**
 * <lang><zh-CN>创建覆盖完整代表性页面的 template candidate。</zh-CN><en>Creates a template candidate covering the complete representative page.</en></lang>
 *
 * @param {'mock'|'wire-fixture'} sourceMode <lang><zh-CN>显式本地实现模式。</zh-CN><en>Explicit local implementation mode.</en></lang>
 * @param {string} fixtureCase <lang><zh-CN>对应实现的 allowlisted fixture case。</zh-CN><en>Allowlisted fixture case for the implementation.</en></lang>
 * @returns {object} <lang><zh-CN>template、profile、units 与受限 observation。</zh-CN><en>Template, profile, units, and bounded observation.</en></lang>
 * @lang zh-CN helper 不补默认 source，测试必须明确声明所需实现。
 * @lang en The helper supplies no source default; tests must declare the required implementation explicitly.
 */
function createCandidate(sourceMode, fixtureCase) {
  // <lang><zh-CN>四个 block 都是应用已编译的稳定 ID，而不是组件路径。</zh-CN><en>All four blocks are stable IDs compiled by the application rather than component paths.</en></lang>
  const enabledBlocks = [
    'runtime-status',
    'query-context',
    'catalog-list',
    'entry-detail'
  ];

  // <lang><zh-CN>候选排序是同一已编译 block 集合的显式全排列；测试不让模板推断或补齐顺序。</zh-CN><en>Candidate order is an explicit permutation of the same compiled-block set; the test does not let the template infer or fill an order.</en></lang>
  const blockOrder = [
    'query-context',
    'runtime-status',
    'catalog-list',
    'entry-detail'
  ];

  // <lang><zh-CN>factory 只接收受限 plain-data options，不接收 callback、path 或 connection。</zh-CN><en>The factory receives only bounded plain-data options and no callback, path, or connection.</en></lang>
  return createExampleCatalogTemplateCandidate({
    sourceMode,
    fixtureCase,
    pageSize: 1,
    enabledBlocks,
    blockOrder
  });
}

/**
 * <lang><zh-CN>验证公开 manifest、runtime snapshot 与 mock template 的完整查询路径。</zh-CN><en>Verifies the public manifest, runtime snapshot, and complete mock-template query path.</en></lang>
 *
 * @returns {Promise<void>} <lang><zh-CN>异步 JSON 读取与同步 runtime 断言完成信号。</zh-CN><en>Completion signal for asynchronous JSON reading and synchronous runtime assertions.</en></lang>
 * @lang zh-CN JSON 只作为测试输入读取；production runtime 不执行文件加载。
 * @lang en JSON is read only as test input; the production runtime performs no file loading.
 */
async function assertPublicTemplateAndMockIntegration() {
  // <lang><zh-CN>定位相对于测试模块的公开 example，不依赖本机绝对路径。</zh-CN><en>Locate the public example relative to the test module without relying on a machine-specific absolute path.</en></lang>
  const publicTemplateUrl = new URL(
    '../docs/contracts/examples/example.catalog-query-detail.mp-weixin.template.manifest.json',
    import.meta.url
  );

  // <lang><zh-CN>解析公开 JSON，验证代码 template 没有另建漂移副本。</zh-CN><en>Parse the public JSON to verify the code template has no divergent copy.</en></lang>
  const publicTemplate = JSON.parse(await readFile(publicTemplateUrl, 'utf8'));

  // <lang><zh-CN>factory 每次返回隔离 template 对象，便于 caller 只读使用和负向测试。</zh-CN><en>The factory returns an isolated template object each time for caller read-only use and negative tests.</en></lang>
  const runtimeTemplate = createExampleCatalogApplicationTemplate();
  assert.deepEqual(runtimeTemplate, publicTemplate);

  // <lang><zh-CN>mock candidate 是必备离线实现，不是 wire 失败后的 fallback。</zh-CN><en>The mock candidate is the mandatory offline implementation rather than a fallback after wire failure.</en></lang>
  const candidate = createCandidate('mock', 'first-page');

  // <lang><zh-CN>integration 在任何 provider invocation 前完成 template、slot 与 adoption 校验。</zh-CN><en>Integration completes template, slot, and adoption validation before any provider invocation.</en></lang>
  const initialization = createApplicationIntegrationRuntime(candidate);
  assert.equal(initialization.ok, true);
  assert.deepEqual(initialization.diagnostics, []);
  assert.equal(initialization.receipt.profileId, 'example.catalog-composed');

  // <lang><zh-CN>template snapshot 与公开 example 等值，同时与 runtime 内部副本隔离。</zh-CN><en>The template snapshot equals the public example while remaining isolated from the runtime-owned copy.</en></lang>
  const templateSnapshot = initialization.getTemplateSnapshot();
  assert.deepEqual(templateSnapshot, publicTemplate);
  templateSnapshot.capabilitySlots[0].requiredSurfaces.push('presentation-block');
  assert.deepEqual(initialization.getTemplateSnapshot(), publicTemplate);

  // <lang><zh-CN>adoption snapshot 只包含两个 template slot 对应 module 的脱敏状态。</zh-CN><en>The adoption snapshot contains only redacted states for the two modules corresponding to template slots.</en></lang>
  assert.deepEqual(
    initialization.getAdoptionSnapshot().map((entry) => entry.moduleId),
    ['example.catalog-query-detail', 'example.reference-data']
  );

  // <lang><zh-CN>shell 通过固定 primary-module bridge 得到规范化 mock page。</zh-CN><en>The shell obtains a canonical mock page through the fixed primary-module bridge.</en></lang>
  const page = initialization.shell.query(createQueryRequest());
  assert.equal(page.kind, 'page');
  assert.equal(page.entries[0].id, 'entry-001');

  // <lang><zh-CN>mock observation 只报告显式 source mode，不伪造 wire exchange 计数。</zh-CN><en>The mock observation reports only its explicit source mode and fabricates no wire exchange count.</en></lang>
  assert.deepEqual(candidate.getObservation(), { sourceMode: 'mock' });
}

/**
 * <lang><zh-CN>验证 injected-wire adapter extension 通过同一 template runtime 集成。</zh-CN><en>Verifies the injected-wire adapter extension through the same template runtime.</en></lang>
 */
function assertWireAdapterIntegration() {
  // <lang><zh-CN>wire candidate 显式选择 success fixture；没有 endpoint 或隐式真实 transport。</zh-CN><en>The wire candidate explicitly selects the success fixture and has no endpoint or implicit real transport.</en></lang>
  const candidate = createCandidate('wire-fixture', 'success');
  const initialization = createApplicationIntegrationRuntime(candidate);
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>首次 query 前 adapter observation 为零，证明校验和启用没有调用 provider。</zh-CN><en>Before the first query, adapter observations are zero, proving validation and enablement did not invoke a provider.</en></lang>
  assert.equal(candidate.getObservation().query.exchanges, 0);

  // <lang><zh-CN>同一 shell API 调用 adapter implementation 并返回 canonical page。</zh-CN><en>The same shell API invokes the adapter implementation and returns a canonical page.</en></lang>
  const page = initialization.shell.query(createQueryRequest());
  assert.equal(page.kind, 'page');
  assert.equal(page.entries[0].id, 'entry-001');
  assert.equal(candidate.getObservation().query.exchanges, 1);

  // <lang><zh-CN>active snapshot 明确显示 wire implementation ID，而不是 source fallback 标志。</zh-CN><en>The active snapshot explicitly shows the wire implementation ID rather than a source-fallback flag.</en></lang>
  const catalogState = initialization.getAdoptionSnapshot().find(
    (entry) => entry.moduleId === 'example.catalog-query-detail'
  );
  assert.equal(
    catalogState.implementationPackageId,
    'example.catalog-query-detail.wire-fixture'
  );
}

/**
 * <lang><zh-CN>验证非法 template 在 provider 调用前失败且不返回 partial shell。</zh-CN><en>Verifies an invalid template fails before provider invocation and returns no partial shell.</en></lang>
 */
function assertInvalidTemplateFailsBeforeProvider() {
  // <lang><zh-CN>选择 wire candidate 以便通过 observation 证明没有 exchange。</zh-CN><en>Select a wire candidate so observations can prove no exchange occurred.</en></lang>
  const candidate = createCandidate('wire-fixture', 'success');

  // <lang><zh-CN>primary module 被改成未声明 ID，破坏 template 自身主责对应。</zh-CN><en>Change the primary module to an undeclared ID, breaking the template's ownership correspondence.</en></lang>
  candidate.template.primaryModuleId = 'example.unknown-primary';

  // <lang><zh-CN>初始化必须以稳定 template diagnostic 失败，不进入 adoption 或 shell。</zh-CN><en>Initialization must fail with a stable template diagnostic and reach neither adoption nor shell.</en></lang>
  const initialization = createApplicationIntegrationRuntime(candidate);
  assert.equal(initialization.ok, false);
  assert.equal(initialization.diagnostics[0].code, 'application-integration.template-invalid');
  assert.equal(Object.hasOwn(initialization, 'shell'), false);
  assert.equal(candidate.getObservation().query.exchanges, 0);
}

/**
 * <lang><zh-CN>验证 slot 所需 implementation surface 缺失时拒绝候选。</zh-CN><en>Verifies a candidate is rejected when a slot-required implementation surface is missing.</en></lang>
 */
function assertMissingSurfaceRejected() {
  // <lang><zh-CN>创建全新 mock candidate，负向变更不会污染其他测试。</zh-CN><en>Create a fresh mock candidate so the negative mutation cannot contaminate another test.</en></lang>
  const candidate = createCandidate('mock', 'first-page');

  // <lang><zh-CN>定位 catalog unit 并移除 template 要求的 mock-session surface metadata。</zh-CN><en>Locate the catalog unit and remove the mock-session surface metadata required by the template.</en></lang>
  const catalogUnit = candidate.units.find(
    (unit) => unit.businessModule.id === 'example.catalog-query-detail'
  );
  catalogUnit.implementationPackage.runtime.surfaces = ['adapter'];

  // <lang><zh-CN>surface mismatch 必须在 core/provider invocation 前由 integration 层拒绝。</zh-CN><en>The integration layer must reject the surface mismatch before core or provider invocation.</en></lang>
  const initialization = createApplicationIntegrationRuntime(candidate);
  assert.equal(initialization.ok, false);
  assert.equal(
    initialization.diagnostics[0].code,
    'application-integration.slot-surface-missing'
  );
  assert.equal(Object.hasOwn(initialization, 'shell'), false);
}

/**
 * <lang><zh-CN>验证同一 shell bridge 可原子替换 mock 为 wire adapter 并回退失败候选。</zh-CN><en>Verifies the same shell bridge can atomically replace mock with a wire adapter and roll back a failed candidate.</en></lang>
 */
function assertAdapterReplacementAndRollback() {
  // <lang><zh-CN>初始 mock candidate 建立 shell；随后 replacement 不重新创建 Vue 或 route projection。</zh-CN><en>The initial mock candidate establishes the shell; later replacement recreates neither Vue nor route projection.</en></lang>
  const mockCandidate = createCandidate('mock', 'first-page');
  const initialization = createApplicationIntegrationRuntime(mockCandidate);
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>记录初始 catalog implementation，供替换与失败回退比较。</zh-CN><en>Record the initial catalog implementation for replacement and failed-rollback comparisons.</en></lang>
  const initialCatalogState = initialization.getAdoptionSnapshot().find(
    (entry) => entry.moduleId === 'example.catalog-query-detail'
  );
  assert.equal(
    initialCatalogState.implementationPackageId,
    'example.catalog-query-detail.mock-implementation'
  );

  // <lang><zh-CN>初始 shell 已可完成 canonical 查询；后续断言只证明同一 bridge 的候选替换，不形成 profile loader 或运行时迁移 API。</zh-CN><en>The initial shell can already complete a canonical query; later assertions prove only candidate replacement through the same bridge and create neither a profile loader nor a runtime migration API.</en></lang>
  const initialPage = initialization.shell.query(createQueryRequest());
  assert.equal(initialPage.kind, 'page');
  assert.equal(initialPage.entries[0].id, 'entry-001');

  // <lang><zh-CN>显式提供完整 wire candidate，并通过 integration 的 slot gate 后原子协调。</zh-CN><en>Supply a complete wire candidate explicitly and reconcile it atomically after the integration slot gate.</en></lang>
  const wireCandidate = createCandidate('wire-fixture', 'success');
  const replacement = initialization.reconcile({
    profile: wireCandidate.profile,
    units: wireCandidate.units
  });
  assert.equal(replacement.ok, true);

  // <lang><zh-CN>receipt 明确记录 catalog replacement，不暴露 unit 或 provider。</zh-CN><en>The receipt explicitly records catalog replacement without exposing a unit or provider.</en></lang>
  const replaceAction = replacement.receipt.actions.find(
    (action) => action.moduleId === 'example.catalog-query-detail'
  );
  assert.equal(replaceAction.action, 'replace');

  // <lang><zh-CN>原 shell 引用通过 active adoption runtime 调用新的 wire provider。</zh-CN><en>The original shell reference invokes the new wire provider through the active adoption runtime.</en></lang>
  const page = initialization.shell.query(createQueryRequest());
  assert.equal(page.kind, 'page');
  assert.equal(wireCandidate.getObservation().query.exchanges, 1);

  // <lang><zh-CN>制造缺少 adapter surface 的失败 candidate，验证 active wire snapshot 不变。</zh-CN><en>Create a failed candidate missing an adapter surface and verify the active wire snapshot remains unchanged.</en></lang>
  const invalidCandidate = createCandidate('mock', 'first-page');
  const invalidCatalogUnit = invalidCandidate.units.find(
    (unit) => unit.businessModule.id === 'example.catalog-query-detail'
  );
  invalidCatalogUnit.implementationPackage.runtime.surfaces = ['mock-session'];
  const beforeFailure = initialization.getAdoptionSnapshot();
  const failedReplacement = initialization.reconcile({
    profile: invalidCandidate.profile,
    units: invalidCandidate.units
  });
  assert.equal(failedReplacement.ok, false);
  assert.equal(
    failedReplacement.diagnostics[0].code,
    'application-integration.slot-surface-missing'
  );
  assert.deepEqual(initialization.getAdoptionSnapshot(), beforeFailure);

  // <lang><zh-CN>失败候选后，同一 shell 仍路由到已成功的 wire candidate；这只验证当前进程回退，不保留或迁移任何外部状态。</zh-CN><en>After a failed candidate, the same shell still routes to the successfully adopted wire candidate; this verifies current-process rollback only and retains or migrates no external state.</en></lang>
  const pageAfterFailedReplacement = initialization.shell.query(createQueryRequest());
  assert.equal(pageAfterFailedReplacement.kind, 'page');
  assert.equal(pageAfterFailedReplacement.entries[0].id, 'entry-001');
  assert.equal(wireCandidate.getObservation().query.exchanges, 2);
}

/**
 * <lang><zh-CN>验证 template 只接受精确 adoption profile 和完整 module slots。</zh-CN><en>Verifies the template accepts only the exact adoption profile and complete module slots.</en></lang>
 */
function assertProfileAndSlotCorrespondence() {
  // <lang><zh-CN>修改 profile ID，证明 template 不把任意 profile 解释为兼容。</zh-CN><en>Change the profile ID to prove the template does not interpret an arbitrary profile as compatible.</en></lang>
  const mismatchedProfileCandidate = createCandidate('mock', 'first-page');
  mismatchedProfileCandidate.profile.profileId = 'example.other-profile';
  const profileFailure = createApplicationIntegrationRuntime(mismatchedProfileCandidate);
  assert.equal(profileFailure.ok, false);
  assert.equal(
    profileFailure.diagnostics[0].code,
    'application-integration.profile-mismatch'
  );

  // <lang><zh-CN>移除 reference-data selection，证明 integration 不自动补依赖或发现 unit。</zh-CN><en>Remove the reference-data selection to prove integration neither auto-adds a dependency nor discovers a unit.</en></lang>
  const incompleteCandidate = createCandidate('mock', 'first-page');
  incompleteCandidate.profile.capabilities = incompleteCandidate.profile.capabilities.filter(
    (selection) => selection.moduleId !== 'example.reference-data'
  );
  incompleteCandidate.units = incompleteCandidate.units.filter(
    (unit) => unit.businessModule.id !== 'example.reference-data'
  );
  const slotFailure = createApplicationIntegrationRuntime(incompleteCandidate);
  assert.equal(slotFailure.ok, false);
  assert.equal(
    slotFailure.diagnostics[0].code,
    'application-integration.slot-mismatch'
  );
}

// <lang><zh-CN>公开 template 与 mock integration 是首项端到端验收。</zh-CN><en>The public template and mock integration form the first end-to-end acceptance.</en></lang>
test('application template matches the public manifest and runs mandatory mock', assertPublicTemplateAndMockIntegration);

// <lang><zh-CN>wire adapter extension 必须通过同一 runtime，而不是专用旁路。</zh-CN><en>The wire adapter extension must use the same runtime rather than a dedicated bypass.</en></lang>
test('application template integrates the explicit wire adapter extension', assertWireAdapterIntegration);

// <lang><zh-CN>非法 template 必须在 provider 前失败。</zh-CN><en>An invalid template must fail before provider invocation.</en></lang>
test('application integration rejects an invalid template before provider use', assertInvalidTemplateFailsBeforeProvider);

// <lang><zh-CN>slot surface 是 adapter 兼容性的显式 metadata gate。</zh-CN><en>Slot surfaces are an explicit metadata gate for adapter compatibility.</en></lang>
test('application integration rejects a missing implementation surface', assertMissingSurfaceRejected);

// <lang><zh-CN>成功替换与失败回退共享同一 shell bridge。</zh-CN><en>Successful replacement and failed rollback share the same shell bridge.</en></lang>
test('application integration replaces an adapter atomically and rolls back failure', assertAdapterReplacementAndRollback);

// <lang><zh-CN>template/profile/slot 对应关系不得由 runtime 猜测。</zh-CN><en>The runtime must not guess template, profile, or slot correspondence.</en></lang>
test('application integration requires the exact profile and complete slots', assertProfileAndSlotCorrespondence);
