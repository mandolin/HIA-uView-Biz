<!--
@lang zh-CN 受控 `mp-weixin` fixture 的单页目录—查询—详情投影：它消费已验证 profile、显式 mock/wire source、能力生命周期、纯 app shell 与 HIA-uView 命名组件，不连接真实后端、身份、存储、平台路由或动态脚本。
@lang en Single-page catalog-query-detail projection for the controlled `mp-weixin` fixture: consumes a validated profile, explicit mock or wire source, capability lifecycle, pure app shell, and named HIA-uView components, and connects to no real backend, identity, storage, platform routing, or dynamic script.
-->
<template>
  <!-- <lang><zh-CN>页面 stack 只组织当前本地呈现；所有业务状态仍由纯 shell 和页面自身 ref 显式拥有。</zh-CN><en>The page stack organizes current local presentation only; pure shell and page-owned refs explicitly retain all business state.</en></lang> -->
  <u-stack class="catalog-fixture" gap="lg">
    <!-- <lang><zh-CN>导航栏右侧 action 只请求当前单页运行固定 catalog query；它不创建 URL、历史记录或 `uni.navigate*` 操作。</zh-CN><en>The navigation-bar right action only requests the current single page to run the fixed catalog query; it creates no URL, history, or `uni.navigate*` operation.</en></lang> -->
    <u-nav-bar
      title="目录示例 / Catalog example"
      action-text="查询 / Query"
      @action="runCatalogQuery"
    />

    <!-- <lang><zh-CN>notice 仅呈现 shell 的已本地化 canonical failure；dismiss 只隐藏当前页面的呈现，不会修改 shell、session 或 provider。</zh-CN><en>The notice presents only the shell's already localized canonical failure; dismiss hides current-page presentation only and changes no shell, session, or provider.</en></lang> -->
    <u-notice
      :visible="isFailureNoticeVisible"
      tone="error"
      :message="failureNoticeMessage"
      dismiss-text="隐藏提示 / Hide notice"
      @dismiss="dismissFailureNotice"
    />

    <!-- <lang><zh-CN>runtime status 是 profile 可选的已编译区块；它只显示显式 source、enabled lifecycle 与受限初始分页，不暴露 provider 或 manifest。</zh-CN><en>Runtime status is a profile-optional compiled block; it displays only explicit source, enabled lifecycle, and bounded initial paging and exposes no provider or manifest.</en></lang> -->
    <u-cell
      v-if="isRuntimeStatusVisible"
      label="运行状态 / Runtime status"
      :value="runtimeStatusValue"
      :description="runtimeStatusDescription"
    />

    <!-- <lang><zh-CN>query field 只在已验证 profile 启用该已编译区块时显示；中性 contract 当前不声明 filter 字段，因此按钮提交的 canonical filter 始终为空对象。</zh-CN><en>The query field displays only when the validated profile enables this compiled block; neutral contract declares no filter field at present, so the button submits an empty object as canonical filter.</en></lang> -->
    <u-field
      v-if="isQueryContextVisible"
      label="查询上下文 / Query context"
      help-text="中性示例暂不解释筛选字段；提交仍验证目录 query 契约。 / The neutral example does not yet interpret filter fields; submission still validates the catalog-query contract."
    >
      <!-- <lang><zh-CN>受控输入只把下一字符串交给页面；输入不会自动访问数据、改变 route 或写入持久状态。</zh-CN><en>The controlled input passes only the next string to the page; input neither automatically accesses data nor changes route or writes persistent state.</en></lang> -->
      <u-input
        :model-value="queryContext"
        placeholder="输入本地查询上下文 / Enter local query context"
        @update:model-value="updateQueryContext"
      />
    </u-field>

    <!-- <lang><zh-CN>初始化问题只通过独立 validation message 呈现；正常 shell 初始化保持 idle，而不是伪造一条成功或错误反馈。</zh-CN><en>Initialization issues are presented only through an independent validation message; normal shell initialization remains idle rather than fabricating success or error feedback.</en></lang> -->
    <u-validation-message
      :state="initializationValidationState"
      :message="initializationValidationMessage"
    />

    <!-- <lang><zh-CN>目录分支只在 shell 未投影 detail screen 时显示；它是组件内条件呈现，不是 host router 或页面栈。</zh-CN><en>The catalog branch displays only while shell has not projected detail screen; it is component-local conditional presentation, not a host router or page stack.</en></lang> -->
    <u-stack v-if="isCatalogBlockVisible && !isDetailVisible" gap="md">
      <!-- <lang><zh-CN>按钮提交完整最小 canonical request；其文案不承诺 queryContext 会成为未声明的业务筛选条件。</zh-CN><en>The button submits the complete minimum canonical request; its label does not promise queryContext becomes an undeclared business filter condition.</en></lang> -->
      <u-button
        label="运行目录查询 / Run catalog query"
        @click="runCatalogQuery"
      />

      <!-- <lang><zh-CN>每行只展示 canonical entry 的双语 label，并把稳定 entry ID 交给已登记 `select-entry` action；行不包含链接或 route 参数。</zh-CN><en>Every row displays only canonical entry's bilingual label and passes stable entry ID to registered `select-entry` action; rows contain no link or route parameter.</en></lang> -->
      <u-cell
        v-for="entry in catalogEntries"
        :key="entry.id"
        :label="localizedText(entry.label)"
        :value="entry.id"
        :clickable="true"
        @click="selectEntry(entry.id)"
      />

      <!-- <lang><zh-CN>尚未运行 query 时空态只邀请运行 profile 已选择的本地 fixture，不把无 page 解释为权限、后端故障或真实空数据。</zh-CN><en>Before query runs, empty state only invites running the local fixture selected by profile and does not interpret absent page as permission, backend failure, or real empty data.</en></lang> -->
      <u-empty
        v-if="shouldShowQueryPrompt"
        title="尚未查询 / No query yet"
        description="运行一次受控的本地 fixture 目录查询。 / Run one controlled local fixture catalog query."
        action-text="运行查询 / Run query"
        @action="runCatalogQuery"
      />

      <!-- <lang><zh-CN>canonical page 的空 entries 是成功 empty state；它不显示为 adapter failure 或无权限结论。</zh-CN><en>Empty entries in a canonical page are a successful empty state; they are not shown as adapter failure or an authorization conclusion.</en></lang> -->
      <u-empty
        v-if="shouldShowEmptyPage"
        title="没有条目 / No entries"
        description="当前 fixture 返回了一个规范化的空页面。 / The current fixture returned a canonical empty page."
        action-text="重新查询 / Query again"
        @action="runCatalogQuery"
      />
    </u-stack>

    <!-- <lang><zh-CN>详情分支仅使用 shell 已选 entry 的 canonical detail；返回按钮调用单页 state reset，不操作平台回退栈。</zh-CN><en>The detail branch uses only canonical detail for shell-selected entry; its back button calls a single-page state reset and does not operate a platform back stack.</en></lang> -->
    <u-stack v-else-if="isEntryDetailBlockVisible" class="catalog-fixture__detail" gap="md">
      <!-- <lang><zh-CN>主 entry 字段来自 canonical detail；页面不补充行业字段、服务端字段、身份信息或未声明 metadata。</zh-CN><en>Primary entry fields come from canonical detail; the page adds no industry field, server field, identity information, or undeclared metadata.</en></lang> -->
      <u-cell
        label="条目 / Entry"
        :value="localizedText(currentDetail.entry.label)"
      />
      <u-cell
        label="标识 / Identifier"
        :value="currentDetail.entry.id"
      />

      <!-- <lang><zh-CN>section 行保留 ready 或 failure 的 canonical 状态；failure 文案来自 section 原始 localized message，而不会提升为整条详情失败。</zh-CN><en>Section rows retain canonical ready or failure state; failure copy comes from original section localized message and is not elevated to whole-detail failure.</en></lang> -->
      <u-cell
        v-for="section in currentDetail.sections"
        :key="section.id"
        :label="section.id"
        :description="sectionDescription(section)"
        :value="section.state"
      />

      <!-- <lang><zh-CN>返回只清理详情 presentation state；retry 只在 shell 明确保存 retryable canonical command 时出现。</zh-CN><en>Back clears detail presentation state only; retry appears only while shell explicitly retains a retryable canonical command.</en></lang> -->
      <u-stack direction="horizontal" gap="sm" wrap>
        <u-button
          variant="secondary"
          label="返回目录 / Back to catalog"
          @click="showCatalog"
        />
        <u-button
          v-if="isRetryAvailable"
          label="重试 / Retry"
          @click="retryLastCommand"
        />
      </u-stack>
    </u-stack>
  </u-stack>
</template>

<script setup>
// <lang><zh-CN>仅导入 Vue 的局部响应式原语；页面不使用全局 store、router、platform API 或网络 client。</zh-CN><en>Import only Vue local reactivity primitives; the page uses no global store, router, platform API, or network client.</en></lang>
import { computed, ref } from 'vue';
// <lang><zh-CN>显式命名导入所需 HIA-uView 组件；不安装 UView plugin、不自动注册组件，也不依赖 import-time 样式注入。</zh-CN><en>Explicitly named-import required HIA-uView components; install no UView plugin, auto-register no component, and rely on no import-time style injection.</en></lang>
import { UButton, UCell, UEmpty, UField, UInput, UNavBar, UNotice, UStack, UValidationMessage } from '@hia-uview/ui';
// <lang><zh-CN>页面只导入 app-owned fixture factory；core、provider、adapter 与 lifecycle 装配保持在独立纯模块内。</zh-CN><en>The page imports only the app-owned fixture factory; core, provider, adapter, and lifecycle assembly remain inside a separate pure module.</en></lang>
import { createRepresentativeFixtureRuntime } from '../../fixture-runtime.mjs';
// <lang><zh-CN>普通 JSON import 提供仓内带版本声明式 profile；Vite 编译它为静态数据，不把值解释为代码或组件路径。</zh-CN><en>A regular JSON import supplies the checked-in versioned declarative profile; Vite compiles it as static data and interprets no value as code or a component path.</en></lang>
import representativeProfile from '../../representative.profile.json';

/**
 * <lang><zh-CN>将已有的双语 localized-text 对象投影为当前 fixture 的单行可见文字。</zh-CN><en>Projects an existing bilingual localized-text object into one line of visible copy for the current fixture.</en></lang>
 * @param {unknown} localizedValue <lang><zh-CN>canonical result 或 diagnostic 提供的 localized value。</zh-CN><en>Localized value provided by canonical result or diagnostic.</en></lang>
 * @returns {string} <lang><zh-CN>安全的中英可见文案，未知值时为空字符串。</zh-CN><en>Safe visible Chinese-English copy, or empty string for an unknown value.</en></lang>
 * @lang zh-CN helper 不翻译、拼接外部输入、记录原始值或生成回退业务文案；它只读取已声明的两种语言字段。
 * @lang en The helper translates nothing, concatenates no external input, logs no raw value, and generates no fallback business copy; it reads only two declared language fields.
 */
function localizedText(localizedValue) {
  // <lang><zh-CN>只有非数组对象才可能拥有明确语言字段；其他形状不被当作可呈现 contract 文本。</zh-CN><en>Only a non-array object may own explicit language fields; no other shape is treated as presentable contract text.</en></lang>
  if (typeof localizedValue !== 'object' || localizedValue === null || Array.isArray(localizedValue)) {
    return '';
  }

  // <lang><zh-CN>分别读取已声明中文与英文字符串；任何非字符串值都归一为空，避免把对象或未审阅数据隐式序列化到页面。</zh-CN><en>Read declared Chinese and English strings separately; normalize any non-string to empty, avoiding implicit serialization of objects or unreviewed data into page.</en></lang>
  const zhHans = typeof localizedValue['zh-Hans'] === 'string' ? localizedValue['zh-Hans'] : '';
  const en = typeof localizedValue.en === 'string' ? localizedValue.en : '';

  // <lang><zh-CN>仅在两个字段都有内容时用固定分隔符组合；任一缺失时返回仍可安全呈现的另一字段。</zh-CN><en>Join with a fixed separator only when both fields have content; when either is missing return the other field that remains safe to present.</en></lang>
  if (zhHans.length > 0 && en.length > 0) {
    return `${zhHans} / ${en}`;
  }

  // <lang><zh-CN>没有双语组合条件时优先返回中文，再返回英文，最后为空；不创建默认标题或错误说明。</zh-CN><en>Without bilingual-combination condition, prefer Chinese, then English, then empty; create no default title or error explanation.</en></lang>
  return zhHans || en;
}

/**
 * <lang><zh-CN>将 canonical detail section 转为信息行的可选说明文字。</zh-CN><en>Converts one canonical detail section into optional description copy for an information row.</en></lang>
 * @param {object} section <lang><zh-CN>当前 detail 提供的 section。</zh-CN><en>Section supplied by current detail.</en></lang>
 * @returns {string} <lang><zh-CN>failure 时的双语说明，其他状态为空字符串。</zh-CN><en>Bilingual explanation on failure, or an empty string for other states.</en></lang>
 * @lang zh-CN section 的 `failure` 仍保持 section scope；本 helper 不把它映射为 whole-detail failure。
 * @lang en Section `failure` remains section scope; this helper does not map it to whole-detail failure.
 */
function sectionDescription(section) {
  // <lang><zh-CN>只有 section failure 具有可呈现 failure message；ready/empty/loading 只通过 state 值展示。</zh-CN><en>Only a section failure has presentable failure message; ready, empty, and loading display through state value only.</en></lang>
  if (section?.state !== 'failure') {
    return '';
  }

  // <lang><zh-CN>读取 canonical failure 的局部化字段，不显示 code 以外的 adapter、transport 或原始错误细节。</zh-CN><en>Read localized field from canonical failure and display no adapter, transport, or raw-error detail beyond the contract.</en></lang>
  return localizedText(section.failure?.message);
}

// <lang><zh-CN>以仓内 profile 创建本页唯一代表性 runtime；初始化完成 profile/source/install/enable/shell，但不调用 query/detail port。</zh-CN><en>Create the page's sole representative runtime from the checked-in profile; initialization completes profile, source, install, enable, and shell but invokes no query or detail port.</en></lang>
const runtimeInitialization = createRepresentativeFixtureRuntime(representativeProfile);

// <lang><zh-CN>仅在完整 runtime 初始化成功时保留 shell；失败时保持 null，所有 handler 都会安全地成为零 provider 调用。</zh-CN><en>Retain shell only after complete runtime initialization succeeds; otherwise keep null and every handler safely becomes zero provider invocation.</en></lang>
const applicationShell = runtimeInitialization.ok ? runtimeInitialization.shell : null;

// <lang><zh-CN>成功时读取隔离 app-profile snapshot 供只读状态文案使用；失败时不从原 JSON 猜测可运行配置。</zh-CN><en>On success read an isolated app-profile snapshot for read-only status copy; on failure do not guess runnable configuration from the original JSON.</en></lang>
const runtimeProfileSnapshot = runtimeInitialization.ok
  ? runtimeInitialization.getProfileSnapshot()
  : null;

// <lang><zh-CN>成功时取得脱敏 lifecycle snapshot；页面不持有 capability runtime 或状态转换函数。</zh-CN><en>On success obtain a redacted lifecycle snapshot; the page retains neither capability runtime nor state-transition function.</en></lang>
const lifecycleSnapshot = runtimeInitialization.ok
  ? runtimeInitialization.getLifecycleSnapshot()
  : [];

// <lang><zh-CN>保存最近一次 shell snapshot 的页面 ref；初始 shell 尚未 query 时 page/detail/failure 都为 null。</zh-CN><en>Keep most-recent shell snapshot in a page ref; before initial query, page, detail, and failure are all null.</en></lang>
const shellSnapshot = ref(applicationShell === null ? null : applicationShell.getSnapshot());

// <lang><zh-CN>保存调用方拥有的 query context 文本；当前中性 contract 不把它转化为未声明 filter 字段或 transport 参数。</zh-CN><en>Keep caller-owned query-context text; current neutral contract does not turn it into an undeclared filter field or transport parameter.</en></lang>
const queryContext = ref('');

// <lang><zh-CN>记录调用方是否仅隐藏了当前 canonical failure notice；隐藏不改写 shell 失败事实，也不触发重试。</zh-CN><en>Records whether caller only hid current canonical-failure notice; hiding changes no shell failure fact and triggers no retry.</en></lang>
const isFailureNoticeDismissed = ref(false);

// <lang><zh-CN>runtime-status 只由已验证 profile 的登记判断控制，失败初始化不会显示猜测状态。</zh-CN><en>Only the registered-block decision of a validated profile controls runtime status; failed initialization displays no guessed status.</en></lang>
const isRuntimeStatusVisible = computed(() => (
  runtimeInitialization.ok
  && runtimeInitialization.isBlockEnabled('runtime-status')
));

// <lang><zh-CN>query-context 可独立隐藏，但隐藏只影响已编译呈现，不改变 canonical filter 或 query 行为。</zh-CN><en>Query context may be hidden independently, but hiding affects only compiled presentation and changes neither canonical filter nor query behavior.</en></lang>
const isQueryContextVisible = computed(() => (
  runtimeInitialization.ok
  && runtimeInitialization.isBlockEnabled('query-context')
));

// <lang><zh-CN>目录区块是有效 profile 的必选项；仍通过 runtime API 判断，避免模板自行解释 JSON。</zh-CN><en>Catalog is required by a valid profile; the template still asks the runtime API instead of interpreting JSON itself.</en></lang>
const isCatalogBlockVisible = computed(() => (
  runtimeInitialization.ok
  && runtimeInitialization.isBlockEnabled('catalog-list')
));

// <lang><zh-CN>详情区块同样由 runtime 已验证登记结果控制，不使用 entry 数据动态选择组件。</zh-CN><en>The detail block is likewise controlled by the runtime's validated registration result and uses no entry data to select a component dynamically.</en></lang>
const isEntryDetailBlockVisible = computed(() => (
  runtimeInitialization.ok
  && runtimeInitialization.isBlockEnabled('entry-detail')
));

// <lang><zh-CN>状态值只组合显式 source mode 与首个脱敏 lifecycle state，不显示实现包、provider 或 manifest。</zh-CN><en>The status value combines only explicit source mode and the first redacted lifecycle state and displays no implementation package, provider, or manifest.</en></lang>
const runtimeStatusValue = computed(() => {
  // <lang><zh-CN>有效初始化固定包含一个 enabled 能力；防御性空值只返回中性 unknown 文案。</zh-CN><en>A valid initialization contains one enabled capability; a defensive absence returns only neutral unknown copy.</en></lang>
  const lifecycleState = lifecycleSnapshot[0]?.state ?? 'unknown';

  // <lang><zh-CN>source mode 已由 profile allowlist 验证，可直接作为稳定技术标识呈现。</zh-CN><en>The source mode was validated by the profile allowlist and may be presented as a stable technical identifier.</en></lang>
  return `${runtimeInitialization.sourceMode} · ${lifecycleState}`;
});

// <lang><zh-CN>状态说明显示受限初始 page/pageSize，证明分页来自 profile 而非页面硬编码。</zh-CN><en>The status description displays bounded initial page and page size, proving paging comes from profile rather than page hard-coding.</en></lang>
const runtimeStatusDescription = computed(() => {
  // <lang><zh-CN>初始化失败或 snapshot 缺失时保持空，错误原因由 validation message 单独呈现。</zh-CN><en>Remain empty when initialization or snapshot is unavailable; the validation message presents the error separately.</en></lang>
  if (runtimeProfileSnapshot === null) {
    return '';
  }

  // <lang><zh-CN>数值已通过 profile schema 对应 runtime 校验，只进入固定双语状态句。</zh-CN><en>The values passed runtime validation corresponding to the profile schema and enter only fixed bilingual status copy.</en></lang>
  return `初始分页 ${runtimeProfileSnapshot.query.page}/${runtimeProfileSnapshot.query.pageSize}。 / Initial paging ${runtimeProfileSnapshot.query.page}/${runtimeProfileSnapshot.query.pageSize}.`;
});

// <lang><zh-CN>只有已成功 shell 且当前 snapshot 为 detail 才显示详情分支；初始化失败或普通目录状态保持目录分支。</zh-CN><en>Show detail branch only when shell succeeded and current snapshot is detail; initialization failure or ordinary catalog state remains catalog branch.</en></lang>
const isDetailVisible = computed(() => shellSnapshot.value?.screenId === 'entry-detail' && shellSnapshot.value.detail !== null);

// <lang><zh-CN>详情值只在可见分支读取；其他状态使用 null，模板的 v-else 不会访问其字段。</zh-CN><en>Read detail value only in visible branch; other states use null, and template v-else does not access its fields.</en></lang>
const currentDetail = computed(() => (isDetailVisible.value ? shellSnapshot.value.detail : null));

// <lang><zh-CN>目录 entries 只来自 canonical page；没有 page 或非数组 entries 时保持空数组，页面不伪造本地记录。</zh-CN><en>Catalog entries come only from canonical page; when no page or non-array entries, retain empty array and fabricate no local record.</en></lang>
const catalogEntries = computed(() => (Array.isArray(shellSnapshot.value?.page?.entries) ? shellSnapshot.value.page.entries : []));

// <lang><zh-CN>query prompt 仅表示尚无 page/detail/failure；它不等同于空数据、权限拒绝或 provider 失败。</zh-CN><en>Query prompt means only there is no page, detail, or failure; it is not equivalent to empty data, permission denial, or provider failure.</en></lang>
const shouldShowQueryPrompt = computed(() => (
  shellSnapshot.value !== null
  && shellSnapshot.value.page === null
  && shellSnapshot.value.detail === null
  && shellSnapshot.value.failure === null
));

// <lang><zh-CN>empty page 仅在 canonical page 实际存在且 entries 为空时显示，保留成功 query 和 failure 的语义区分。</zh-CN><en>Show empty page only when canonical page actually exists and entries are empty, retaining semantic distinction between successful query and failure.</en></lang>
const shouldShowEmptyPage = computed(() => shellSnapshot.value?.page !== null && catalogEntries.value.length === 0);

// <lang><zh-CN>failure notice 只呈现未被页面 dismiss 的 canonical failure；初始化错误由独立 validation message 处理。</zh-CN><en>Failure notice presents only canonical failure not dismissed by page; independent validation message handles initialization error.</en></lang>
const isFailureNoticeVisible = computed(() => shellSnapshot.value?.failure !== null && !isFailureNoticeDismissed.value);

// <lang><zh-CN>notice 文案直接使用 canonical failure 的 localized message；没有 failure 时为空，组件本身因 visible guard 不渲染。</zh-CN><en>Notice copy directly uses canonical failure localized message; it is empty without failure and component itself does not render because visible guard.</en></lang>
const failureNoticeMessage = computed(() => localizedText(shellSnapshot.value?.failure?.message));

// <lang><zh-CN>retry 按钮只在 canonical failure 明确标记 retryable 时可见；页面不能从 code、text 或用户输入猜测 retryability。</zh-CN><en>Retry button is visible only when canonical failure explicitly marks retryable; page cannot guess retryability from code, text, or user input.</en></lang>
const isRetryAvailable = computed(() => shellSnapshot.value?.failure?.retryable === true);

// <lang><zh-CN>初始化 validation state 反映 profile/source/lifecycle/shell 整体创建是否成功；它不把普通 query/detail failure 伪装成表单验证。</zh-CN><en>Initialization validation state reflects whether profile, source, lifecycle, and shell creation succeeded as a whole; it does not disguise ordinary query or detail failure as form validation.</en></lang>
const initializationValidationState = computed(() => (runtimeInitialization.ok ? 'idle' : 'error'));

// <lang><zh-CN>初始化失败时只显示 app runtime 首个安全 diagnostic 的 localized message；没有错误时保持空，不生成默认成功文案。</zh-CN><en>On initialization failure display only the localized message of the app runtime's first safe diagnostic; with no error stay empty and generate no default success copy.</en></lang>
const initializationValidationMessage = computed(() => (
  runtimeInitialization.ok ? '' : localizedText(runtimeInitialization.diagnostics[0]?.message)
));

/**
 * <lang><zh-CN>从纯 shell 刷新当前页面 snapshot，并恢复 canonical failure notice 的默认可见性。</zh-CN><en>Refreshes current-page snapshot from pure shell and restores default visibility of canonical-failure notice.</en></lang>
 * @returns {void} <lang><zh-CN>无返回值；仅更新页面 presentation refs。</zh-CN><en>No return value; updates only page-presentation refs.</en></lang>
 * @lang zh-CN helper 不触发 provider、路由、存储、计时器或 UI global service；调用方需先完成明确 shell action。
 * @lang en Helper triggers no provider, route, storage, timer, or UI global service; caller must complete explicit shell action first.
 */
function synchronizeSnapshot() {
  // <lang><zh-CN>初始化失败时没有 shell 可读，保持 null snapshot 并避免隐式回退对象。</zh-CN><en>With initialization failure there is no shell to read; retain null snapshot and avoid an implicit fallback object.</en></lang>
  if (applicationShell === null) {
    return;
  }

  // <lang><zh-CN>取得 shell 的新隔离 snapshot，使模板不会得到内部可变 state 引用。</zh-CN><en>Obtain shell's fresh isolated snapshot so template receives no internal mutable-state reference.</en></lang>
  shellSnapshot.value = applicationShell.getSnapshot();

  // <lang><zh-CN>每次明确 shell action 后重新允许展示当前 failure；用户可再次选择只隐藏该页面提示。</zh-CN><en>After every explicit shell action, allow current failure to display again; user may again choose to hide only that page notice.</en></lang>
  isFailureNoticeDismissed.value = false;
}

/**
 * <lang><zh-CN>写入受控输入报告的下一 query-context 字符串。</zh-CN><en>Writes next query-context string reported by controlled input.</en></lang>
 * @param {string} nextContext <lang><zh-CN>UInput 原样发出的下一文本。</zh-CN><en>Next text emitted unchanged by UInput.</en></lang>
 * @returns {void} <lang><zh-CN>无返回值；仅更新页面本地 ref。</zh-CN><en>No return value; updates only page-local ref.</en></lang>
 * @lang zh-CN 输入文字当前只是透明呈现输入，不触发自动 query、filter schema 扩展或任何数据读取。
 * @lang en Input text is currently transparent presentation input and triggers no automatic query, filter-schema extension, or data read.
 */
function updateQueryContext(nextContext) {
  // <lang><zh-CN>只接受字符串，防止非预期 handler 调用将对象写入受控 input 的 modelValue。</zh-CN><en>Accept only a string, preventing an unexpected handler call from writing an object into controlled input modelValue.</en></lang>
  if (typeof nextContext !== 'string') {
    return;
  }

  // <lang><zh-CN>页面拥有 query context 写回；不 trim、持久化、记录或解释其业务含义。</zh-CN><en>The page owns query-context writeback and does not trim, persist, log, or interpret its business meaning.</en></lang>
  queryContext.value = nextContext;
}

/**
 * <lang><zh-CN>运行一次明确的 canonical catalog query，并同步其 page 或 failure 投影。</zh-CN><en>Runs one explicit canonical catalog query and synchronizes its page or failure projection.</en></lang>
 * @returns {void} <lang><zh-CN>无返回值；shell result 通过后续 snapshot 呈现。</zh-CN><en>No return value; shell result is presented through following snapshot.</en></lang>
 * @lang zh-CN 显式选择的本地只读 mock/wire fixture 同步返回，不访问 HTTP、Directus、真实数据、网络或异步 transport。
 * @lang en The explicitly selected local read-only mock or wire fixture returns synchronously and accesses no HTTP, Directus, real data, network, or asynchronous transport.
 */
function runCatalogQuery() {
  // <lang><zh-CN>初始化失败时没有合法调用边界，不能用页面默认数据绕过 shell。</zh-CN><en>With initialization failure there is no valid invocation boundary and page default data cannot bypass shell.</en></lang>
  if (applicationShell === null) {
    return;
  }

  // <lang><zh-CN>提交 app runtime 从已验证 profile 创建的 request；shell 决定 page/failure 投影，页面不补分页默认值或改写 canonical outcome。</zh-CN><en>Submit the request created by app runtime from the validated profile; shell decides page or failure projection, while page adds no paging default and rewrites no canonical outcome.</en></lang>
  applicationShell.query(runtimeInitialization.createQueryRequest());

  // <lang><zh-CN>在 action 完成后读取新 snapshot，使目录、empty 或 failure 分支同时从同一 shell state 派生。</zh-CN><en>Read fresh snapshot after action so catalog, empty, or failure branches all derive from same shell state.</en></lang>
  synchronizeSnapshot();
}

/**
 * <lang><zh-CN>通过已登记 `select-entry` action 请求一个 canonical entry detail。</zh-CN><en>Requests one canonical entry detail through registered `select-entry` action.</en></lang>
 * @param {string} entryId <lang><zh-CN>当前 canonical page 提供的稳定 entry ID。</zh-CN><en>Stable entry ID provided by current canonical page.</en></lang>
 * @returns {void} <lang><zh-CN>无返回值；详情或 failure 通过 snapshot 呈现。</zh-CN><en>No return value; detail or failure is presented through snapshot.</en></lang>
 * @lang zh-CN 页面不构造 URL、组件路径或 native navigation；未知或不允许 ID 由 shell 按 canonical failure 处理。
 * @lang en The page constructs no URL, component path, or native navigation; shell handles unknown or disallowed ID through canonical failure.
 */
function selectEntry(entryId) {
  // <lang><zh-CN>无 shell 时维持零 provider 调用；初始化 diagnostics 已在独立消息中可见。</zh-CN><en>With no shell retain zero provider call; initialization diagnostics are already visible in independent message.</en></lang>
  if (applicationShell === null) {
    return;
  }

  // <lang><zh-CN>委托 shell 的已登记 action gate，使 capability/source/target/input 规则不被页面 click handler 绕过。</zh-CN><en>Delegate to shell's registered action gate so capability, source, target, and input rules cannot be bypassed by page click handler.</en></lang>
  applicationShell.selectEntry(entryId);

  // <lang><zh-CN>同步详情或拒绝后的 snapshot，不保留调用方可变 result 引用。</zh-CN><en>Synchronize snapshot after detail or denial and retain no caller mutable result reference.</en></lang>
  synchronizeSnapshot();
}

/**
 * <lang><zh-CN>显式返回 shell 的 catalog screen，并清理 detail presentation state。</zh-CN><en>Explicitly returns to shell's catalog screen and clears detail presentation state.</en></lang>
 * @returns {void} <lang><zh-CN>无返回值；只更新单页 shell projection。</zh-CN><en>No return value; updates only single-page shell projection.</en></lang>
 * @lang zh-CN 这不是 host-router back、URL 更新或平台页面关闭。
 * @lang en This is not host-router back, URL update, or platform-page close.
 */
function showCatalog() {
  // <lang><zh-CN>缺失 shell 时不伪造目录 page 或修复初始化结果。</zh-CN><en>With missing shell do not fabricate catalog page or repair initialization result.</en></lang>
  if (applicationShell === null) {
    return;
  }

  // <lang><zh-CN>调用 shell 明确 state reset；已加载的 canonical page 按 shell contract 保留。</zh-CN><en>Call shell's explicit state reset; loaded canonical page remains according to shell contract.</en></lang>
  applicationShell.showCatalog();

  // <lang><zh-CN>刷新可见 state，使页面不自行维护第二份 selection/detail 副本。</zh-CN><en>Refresh visible state so page maintains no second copy of selection/detail.</en></lang>
  synchronizeSnapshot();
}

/**
 * <lang><zh-CN>只在 shell 保存 retryable canonical command 时重放最近一次请求。</zh-CN><en>Replays latest request only when shell has retained a retryable canonical command.</en></lang>
 * @returns {void} <lang><zh-CN>无返回值；重放结果通过 snapshot 呈现。</zh-CN><en>No return value; replay result is presented through snapshot.</en></lang>
 * @lang zh-CN 页面不从 notice 文案、entry ID 或 query context 重建请求；所有重放语义属于 shell。
 * @lang en Page rebuilds no request from notice copy, entry ID, or query context; all replay semantics belong to shell.
 */
function retryLastCommand() {
  // <lang><zh-CN>无 shell 时零操作；重试不能成为初始化错误的隐式恢复或 provider 探测。</zh-CN><en>With no shell perform zero operation; retry cannot become implicit recovery from initialization error or provider probing.</en></lang>
  if (applicationShell === null) {
    return;
  }

  // <lang><zh-CN>委托 shell 的显式 retry command；shell 会在没有可重试命令时返回受控 failure。</zh-CN><en>Delegate to shell's explicit retry command; shell returns controlled failure when no replayable command exists.</en></lang>
  applicationShell.retry();

  // <lang><zh-CN>读取重放后的统一 snapshot，保留 page/detail/failure 分支的单一状态来源。</zh-CN><en>Read unified snapshot after replay, retaining one state source for page, detail, and failure branches.</en></lang>
  synchronizeSnapshot();
}

/**
 * <lang><zh-CN>仅隐藏当前页面的 canonical failure notice。</zh-CN><en>Hides only current-page canonical-failure notice.</en></lang>
 * @returns {void} <lang><zh-CN>无返回值；不修改 shell state 或发起 retry。</zh-CN><en>No return value; modifies no shell state and starts no retry.</en></lang>
 * @lang zh-CN dismiss 是局部呈现意图，不等于确认、解决、记录或删除任何业务失败。
 * @lang en Dismiss is local presentation intent and does not mean confirmation, resolution, recording, or deletion of any business failure.
 */
function dismissFailureNotice() {
  // <lang><zh-CN>页面只写自身 visible gate；canonical failure 仍保留在 shell snapshot 中供下一明确 action 前观察。</zh-CN><en>Page writes only its own visible gate; canonical failure remains in shell snapshot for observation before next explicit action.</en></lang>
  isFailureNoticeDismissed.value = true;
}
</script>

<style>
/* <lang><zh-CN>fixture 页面只添加局部容器与详情边界样式；不引入行业 CSS、图片、图标、SVG、字体、外部资源或未审计品牌资产。</zh-CN><en>The fixture page adds only local container and detail-boundary styles; it imports no industry CSS, image, icon, SVG, font, external resource, or unaudited brand asset.</en></lang> */

/* <lang><zh-CN>页面容器使用有限内边距，保留 HIA-uView 组件自身 token 化表面与可见文字职责。</zh-CN><en>Page container uses finite padding and retains HIA-uView components' own tokenized surface and visible-text responsibilities.</en></lang> */
.catalog-fixture {
  padding: 20px;
}

/* <lang><zh-CN>详情区域仅以系统 token 边界区分当前单页投影；它不代表卡片组件、行业布局或跨端断点保证。</zh-CN><en>Detail area uses only system-token boundary to distinguish current single-page projection; it represents no card component, industry layout, or cross-platform breakpoint guarantee.</en></lang> */
.catalog-fixture__detail {
  padding: var(--u-sys-space-md);
  border: 1px solid var(--u-sys-color-border);
  border-radius: var(--u-sys-radius-md);
}
</style>
