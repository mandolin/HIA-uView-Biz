/**
 * <lang><zh-CN>校验受控 Biz `mp-weixin` fixture 的最小生成文件、固定项目配置、静态 solution profile 与受限 block-order 投影标记；它只读取已生成的受忽略产物，不启动 compiler、DevTools、模拟器、设备、网络服务或发布。</zh-CN><en>Validates minimum generated files, fixed project configuration, static solution-profile, and bounded block-order projection markers of controlled Biz `mp-weixin` fixture; it only reads generated ignored output and starts no compiler, DevTools, simulator, device, network service, or release.</en></lang>
 * @lang zh-CN 调用方应先运行受控 build；本脚本不能把文件存在性升级为真实导入、运行、无障碍、跨端或发布证据。
 * @lang en Caller should run controlled build first; this script cannot elevate file existence to real import, runtime, accessibility, cross-platform, or release evidence.
 */

import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * <lang><zh-CN>当前验证脚本目录。</zh-CN><en>Directory of the current verification script.</en></lang>
 * @lang zh-CN 由模块 URL 推导，避免调用方 cwd 改变受检 output 的范围。
 * @lang en Derived from module URL, avoiding caller cwd changing scope of inspected output.
 */
const scriptsDirectory = dirname(fileURLToPath(import.meta.url));

/**
 * <lang><zh-CN>Biz 仓库根目录。</zh-CN><en>Biz repository root directory.</en></lang>
 * @lang zh-CN 只用于生成固定 fixture output 路径；不搜索用户目录、外部仓或临时目录。
 * @lang en Used only to form fixed fixture-output path and searches no user directory, external repository, or temporary directory.
 */
const repositoryDirectory = resolve(scriptsDirectory, '..');

/**
 * <lang><zh-CN>受忽略的微信小程序 compiler output 目录。</zh-CN><en>Ignored WeChat Mini Program compiler-output directory.</en></lang>
 * @lang zh-CN 该目录由受控 build runner 固定生成；验证不接受覆盖路径或扫描其他输出。
 * @lang en This directory is fixed by controlled build runner; verification accepts no override path and scans no other output.
 */
const outputDirectory = resolve(repositoryDirectory, 'apps/example-catalog-query-detail-mp-weixin/dist/build/mp-weixin');

/**
 * <lang><zh-CN>读取生成 output 内一个明确 JSON 文件。</zh-CN><en>Reads one explicit JSON file inside generated output.</en></lang>
 * @param {string} relativePath <lang><zh-CN>相对 output 根的固定 JSON 路径。</zh-CN><en>Fixed JSON path relative to output root.</en></lang>
 * @returns {Promise<Record<string, unknown>>} <lang><zh-CN>已解析的生成配置。</zh-CN><en>Parsed generated configuration.</en></lang>
 * @lang zh-CN helper 只读取两个白名单配置文件；不执行生成 JavaScript、不加载页面、也不调用微信工具。
 * @lang en Helper reads only two allowlisted configuration files; it executes no generated JavaScript, loads no page, and calls no WeChat tool.
 */
async function readGeneratedJson(relativePath) {
  // <lang><zh-CN>将固定相对路径收敛到唯一 output root，避免调用方让检查器读取仓外 JSON。</zh-CN><en>Constrain fixed relative path to sole output root, preventing callers from making checker read JSON outside repository.</en></lang>
  const filePath = resolve(outputDirectory, relativePath);

  // <lang><zh-CN>以 UTF-8 读取生成配置文本；不保留或输出其可能包含的本地编译细节。</zh-CN><en>Read generated configuration text as UTF-8 and retain or emit no possible local compilation detail.</en></lang>
  const jsonText = await readFile(filePath, 'utf8');

  // <lang><zh-CN>解析固定配置，解析错误直接使验证失败而不尝试容错或修改 output。</zh-CN><en>Parse fixed configuration; parse error fails validation directly and attempts no recovery or output mutation.</en></lang>
  return JSON.parse(jsonText);
}

/**
 * <lang><zh-CN>读取生成 output 内一个明确的纯文本文件，不执行其内容。</zh-CN><en>Reads one explicit plain-text file inside generated output without executing its content.</en></lang>
 * @param {string} relativePath <lang><zh-CN>相对 output 根的白名单文本路径。</zh-CN><en>Allowlisted text path relative to output root.</en></lang>
 * @returns {Promise<string>} <lang><zh-CN>仅供静态 marker 断言的 UTF-8 文本。</zh-CN><en>UTF-8 text used only for static-marker assertions.</en></lang>
 * @lang zh-CN helper 不解析、import、eval 或运行生成脚本；它只读取固定首页 JS，防止检查器接触任意 output 路径。
 * @lang en The helper neither parses, imports, evaluates, nor runs generated script; it reads only fixed home-page JS, preventing checker access to arbitrary output paths.
 */
async function readGeneratedText(relativePath) {
  // <lang><zh-CN>固定相对路径与唯一 output root 组合，不能由命令行或环境改写。</zh-CN><en>Combine a fixed relative path with the sole output root; neither command line nor environment can rewrite it.</en></lang>
  const filePath = resolve(outputDirectory, relativePath);

  // <lang><zh-CN>只以 UTF-8 返回文字供正则断言；内容不会进入日志、诊断或任何运行时执行路径。</zh-CN><en>Return text only as UTF-8 for regular-expression assertions; content enters no log, diagnostic, or runtime-execution path.</en></lang>
  return readFile(filePath, 'utf8');
}

/**
 * <lang><zh-CN>验证微信小程序可导入前提所需的最小静态 output 文件与配置。</zh-CN><en>Validates minimum static output files and configuration required as prerequisites for WeChat Mini Program import.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>全部文件与断言通过时 resolve。</zh-CN><en>Resolves when every file and assertion passes.</en></lang>
 * @lang zh-CN 检查不打开开发者工具；“可导入前提”只表示生成项目结构，而非实际 DevTools 导入或运行结论。
 * @lang en Check does not open DevTools; “import prerequisite” means only generated project structure, not actual DevTools import or runtime conclusion.
 */
async function verifyMpWeixinFixtureOutput() {
  // <lang><zh-CN>先读取三个编译器直接生成的 JSON 配置及唯一首页脚本的文本；后续断言不依赖命令行输出或本机语言环境。</zh-CN><en>Read three compiler-generated JSON configurations and text of the sole home-page script first; later assertions do not depend on command-line output or local language environment.</en></lang>
  const [appConfiguration, projectConfiguration, pageConfiguration, pageScript] = await Promise.all([
    readGeneratedJson('app.json'),
    readGeneratedJson('project.config.json'),
    readGeneratedJson('pages/index/index.json'),
    readGeneratedText('pages/index/index.js')
  ]);

  // <lang><zh-CN>页面数组必须只声明 fixture 的唯一首页，防止 compiler 输出悄然扩展到未审阅页面路径。</zh-CN><en>Pages array must declare only fixture's sole home page, preventing compiler output from silently expanding to an unreviewed page path.</en></lang>
  assert.deepEqual(appConfiguration.pages, ['pages/index/index'], 'Generated app.json must declare only the controlled fixture home page.');

  // <lang><zh-CN>项目配置必须保持小程序类型和无真实身份绑定的 tourist AppID。</zh-CN><en>Project configuration must retain Mini Program type and tourist AppID without real identity binding.</en></lang>
  assert.equal(projectConfiguration.compileType, 'miniprogram', 'Generated project config must identify Mini Program compile type.');
  assert.equal(projectConfiguration.appid, 'touristappid', 'Generated project config must retain fixture-only tourist AppID.');

  // <lang><zh-CN>代表性页面必须把全部九个显式 UI SFC 编译为微信自定义组件；空 registry 会让模板标签被静默保留却渲染为空白。</zh-CN><en>The representative page must compile all nine explicit UI SFCs as WeChat custom components; an empty registry silently retains template tags while rendering a blank page.</en></lang>
  const expectedComponentNames = [
    'u-button',
    'u-cell',
    'u-empty',
    'u-field',
    'u-input',
    'u-nav-bar',
    'u-notice',
    'u-stack',
    'u-validation-message'
  ];

  // <lang><zh-CN>只比较稳定组件名集合；生成路径另行限制为输入树内相对路径，避免锁定编译器内部排序。</zh-CN><en>Compare only the stable component-name set; generated paths are separately constrained to input-tree-relative paths, avoiding dependence on compiler-internal ordering.</en></lang>
  assert.deepEqual(
    Object.keys(pageConfiguration.usingComponents ?? {}).sort(),
    expectedComponentNames,
    'Generated page config must register every explicit HIA-uView UI component used by the representative slice.'
  );

  // <lang><zh-CN>逐个检查组件路径来自一次性 UI source link 的相对生成树，不接受绝对路径、registry 回退或其他包位置。</zh-CN><en>Check every component path comes from the relative generated tree of the one-use UI-source link; accept no absolute path, registry fallback, or other package location.</en></lang>
  for (const componentName of expectedComponentNames) {
    // <lang><zh-CN>读取编译器为当前固定组件名写出的路径；上方集合断言保证该值必须存在。</zh-CN><en>Read the path emitted by compiler for the current fixed component name; the preceding set assertion guarantees this value exists.</en></lang>
    const generatedComponentPath = pageConfiguration.usingComponents[componentName];

    // <lang><zh-CN>相对路径必须落入生成 output 内的受控 UI source 子树；精确文件后缀由官方 compiler 决定。</zh-CN><en>The relative path must land in the controlled UI-source subtree of generated output; the official compiler decides the exact file suffix.</en></lang>
    assert.match(
      generatedComponentPath,
      /^\.\.\/\.\.\/hia-uview-ui-source\/src\/components\/u-[a-z-]+\/u-[a-z-]+$/,
      `Generated component path for ${componentName} must remain inside the controlled UI source subtree.`
    );
  }

  // <lang><zh-CN>生成首页必须保留默认 profile 的四个 block 排列；该断言只确认静态数据被编译，不执行页面或动态解释其值。</zh-CN><en>The generated home page must retain the default profile's four-block permutation; this assertion confirms only static-data compilation and executes neither page nor dynamic interpretation of its values.</en></lang>
  assert.match(
    pageScript,
    /blockOrder:\["query-context","runtime-status","catalog-list","entry-detail"\]/,
    'Generated page script must retain the checked-in bounded block order.'
  );

  // <lang><zh-CN>生成首页必须保留 solution profile 的固定版本、目标 channel 与顶层 package 选择；该断言只确认静态 JSON 被编译，不读取 session 或运行 resolver。</zh-CN><en>The generated home page must retain solution profile's fixed version, target channel, and top-level package selection; this assertion confirms only static JSON compilation and neither reads session nor runs resolver.</en></lang>
  assert.match(
    pageScript,
    /solutionProfileVersion:"1\.0"/,
    'Generated page script must retain the checked-in solution-profile version.'
  );
  assert.match(
    pageScript,
    /channelProfileId:"example\.catalog-query-detail\.representative-mp-weixin"/,
    'Generated page script must retain the fixed solution-to-channel correspondence.'
  );
  assert.match(
    pageScript,
    /capabilityPackageIds:\["example\.catalog-query-detail\.read"\]/,
    'Generated page script must retain the bounded top-level solution package selection.'
  );

  // <lang><zh-CN>生成首页必须调用 runtime 的受限 projection，并只把有限整数加固定 offset 写入 flex order；不接受动态 component/template/script 标记。</zh-CN><en>The generated home page must call runtime bounded projection and write only a finite integer plus fixed offset into flex order; it accepts no dynamic component/template/script marker.</en></lang>
  assert.match(
    pageScript,
    /getBlockProjection/,
    'Generated page script must retain the registered-block projection boundary.'
  );
  assert.match(
    pageScript,
    /order:[A-Za-z_$][A-Za-z0-9_$]*\.order\+10/,
    'Generated page script must derive flex order from the bounded projection integer.'
  );

  // <lang><zh-CN>把每个已登记组件展开为微信运行时实际需要的四类生成文件，避免 registry 路径存在但模块或模板缺失。</zh-CN><en>Expand every registered component into the four generated file types required by WeChat runtime, preventing a registry path from existing while its module or template is absent.</en></lang>
  const requiredGeneratedComponentFiles = expectedComponentNames.flatMap((componentName) => (
    ['js', 'json', 'wxml', 'wxss'].map((extension) => (
      `hia-uview-ui-source/src/components/${componentName}/${componentName}.${extension}`
    ))
  ));

  // <lang><zh-CN>只检查 app、project 与 app.json 已声明首页的四类静态文件；不读取、执行或上传任何其他生成资源。</zh-CN><en>Check only app, project, and four static file types of home page declared by app.json; read, execute, or upload no other generated resource.</en></lang>
  const requiredGeneratedFiles = [
    'app.js',
    'app.json',
    'app.wxss',
    'project.config.json',
    'pages/index/index.js',
    'pages/index/index.json',
    'pages/index/index.wxml',
    'pages/index/index.wxss',
    ...requiredGeneratedComponentFiles
  ];

  // <lang><zh-CN>将全部白名单路径解析到 output root 后并发只读存在性检查；任一缺失即停止验证。</zh-CN><en>Resolve all allowlisted paths under output root and run concurrent read-only existence checks; any missing file stops verification.</en></lang>
  await Promise.all(requiredGeneratedFiles.map((relativePath) => access(resolve(outputDirectory, relativePath))));
}

// <lang><zh-CN>执行只读 output 验证；不会创建缓存、修改生成物或触及 UI source link。</zh-CN><en>Run read-only output validation; create no cache, modify no generated artifact, and touch no UI source link.</en></lang>
await verifyMpWeixinFixtureOutput();

// <lang><zh-CN>成功信息只包含稳定验证结论，不包含本机绝对 output 路径或操作者 UI source 路径。</zh-CN><en>Success message contains only stable verification conclusion and no machine absolute output path or operator UI-source path.</en></lang>
console.log('HIA-uView-Biz mp-weixin fixture generation contract passed.');
