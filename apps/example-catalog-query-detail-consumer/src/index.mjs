/**
 * <lang><zh-CN>隔离 checkout-first consumer fixture：显式消费模板/集成 contract，并拥有本地 provider-port mock。</zh-CN><en>Isolated checkout-first consumer fixture: explicitly consumes template/integration contracts and owns local provider-port mocks.</en></lang>
 * @lang zh-CN 本模块不读取文件、环境、网络、credential 或 package registry；manifest/profile 必须由调用方显式传入。
 * @lang en This module reads no file, environment, network, credential, or package registry; the caller must supply manifest/profile explicitly.
 */

// <lang><zh-CN>application integration 只负责模板、slot、adoption 与 shell 的规范化组合。</zh-CN><en>Application integration owns normalized composition of template, slots, adoption, and shell.</en></lang>
import { createApplicationIntegrationRuntime } from '@hia-uview/biz-app-integration';

// <lang><zh-CN>模板 factory 提供已登记的中性 catalog candidate；consumer 不发现或加载其他实现。</zh-CN><en>The template factory provides the registered neutral catalog candidate; the consumer discovers or loads no other implementation.</en></lang>
import { createExampleCatalogTemplateCandidate } from '@hia-uview/biz-example-catalog-query-detail-template';

// <lang><zh-CN>provider host 固定 P45 的 consumer-owned provider boundary。</zh-CN><en>The provider host fixes the P45 consumer-owned provider boundary.</en></lang>
import {
  PROVIDER_PORT_CONTRACT_VERSION,
  createProviderPortHost
} from '@hia-uview/biz-provider-port-runtime';

/**
 * <lang><zh-CN>consumer manifest 的固定契约版本。</zh-CN><en>Fixed contract version of the consumer manifest.</en></lang>
 * @lang zh-CN 该版本只表示 manifest shape，不代表 npm 或业务发布版本。
 * @lang en This version represents only the manifest shape and not an npm or business release version.
 */
export const CONSUMER_MANIFEST_VERSION = '1.0';

/**
 * <lang><zh-CN>consumer manifest 必须具备的精确字段集合。</zh-CN><en>Exact fields required by a consumer manifest.</en></lang>
 * @lang zh-CN 精确字段阻止 URL、token、script、path 或 backend 配置借 manifest 进入 runtime。
 * @lang en Exact fields prevent URL, token, script, path, or backend configuration from entering the runtime through the manifest.
 */
const MANIFEST_KEYS = Object.freeze([
  'consumerManifestVersion',
  'kind',
  'id',
  'owner',
  'templateId',
  'profileId',
  'providerContractVersion',
  'providerPortIds',
  'execution'
]);

/**
 * <lang><zh-CN>consumer profile 必须具备的精确字段集合。</zh-CN><en>Exact fields required by a consumer profile.</en></lang>
 * @lang zh-CN profile 只声明 source、分页与已编译 block projection，不承载可执行配置。
 * @lang en The profile declares only source, paging, and compiled-block projection and carries no executable configuration.
 */
const PROFILE_KEYS = Object.freeze(['profileVersion', 'id', 'sourceMode', 'query', 'presentation']);

/**
 * <lang><zh-CN>四个 consumer provider port 的声明。</zh-CN><en>Declarations for the four consumer provider ports.</en></lang>
 * @lang zh-CN 声明不含 endpoint、credential reference、token、URL 或异步生命周期字段。
 * @lang en Declarations contain no endpoint, credential reference, token, URL, or asynchronous-lifecycle field.
 */
export const CONSUMER_PROVIDER_DECLARATIONS = Object.freeze([
  {
    providerContractVersion: PROVIDER_PORT_CONTRACT_VERSION,
    providerId: 'example.consumer.session',
    portId: 'session-state',
    owner: 'example-consumer',
    kind: 'session',
    contract: { id: 'catalog-query-detail.session', version: '1.0' },
    execution: 'injected-sync',
    credential: { mode: 'none' },
    optional: false,
    rollback: 'not-applicable'
  },
  {
    providerContractVersion: PROVIDER_PORT_CONTRACT_VERSION,
    providerId: 'example.consumer.storage',
    portId: 'local-preference',
    owner: 'example-consumer',
    kind: 'storage',
    contract: { id: 'example.consumer.storage', version: '1.0' },
    execution: 'injected-sync',
    credential: { mode: 'none' },
    optional: true,
    rollback: 'not-applicable'
  },
  {
    providerContractVersion: PROVIDER_PORT_CONTRACT_VERSION,
    providerId: 'example.consumer.read',
    portId: 'catalog-query',
    owner: 'example-consumer',
    kind: 'read',
    contract: { id: 'catalog-query-detail.query', version: '1.0' },
    execution: 'injected-sync',
    credential: { mode: 'none' },
    optional: false,
    rollback: 'not-applicable'
  },
  {
    providerContractVersion: PROVIDER_PORT_CONTRACT_VERSION,
    providerId: 'example.consumer.write',
    portId: 'entry-update',
    owner: 'example-consumer',
    kind: 'write',
    contract: { id: 'example.consumer.entry-update', version: '1.0' },
    execution: 'injected-sync',
    credential: { mode: 'none' },
    optional: false,
    rollback: 'local-no-partial-mutation'
  }
]);

/**
 * <lang><zh-CN>判断值是否为无行为的普通对象。</zh-CN><en>Determines whether a value is an ordinary object without behavior.</en></lang>
 * @param {unknown} value <lang><zh-CN>待判断值。</zh-CN><en>Value to inspect.</en></param>
 * @returns {boolean} <lang><zh-CN>是否为 plain object。</zh-CN><en>Whether the value is a plain object.</en></lang>
 * @lang zh-CN manifest/profile 只接受普通对象，避免平台对象或 class instance 越过 consumer contract。
 * @lang en Manifest/profile accept ordinary objects only, preventing platform objects or class instances from crossing the consumer contract.
 */
function isPlainObject(value) {
  // <lang><zh-CN>数组、null 与 primitive 没有稳定的命名字段语义。</zh-CN><en>Arrays, null, and primitives have no stable named-field semantics.</en></lang>
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  // <lang><zh-CN>只接受字面量或无 prototype 对象，不接纳带行为的实例。</zh-CN><en>Accept only literal or prototype-free objects and reject behavioral instances.</en></lang>
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * <lang><zh-CN>判断字符串是否为稳定的 manifest/profile 标识。</zh-CN><en>Determines whether a string is a stable manifest/profile identifier.</en></lang>
 * @param {unknown} value <lang><zh-CN>候选标识。</zh-CN><en>Candidate identifier.</en></param>
 * @returns {boolean} <lang><zh-CN>是否通过有限字符规则。</zh-CN><en>Whether bounded character rules pass.</en></lang>
 * @lang zh-CN 标识不接受 URL、空白、路径或任意长输入。
 * @lang en Identifiers accept no URL, whitespace, path, or arbitrary-length input.
 */
function isIdentifier(value) {
  // <lang><zh-CN>短小 ASCII ID 便于 schema、诊断与 snapshot 稳定比较。</zh-CN><en>Short ASCII IDs keep schema, diagnostics, and snapshots stable to compare.</en></lang>
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,95}$/u.test(value);
}

/**
 * <lang><zh-CN>创建不回显输入的 consumer diagnostic。</zh-CN><en>Creates a consumer diagnostic that echoes no input.</en></lang>
 * @param {string} code <lang><zh-CN>稳定诊断 code。</zh-CN><en>Stable diagnostic code.</en></param>
 * @param {string} zhHans <lang><zh-CN>中文固定消息。</zh-CN><en>Fixed Chinese message.</en></param>
 * @param {string} en <lang><zh-CN>英文固定消息。</zh-CN><en>Fixed English message.</en></param>
 * @returns {object} <lang><zh-CN>双语诊断对象。</zh-CN><en>Bilingual diagnostic object.</en></lang>
 * @lang zh-CN 消息只来自 runtime 自有文本，不包含 manifest、profile 或 provider 原文。
 * @lang en Messages contain runtime-owned text only and no manifest, profile, or provider source text.
 */
function createDiagnostic(code, zhHans, en) {
  // <lang><zh-CN>每次创建独立对象，避免调用方改变后影响后续结果。</zh-CN><en>Create an independent object each time so caller mutation cannot affect later results.</en></lang>
  return { code, message: { 'zh-Hans': zhHans, en } };
}

/**
 * <lang><zh-CN>校验 checkout-first consumer manifest。</zh-CN><en>Validates a checkout-first consumer manifest.</en></lang>
 * @param {unknown} manifest <lang><zh-CN>调用方显式提供的 manifest。</zh-CN><en>Manifest explicitly supplied by the caller.</en></param>
 * @returns {{ok: boolean, diagnostics: object[]}} <lang><zh-CN>结构化校验结果。</zh-CN><en>Structured validation result.</en></lang>
 * @lang zh-CN 校验不读取文件、环境、registry 或 provider implementation。
 * @lang en Validation reads no file, environment, registry, or provider implementation.
 */
export function validateConsumerManifest(manifest) {
  // <lang><zh-CN>容器不合法时直接返回固定诊断，不继续读取任意字段。</zh-CN><en>Return a fixed diagnostic immediately for an invalid container and read no further fields.</en></lang>
  if (!isPlainObject(manifest)) {
    return { ok: false, diagnostics: [createDiagnostic('consumer.manifest.invalid', 'Consumer manifest 必须是普通对象。', 'The consumer manifest must be an ordinary object.')] };
  }

  // <lang><zh-CN>精确字段集阻止隐藏连接、脚本或平台参数进入 checkout contract。</zh-CN><en>Exact fields prevent hidden connection, script, or platform parameters from entering the checkout contract.</en></lang>
  const hasExactKeys = Object.keys(manifest).length === MANIFEST_KEYS.length
    && MANIFEST_KEYS.every((key) => Object.hasOwn(manifest, key));
  if (!hasExactKeys) {
    return { ok: false, diagnostics: [createDiagnostic('consumer.manifest.fields.invalid', 'Consumer manifest 字段不符合固定契约。', 'Consumer manifest fields do not match the fixed contract.')] };
  }

  // <lang><zh-CN>固定 metadata 必须与当前 consumer fixture 精确对应，不执行 alias 或自动迁移。</zh-CN><en>Fixed metadata must correspond exactly to this consumer fixture; no aliasing or automatic migration is performed.</en></lang>
  const validMetadata = manifest.consumerManifestVersion === CONSUMER_MANIFEST_VERSION
    && manifest.kind === 'checkout-first-consumer'
    && manifest.id === 'example.catalog-query-detail.consumer'
    && manifest.owner === 'example-consumer'
    && manifest.templateId === 'example.catalog-query-detail'
    && manifest.profileId === 'example.catalog-query-detail.consumer'
    && manifest.providerContractVersion === PROVIDER_PORT_CONTRACT_VERSION
    && manifest.execution === 'explicit-injected-sync'
    && Array.isArray(manifest.providerPortIds)
    && manifest.providerPortIds.length === 4
    && new Set(manifest.providerPortIds).size === 4
    && manifest.providerPortIds.every(isIdentifier);
  return validMetadata
    ? { ok: true, diagnostics: [] }
    : { ok: false, diagnostics: [createDiagnostic('consumer.manifest.metadata.invalid', 'Consumer manifest metadata 不受当前 fixture 支持。', 'Consumer manifest metadata is not supported by this fixture.')] };
}

/**
 * <lang><zh-CN>校验 consumer profile 的固定 app-facing shape。</zh-CN><en>Validates the fixed app-facing shape of the consumer profile.</en></lang>
 * @param {unknown} profile <lang><zh-CN>调用方显式提供的 profile。</zh-CN><en>Profile explicitly supplied by the caller.</en></param>
 * @returns {{ok: boolean, diagnostics: object[]}} <lang><zh-CN>结构化校验结果。</zh-CN><en>Structured validation result.</en></lang>
 * @lang zh-CN 更深层的 template/profile 对应关系交给 application-template integration runtime 校验。
 * @lang en Deeper template/profile correspondence is validated by the application-template integration runtime.
 */
export function validateConsumerProfile(profile) {
  // <lang><zh-CN>profile 根必须是固定字段的普通对象，避免可执行配置混入。</zh-CN><en>The profile root must be an ordinary object with fixed fields, preventing executable configuration from entering.</en></lang>
  const hasExactKeys = isPlainObject(profile)
    && Object.keys(profile).length === PROFILE_KEYS.length
    && PROFILE_KEYS.every((key) => Object.hasOwn(profile, key));
  if (!hasExactKeys) {
    return { ok: false, diagnostics: [createDiagnostic('consumer.profile.fields.invalid', 'Consumer profile 字段不符合固定契约。', 'Consumer profile fields do not match the fixed contract.')] };
  }

  // <lang><zh-CN>只接受当前 consumer ID、已登记 source 与最小 query/presentation 容器。</zh-CN><en>Accept only the current consumer ID, registered source, and minimum query/presentation containers.</en></lang>
  const validMetadata = profile.profileVersion === CONSUMER_MANIFEST_VERSION
    && profile.id === 'example.catalog-query-detail.consumer'
    && (profile.sourceMode === 'mock' || profile.sourceMode === 'wire-fixture')
    && isPlainObject(profile.query)
    && isPlainObject(profile.presentation);
  return validMetadata
    ? { ok: true, diagnostics: [] }
    : { ok: false, diagnostics: [createDiagnostic('consumer.profile.metadata.invalid', 'Consumer profile metadata 不受当前 fixture 支持。', 'Consumer profile metadata is not supported by this fixture.')] };
}

/**
 * <lang><zh-CN>创建 consumer-owned provider map。</zh-CN><en>Creates the consumer-owned provider map.</en></lang>
 * @returns {object} <lang><zh-CN>按 portId 索引的同步 mock provider。</zh-CN><en>Synchronous mock providers indexed by portId.</en></lang>
 * @lang zh-CN provider 只产生 canonical/plain outcomes，不构造 HTTP envelope、token 或 backend DTO。
 * @lang en Providers produce canonical/plain outcomes only and construct no HTTP envelope, token, or backend DTO.
 */
function createConsumerProviders() {
  // <lang><zh-CN>storage 状态只存在当前 fixture closure，模拟可选内存 provider。</zh-CN><en>Storage state exists only in this fixture closure, simulating an optional memory provider.</en></lang>
  const storage = new Map();

  return {
    'session-state': {
      contract: { id: 'catalog-query-detail.session', version: '1.0' },
      invoke: (input) => {
        // <lang><zh-CN>session mock 不读取身份，且只接受 host 投影的 null input。</zh-CN><en>The session mock reads no identity and accepts only the null input projected by the host.</en></lang>
        if (input !== null) {
          return { kind: 'failure', code: 'request-invalid', retryable: false };
        }
        return { kind: 'success', value: { contractVersion: '1.0', mode: 'mock', subject: null, capabilities: [] } };
      }
    },
    'local-preference': {
      contract: { id: 'example.consumer.storage', version: '1.0' },
      invoke: (input) => {
        // <lang><zh-CN>storage 只操作当前 closure 的 plain-data key/value，不接触平台 storage。</zh-CN><en>Storage operates only on plain-data key/value inside this closure and touches no platform storage.</en></lang>
        if (input.action === 'set') {
          storage.set(input.key, input.value);
          return { kind: 'success', value: { stored: true } };
        }
        return { kind: 'success', value: { value: storage.get(input.key) ?? null } };
      }
    },
    'catalog-query': {
      contract: { id: 'catalog-query-detail.query', version: '1.0' },
      invoke: (input) => {
        // <lang><zh-CN>read mock 只返回中性 canonical page，分页来自调用方显式输入。</zh-CN><en>The read mock returns only a neutral canonical page, with paging supplied explicitly by the caller.</en></lang>
        return {
          kind: 'success',
          value: {
            contractVersion: '1.0',
            kind: 'page',
            page: input.page,
            pageSize: input.pageSize,
            total: 1,
            hasNext: false,
            entries: [{ id: 'entry-001', label: { 'zh-Hans': '示例', en: 'Example' } }]
          }
        };
      }
    },
    'entry-update': {
      contract: { id: 'example.consumer.entry-update', version: '1.0' },
      invoke: (input) => {
        // <lang><zh-CN>写 mock 只演示 local rollback contract，不产生后端或持久化副作用。</zh-CN><en>The write mock demonstrates only the local rollback contract and creates no backend or persistent side effect.</en></lang>
        if (input.mode === 'cancel') {
          return { kind: 'failure', code: 'write-cancelled', retryable: true, rollback: 'completed' };
        }
        if (input.mode === 'unknown-rollback') {
          return { kind: 'failure', code: 'write-failed', retryable: false, rollback: 'unknown' };
        }
        return { kind: 'success', value: { updated: true, entryId: input.entryId } };
      }
    }
  };
}

/**
 * <lang><zh-CN>将 profile projection 转为模板所需的显式 block 数组。</zh-CN><en>Converts profile projection into the explicit block arrays required by the template.</en></lang>
 * @param {object} profile <lang><zh-CN>已通过根级校验的 profile。</zh-CN><en>Profile that passed root-level validation.</en></param>
 * @returns {object} <lang><zh-CN>模板 candidate 的受限 plain options。</zh-CN><en>Bounded plain options for the template candidate.</en></lang>
 * @lang zh-CN 不补默认区块或分页值；深层 shape 由 template runtime 再次校验。
 * @lang en Do not fill default blocks or paging; the template runtime validates deeper shape again.
 */
function createTemplateOptions(profile) {
  // <lang><zh-CN>sourceMode 是 profile 的显式选择，fixture case 只是已登记本地实现的静态对应。</zh-CN><en>Source mode is explicitly selected by the profile; fixture case is only a static mapping to a registered local implementation.</en></lang>
  const fixtureCase = profile.sourceMode === 'wire-fixture' ? 'success' : 'first-page';

  // <lang><zh-CN>只把已编译 block metadata 传给模板，绝不把其值解释为组件或脚本。</zh-CN><en>Pass compiled-block metadata to the template only; never interpret values as components or scripts.</en></lang>
  return {
    sourceMode: profile.sourceMode,
    fixtureCase,
    pageSize: profile.query.pageSize,
    enabledBlocks: profile.presentation.enabledBlocks,
    blockOrder: profile.presentation.blockOrder
  };
}

/**
 * <lang><zh-CN>创建 checkout-first consumer fixture。</zh-CN><en>Creates the checkout-first consumer fixture.</en></lang>
 * @param {{manifest: object, profile: object}} input <lang><zh-CN>调用方显式提供的 manifest/profile。</zh-CN><en>Manifest/profile explicitly supplied by the caller.</en></param>
 * @returns {object} <lang><zh-CN>成功时返回 shell、provider host 与脱敏 snapshot；失败时只返回 diagnostics。</zh-CN><en>Returns shell, provider host, and redacted snapshots on success, or diagnostics only on failure.</en></lang>
 * @lang zh-CN 初始化不读取文件、不发现 package、不启动生命周期异步任务；所有 implementation/provider 都由本函数显式构造。
 * @lang en Initialization reads no file, discovers no package, and starts no asynchronous lifecycle task; every implementation/provider is constructed explicitly here.
 */
export function createCheckoutFirstConsumerFixture({ manifest, profile }) {
  // <lang><zh-CN>先验证两个调用方输入，任何 runtime 或 provider 创建都发生在校验之后。</zh-CN><en>Validate both caller inputs before creating any runtime or provider.</en></lang>
  const manifestValidation = validateConsumerManifest(manifest);
  const profileValidation = validateConsumerProfile(profile);
  if (!manifestValidation.ok || !profileValidation.ok) {
    return {
      ok: false,
      diagnostics: [...manifestValidation.diagnostics, ...profileValidation.diagnostics]
    };
  }

  // <lang><zh-CN>模板 candidate 只使用 profile 已声明的 source、分页与 block metadata，不存在 fallback。</zh-CN><en>The template candidate uses only source, paging, and block metadata declared by the profile, with no fallback.</en></lang>
  let candidate;
  try {
    candidate = createExampleCatalogTemplateCandidate(createTemplateOptions(profile));
  } catch {
    // <lang><zh-CN>模板异常归并为固定 diagnostics，不回显 profile、provider 或内部 exception。</zh-CN><en>Collapse template exceptions into a fixed diagnostic without echoing profile, provider, or internal exception.</en></lang>
    return {
      ok: false,
      diagnostics: [createDiagnostic('consumer.template.invalid', 'Consumer template candidate 无法通过固定校验。', 'The consumer template candidate failed fixed validation.')]
    };
  }

  // <lang><zh-CN>集成 runtime 在 provider invocation 前校验 template、slot 与 adoption 对应关系。</zh-CN><en>The integration runtime validates template, slot, and adoption correspondence before provider invocation.</en></lang>
  const integration = createApplicationIntegrationRuntime(candidate);
  if (!integration.ok) {
    return { ok: false, diagnostics: integration.diagnostics };
  }

  // <lang><zh-CN>consumer 显式创建并拥有 P45 provider host；host 初始化不读取外部状态。</zh-CN><en>The consumer explicitly creates and owns the P45 provider host; host initialization reads no external state.</en></lang>
  const providerInitialization = createProviderPortHost({
    declarations: CONSUMER_PROVIDER_DECLARATIONS,
    providers: createConsumerProviders()
  });
  if (!providerInitialization.ok) {
    return { ok: false, diagnostics: providerInitialization.diagnostics };
  }

  // <lang><zh-CN>只公开调用方后续验收所需的 shell、provider invoke 与脱敏 snapshot，不暴露 candidate/provider closure。</zh-CN><en>Expose only shell, provider invocation, and redacted snapshots needed for caller acceptance; expose no candidate/provider closure.</en></lang>
  return Object.freeze({
    ok: true,
    diagnostics: [],
    shell: integration.shell,
    invokeProvider: providerInitialization.host.invoke,
    getProviderObservation: providerInitialization.host.getObservation,
    getManifestSnapshot: () => ({
      id: manifest.id,
      templateId: manifest.templateId,
      profileId: manifest.profileId,
      providerContractVersion: manifest.providerContractVersion,
      providerPortIds: [...manifest.providerPortIds]
    }),
    getProfileSnapshot: () => ({
      id: profile.id,
      sourceMode: profile.sourceMode,
      query: { ...profile.query },
      presentation: {
        enabledBlocks: [...profile.presentation.enabledBlocks],
        blockOrder: [...profile.presentation.blockOrder]
      }
    }),
    getAdoptionSnapshot: integration.getAdoptionSnapshot,
    getTemplateSnapshot: integration.getTemplateSnapshot
  });
}
