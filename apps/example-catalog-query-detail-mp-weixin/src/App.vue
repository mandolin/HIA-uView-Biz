<!--
@lang zh-CN Biz `mp-weixin` compile-only fixture 的最小应用外壳；它不声明生命周期副作用、平台 service、全局 plugin、网络、身份或持久化。
@lang en Minimal application shell for the Biz `mp-weixin` compile-only fixture; it declares no lifecycle side effect, platform service, global plugin, network, identity, or persistence.
-->
<script>
export default {
  // <lang><zh-CN>保留空启动生命周期以满足最小 UniApp 应用形状；不读取系统信息、注册服务、写 storage 或启动异步任务。</zh-CN><en>Retain an empty launch lifecycle to satisfy the minimum UniApp application shape; it reads no system information, registers no service, writes no storage, and starts no asynchronous task.</en></lang>
  onLaunch() {}
};
</script>

<style>
/* <lang><zh-CN>全局 UI 样式仅由应用显式 `uni.scss` 导入；App 不重复注入样式、字体、图标或外部资源。</zh-CN><en>Global UI style is imported explicitly only by application `uni.scss`; App injects no duplicate style, font, icon, or external resource.</en></lang> */
</style>
