/**
 * <lang><zh-CN>静态 local-synchronous transport-operation runtime 的纯 Node 验收：固定 descriptor、handler map、operation dispatch、输入/输出隔离与失败脱敏。</zh-CN><en>Pure-Node acceptance for static local-synchronous transport-operation runtime: fixes descriptor, handler map, operation dispatch, input/output isolation, and failure redaction.</en></lang>
 * @lang zh-CN 测试只构造仓内 plain-data descriptor 和闭包 handler；不读取网络、文件、环境、storage、身份、真实时间或 UI。
 * @lang en Tests construct only checked-in plain-data descriptors and closure handlers; they read no network, file, environment, storage, identity, real time, or UI.
 */

// <lang><zh-CN>使用严格断言固定公开 initialization/result/observation 边界。</zh-CN><en>Use strict assertions to fix public initialization/result/observation boundaries.</en></lang>
import assert from 'node:assert/strict';

// <lang><zh-CN>使用 Node 原生测试器，避免为 pure operation router 增加依赖。</zh-CN><en>Use Node's native test runner, avoiding a dependency for the pure operation router.</en></lang>
import test from 'node:test';

// <lang><zh-CN>直接导入待实现的独立 transport runtime，首轮 test-first 失败应精确定位缺失 package。</zh-CN><en>Import the pending independent transport runtime directly so the first test-first failure pinpoints the missing package.</en></lang>
import {
  TRANSPORT_OPERATION_CONTRACT_VERSION,
  createStaticOperationTransport,
  validateTransportOperationDescriptor
} from '../packages/transport-operation-runtime/src/index.mjs';

/**
 * <lang><zh-CN>创建两个中性 read operation 的最小静态 descriptor。</zh-CN><en>Creates the smallest static descriptor for two neutral read operations.</en></lang>
 *
 * @returns {object} <lang><zh-CN>没有 URL、HTTP、身份或 credential reference 的 descriptor plain data。</zh-CN><en>Descriptor plain data containing no URL, HTTP, identity, or credential reference.</en></lang>
 * @lang zh-CN operation ID 只供 selected adapter 的本地 dispatch 使用，不是 endpoint、route 或动态 selector。
 * @lang en Operation IDs are used only for selected adapter local dispatch and are not endpoints, routes, or dynamic selectors.
 */
function createDescriptor() {
  // <lang><zh-CN>两个 operation 都精确对应既有 catalog read ports；本测试不登记 P38 command。</zh-CN><en>Both operations correspond exactly to existing catalog read ports; this test registers no P38 command.</en></lang>
  return {
    transportOperationContractVersion: TRANSPORT_OPERATION_CONTRACT_VERSION,
    kind: 'transport-operation-descriptor',
    id: 'example.catalog-query-detail.local-transport',
    execution: 'local-synchronous',
    credential: {
      mode: 'none'
    },
    operations: [
      {
        id: 'catalog-query-detail.catalog-query.read',
        kind: 'read',
        port: 'catalog-query',
        contract: {
          id: 'catalog-query-detail.query',
          version: '1.0'
        }
      },
      {
        id: 'catalog-query-detail.entry-detail.read',
        kind: 'read',
        port: 'entry-detail',
        contract: {
          id: 'catalog-query-detail.detail',
          version: '1.0'
        }
      }
    ]
  };
}

/**
 * <lang><zh-CN>创建与 descriptor 完整对应的 checked-in local handler map。</zh-CN><en>Creates a checked-in local handler map that completely corresponds to descriptor.</en></lang>
 *
 * @param {(value: object) => void} [onQuery] <lang><zh-CN>仅测试使用的 query input observation。</zh-CN><en>Query-input observation used only by test.</en></lang>
 * @returns {object} <lang><zh-CN>两个固定 operation handler。</zh-CN><en>Two fixed operation handlers.</en></lang>
 * @lang zh-CN handler map 由 reviewed host source 提供；它不是 JSON 配置、动态加载器或用户回调注册表。
 * @lang en The reviewed host source supplies the handler map; it is not JSON configuration, a dynamic loader, or a user callback registry.
 */
function createHandlers(onQuery = () => {}) {
  // <lang><zh-CN>handler 只返回中性 local wire plain data，供 selected adapter 后续转换。</zh-CN><en>Handlers return only neutral local wire plain data for subsequent selected-adapter conversion.</en></lang>
  return {
    'catalog-query-detail.catalog-query.read': (request) => {
      onQuery(request);
      return {
        state: 'ok',
        page_number: request.page_number,
        page_size: request.page_size
      };
    },
    'catalog-query-detail.entry-detail.read': (request) => ({
      state: 'ok',
      entry_key: request.entry_key
    })
  };
}

/**
 * <lang><zh-CN>验证 descriptor、成功 dispatch、handler 输入隔离、outcome 隔离和 count-only observation。</zh-CN><en>Verifies descriptor, successful dispatch, handler-input isolation, outcome isolation, and count-only observation.</en></lang>
 * @lang zh-CN 成功只证明进程内 local dispatch，不主张 backend、HTTP、身份、持久化或生产 transport。
 * @lang en Success proves only in-process local dispatch and claims no backend, HTTP, identity, persistence, or production transport.
 */
function testDispatchesStaticLocalReadOperations() {
  // <lang><zh-CN>先固定 descriptor 的合法性，避免 handler 测试掩盖 metadata 错误。</zh-CN><en>Fix descriptor validity first so handler tests cannot mask metadata errors.</en></lang>
  assert.deepEqual(validateTransportOperationDescriptor(createDescriptor()), {
    ok: true,
    diagnostics: []
  });

  // <lang><zh-CN>记录 handler 接收到的副本，验证调用方请求不能与内部 handler 共享可变引用。</zh-CN><en>Record the copy received by handler to verify caller request shares no mutable reference with internal handler.</en></lang>
  let receivedQuery = null;
  const initialization = createStaticOperationTransport({
    descriptor: createDescriptor(),
    handlers: createHandlers((request) => {
      receivedQuery = request;
      request.page_number = 99;
    })
  });
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>调用方输入只含 adapter-private local wire data；runtime 必须给 handler 独立副本。</zh-CN><en>Caller input contains only adapter-private local wire data; runtime must give handler an isolated copy.</en></lang>
  const request = {
    page_number: 1,
    page_size: 1
  };
  const firstResult = initialization.transport.invoke('catalog-query-detail.catalog-query.read', request);
  assert.equal(firstResult.ok, true);
  assert.deepEqual(request, {
    page_number: 1,
    page_size: 1
  });
  assert.notEqual(receivedQuery, request);
  assert.deepEqual(firstResult.outcome, {
    state: 'ok',
    page_number: 99,
    page_size: 1
  });

  // <lang><zh-CN>调用方修改 success outcome 不得污染下一次 handler result。</zh-CN><en>Caller mutation of success outcome must not contaminate the next handler result.</en></lang>
  firstResult.outcome.page_number = 77;
  const secondResult = initialization.transport.invoke('catalog-query-detail.catalog-query.read', {
    page_number: 2,
    page_size: 1
  });
  assert.equal(secondResult.ok, true);
  assert.deepEqual(secondResult.outcome, {
    state: 'ok',
    page_number: 99,
    page_size: 1
  });

  // <lang><zh-CN>observation 只暴露稳定计数，不返回 operation ID、request、outcome 或 handler。</zh-CN><en>Observation exposes only stable counts and returns no operation ID, request, outcome, or handler.</en></lang>
  assert.deepEqual(initialization.transport.getObservation(), {
    invocations: 2,
    successes: 2,
    failures: {
      operation: 0,
      input: 0,
      handler: 0
    }
  });
}

/**
 * <lang><zh-CN>验证未知 operation、accessor input 与 handler failure 均受限失败且不回显 local data。</zh-CN><en>Verifies unknown operation, accessor input, and handler failure all fail within boundary and echo no local data.</en></lang>
 * @lang zh-CN failure 仅供 selected adapter 映射；它不是 canonical business failure、用户文本或真实 transport diagnostic。
 * @lang en Failure is only for selected-adapter mapping; it is not canonical business failure, user text, or real transport diagnostic.
 */
function testRedactsDispatchFailures() {
  // <lang><zh-CN>其中一个 handler 抛出本地错误，另一 handler 保持正常，证明失败不跨 operation 污染。</zh-CN><en>One handler throws a local error while the other remains normal, proving failure cannot contaminate another operation.</en></lang>
  const handlers = createHandlers();
  handlers['catalog-query-detail.entry-detail.read'] = () => {
    throw new Error('local-wire-untrusted');
  };
  const initialization = createStaticOperationTransport({
    descriptor: createDescriptor(),
    handlers
  });
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>未登记 operation 在执行 handler 前返回稳定 failure，且不回显 caller string。</zh-CN><en>An unregistered operation returns stable failure before handler execution and echoes no caller string.</en></lang>
  const unknown = initialization.transport.invoke('javascript:untrusted', { page_number: 1 });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.failure.code, 'transport-operation.operation-unavailable');
  assert.equal(JSON.stringify(unknown).includes('javascript:untrusted'), false);

  // <lang><zh-CN>accessor input 必须在 getter 读取前失败，避免 transport boundary 成为隐式执行面。</zh-CN><en>An accessor input must fail before getter read, preventing transport boundary from becoming an implicit execution surface.</en></lang>
  let getterRead = false;
  const accessorInput = {};
  Object.defineProperty(accessorInput, 'page_number', {
    enumerable: true,
    get() {
      getterRead = true;
      return 1;
    }
  });
  const accessorFailure = initialization.transport.invoke('catalog-query-detail.catalog-query.read', accessorInput);
  assert.equal(accessorFailure.ok, false);
  assert.equal(accessorFailure.failure.code, 'transport-operation.input-invalid');
  assert.equal(getterRead, false);

  // <lang><zh-CN>handler exception 只投影稳定 unavailable failure，不泄露原始 error 或 input。</zh-CN><en>A handler exception projects only stable unavailable failure and leaks neither raw error nor input.</en></lang>
  const handlerFailure = initialization.transport.invoke('catalog-query-detail.entry-detail.read', {
    entry_key: 'entry-001'
  });
  assert.equal(handlerFailure.ok, false);
  assert.equal(handlerFailure.failure.code, 'transport-operation.operation-unavailable');
  assert.equal(JSON.stringify(handlerFailure).includes('local-wire-untrusted'), false);

  // <lang><zh-CN>失败分类只报告计数，证明未知、输入和 handler 三种边界独立计数。</zh-CN><en>Failure categories report counts only, proving unknown-operation, input, and handler boundaries count independently.</en></lang>
  assert.deepEqual(initialization.transport.getObservation(), {
    invocations: 3,
    successes: 0,
    failures: {
      operation: 1,
      input: 1,
      handler: 1
    }
  });
}

/**
 * <lang><zh-CN>验证 descriptor/handler map 必须完整静态对应，拒绝 executable configuration 或未审阅 handler 扩张。</zh-CN><en>Verifies descriptor/handler map must correspond completely and statically, rejecting executable configuration or unreviewed handler expansion.</en></lang>
 * @lang zh-CN 初始化失败只返回脱敏 diagnostics，不形成可调用 transport partial API。
 * @lang en Initialization failure returns only redacted diagnostics and creates no invokable partial transport API.
 */
function testRejectsNonStaticDescriptorAndHandlerMap() {
  // <lang><zh-CN>额外 endpoint 字段不得被当作 future metadata 保留；descriptor root 必须精确。</zh-CN><en>An extra endpoint field cannot be retained as future metadata; descriptor root must be exact.</en></lang>
  const invalidDescriptor = createDescriptor();
  invalidDescriptor.endpoint = 'https://untrusted.invalid';
  const descriptorFailure = validateTransportOperationDescriptor(invalidDescriptor);
  assert.equal(descriptorFailure.ok, false);
  assert.equal(descriptorFailure.diagnostics.some((diagnostic) => diagnostic.code === 'transport-operation.descriptor.invalid'), true);
  assert.equal(JSON.stringify(descriptorFailure).includes('untrusted.invalid'), false);

  // <lang><zh-CN>隐藏或 Symbol 字段同样不能绕过 exact-shape 校验，避免未声明 metadata 被静默保留。</zh-CN><en>Hidden or Symbol fields likewise cannot bypass exact-shape validation, preventing undeclared metadata from being silently retained.</en></lang>
  const hiddenDescriptor = createDescriptor();
  Object.defineProperty(hiddenDescriptor, 'endpoint', {
    value: 'https://untrusted.invalid',
    enumerable: false
  });
  const hiddenDescriptorFailure = validateTransportOperationDescriptor(hiddenDescriptor);
  assert.equal(hiddenDescriptorFailure.ok, false);
  assert.equal(hiddenDescriptorFailure.diagnostics.some((diagnostic) => diagnostic.code === 'transport-operation.descriptor.invalid'), true);

  const symbolDescriptor = createDescriptor();
  symbolDescriptor[Symbol('untrusted')] = 'metadata';
  const symbolDescriptorFailure = validateTransportOperationDescriptor(symbolDescriptor);
  assert.equal(symbolDescriptorFailure.ok, false);
  assert.equal(symbolDescriptorFailure.diagnostics.some((diagnostic) => diagnostic.code === 'transport-operation.descriptor.invalid'), true);

  // <lang><zh-CN>缺少任一 declared handler 时初始化失败；runtime 不会 fallback、发现或自动填充 handler。</zh-CN><en>Initialization fails when any declared handler is missing; runtime does not fall back, discover, or auto-fill handlers.</en></lang>
  const incompleteHandlers = createHandlers();
  delete incompleteHandlers['catalog-query-detail.entry-detail.read'];
  const missingHandler = createStaticOperationTransport({
    descriptor: createDescriptor(),
    handlers: incompleteHandlers
  });
  assert.equal(missingHandler.ok, false);
  assert.equal(missingHandler.diagnostics.some((diagnostic) => diagnostic.code === 'transport-operation.handlers.invalid'), true);
  assert.equal(Object.hasOwn(missingHandler, 'transport'), false);

  // <lang><zh-CN>额外 handler 同样失败，防止 function map 悄然成为任意 operation registry。</zh-CN><en>An extra handler fails as well, preventing function map from silently becoming an arbitrary operation registry.</en></lang>
  const extraHandlers = createHandlers();
  extraHandlers['catalog-query-detail.unreviewed.read'] = () => ({ state: 'ok' });
  const extraHandler = createStaticOperationTransport({
    descriptor: createDescriptor(),
    handlers: extraHandlers
  });
  assert.equal(extraHandler.ok, false);
  assert.equal(extraHandler.diagnostics.some((diagnostic) => diagnostic.code === 'transport-operation.handlers.invalid'), true);
}

// <lang><zh-CN>登记静态 dispatch、失败脱敏和完整 handler-map 三项 acceptance；不注册 command 或异步 transport。</zh-CN><en>Register static dispatch, failure redaction, and complete handler-map acceptance; register no command or asynchronous transport.</en></lang>
test('static transport dispatches only declared local read operations with isolated data', testDispatchesStaticLocalReadOperations);
test('static transport redacts unknown-operation, input, and handler failures', testRedactsDispatchFailures);
test('static transport requires an exact descriptor and complete reviewed handler map', testRejectsNonStaticDescriptorAndHandlerMap);
