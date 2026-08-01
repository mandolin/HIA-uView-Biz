/**
 * <lang><zh-CN>代表性小程序的静态 solution context：登记中性 capability package，并创建不含个人主体的匿名 mock session。</zh-CN><en>Static solution context for the representative mini-program: registers neutral capability packages and creates an anonymous mock session containing no personal subject.</en></lang>
 * @lang zh-CN 本模块只构造仓内确定性 plain data；不读取 profile 文件、环境、网络、storage、token、身份或动态代码。
 * @lang en This module constructs only checked-in deterministic plain data; it reads no profile file, environment, network, storage, token, identity, or dynamic code.
 */

// <lang><zh-CN>通用 runtime 只解析显式 solution/session 与静态登记表，不发现、加载或执行 package。</zh-CN><en>The generic runtime resolves only explicit solution/session data and a static registry; it discovers, loads, and executes no package.</en></lang>
import {
  createSolutionProfileRuntime
} from '@hia-uview/biz-solution-profile-runtime';

/**
 * <lang><zh-CN>创建代表性 app 的固定 capability package 登记表。</zh-CN><en>Creates the fixed capability-package registry for the representative app.</en></lang>
 *
 * @returns {object[]} <lang><zh-CN>按依赖次序可解析的中性 package 描述符副本。</zh-CN><en>Neutral package-descriptor copies resolvable in dependency order.</en></lang>
 * @lang zh-CN 描述符不是 npm manifest、远端目录、import 指令或行业 profile；其 ID 只连接当前已编译的中性模块边界。
 * @lang en Descriptors are not npm manifests, remote catalogs, import instructions, or industry profiles; their IDs connect only current compiled neutral-module boundaries.
 */
function createRepresentativeCapabilityPackages() {
  // <lang><zh-CN>reference-data 是 catalog read 的受限静态依赖，先登记使 resolver 输出依赖优先的固定顺序。</zh-CN><en>Reference data is the bounded static dependency of catalog read and is registered first so resolver output has a fixed dependency-first order.</en></lang>
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
 * <lang><zh-CN>创建代表性 app 所用的受限 solution profile resolver。</zh-CN><en>Creates the bounded solution-profile resolver used by the representative app.</en></lang>
 *
 * @returns {object} <lang><zh-CN>只接受当前 channel profile 与静态登记表的纯 resolver。</zh-CN><en>Pure resolver accepting only the current channel profile and static registry.</en></lang>
 * @lang zh-CN resolver 只建立 capability availability；它不执行真实认证、会话持久化、租户/角色推断、HTTP 或 provider 创建。
 * @lang en The resolver establishes only capability availability; it performs no real authentication, session persistence, tenant/role inference, HTTP, or provider creation.
 */
export function createRepresentativeSolutionProfileRuntime() {
  // <lang><zh-CN>channel allowlist 固定为当前 app profile，阻止其他 app 的 solution 被静默采用。</zh-CN><en>Fix the channel allowlist to the current app profile, preventing a solution for another app from being silently adopted.</en></lang>
  return createSolutionProfileRuntime({
    allowedChannelProfileIds: ['example.catalog-query-detail.representative-mp-weixin'],
    capabilityPackages: createRepresentativeCapabilityPackages()
  });
}

/**
 * <lang><zh-CN>创建仅用于本地 fixture availability 的匿名 mock session。</zh-CN><en>Creates an anonymous mock session used only for local-fixture availability.</en></lang>
 *
 * @returns {object} <lang><zh-CN>调用方独立拥有的最小 session plain data。</zh-CN><en>Minimum session plain data independently owned by the caller.</en></lang>
 * @lang zh-CN grant 不等同真实授权或用户身份；不包含 subject、token、cookie、storage key、过期时间或后端凭据。
 * @lang en Grants are not real authorization or user identity; this contains no subject, token, cookie, storage key, expiry, or backend credential.
 */
export function createAnonymousMockSession() {
  // <lang><zh-CN>每次返回新数组，避免任何调用方改写影响后续 runtime 创建。</zh-CN><en>Return a new array each time so a caller change cannot affect subsequent runtime creation.</en></lang>
  return {
    sessionVersion: '1.0',
    kind: 'anonymous-mock-session',
    grantIds: ['reference-data.read', 'catalog.read']
  };
}
