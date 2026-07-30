/**
 * <lang><zh-CN>Biz 应用 shell 的纯 Node 契约测试：固定 route projection、mock capability 与 canonical result 在没有 Vue、UniApp、网络或真实身份时的可观察行为。</zh-CN><en>Pure-Node contract tests for the Biz application shell: fix observable route-projection, mock-capability, and canonical-result behavior without Vue, UniApp, network, or real identity.</en></lang>
 * @lang zh-CN 测试只组合本仓 core 与中性 mock；它不加载 UI source、编译器、环境变量、文件或后端输入。
 * @lang en The tests compose only this repository's core and neutral mock; they load no UI source, compiler, environment variable, file, or backend input.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { createApplicationShell } from '../packages/app-shell/src/index.mjs';
import { assembleComposition } from '../packages/core/src/index.mjs';
import { createCatalogQueryDetailMock, createExampleManifests } from '../modules/example-catalog-query-detail/src/index.mjs';

/**
 * <lang><zh-CN>首轮 shell 与既有示例共用的稳定契约版本。</zh-CN><en>The stable contract version shared by the first shell and existing example.</en></lang>
 * @lang zh-CN 测试把版本写为显式常量，避免查询或详情请求悄然依赖 module 内部默认值。
 * @lang en Tests keep the version as an explicit constant, avoiding a query or detail request that silently relies on a module-internal default.
 */
const CONTRACT_VERSION = '1.0';

/**
 * <lang><zh-CN>创建屏幕 capability policy；首轮所有 screen 默认无需 capability。</zh-CN><en>Creates a screen-capability policy; every first-round screen needs no capability by default.</en></lang>
 * @param {{catalog?: string[], detail?: string[]}} [options] <lang><zh-CN>用于个别测试的声明 capability 覆盖。</zh-CN><en>Declared capability overrides for individual tests.</en></lang>
 * @returns {Record<string, string[]>} <lang><zh-CN>按已登记 screen ID 组织的 immutable-by-convention policy。</zh-CN><en>Policy organized by registered screen ID and immutable by convention.</en></lang>
 * @lang zh-CN policy 是 shell 自有的声明性授权输入；它不代表真实角色、身份协议或业务权限模型。
 * @lang en The policy is a declarative authorization input owned by the shell; it represents neither real roles, identity protocols, nor a business permission model.
 */
function createScreenCapabilityPolicy(options = {}) {
  // <lang><zh-CN>catalog capability 只从显式 options 读取；缺省为空数组以保持匿名目录可访问。</zh-CN><en>Read catalog capabilities only from explicit options; default to an empty array so the anonymous catalog remains accessible.</en></lang>
  const catalogCapabilities = options.catalog ?? [];

  // <lang><zh-CN>detail capability 独立于 catalog，供 deny 测试确认目标 screen 不会继承来源 screen 的许可。</zh-CN><en>Keep detail capabilities independent from catalog ones so deny tests confirm a target screen does not inherit its source screen's permission.</en></lang>
  const detailCapabilities = options.detail ?? [];

  // <lang><zh-CN>只返回公开 route projection 已登记的两个 screen，避免 policy 引入未知页面或 URL。</zh-CN><en>Return only the two screens registered by the public route projection, preventing the policy from introducing an unknown page or URL.</en></lang>
  return {
    'catalog-list': catalogCapabilities,
    'entry-detail': detailCapabilities
  };
}

/**
 * <lang><zh-CN>创建由中性 mock 驱动的成功 Biz composition 与 route projection。</zh-CN><en>Creates a successful Biz composition and route projection driven by the neutral mock.</en></lang>
 * @param {'first-page'|'last-page'|'empty-query'|'adapter-failure'|'detail-section-failure'} [fixtureCase='first-page'] <lang><zh-CN>确定性 mock 情形。</zh-CN><en>Deterministic mock case.</en></lang>
 * @returns {{composition: object, routeProjection: object}} <lang><zh-CN>shell 所需的已装配调用边界和 route projection。</zh-CN><en>Assembled invocation boundary and route projection required by the shell.</en></lang>
 * @lang zh-CN helper 在每个测试中重建 manifest/provider，防止一个测试的可变输入泄漏到另一个测试。
 * @lang en The helper rebuilds manifests and providers for every test, preventing mutable input from one test from leaking into another.
 */
function createExampleComposition(fixtureCase = 'first-page') {
  // <lang><zh-CN>example 自有 manifest/profile 保持与公开 contract 的 ID、port 与 block 声明一致。</zh-CN><en>The example-owned manifests and profile remain aligned with public-contract IDs, ports, and block declarations.</en></lang>
  const manifests = createExampleManifests();

  // <lang><zh-CN>fixture case 只改变已登记 mock port 的确定性返回，不创建真实 adapter 或 transport。</zh-CN><en>The fixture case changes only deterministic returns of registered mock ports and creates no real adapter or transport.</en></lang>
  const mock = createCatalogQueryDetailMock({ fixtureCase });

  // <lang><zh-CN>core 装配显式接受三类声明和 provider；测试不读取文件或通过全局 registry 发现它们。</zh-CN><en>Core assembly explicitly accepts three declarations and providers; tests neither read files nor discover them through a global registry.</en></lang>
  const assembly = assembleComposition({
    businessModule: manifests.businessModule,
    implementationPackage: manifests.implementationPackage,
    profile: manifests.profile,
    portProviders: mock.portProviders
  });

  // <lang><zh-CN>测试 helper 只接受已验证 composition；失败时立即暴露既有契约漂移而不产生不可靠 shell 输入。</zh-CN><en>The test helper accepts only a verified composition; fail immediately on existing-contract drift rather than create unreliable shell input.</en></lang>
  assert.equal(assembly.ok, true);

  // <lang><zh-CN>route projection 由同一 mock 显式返回，确保 screen/action ID 与 provider fixture 属于同一中性示例。</zh-CN><en>The same mock explicitly returns the route projection, ensuring screen/action IDs and provider fixtures belong to one neutral example.</en></lang>
  return { composition: assembly.composition, routeProjection: mock.routeProjection };
}

/**
 * <lang><zh-CN>创建测试可用的成功 shell，并允许调用方覆盖 fixture 或 policy。</zh-CN><en>Creates a successful shell for tests while allowing fixture or policy overrides.</en></lang>
 * @param {{fixtureCase?: 'first-page'|'last-page'|'empty-query'|'adapter-failure'|'detail-section-failure', policy?: Record<string, string[]>}} [options] <lang><zh-CN>测试情形和 capability policy 覆盖。</zh-CN><en>Test-case and capability-policy overrides.</en></lang>
 * @returns {object} <lang><zh-CN>已经通过初始化校验的 shell。</zh-CN><en>Shell that has passed initialization validation.</en></lang>
 * @lang zh-CN 初始化结果使用结构化成功/失败而非异常；helper 仅在这里断言成功，令各测试专注具体行为。
 * @lang en Initialization uses structured success or failure rather than exceptions; the helper asserts success here so each test can focus on specific behavior.
 */
function createReadyShell(options = {}) {
  // <lang><zh-CN>默认 first-page 用于正常导航；个别测试可选择 empty、adapter failure 或 section failure。</zh-CN><en>Default to first-page for ordinary navigation; individual tests may select empty, adapter failure, or section failure.</en></lang>
  const fixtureCase = options.fixtureCase ?? 'first-page';

  // <lang><zh-CN>获取 composition 和 projection 的独立副本，避免 shell state 共享到另一个测试。</zh-CN><en>Obtain independent composition and projection values, avoiding shell-state sharing with another test.</en></lang>
  const example = createExampleComposition(fixtureCase);

  // <lang><zh-CN>policy 未覆盖时使用匿名可访问的默认声明；其键仍严格对应已登记 screen。</zh-CN><en>Use the anonymously accessible default declaration when policy is not overridden; its keys still strictly correspond to registered screens.</en></lang>
  const policy = options.policy ?? createScreenCapabilityPolicy();

  // <lang><zh-CN>shell 初始化只接收显式 composition、projection 和 policy，不接收 Vue application、router 或身份服务。</zh-CN><en>Shell initialization receives only explicit composition, projection, and policy, never a Vue application, router, or identity service.</en></lang>
  const initialization = createApplicationShell({
    composition: example.composition,
    routeProjection: example.routeProjection,
    screenCapabilityPolicy: policy
  });

  // <lang><zh-CN>合法的既有示例和默认 policy 必须生成 shell，而不是只返回 diagnostics。</zh-CN><en>A valid existing example and default policy must produce a shell rather than return diagnostics only.</en></lang>
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>返回 shell 的最小行为表面；测试不读取或修改 initialization 内部对象。</zh-CN><en>Return the shell's minimal behavior surface; tests neither read nor modify initialization internals.</en></lang>
  return initialization.shell;
}

/**
 * <lang><zh-CN>构造公开 query contract 的最小合法请求。</zh-CN><en>Constructs the smallest valid request for the public query contract.</en></lang>
 * @param {number} [page=1] <lang><zh-CN>one-based 页码。</zh-CN><en>One-based page number.</en></lang>
 * @returns {{contractVersion: string, filter: object, page: number, pageSize: number}} <lang><zh-CN>可传递给 shell 的查询请求。</zh-CN><en>Query request passable to the shell.</en></lang>
 * @lang zh-CN filter 刻意为空对象，因为中性 example 不定义行业筛选字段。
 * @lang en Filter is deliberately an empty object because the neutral example defines no industry filter fields.
 */
function createQueryRequest(page = 1) {
  // <lang><zh-CN>返回完整 request shape，使 test 不依赖 shell 对缺失分页字段的默认补全。</zh-CN><en>Return the complete request shape so tests do not rely on the shell to supply missing paging defaults.</en></lang>
  return {
    contractVersion: CONTRACT_VERSION,
    filter: {},
    page,
    pageSize: 20
  };
}

/**
 * <lang><zh-CN>验证正常 query 将 canonical page 投影到目录 screen state。</zh-CN><en>Verifies that an ordinary query projects a canonical page into catalog screen state.</en></lang>
 * @lang zh-CN 此断言确认 shell 不改变 module-owned page 语义，也不把 presentation state 写回 composition。
 * @lang en This assertion confirms the shell does not alter module-owned page semantics or write presentation state back into the composition.
 */
function testProjectsCatalogPage() {
  // <lang><zh-CN>创建默认可访问 shell，用于验证匿名 mock 的目录行为。</zh-CN><en>Create the default accessible shell to verify anonymous mock catalog behavior.</en></lang>
  const shell = createReadyShell();

  // <lang><zh-CN>查询结果同时是操作返回值和后续 snapshot 的 page 投影来源。</zh-CN><en>The query result is both the operation return value and the source of the later snapshot's page projection.</en></lang>
  const result = shell.query(createQueryRequest());

  // <lang><zh-CN>成功查询必须保留 canonical page kind，而不是转换为 UI 私有结果类型。</zh-CN><en>A successful query must retain the canonical page kind rather than convert into a UI-private result type.</en></lang>
  assert.equal(result.kind, 'page');

  // <lang><zh-CN>读取新的只读 snapshot，确认初始目录 screen 在查询后仍保持当前 screen。</zh-CN><en>Read a fresh read-only snapshot and confirm the initial catalog screen remains current after querying.</en></lang>
  const snapshot = shell.getSnapshot();

  // <lang><zh-CN>目录 screen ID 来自 route projection，不是 URL、文件路径或组件名。</zh-CN><en>The catalog screen ID comes from route projection, not a URL, file path, or component name.</en></lang>
  assert.equal(snapshot.screenId, 'catalog-list');

  // <lang><zh-CN>page projection 保留 entry ID，供后续已声明 action 选择详情。</zh-CN><en>The page projection retains the entry ID for later selection through a declared action.</en></lang>
  assert.equal(snapshot.page.entries[0].id, 'entry-001');

  // <lang><zh-CN>成功结果不能遗留前次 failure；初始 shell 应明确保持 failure 为 null。</zh-CN><en>A successful result cannot retain a prior failure; the initial shell must explicitly keep failure null.</en></lang>
  assert.equal(snapshot.failure, null);
}

/**
 * <lang><zh-CN>验证缺失声明 capability 会拒绝进入 detail，并且不会执行 detail port。</zh-CN><en>Verifies that a missing declared capability rejects entry to detail and does not invoke the detail port.</en></lang>
 * @lang zh-CN 当前 mock session 没有 capabilities；该测试仅证明声明式 deny 分支，不表达真实授权系统。
 * @lang en The current mock session has no capabilities; this test proves only a declarative deny branch and represents no real authorization system.
 */
function testRejectsDetailWithoutCapability() {
  // <lang><zh-CN>仅 detail screen 要求 capability，使目录 query 仍能建立可选择的 canonical page。</zh-CN><en>Require a capability only for the detail screen so the catalog query can still establish a selectable canonical page.</en></lang>
  const policy = createScreenCapabilityPolicy({ detail: ['entry.read'] });

  // <lang><zh-CN>使用限制后的 policy 创建 shell；mock session 仍返回空 capability 数组。</zh-CN><en>Create the shell with the restricted policy; the mock session still returns an empty capability array.</en></lang>
  const shell = createReadyShell({ policy });

  // <lang><zh-CN>先加载目录，确保拒绝发生在选择 detail 的 capability gate 而不是 query 输入校验。</zh-CN><en>Load the catalog first so rejection occurs at the detail capability gate rather than query-input validation.</en></lang>
  shell.query(createQueryRequest());

  // <lang><zh-CN>选择公开 page 返回的 entry ID，请求已登记 catalog-to-detail action。</zh-CN><en>Select the entry ID returned by the public page and request the registered catalog-to-detail action.</en></lang>
  const denial = shell.selectEntry('entry-001');

  // <lang><zh-CN>deny 复用公开 session scope failure，调用方可以稳定地区分 session capability 与 adapter 错误。</zh-CN><en>The denial reuses the public session-scope failure so callers can stably distinguish session capability from adapter errors.</en></lang>
  assert.equal(denial.code, 'session-not-capable');
  assert.equal(denial.scope, 'session');

  // <lang><zh-CN>拒绝后仍停在来源 screen，避免未授权 detail 产生可观察导航状态。</zh-CN><en>Remain on the source screen after denial, preventing unauthorized detail from producing observable navigation state.</en></lang>
  const snapshot = shell.getSnapshot();

  // <lang><zh-CN>screen 未变化证明 shell 先校验 capability，再允许 detail provider 或状态转换。</zh-CN><en>An unchanged screen proves the shell checks capability before allowing a detail provider or state transition.</en></lang>
  assert.equal(snapshot.screenId, 'catalog-list');

  // <lang><zh-CN>被拒绝的 detail 不得保留 selected entry 或 detail result。</zh-CN><en>A denied detail must retain neither a selected entry nor a detail result.</en></lang>
  assert.equal(snapshot.selectedEntryId, null);
  assert.equal(snapshot.detail, null);
}

/**
 * <lang><zh-CN>验证详情导航保留主 entry，并把 section failure 与整体 detail 成功分层。</zh-CN><en>Verifies that detail navigation retains the primary entry and layers a section failure beneath an otherwise successful detail.</en></lang>
 * @lang zh-CN section failure 是 module/adapter 的 canonical detail 内容；shell 只投影，不升级为整体导航失败。
 * @lang en A section failure is canonical detail content owned by the module or adapter; the shell only projects it and does not upgrade it to a whole-navigation failure.
 */
function testProjectsDetailSectionFailure() {
  // <lang><zh-CN>section-failure fixture 保持 query 成功，只在 detail supplementary section 返回失败。</zh-CN><en>The section-failure fixture keeps the query successful and returns failure only from the detail supplementary section.</en></lang>
  const shell = createReadyShell({ fixtureCase: 'detail-section-failure' });

  // <lang><zh-CN>目录 page 先提供可用于 detail 的 canonical entry ID。</zh-CN><en>The catalog page first supplies the canonical entry ID usable for detail.</en></lang>
  shell.query(createQueryRequest());

  // <lang><zh-CN>允许的选择应返回 detail，而不是 route-only acknowledgement。</zh-CN><en>An allowed selection must return detail rather than a route-only acknowledgement.</en></lang>
  const detail = shell.selectEntry('entry-001');

  // <lang><zh-CN>整体 kind 仍是 detail，证明 supplementary failure 不覆盖已成功的主 entry。</zh-CN><en>The overall kind remains detail, proving a supplementary failure does not overwrite the successful primary entry.</en></lang>
  assert.equal(detail.kind, 'detail');

  // <lang><zh-CN>读取 detail screen snapshot，验证 action 只改变为 projection 登记的目标 screen。</zh-CN><en>Read the detail-screen snapshot and verify the action changes only to the target screen registered by projection.</en></lang>
  const snapshot = shell.getSnapshot();

  // <lang><zh-CN>screen 与 selected entry 同时证明状态转换携带的是 canonical ID，而不是 UI object 或 URL。</zh-CN><en>The screen and selected entry together prove state transition carries a canonical ID rather than a UI object or URL.</en></lang>
  assert.equal(snapshot.screenId, 'entry-detail');
  assert.equal(snapshot.selectedEntryId, 'entry-001');

  // <lang><zh-CN>附属 section 失败仍保持自己的 code，便于 UI 决定局部反馈而不掩盖 primary 内容。</zh-CN><en>The supplementary section failure retains its own code so UI can decide local feedback without hiding primary content.</en></lang>
  assert.equal(snapshot.detail.sections[1].failure.code, 'section-unavailable');

  // <lang><zh-CN>成功 detail 不应在 shell 顶层 failure 槽产生错误，避免混淆 section 与 request scope。</zh-CN><en>A successful detail must not produce an error in the shell's top-level failure slot, avoiding confusion between section and request scope.</en></lang>
  assert.equal(snapshot.failure, null);

  // <lang><zh-CN>显式回到目录只恢复 projection state，不调用 host router 或清除已加载 page。</zh-CN><en>Returning explicitly to catalog restores only projection state and calls no host router or clears the loaded page.</en></lang>
  shell.showCatalog();

  // <lang><zh-CN>回退后 selected/detail 被清空，但目录 page 仍可供应用继续呈现。</zh-CN><en>After returning, selected/detail are cleared while the catalog page remains available for application rendering.</en></lang>
  const catalogSnapshot = shell.getSnapshot();

  // <lang><zh-CN>这三个断言固定无 router 的单页回退语义。</zh-CN><en>These three assertions fix single-page return semantics without a router.</en></lang>
  assert.equal(catalogSnapshot.screenId, 'catalog-list');
  assert.equal(catalogSnapshot.selectedEntryId, null);
  assert.equal(catalogSnapshot.page.entries[0].id, 'entry-001');
}

/**
 * <lang><zh-CN>验证 empty page 是成功观察，且 retry 重放最近的 retryable query。</zh-CN><en>Verifies that an empty page is a successful observation and retry replays the most recent retryable query.</en></lang>
 * @lang zh-CN retry 只重放 shell 自己保存的 canonical request；它不读取缓存、计时器、网络或持久化状态。
 * @lang en Retry replays only the canonical request stored by the shell; it reads no cache, timer, network, or persisted state.
 */
function testProjectsEmptyAndRetryableFailure() {
  // <lang><zh-CN>empty fixture 用于确认零条目 page 不会被转换为 failure。</zh-CN><en>Use the empty fixture to confirm a zero-entry page is not converted into failure.</en></lang>
  const emptyShell = createReadyShell({ fixtureCase: 'empty-query' });

  // <lang><zh-CN>执行合法 query 并保存 page 结果，空态由应用根据 entries/total 呈现。</zh-CN><en>Execute a valid query and retain the page result; application presents empty state from entries and total.</en></lang>
  const emptyPage = emptyShell.query(createQueryRequest());

  // <lang><zh-CN>empty page 必须仍有 canonical page kind 与零 total。</zh-CN><en>An empty page must still have canonical page kind and zero total.</en></lang>
  assert.equal(emptyPage.kind, 'page');
  assert.equal(emptyPage.total, 0);

  // <lang><zh-CN>adapter-failure fixture 用于确认 shell 保存 canonical retryable failure，而不接触真实 transport。</zh-CN><en>Use the adapter-failure fixture to confirm the shell stores canonical retryable failure without touching real transport.</en></lang>
  const unavailableShell = createReadyShell({ fixtureCase: 'adapter-failure' });

  // <lang><zh-CN>第一次 query 产生 adapter scope failure，并成为 shell 可重放的最后命令。</zh-CN><en>The first query yields adapter-scope failure and becomes the shell's replayable last command.</en></lang>
  const initialFailure = unavailableShell.query(createQueryRequest());

  // <lang><zh-CN>只对 retryable failure 开放 retry，避免把输入错误或 deny 当成可自动重试的 transport 操作。</zh-CN><en>Expose retry only for a retryable failure, avoiding automatic transport behavior for input errors or denials.</en></lang>
  assert.equal(initialFailure.retryable, true);
  assert.equal(initialFailure.code, 'adapter-unavailable');

  // <lang><zh-CN>retry 重放相同 canonical query；fixture 保持不可用，因此返回同一受控失败。</zh-CN><en>Retry replays the same canonical query; fixture remains unavailable and therefore returns the same controlled failure.</en></lang>
  const retriedFailure = unavailableShell.retry();

  // <lang><zh-CN>失败 code/scope 保持稳定，证明 shell 没有用 UI 文案或 HTTP 细节替换 contract。</zh-CN><en>Failure code and scope remain stable, proving the shell did not replace contract with UI copy or HTTP details.</en></lang>
  assert.equal(retriedFailure.code, 'adapter-unavailable');
  assert.equal(retriedFailure.scope, 'adapter');

  // <lang><zh-CN>snapshot 保留最后 canonical failure，供应用用其 localized message 决定 notice 或 retry control。</zh-CN><en>The snapshot retains the last canonical failure so application can use localized message to decide a notice or retry control.</en></lang>
  assert.equal(unavailableShell.getSnapshot().failure.code, 'adapter-unavailable');
}

/**
 * <lang><zh-CN>验证非法 policy 与未知 route action 在 shell 创建或调用时被受控拒绝。</zh-CN><en>Verifies that an invalid policy and an unknown route action are rejected in a controlled manner at shell creation or invocation.</en></lang>
 * @lang zh-CN 这类拒绝避免 policy 或调用方借由任意字符串引入未声明 screen、action、URL 或动态能力。
 * @lang en These rejections prevent a policy or caller from introducing an undeclared screen, action, URL, or dynamic capability through arbitrary strings.
 */
function testRejectsInvalidPolicyAndAction() {
  // <lang><zh-CN>先取得合法 example 输入，再仅向 policy 加入未知 screen 以隔离配置错误。</zh-CN><en>First obtain valid example input and then add only an unknown screen to policy to isolate configuration error.</en></lang>
  const example = createExampleComposition();

  // <lang><zh-CN>unknown screen 不属于公开 route projection，必须在初始化时被诊断。</zh-CN><en>The unknown screen is absent from public route projection and must be diagnosed during initialization.</en></lang>
  const invalidPolicy = {
    ...createScreenCapabilityPolicy(),
    'unknown-screen': []
  };

  // <lang><zh-CN>创建结果使用结构化失败，避免在普通配置错误上抛出无法呈现的异常。</zh-CN><en>The creation result uses structured failure, avoiding an unpresentable exception for an ordinary configuration error.</en></lang>
  const invalidInitialization = createApplicationShell({
    composition: example.composition,
    routeProjection: example.routeProjection,
    screenCapabilityPolicy: invalidPolicy
  });

  // <lang><zh-CN>初始化必须明确失败，并保留稳定 diagnostic code 供 host/test 分支。</zh-CN><en>Initialization must fail explicitly and retain a stable diagnostic code for host or test branching.</en></lang>
  assert.equal(invalidInitialization.ok, false);
  assert.equal(invalidInitialization.diagnostics.some((diagnostic) => diagnostic.code === 'shell.policy.screen.unknown'), true);

  // <lang><zh-CN>合法 shell 用于验证未知 action 既不路由也不调用 detail provider。</zh-CN><en>Use a valid shell to verify an unknown action neither routes nor invokes a detail provider.</en></lang>
  const shell = createReadyShell();

  // <lang><zh-CN>未知 action 只返回稳定 request-scope failure，不回退到 URL 或 host navigation。</zh-CN><en>An unknown action returns only a stable request-scope failure and never falls back to a URL or host navigation.</en></lang>
  const unknownActionFailure = shell.navigate('unknown-action');

  // <lang><zh-CN>错误 code 与 scope 让应用可呈现受控反馈，而不会泄露未声明路由细节。</zh-CN><en>Error code and scope let application present controlled feedback without leaking undeclared route details.</en></lang>
  assert.equal(unknownActionFailure.code, 'route-action-unknown');
  assert.equal(unknownActionFailure.scope, 'request');
}

// <lang><zh-CN>按独立 shell 责任注册测试，确保失败输出可定位为目录、权限、详情、retry 或配置边界。</zh-CN><en>Register tests by independent shell responsibility so failure output locates a catalog, permission, detail, retry, or configuration boundary.</en></lang>
test('projects a canonical catalog page into shell state', testProjectsCatalogPage);
test('rejects detail navigation without a declared capability', testRejectsDetailWithoutCapability);
test('projects a detail section failure without losing the primary entry', testProjectsDetailSectionFailure);
test('projects empty pages and replays a retryable canonical failure', testProjectsEmptyAndRetryableFailure);
test('rejects an invalid policy and an unknown route action', testRejectsInvalidPolicyAndAction);
