/**
 * <lang><zh-CN>代表性 `mp-weixin` 纵切的纯 Node 验收：固定 app profile、显式数据源、能力生命周期、shell 路由与脱敏观察边界。</zh-CN><en>Pure-Node acceptance for the representative `mp-weixin` slice: fixes the app profile, explicit source, capability lifecycle, shell routing, and redacted-observation boundaries.</en></lang>
 * @lang zh-CN 测试只读取仓内 JSON 并调用本地确定性 fixture；它不编译 Vue、不访问网络，也不启动微信开发者工具。
 * @lang en The test reads only checked-in JSON and invokes local deterministic fixtures; it neither compiles Vue, accesses the network, nor starts WeChat DevTools.
 */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createRepresentativeFixtureRuntime } from '../apps/example-catalog-query-detail-mp-weixin/src/fixture-runtime.mjs';

/**
 * <lang><zh-CN>代表性 app profile 的仓内 URL；以模块相对位置解析，避免依赖调用测试时的工作目录。</zh-CN><en>Checked-in URL of the representative app profile, resolved relative to this module instead of the test process working directory.</en></lang>
 * @lang zh-CN URL 只指向当前公开仓内固定 JSON，不接受环境变量、任意路径或远端地址。
 * @lang en The URL points only to fixed JSON in this public repository and accepts no environment variable, arbitrary path, or remote address.
 */
const REPRESENTATIVE_PROFILE_URL = new URL(
  '../apps/example-catalog-query-detail-mp-weixin/src/representative.profile.json',
  import.meta.url
);

/**
 * <lang><zh-CN>中性代表性能力的稳定模块标识。</zh-CN><en>Stable module identifier of the neutral representative capability.</en></lang>
 * @lang zh-CN 该值用于 lifecycle snapshot 断言，不代表行业模块或 npm 包。
 * @lang en The value is used for lifecycle-snapshot assertions and represents neither an industry module nor an npm package.
 */
const MODULE_ID = 'example.catalog-query-detail';

/**
 * <lang><zh-CN>读取并解析仓内默认 profile。</zh-CN><en>Reads and parses the checked-in default profile.</en></lang>
 *
 * @returns {Promise<object>} <lang><zh-CN>每次测试独立拥有的新 profile 对象。</zh-CN><en>A new profile object independently owned by each test.</en></lang>
 * @lang zh-CN JSON parse 也证明应用输入不是带函数的 DSL；运行时仍负责完整 shape 校验。
 * @lang en JSON parsing also proves the application input is not a function-bearing DSL; the runtime remains responsible for full shape validation.
 */
async function loadRepresentativeProfile() {
  // <lang><zh-CN>以 UTF-8 读取公开 fixture，避免平台默认编码改变双语或标识文本。</zh-CN><en>Read the public fixture as UTF-8, avoiding platform-default encoding changes to bilingual or identifier text.</en></lang>
  const profileText = await readFile(REPRESENTATIVE_PROFILE_URL, 'utf8');

  // <lang><zh-CN>解析结果仅作为调用方输入；测试不在共享模块状态中缓存或修改它。</zh-CN><en>The parsed result is only caller input; the test neither caches nor mutates it in shared module state.</en></lang>
  return JSON.parse(profileText);
}

/**
 * <lang><zh-CN>创建一个从默认 profile 隔离的显式 mock profile。</zh-CN><en>Creates an explicit mock profile isolated from the default profile.</en></lang>
 *
 * @returns {Promise<object>} <lang><zh-CN>只把 source mode 改为 `mock` 的 profile。</zh-CN><en>A profile whose only changed source selection is `mock`.</en></lang>
 * @lang zh-CN 使用结构化副本防止 mock 测试覆盖默认 `wire-fixture` 证据。
 * @lang en A structured copy prevents mock tests from overwriting the default `wire-fixture` evidence.
 */
async function createMockProfile() {
  // <lang><zh-CN>默认 JSON 每次重新读取，因此 source 选择修改只属于当前测试。</zh-CN><en>The default JSON is reread each time, so source-selection mutation belongs only to the current test.</en></lang>
  const profile = await loadRepresentativeProfile();

  // <lang><zh-CN>明确写入 `mock`，测试不依赖 runtime fallback 或环境推断。</zh-CN><en>Write `mock` explicitly so the test relies on neither runtime fallback nor environment inference.</en></lang>
  profile.sourceMode = 'mock';

  // <lang><zh-CN>返回仍需 runtime 校验的普通 JSON 对象。</zh-CN><en>Return an ordinary JSON object that the runtime must still validate.</en></lang>
  return profile;
}

/**
 * <lang><zh-CN>验证无效 profile 在任何可调用纵切表面形成前被受限诊断拒绝。</zh-CN><en>Verifies an invalid profile is rejected with bounded diagnostics before any invokable slice surface is formed.</en></lang>
 * @lang zh-CN 同时覆盖未知 source 不回退，以及额外连接字段不进入诊断。
 * @lang en This also covers no fallback for an unknown source and exclusion of an extra connection field from diagnostics.
 */
async function testRejectsInvalidProfileWithoutFallback() {
  // <lang><zh-CN>从合法输入开始只破坏 source，并加入 schema 明确禁止的类连接字段。</zh-CN><en>Start from valid input, corrupt only the source, and add a connection-like field explicitly forbidden by the schema.</en></lang>
  const invalidProfile = await loadRepresentativeProfile();

  // <lang><zh-CN>未知 source 不能被解释为 mock、wire、URL 或自定义 provider 名称。</zh-CN><en>An unknown source cannot be interpreted as mock, wire, URL, or a custom provider name.</en></lang>
  invalidProfile.sourceMode = 'automatic-secret-source';

  // <lang><zh-CN>附加值用于确认 validation diagnostics 不回显任意 profile 字段。</zh-CN><en>The extra value confirms validation diagnostics do not echo arbitrary profile fields.</en></lang>
  invalidProfile.backendUrl = 'https://secret.invalid/private-value';

  // <lang><zh-CN>创建调用必须返回结构化失败，而不是抛出原始输入或选择默认数据源。</zh-CN><en>Creation must return a structured failure rather than throw raw input or select a default source.</en></lang>
  const initialization = createRepresentativeFixtureRuntime(invalidProfile);

  // <lang><zh-CN>失败结果只有状态与受限 diagnostics，不形成 shell、source 或 observation 控制面。</zh-CN><en>The failed result has only status and bounded diagnostics and forms no shell, source, or observation surface.</en></lang>
  assert.deepEqual(Object.keys(initialization).sort(), ['diagnostics', 'ok']);
  assert.equal(initialization.ok, false);
  assert.equal(initialization.diagnostics.length > 0, true);
  assert.equal(initialization.diagnostics.some((diagnostic) => diagnostic.code === 'representative.profile.properties.invalid'), true);
  assert.equal(initialization.diagnostics.some((diagnostic) => diagnostic.code === 'representative.profile.source-mode.invalid'), true);

  // <lang><zh-CN>序列化公开失败结果，确认非法 source、URL 和任意字段名均未被回显。</zh-CN><en>Serialize the public failure result to confirm the invalid source, URL, and arbitrary field name are not echoed.</en></lang>
  const serializedResult = JSON.stringify(initialization);

  // <lang><zh-CN>三个断言分别覆盖值、连接内容与额外字段名，防止只遮盖其中一部分。</zh-CN><en>The three assertions cover the value, connection content, and extra field name separately, preventing only partial redaction.</en></lang>
  assert.equal(serializedResult.includes('automatic-secret-source'), false);
  assert.equal(serializedResult.includes('secret.invalid'), false);
  assert.equal(serializedResult.includes('backendUrl'), false);
}

/**
 * <lang><zh-CN>验证默认 wire fixture 经过 enabled lifecycle、app shell、query、detail 与返回目录的完整路径。</zh-CN><en>Verifies the default wire fixture passes through enabled lifecycle, app shell, query, detail, and return-to-catalog path.</en></lang>
 * @lang zh-CN adapter observation 在安装/启用时为零，并只在明确 query/detail action 后增长。
 * @lang en Adapter observation is zero during install and enable and grows only after explicit query and detail actions.
 */
async function testRunsDefaultWireSliceEndToEnd() {
  // <lang><zh-CN>默认 profile 必须显式选择 `wire-fixture`，测试不在调用处覆盖它。</zh-CN><en>The default profile must explicitly select `wire-fixture`; the test does not override it at the call site.</en></lang>
  const profile = await loadRepresentativeProfile();

  // <lang><zh-CN>创建成功会完成 profile validation、source construction、install、enable 与 shell bridge，但不运行 query/detail。</zh-CN><en>Successful creation completes profile validation, source construction, install, enable, and shell bridging but runs no query or detail.</en></lang>
  const representativeRuntime = createRepresentativeFixtureRuntime(profile);

  // <lang><zh-CN>公开 API 只含明确的查询、snapshot、呈现判断和 shell 表面。</zh-CN><en>The public API contains only explicit query, snapshot, presentation-check, and shell surfaces.</en></lang>
  assert.deepEqual(Object.keys(representativeRuntime).sort(), [
    'createQueryRequest',
    'diagnostics',
    'getLifecycleSnapshot',
    'getObservation',
    'getProfileSnapshot',
    'isBlockEnabled',
    'ok',
    'shell',
    'sourceMode'
  ]);
  assert.equal(representativeRuntime.ok, true);
  assert.equal(representativeRuntime.sourceMode, 'wire-fixture');

  // <lang><zh-CN>lifecycle snapshot 证明明确实现已启用，同时不暴露 composition 或 provider。</zh-CN><en>The lifecycle snapshot proves the explicit implementation is enabled while exposing no composition or provider.</en></lang>
  const initialLifecycle = representativeRuntime.getLifecycleSnapshot();

  // <lang><zh-CN>当前代表性 app 只安装一个中性能力单元。</zh-CN><en>The current representative app installs exactly one neutral capability unit.</en></lang>
  assert.equal(initialLifecycle.length, 1);
  assert.equal(initialLifecycle[0].moduleId, MODULE_ID);
  assert.equal(initialLifecycle[0].implementationPackageId, 'example.catalog-query-detail.wire-fixture');
  assert.equal(initialLifecycle[0].state, 'enabled');

  // <lang><zh-CN>install/enable 没有读取业务数据，因此两个 adapter exchange 计数都必须为零。</zh-CN><en>Install and enable read no business data, so both adapter-exchange counts must be zero.</en></lang>
  const initialObservation = representativeRuntime.getObservation();
  assert.equal(initialObservation.sourceMode, 'wire-fixture');
  assert.equal(initialObservation.query.exchanges, 0);
  assert.equal(initialObservation.detail.exchanges, 0);

  // <lang><zh-CN>query request 完全来自已验证 profile，页面或 shell 不补分页默认值。</zh-CN><en>The query request comes entirely from the validated profile; neither page nor shell adds paging defaults.</en></lang>
  const queryRequest = representativeRuntime.createQueryRequest();
  assert.deepEqual(queryRequest, {
    contractVersion: '1.0',
    filter: {},
    page: 1,
    pageSize: 1
  });

  // <lang><zh-CN>明确 query 经过 shell 与 enabled capability 后得到 wire-to-canonical page。</zh-CN><en>An explicit query passes through shell and the enabled capability to produce a wire-to-canonical page.</en></lang>
  const page = representativeRuntime.shell.query(queryRequest);
  assert.equal(page.kind, 'page');
  assert.equal(page.entries[0].id, 'entry-001');
  assert.equal(representativeRuntime.getObservation().query.exchanges, 1);

  // <lang><zh-CN>选择规范化 page 中的 entry，使用已登记 action 取得规范化 detail。</zh-CN><en>Select the entry from the canonical page and obtain canonical detail through the registered action.</en></lang>
  const detail = representativeRuntime.shell.selectEntry(page.entries[0].id);
  assert.equal(detail.kind, 'detail');
  assert.equal(detail.entry.id, 'entry-001');
  assert.equal(representativeRuntime.getObservation().detail.exchanges, 1);

  // <lang><zh-CN>返回目录只重置单页 projection，并保留已加载 page 供继续呈现。</zh-CN><en>Returning to catalog resets only the single-page projection and retains the loaded page for continued presentation.</en></lang>
  const catalogSnapshot = representativeRuntime.shell.showCatalog();
  assert.equal(catalogSnapshot.screenId, 'catalog-list');
  assert.equal(catalogSnapshot.detail, null);
  assert.equal(catalogSnapshot.page.entries[0].id, 'entry-001');

  // <lang><zh-CN>调用方修改 lifecycle snapshot 后重新读取，必须仍得到 runtime 自有 enabled 状态。</zh-CN><en>After caller mutation of a lifecycle snapshot, rereading must still return the runtime-owned enabled state.</en></lang>
  initialLifecycle[0].state = 'caller-mutated';
  assert.equal(representativeRuntime.getLifecycleSnapshot()[0].state, 'enabled');
}

/**
 * <lang><zh-CN>验证显式 mock 仍经过同一 lifecycle/shell，并保留分页 profile 与可选区块投影。</zh-CN><en>Verifies explicit mock still passes through the same lifecycle and shell while retaining paging profile and optional-block projection.</en></lang>
 * @lang zh-CN 测试不把 mock 当 wire 失败时的备用源；它以独立 profile 明确选择。
 * @lang en The test does not treat mock as a backup for wire failure; an independent profile selects it explicitly.
 */
async function testRunsExplicitMockAndPresentationProjection() {
  // <lang><zh-CN>mock profile 显式隐藏两个可选应用区块，但保留契约要求的目录与详情区块。</zh-CN><en>The mock profile explicitly hides both optional application blocks while retaining contract-required catalog and detail blocks.</en></lang>
  const profile = await createMockProfile();
  profile.presentation.enabledBlocks = ['catalog-list', 'entry-detail'];

  // <lang><zh-CN>first-page 是 allowlisted 本地 fixture case，不来自 profile、远端配置或脚本。</zh-CN><en>`first-page` is an allowlisted local fixture case and comes from neither profile, remote configuration, nor script.</en></lang>
  const representativeRuntime = createRepresentativeFixtureRuntime(profile, { fixtureCase: 'first-page' });

  // <lang><zh-CN>显式 source 与生命周期实现 ID 都必须指向 mock。</zh-CN><en>Both explicit source and lifecycle implementation ID must point to mock.</en></lang>
  assert.equal(representativeRuntime.ok, true);
  assert.equal(representativeRuntime.sourceMode, 'mock');
  assert.equal(representativeRuntime.getLifecycleSnapshot()[0].implementationPackageId, 'example.catalog-query-detail.mock-implementation');

  // <lang><zh-CN>可选区块关闭、必选区块保持开启，未知 ID 不能成为隐式已登记区块。</zh-CN><en>Optional blocks are disabled, required blocks remain enabled, and an unknown ID cannot become an implicitly registered block.</en></lang>
  assert.equal(representativeRuntime.isBlockEnabled('runtime-status'), false);
  assert.equal(representativeRuntime.isBlockEnabled('query-context'), false);
  assert.equal(representativeRuntime.isBlockEnabled('catalog-list'), true);
  assert.equal(representativeRuntime.isBlockEnabled('entry-detail'), true);
  assert.equal(representativeRuntime.isBlockEnabled('unknown-block'), false);

  // <lang><zh-CN>mock query 使用 profile 的 pageSize 1，并保留 mock 公开的下一页语义。</zh-CN><en>The mock query uses profile page size 1 and retains the mock's public next-page semantics.</en></lang>
  const page = representativeRuntime.shell.query(representativeRuntime.createQueryRequest());
  assert.equal(page.pageSize, 1);
  assert.equal(page.hasNext, true);

  // <lang><zh-CN>profile snapshot 与 runtime 内部选择隔离，调用方修改数组不改变下一次区块判断。</zh-CN><en>The profile snapshot is isolated from runtime selection; caller mutation of its array does not change the next block check.</en></lang>
  const profileSnapshot = representativeRuntime.getProfileSnapshot();
  profileSnapshot.presentation.enabledBlocks.length = 0;
  assert.equal(representativeRuntime.isBlockEnabled('catalog-list'), true);
}

/**
 * <lang><zh-CN>验证同一显式 mock 纵切可投影成功空页与可重试规范化失败。</zh-CN><en>Verifies the same explicit mock slice can project a successful empty page and a retryable canonical failure.</en></lang>
 * @lang zh-CN fixture case 只用于本地自动证据，不进入 app profile 或生产配置面。
 * @lang en Fixture cases serve only local automated evidence and do not enter the app profile or a production configuration surface.
 */
async function testProjectsMockEmptyAndFailureStates() {
  // <lang><zh-CN>两个 runtime 使用独立 profile 与 provider 闭包，避免 failure/empty state 相互污染。</zh-CN><en>The two runtimes use independent profiles and provider closures, preventing failure and empty state from contaminating each other.</en></lang>
  const emptyRuntime = createRepresentativeFixtureRuntime(
    await createMockProfile(),
    { fixtureCase: 'empty-query' }
  );
  const failureRuntime = createRepresentativeFixtureRuntime(
    await createMockProfile(),
    { fixtureCase: 'adapter-failure' }
  );

  // <lang><zh-CN>空结果仍是 canonical page，并保留零 total 与无下一页。</zh-CN><en>An empty result remains a canonical page and retains zero total and no next page.</en></lang>
  const emptyPage = emptyRuntime.shell.query(emptyRuntime.createQueryRequest());
  assert.equal(emptyPage.kind, 'page');
  assert.deepEqual(emptyPage.entries, []);
  assert.equal(emptyPage.total, 0);
  assert.equal(emptyPage.hasNext, false);

  // <lang><zh-CN>adapter failure 保持规范化 code/scope/retryable，而不泄漏旧 HTTP envelope 或 wire 值。</zh-CN><en>The adapter failure retains canonical code, scope, and retryability without leaking a legacy HTTP envelope or wire value.</en></lang>
  const failure = failureRuntime.shell.query(failureRuntime.createQueryRequest());
  assert.equal(failure.kind, 'failure');
  assert.equal(failure.code, 'adapter-unavailable');
  assert.equal(failure.scope, 'adapter');
  assert.equal(failure.retryable, true);
  assert.equal(JSON.stringify(failure).includes('http'), false);
}

// <lang><zh-CN>按公开验收责任登记测试，名称不暴露私有阶段、路径或会话上下文。</zh-CN><en>Register tests by public acceptance responsibility; names expose no private stage, path, or session context.</en></lang>
test('rejects an invalid application profile without source fallback', testRejectsInvalidProfileWithoutFallback);
test('runs the default wire fixture through lifecycle, shell, query, detail, and back', testRunsDefaultWireSliceEndToEnd);
test('runs an explicit mock with registered presentation projection', testRunsExplicitMockAndPresentationProjection);
test('projects deterministic empty and failure states through the same shell', testProjectsMockEmptyAndFailureStates);
