/**
 * <lang><zh-CN>Biz `mp-weixin` fixture 的最小 UniApp Vue 3 entry；创建当前 App 实例，不注册 HIA-uView global plugin、router、store、身份、网络或平台 service。</zh-CN><en>Minimal UniApp Vue 3 entry for the Biz `mp-weixin` fixture; creates the current App instance and registers no HIA-uView global plugin, router, store, identity, network, or platform service.</en></lang>
 * @lang zh-CN 组件由页面 `script setup` 显式命名导入，样式由应用 `uni.scss` 显式导入。
 * @lang en Components are explicitly named-imported by page `script setup`, and styles are explicitly imported by application `uni.scss`.
 */

import { createSSRApp } from 'vue';
import FixtureApp from './App.vue';

/**
 * <lang><zh-CN>创建只包含当前 fixture App 的 UniApp 应用对象。</zh-CN><en>Creates the UniApp application object containing only the current fixture App.</en></lang>
 * @returns {{app: ReturnType<typeof createSSRApp>}} <lang><zh-CN>官方 UniApp Vue 3 entry 所需的 app 容器。</zh-CN><en>App container required by the official UniApp Vue 3 entry.</en></lang>
 * @lang zh-CN 不在这里执行 `app.use`、全局 component 注册或副作用初始化；页面拥有其显式 UI composition。
 * @lang en Performs no `app.use`, global component registration, or side-effect initialization here; the page owns its explicit UI composition.
 */
export function createApp() {
  // <lang><zh-CN>创建 SSR-compatible UniApp app；这个动作不启动服务器、开发者工具、设备连接或数据访问。</zh-CN><en>Create the SSR-compatible UniApp app; this action starts no server, DevTools, device connection, or data access.</en></lang>
  const app = createSSRApp(FixtureApp);

  // <lang><zh-CN>按 UniApp Vue 3 约定仅返回 app，避免向全局注入任何额外运行时表面。</zh-CN><en>Return only app according to UniApp Vue 3 convention, avoiding injection of any additional runtime surface globally.</en></lang>
  return { app };
}
