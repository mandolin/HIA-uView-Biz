/**
 * <lang><zh-CN>Biz `mp-weixin` fixture 的最小 Vite 配置：使用固定官方 UniApp transform，并且只在显式本地 UI source 已校验后解析 named component import 与样式入口。</zh-CN><en>Minimal Vite configuration for the Biz `mp-weixin` fixture: uses the fixed official UniApp transform and resolves named-component imports and style entry only after explicit local UI source is validated.</en></lang>
 * @lang zh-CN 配置不声明 dev server、proxy、环境加载、自动组件、全局 plugin、网络输入或发布行为。
 * @lang en The configuration declares no dev server, proxy, environment loading, automatic component, global plugin, network input, or release behavior.
 */

import { defineConfig } from 'vite';
import uniPlugin from '@dcloudio/vite-plugin-uni';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveVerifiedHiaUViewUiSource } from '../../scripts/resolve-hia-uview-ui-source.mjs';

/**
 * <lang><zh-CN>当前 fixture 配置文件目录。</zh-CN><en>Directory of the current fixture configuration file.</en></lang>
 * @lang zh-CN 该目录来自模块 URL，避免 Vite 从操作者调用 cwd 推断仓库布局。
 * @lang en This directory comes from module URL, avoiding Vite inference of repository layout from operator invocation cwd.
 */
const fixtureDirectory = dirname(fileURLToPath(import.meta.url));

/**
 * <lang><zh-CN>Biz 仓库根目录。</zh-CN><en>Biz repository root directory.</en></lang>
 * @lang zh-CN 只用于解析已锁定的本仓 Vue runtime，不参与 UI source 的目录发现。
 * @lang en Used only to resolve the locked repository-local Vue runtime and does not participate in UI-source directory discovery.
 */
const repositoryDirectory = resolve(fixtureDirectory, '../..');

/**
 * <lang><zh-CN>通过 metadata 与精确 Git commit 守卫得到的 UI source 输入。</zh-CN><en>UI source input obtained through metadata and exact-Git-commit guard.</en></lang>
 * @lang zh-CN 该调用会在 Vite 解析 alias 前拒绝错误 source；不会将其路径打印或写入公开源码。
 * @lang en This call rejects wrong source before Vite resolves aliases and neither prints nor writes its path into public source.
 */
const verifiedUiSource = resolveVerifiedHiaUViewUiSource();

/**
 * <lang><zh-CN>build runner 创建的输入树内一次性 UI source link。</zh-CN><en>One-use UI-source link inside input tree created by build runner.</en></lang>
 * @lang zh-CN Vite 只解析该 lexical link；它不直接 alias 到工作区外绝对源码路径，避免 DCloud compiler 将外部路径当作 output 名称。
 * @lang en Vite resolves only this lexical link and does not alias directly to an absolute source path outside workspace, avoiding DCloud compiler treating external path as output name.
 */
const uiSourceLinkDirectory = resolve(fixtureDirectory, 'src/hia-uview-ui-source');

/**
 * <lang><zh-CN>一次性 link 中的 UI runtime entry。</zh-CN><en>UI runtime entry inside one-use link.</en></lang>
 * @lang zh-CN 路径在 compiler 输入树下并与 source guard 的外部 root 一一对应；不会成为 Git tracked source。
 * @lang en Path lies under compiler input tree and corresponds one-to-one with source guard's external root; it never becomes Git-tracked source.
 */
const linkedUiRuntimeEntry = resolve(uiSourceLinkDirectory, 'src/index.mjs');

/**
 * <lang><zh-CN>一次性 link 中的显式 UI 样式 entry。</zh-CN><en>Explicit UI-style entry inside one-use link.</en></lang>
 * @lang zh-CN 与 runtime entry 一起存在才允许 build，避免 style alias 回退到 registry 或其他工作区位置。
 * @lang en Build is allowed only when this exists together with runtime entry, preventing style alias fallback to registry or another workspace location.
 */
const linkedUiStyleEntry = resolve(uiSourceLinkDirectory, 'src/style.css');

// <lang><zh-CN>source guard 的路径只用于证明 external input 存在；实际 alias 仅使用 input-tree link，二者缺一不可。</zh-CN><en>Source-guard path proves external input exists only; actual aliases use input-tree link only, and both are required.</en></lang>
if (!existsSync(verifiedUiSource.runtimeEntry) || !existsSync(verifiedUiSource.styleEntry) || !existsSync(linkedUiRuntimeEntry) || !existsSync(linkedUiStyleEntry)) {
  throw new Error('The verified HIA-uView UI source link is unavailable for this controlled fixture build.');
}

/**
 * <lang><zh-CN>Biz 自有精确 Vue runtime entry。</zh-CN><en>Biz-owned exact Vue runtime entry.</en></lang>
 * @lang zh-CN 显式 alias 避免从 UI source 的相邻 `node_modules` 或任何父目录隐式解析 Vue。
 * @lang en The explicit alias avoids implicit Vue resolution from UI source's adjacent `node_modules` or any parent directory.
 */
const vueRuntimeEntry = resolve(repositoryDirectory, 'node_modules/vue/dist/vue.runtime.esm-bundler.js');

/**
 * <lang><zh-CN>为 compile-only fixture 声明唯一官方 transform plugin 与三个受控解析映射。</zh-CN><en>Declares the sole official transform plugin and three controlled resolution mappings for the compile-only fixture.</en></lang>
 * @lang zh-CN UI runtime/style alias 都来自已验证 source 的输入树 link；Vue alias 来自 Biz 自有 lockfile 输入，不能回退到 UI 仓依赖。
 * @lang en Both UI runtime/style aliases come from verified source's input-tree link; Vue alias comes from Biz-owned lockfile input and cannot fall back to UI-repository dependencies.
 */
export default defineConfig({
  // <lang><zh-CN>只使用锁定官方 UniApp plugin；没有额外 transform、复制、下载或 post-build plugin。</zh-CN><en>Use only the locked official UniApp plugin; there is no additional transform, copy, download, or post-build plugin.</en></lang>
  plugins: [uniPlugin.default()],
  // <lang><zh-CN>依解析顺序先匹配 style，再匹配 package runtime，最后将所有 Vue import 固定到 Biz 自有 runtime entry。</zh-CN><en>In resolution order, match style first, package runtime second, and finally pin every Vue import to Biz-owned runtime entry.</en></lang>
  resolve: {
    // <lang><zh-CN>保留 junction 的词法路径，让 DCloud compiler 将 UI module 视为受控输入树内容；不跟随到工作区外 real path。</zh-CN><en>Preserve junction's lexical path so DCloud compiler treats UI module as controlled input-tree content and does not follow to external-workspace real path.</en></lang>
    preserveSymlinks: true,
    alias: [
      { find: '@hia-uview/ui/style.css', replacement: linkedUiStyleEntry },
      { find: '@hia-uview/ui', replacement: linkedUiRuntimeEntry },
      { find: 'vue', replacement: vueRuntimeEntry }
    ]
  }
});
