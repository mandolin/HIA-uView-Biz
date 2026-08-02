/**
 * <lang><zh-CN>Biz async-provider runtime 契约测试：固定显式 source policy、Promise handle、read 降级、write authority、timeout/cancel、late result、retry 与脱敏边界。</zh-CN><en>Biz async-provider runtime contract tests: fix explicit source policy, Promise handles, read degradation, write authority, timeout/cancel, late results, retry, and redaction boundary.</en></lang>
 * @lang zh-CN 测试只使用内存 source 与手工 scheduler；不打开网络、不读取环境或文件、不处理真实身份/credential，也不创建 BP 项目。
 * @lang en Tests use only in-memory sources and manual scheduler; they open no network, read no environment/file, handle no real identity/credential, and create no BP project.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ASYNC_PROVIDER_CONTRACT_VERSION,
  ASYNC_SOURCE_POLICY_VERSION,
  createAsyncProviderHost,
  validateAsyncProviderDeclaration,
  validateAsyncSourcePolicy
} from '../packages/async-provider-runtime/src/index.mjs';

/**
 * <lang><zh-CN>创建基础有效 async-provider declaration。</zh-CN><en>Creates a baseline valid async-provider declaration.</en></lang>
 * @param {object} [overrides={}] <lang><zh-CN>覆盖字段。</zh-CN><en>Override fields.</en></lang>
 * @returns {object} <lang><zh-CN>新的 declaration。</zh-CN><en>A new declaration.</en></lang>
 * @lang zh-CN helper 只构造测试输入；它不代表已发布 manifest、项目 profile 或业务 DTO。
 * @lang en This helper constructs only test input; it represents no published manifest, project profile, or business DTO.
 */
function createDeclaration(overrides = {}) {
  // <lang><zh-CN>返回一个只含 contract 定义字段的 read declaration。</zh-CN><en>Return a read declaration containing only contract-defined fields.</en></lang>
  return {
    asyncProviderContractVersion: ASYNC_PROVIDER_CONTRACT_VERSION,
    providerId: 'example.async-provider',
    portId: 'example-read',
    owner: 'example-test',
    kind: 'read',
    contract: {
      id: 'example.async-read',
      version: '1.0'
    },
    execution: 'injected-async',
    credential: {
      mode: 'none'
    },
    cancellation: 'explicit-handle',
    retry: {
      maxAttempts: 2
    },
    ...overrides
  };
}

/**
 * <lang><zh-CN>创建 local 模式的基础 source policy。</zh-CN><en>Creates a baseline local-mode source policy.</en></lang>
 * @param {object} [overrides={}] <lang><zh-CN>覆盖字段。</zh-CN><en>Override fields.</en></lang>
 * @returns {object} <lang><zh-CN>新的 source policy。</zh-CN><en>A new source policy.</en></lang>
 * @lang zh-CN local mode 是本轮 checkout-first 默认；其他 mode 仅作为注入 seam 测试，不实现真实后端。
 * @lang en Local mode is this round's checkout-first default; other modes are only injected-seam tests and implement no real backend.
 */
function createLocalPolicy(overrides = {}) {
  // <lang><zh-CN>返回固定 local source 的最小 policy。</zh-CN><en>Return the minimum policy with fixed local source.</en></lang>
  return {
    sourcePolicyVersion: ASYNC_SOURCE_POLICY_VERSION,
    mode: 'local',
    readSourceIds: ['local-source'],
    writeSourceId: 'local-source',
    ...overrides
  };
}

/**
 * <lang><zh-CN>创建一组合法 local source providers。</zh-CN><en>Creates a set of valid local source providers.</en></lang>
 * @param {(request: unknown, control: object) => unknown} invoke <lang><zh-CN>local source 调用函数。</zh-CN><en>Local source invocation function.</en></lang>
 * @returns {object} <lang><zh-CN>精确 source map。</zh-CN><en>An exact source map.</en></lang>
 * @lang zh-CN provider map 仅用于测试注入，不含 URL、header、token、credential 或动态发现。
 * @lang en Provider map exists only for test injection and contains no URL, header, token, credential, or dynamic discovery.
 */
function createLocalSources(invoke) {
  // <lang><zh-CN>返回一个 authority 为 local 的唯一 source。</zh-CN><en>Return one source whose authority is local.</en></lang>
  return {
    'local-source': {
      authority: 'local',
      invoke
    }
  };
}

/**
 * <lang><zh-CN>创建可控的 deferred Promise。</zh-CN><en>Creates a controllable deferred Promise.</en></lang>
 * @returns {{promise: Promise<unknown>, resolve: (value: unknown) => void}} <lang><zh-CN>Promise 与 resolver。</zh-CN><en>Promise and resolver.</en></lang>
 * @lang zh-CN deferred 只模拟 source 时序；它不代表真实 remote 请求、线程或 background task。
 * @lang en Deferred simulates only source timing; it represents no real remote request, thread, or background task.
 */
function createDeferred() {
  // <lang><zh-CN>保存 resolver，供测试在 timeout/cancel 后显式提交晚到 source result。</zh-CN><en>Store resolver so tests can explicitly submit a late source result after timeout/cancel.</en></lang>
  let resolveDeferred;

  // <lang><zh-CN>创建等待测试控制的 Promise。</zh-CN><en>Create Promise waiting for test control.</en></lang>
  const promise = new Promise((resolve) => {
    // <lang><zh-CN>捕获 resolver，不在 executor 内产生副作用。</zh-CN><en>Capture resolver and produce no side effect inside executor.</en></lang>
    resolveDeferred = resolve;
  });

  // <lang><zh-CN>返回受控 pair。</zh-CN><en>Return controlled pair.</en></lang>
  return {
    promise,
    resolve: resolveDeferred
  };
}

/**
 * <lang><zh-CN>创建不依赖真实时钟的手工 scheduler。</zh-CN><en>Creates manual scheduler independent of real clock.</en></lang>
 * @returns {{schedule: Function, clearSchedule: Function, runNext: () => boolean}} <lang><zh-CN>scheduler control。</zh-CN><en>Scheduler control.</en></lang>
 * @lang zh-CN scheduler 只记录 callback，不等待真实时间，因此 timeout/race 测试可重复。
 * @lang en Scheduler records callbacks only and waits no real time, making timeout/race tests repeatable.
 */
function createManualScheduler() {
  // <lang><zh-CN>使用 Map 保存尚未清理的 timer callback。</zh-CN><en>Use Map to store timer callbacks not yet cleared.</en></lang>
  const callbacks = new Map();

  // <lang><zh-CN>为每个模拟 timer 分配递增 ID。</zh-CN><en>Allocate increasing ID for every simulated timer.</en></lang>
  let nextId = 1;

  /**
   * <lang><zh-CN>登记一个模拟 timer。</zh-CN><en>Registers one simulated timer.</en></lang>
   * @param {() => void} callback <lang><zh-CN>timer callback。</zh-CN><en>Timer callback.</en></lang>
   * @returns {number} <lang><zh-CN>opaque timer ID。</zh-CN><en>Opaque timer ID.</en></lang>
   * @lang zh-CN delay 由 runtime 已校验；测试 scheduler 不需要真实等待它。
   * @lang en Delay is already validated by runtime; test scheduler needs not wait for it.
   */
  function schedule(callback) {
    // <lang><zh-CN>保存当前 ID，随后递增以保障每项 timer 独立。</zh-CN><en>Save current ID and then increment it so every timer remains distinct.</en></lang>
    const timerId = nextId;
    nextId += 1;

    // <lang><zh-CN>将 callback 登记为未触发状态。</zh-CN><en>Register callback as not yet triggered.</en></lang>
    callbacks.set(timerId, callback);

    // <lang><zh-CN>返回 opaque ID 给 runtime。</zh-CN><en>Return opaque ID to runtime.</en></lang>
    return timerId;
  }

  /**
   * <lang><zh-CN>清理一个模拟 timer。</zh-CN><en>Clears one simulated timer.</en></lang>
   * @param {number} timerId <lang><zh-CN>opaque timer ID。</zh-CN><en>Opaque timer ID.</en></lang>
   * @returns {void} <lang><zh-CN>无返回值。</zh-CN><en>Returns nothing.</en></lang>
   * @lang zh-CN 删除不存在 ID 也是安全 no-op，与标准 clearTimeout 语义一致。
   * @lang en Deleting an absent ID is safe no-op, matching standard clearTimeout semantics.
   */
  function clearSchedule(timerId) {
    // <lang><zh-CN>删除待触发 callback。</zh-CN><en>Delete pending callback.</en></lang>
    callbacks.delete(timerId);
  }

  /**
   * <lang><zh-CN>触发最早登记的未清理 timer。</zh-CN><en>Triggers earliest registered timer not yet cleared.</en></lang>
   * @returns {boolean} <lang><zh-CN>触发 callback 时为 true。</zh-CN><en>`true` when callback was triggered.</en></lang>
   * @lang zh-CN 测试一次只触发一个 timer，避免背景时间造成不可解释的批量状态变化。
   * @lang en Tests trigger one timer at a time, avoiding unexplained batch state changes from background time.
   */
  function runNext() {
    // <lang><zh-CN>读取第一个 Map entry，保持 registration 顺序。</zh-CN><en>Read first Map entry, retaining registration order.</en></lang>
    const nextEntry = callbacks.entries().next();

    // <lang><zh-CN>没有 timer 时返回 false。</zh-CN><en>Return false when no timer remains.</en></lang>
    if (nextEntry.done) {
      // <lang><zh-CN>不产生额外副作用。</zh-CN><en>Produce no additional side effect.</en></lang>
      return false;
    }

    // <lang><zh-CN>解构 ID 与 callback，随后先删除再触发，模拟 one-shot timer。</zh-CN><en>Destructure ID/callback, delete first, then trigger to simulate one-shot timer.</en></lang>
    const [timerId, callback] = nextEntry.value;
    callbacks.delete(timerId);

    // <lang><zh-CN>执行受控 callback。</zh-CN><en>Execute controlled callback.</en></lang>
    callback();

    // <lang><zh-CN>告知测试 timer 已触发。</zh-CN><en>Tell test the timer was triggered.</en></lang>
    return true;
  }

  // <lang><zh-CN>返回 scheduler 的全部受控入口。</zh-CN><en>Return all controlled scheduler entry points.</en></lang>
  return {
    schedule,
    clearSchedule,
    runNext
  };
}

/**
 * <lang><zh-CN>刷新有限轮 microtask，使 runtime 的异步启动和 source continuation 可被测试观察。</zh-CN><en>Flushes finite microtask turns so tests can observe runtime async start and source continuation.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>刷新完成时 resolve。</zh-CN><en>Resolves when flushing completes.</en></lang>
 * @lang zh-CN 固定轮数仅覆盖本 runtime 的 Promise 链；它不是通用 event-loop drain 或等待真实 I/O。
 * @lang en Fixed turns cover only this runtime's Promise chain; this is not a general event-loop drain or wait for real I/O.
 */
async function flushMicrotasks() {
  // <lang><zh-CN>连续等待六轮已知 microtask，以覆盖 start、source outcome 与 terminal resolve。</zh-CN><en>Await six known microtask turns to cover start, source outcome, and terminal resolve.</en></lang>
  for (let turn = 0; turn < 6; turn += 1) {
    // <lang><zh-CN>让下一层 Promise continuation 运行。</zh-CN><en>Let next Promise continuation run.</en></lang>
    await Promise.resolve();
  }
}

/**
 * <lang><zh-CN>验证 declaration/policy 在边界拒绝不支持的 execution、write retry 与 auto 无 local 回退。</zh-CN><en>Verifies declaration/policy reject unsupported execution, write retry, and auto without local fallback at boundary.</en></lang>
 * @returns {void} <lang><zh-CN>无返回值。</zh-CN><en>Returns nothing.</en></lang>
 * @lang zh-CN 该测试固定新 runtime 与同步 provider v1 分离，也固定 auto 不得丢弃 local checkout-first 基础。
 * @lang en This test fixes separation from sync provider v1 and fixes that auto may not discard local checkout-first foundation.
 */
function testValidatesDeclarationAndPolicyBoundary() {
  // <lang><zh-CN>同步 execution 不可被新 async runtime 静默接受。</zh-CN><en>Sync execution cannot be silently accepted by new async runtime.</en></lang>
  const invalidExecution = validateAsyncProviderDeclaration(createDeclaration({ execution: 'injected-sync' }));
  assert.equal(invalidExecution.ok, false);
  assert.equal(invalidExecution.diagnostics.some((diagnostic) => diagnostic.code === 'async-provider.execution.unsupported'), true);

  // <lang><zh-CN>write 声明必须关闭 automatic retry。</zh-CN><en>Write declaration must disable automatic retry.</en></lang>
  const invalidWriteRetry = validateAsyncProviderDeclaration(createDeclaration({
    kind: 'write',
    retry: {
      maxAttempts: 2
    }
  }));
  assert.equal(invalidWriteRetry.ok, false);
  assert.equal(invalidWriteRetry.diagnostics.some((diagnostic) => diagnostic.code === 'async-provider.write-retry.unsupported'), true);

  // <lang><zh-CN>auto policy 可以在 shape 层通过；host relation 层才检查 provider authority 是否包含 local。</zh-CN><en>Auto policy can pass shape layer; host relation layer checks whether provider authority includes local.</en></lang>
  const autoPolicy = validateAsyncSourcePolicy(createLocalPolicy({
    mode: 'auto',
    readSourceIds: ['remote-source'],
    writeSourceId: 'remote-source'
  }));
  assert.equal(autoPolicy.ok, true);

  // <lang><zh-CN>构造没有 local authority 的 auto host，确认 relation validation 阻断它。</zh-CN><en>Construct auto host with no local authority and confirm relation validation blocks it.</en></lang>
  const rejectedHost = createAsyncProviderHost({
    declaration: createDeclaration(),
    sourcePolicy: createLocalPolicy({
      mode: 'auto',
      readSourceIds: ['remote-source'],
      writeSourceId: 'remote-source'
    }),
    sourceProviders: {
      'remote-source': {
        authority: 'remote',
        invoke: () => ({ kind: 'success', value: {} })
      }
    }
  });
  assert.equal(rejectedHost.ok, false);
  assert.equal(rejectedHost.diagnostics.some((diagnostic) => diagnostic.code === 'async-source-policy.auto.local.required'), true);
}

/**
 * <lang><zh-CN>验证 local read 成功隔离 request/value，且 observation 不泄漏 source/request/value。</zh-CN><en>Verifies local read success isolates request/value and observation leaks no source/request/value.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>完成时 resolve。</zh-CN><en>Resolves when complete.</en></lang>
 * @lang zh-CN 此路径代表 checkout-first local success，不代表 local JSON 文件、持久化 storage 或业务 canonical page 已实现。
 * @lang en This path represents checkout-first local success and does not represent local JSON file, persistent storage, or business canonical page implementation.
 */
async function testCompletesLocalReadWithIsolation() {
  // <lang><zh-CN>保留 source 接收到的 request 副本，确认 source mutation 不会返回给调用方。</zh-CN><en>Retain request copy received by source to confirm source mutation cannot return to caller.</en></lang>
  let sourceRequest;

  // <lang><zh-CN>创建唯一 local source 的 read host。</zh-CN><en>Create read host with one local source.</en></lang>
  const initialization = createAsyncProviderHost({
    declaration: createDeclaration({
      retry: {
        maxAttempts: 1
      }
    }),
    sourcePolicy: createLocalPolicy(),
    sourceProviders: createLocalSources((request) => {
      // <lang><zh-CN>保存 source 自有 request 副本并故意 mutation 它。</zh-CN><en>Save source-owned request copy and deliberately mutate it.</en></lang>
      sourceRequest = request;
      sourceRequest.filter.changedBySource = true;

      // <lang><zh-CN>返回 adapter-private plain data，不添加任何业务 canonical claim。</zh-CN><en>Return adapter-private plain data without adding any business canonical claim.</en></lang>
      return {
        kind: 'success',
        value: {
          records: [
            {
              id: 'record-1'
            }
          ]
        }
      };
    })
  });
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>调用方 request 会在 source 尝试前被复制。</zh-CN><en>Caller request will be copied before source attempt.</en></lang>
  const callerRequest = {
    filter: {
      query: 'shared-space'
    }
  };

  // <lang><zh-CN>启动并等待 terminal success。</zh-CN><en>Start and await terminal success.</en></lang>
  const handle = initialization.host.start(callerRequest);
  const outcome = await handle.promise;

  // <lang><zh-CN>source mutation 不得改变调用方原对象。</zh-CN><en>Source mutation must not change caller original object.</en></lang>
  assert.equal(callerRequest.filter.changedBySource, undefined);
  assert.notEqual(sourceRequest, callerRequest);

  // <lang><zh-CN>terminal envelope 只报告 source metadata 和隔离 value。</zh-CN><en>Terminal envelope reports only source metadata and isolated value.</en></lang>
  assert.equal(outcome.kind, 'success');
  assert.deepEqual(outcome.source, {
    sourceId: 'local-source',
    authority: 'local',
    degradedReason: null
  });
  assert.equal(outcome.value.records[0].id, 'record-1');

  // <lang><zh-CN>修改已返回 outcome 不得污染下次 observation 或 host 内部状态。</zh-CN><en>Mutating returned outcome must not pollute next observation or host state.</en></lang>
  outcome.value.records[0].id = 'mutated-by-caller';
  const observation = initialization.host.getObservation();
  const observationText = JSON.stringify(observation);
  assert.equal(observation.successes, 1);
  assert.equal(observationText.includes('local-source'), false);
  assert.equal(observationText.includes('shared-space'), false);
  assert.equal(observationText.includes('record-1'), false);
}

/**
 * <lang><zh-CN>验证 read 在同一 remote source 进行有限 retry 后，可显式降级到 local 并保留原因。</zh-CN><en>Verifies read retries finite times on same remote source, then explicitly degrades to local and retains reason.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>完成时 resolve。</zh-CN><en>Resolves when complete.</en></lang>
 * @lang zh-CN 该测试只模拟注入 seam，不创建 remote endpoint；成功 metadata 用于后续 adapter/UI source badge 投影。
 * @lang en This test simulates only injected seam and creates no remote endpoint; success metadata is for later adapter/UI source-badge projection.
 */
async function testRetriesReadThenDegradesToLocal() {
  // <lang><zh-CN>记录 remote/local source 被调用次数。</zh-CN><en>Record remote/local source invocation counts.</en></lang>
  let remoteCalls = 0;
  let localCalls = 0;

  // <lang><zh-CN>构造 auto policy：remote read 先尝试，local 是显式 fallback；write 仍固定 local。</zh-CN><en>Construct auto policy: remote read attempts first, local is explicit fallback; write remains fixed local.</en></lang>
  const sourcePolicy = createLocalPolicy({
    mode: 'auto',
    readSourceIds: ['remote-source', 'local-source'],
    writeSourceId: 'local-source'
  });

  // <lang><zh-CN>显式提供两个 source，不含 URL/HTTP/credential。</zh-CN><en>Explicitly provide two sources containing no URL/HTTP/credential.</en></lang>
  const sourceProviders = {
    'remote-source': {
      authority: 'remote',
      invoke: () => {
        // <lang><zh-CN>第一次 remote failure 可 retry，第二次不可 retry，从而结束 remote budget。</zh-CN><en>First remote failure is retryable and second is not, exhausting remote budget.</en></lang>
        remoteCalls += 1;
        return remoteCalls === 1
          ? { kind: 'failure', code: 'unavailable', retryable: true }
          : { kind: 'failure', code: 'offline', retryable: false };
      }
    },
    'local-source': {
      authority: 'local',
      invoke: () => {
        // <lang><zh-CN>local fallback 返回安全 adapter-private value。</zh-CN><en>Local fallback returns safe adapter-private value.</en></lang>
        localCalls += 1;
        return {
          kind: 'success',
          value: {
            from: 'local-fixture'
          }
        };
      }
    }
  };

  // <lang><zh-CN>建立含两个 read attempts 的 host。</zh-CN><en>Initialize host with two read attempts.</en></lang>
  const initialization = createAsyncProviderHost({
    declaration: createDeclaration(),
    sourcePolicy,
    sourceProviders
  });
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>完成自动降级 read。</zh-CN><en>Complete auto-degradation read.</en></lang>
  const outcome = await initialization.host.start({}).promise;

  // <lang><zh-CN>remote 尝试两次，local 一次；成功来自 local 且保留最后 remote failure code。</zh-CN><en>Remote attempts twice and local once; success comes from local and retains last remote failure code.</en></lang>
  assert.equal(remoteCalls, 2);
  assert.equal(localCalls, 1);
  assert.equal(outcome.kind, 'success');
  assert.deepEqual(outcome.source, {
    sourceId: 'local-source',
    authority: 'local',
    degradedReason: 'offline'
  });

  // <lang><zh-CN>observation 只表达次数，证明有限 retry 与 source ID 不外泄。</zh-CN><en>Observation expresses only counts, proving finite retry and no source-ID leak.</en></lang>
  assert.deepEqual(initialization.host.getObservation(), {
    starts: 1,
    attempts: 3,
    retries: 1,
    successes: 1,
    lateResultsDiscarded: 0,
    failures: {
      'invalid-request': 0,
      offline: 0,
      conflict: 0,
      unavailable: 0,
      timeout: 0,
      cancelled: 0,
      unknown: 0
    }
  });
}

/**
 * <lang><zh-CN>验证 write failure 不 retry、不 fallback 到 local，即使 remote failure 被标为 retryable。</zh-CN><en>Verifies write failure neither retries nor falls back to local even when remote failure is marked retryable.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>完成时 resolve。</zh-CN><en>Resolves when complete.</en></lang>
 * @lang zh-CN 这是避免幻象预约的核心保护：remote authority 的失败绝不能被 local 成功掩盖。
 * @lang en This is core protection against phantom bookings: a remote-authority failure must never be masked by local success.
 */
async function testNeverFallsBackOrRetriesWrite() {
  // <lang><zh-CN>记录两个 source 的调用次数。</zh-CN><en>Record invocation count of both sources.</en></lang>
  let remoteCalls = 0;
  let localCalls = 0;

  // <lang><zh-CN>write declaration 明确 retry budget 为一。</zh-CN><en>Write declaration explicitly uses retry budget one.</en></lang>
  const declaration = createDeclaration({
    kind: 'write',
    retry: {
      maxAttempts: 1
    }
  });

  // <lang><zh-CN>auto policy 在开始前固定 remote 为 write authority，read sequence 仍含 local 回退。</zh-CN><en>Auto policy fixes remote as write authority before start while read sequence still contains local fallback.</en></lang>
  const sourcePolicy = createLocalPolicy({
    mode: 'auto',
    readSourceIds: ['remote-source', 'local-source'],
    writeSourceId: 'remote-source'
  });

  // <lang><zh-CN>remote write 返回 retryable offline；local 若被错误调用会返回 success。</zh-CN><en>Remote write returns retryable offline; local would return success if invoked incorrectly.</en></lang>
  const sourceProviders = {
    'remote-source': {
      authority: 'remote',
      invoke: () => {
        // <lang><zh-CN>登记唯一 remote write attempt。</zh-CN><en>Record single remote write attempt.</en></lang>
        remoteCalls += 1;
        return { kind: 'failure', code: 'offline', retryable: true };
      }
    },
    'local-source': {
      authority: 'local',
      invoke: () => {
        // <lang><zh-CN>若调用此 source 即表示 runtime 错误地 fallback write。</zh-CN><en>Calling this source would mean runtime incorrectly fell back write.</en></lang>
        localCalls += 1;
        return { kind: 'success', value: { shouldNotExist: true } };
      }
    }
  };

  // <lang><zh-CN>初始化固定 write authority host。</zh-CN><en>Initialize fixed write-authority host.</en></lang>
  const initialization = createAsyncProviderHost({
    declaration,
    sourcePolicy,
    sourceProviders
  });
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>等待 terminal failure。</zh-CN><en>Await terminal failure.</en></lang>
  const outcome = await initialization.host.start({ booking: 'mock-only' }).promise;

  // <lang><zh-CN>remote 仅调用一次，local 从未调用；最终 code 仍是 offline 但不允许自动 retry。</zh-CN><en>Remote is called once and local never; final code remains offline but automatic retry is not allowed.</en></lang>
  assert.equal(remoteCalls, 1);
  assert.equal(localCalls, 0);
  assert.equal(outcome.kind, 'failure');
  assert.equal(outcome.code, 'offline');
  assert.equal(outcome.retryable, false);
  assert.deepEqual(outcome.source, {
    sourceId: 'remote-source',
    authority: 'remote',
    degradedReason: null
  });
}

/**
 * <lang><zh-CN>验证 read timeout 固定为 timeout，且晚到 success 不能覆盖第一个 terminal result。</zh-CN><en>Verifies read timeout is fixed as timeout and late success cannot overwrite first terminal result.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>完成时 resolve。</zh-CN><en>Resolves when complete.</en></lang>
 * @lang zh-CN timeout 测试不使用真实时间；它证明 runtime 的 terminal race 处理，不证明网络中止或平台 request abort。
 * @lang en Timeout test uses no real time; it proves runtime terminal-race handling and does not prove network abort or platform request abort.
 */
async function testTimesOutReadAndDiscardsLateResult() {
  // <lang><zh-CN>创建一个由测试晚些时候 resolve 的 source Promise。</zh-CN><en>Create source Promise resolved later by test.</en></lang>
  const deferred = createDeferred();

  // <lang><zh-CN>创建可手动触发 timeout 的 scheduler。</zh-CN><en>Create scheduler capable of manually triggering timeout.</en></lang>
  const scheduler = createManualScheduler();

  // <lang><zh-CN>初始化 local read host，source 暂不返回 terminal outcome。</zh-CN><en>Initialize local read host whose source does not yet return terminal outcome.</en></lang>
  const initialization = createAsyncProviderHost({
    declaration: createDeclaration({
      retry: {
        maxAttempts: 1
      }
    }),
    sourcePolicy: createLocalPolicy(),
    sourceProviders: createLocalSources(() => deferred.promise),
    timeoutMs: 10,
    schedule: scheduler.schedule,
    clearSchedule: scheduler.clearSchedule
  });
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>启动 read 并等待它进入 source await。</zh-CN><en>Start read and wait until it enters source await.</en></lang>
  const handle = initialization.host.start({ query: 'slow-local' });
  await flushMicrotasks();

  // <lang><zh-CN>触发 timeout，得到确定的 read timeout envelope。</zh-CN><en>Trigger timeout and obtain determinate read timeout envelope.</en></lang>
  assert.equal(scheduler.runNext(), true);
  const outcome = await handle.promise;
  assert.equal(outcome.kind, 'failure');
  assert.equal(outcome.code, 'timeout');
  assert.equal(outcome.retryable, true);

  // <lang><zh-CN>随后提交 source success；它只能被作为 late result 丢弃。</zh-CN><en>Then submit source success; it can only be discarded as late result.</en></lang>
  deferred.resolve({
    kind: 'success',
    value: {
      late: true
    }
  });
  await flushMicrotasks();

  // <lang><zh-CN>observation 记录 timeout 和一个 late result，但没有 success。</zh-CN><en>Observation records timeout and one late result but no success.</en></lang>
  const observation = initialization.host.getObservation();
  assert.equal(observation.successes, 0);
  assert.equal(observation.failures.timeout, 1);
  assert.equal(observation.lateResultsDiscarded, 1);
}

/**
 * <lang><zh-CN>验证 read cancel 会立即 terminal cancelled，之后的 source result 被丢弃。</zh-CN><en>Verifies read cancel immediately terminals as cancelled and later source result is discarded.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>完成时 resolve。</zh-CN><en>Resolves when complete.</en></lang>
 * @lang zh-CN cancel 返回 true 只表示 runtime 接收请求；本测试不把它解释为真实网络 I/O 已被中止。
 * @lang en Cancel returning true only means runtime accepts request; this test does not interpret it as real network I/O aborted.
 */
async function testCancelsReadBeforeLateResult() {
  // <lang><zh-CN>创建暂不完成的 source。</zh-CN><en>Create source that does not complete yet.</en></lang>
  const deferred = createDeferred();

  // <lang><zh-CN>初始化最小 local read host。</zh-CN><en>Initialize minimum local read host.</en></lang>
  const initialization = createAsyncProviderHost({
    declaration: createDeclaration({
      retry: {
        maxAttempts: 1
      }
    }),
    sourcePolicy: createLocalPolicy(),
    sourceProviders: createLocalSources(() => deferred.promise)
  });
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>启动 source 后请求取消。</zh-CN><en>Request cancellation after source starts.</en></lang>
  const handle = initialization.host.start({ query: 'cancelled-read' });
  await flushMicrotasks();
  assert.equal(handle.cancel(), true);

  // <lang><zh-CN>terminal outcome 应为 cancelled，第二次 cancel 返回 false。</zh-CN><en>Terminal outcome should be cancelled and second cancel returns false.</en></lang>
  const outcome = await handle.promise;
  assert.equal(outcome.code, 'cancelled');
  assert.equal(handle.cancel(), false);

  // <lang><zh-CN>迟到 success 不可改变已确认取消。</zh-CN><en>Late success cannot change confirmed cancellation.</en></lang>
  deferred.resolve({
    kind: 'success',
    value: {
      ignored: true
    }
  });
  await flushMicrotasks();
  assert.equal(initialization.host.getObservation().lateResultsDiscarded, 1);
}

/**
 * <lang><zh-CN>验证已启动 write 的 cancel/timeout 都保持 unknown，只有 source 明确 before-commit cancelled 才可返回 cancelled。</zh-CN><en>Verifies cancel/timeout of started write remain unknown and only source explicit before-commit cancelled may return cancelled.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>完成时 resolve。</zh-CN><en>Resolves when complete.</en></lang>
 * @lang zh-CN 此测试固定写入不确定性，不宣称 transaction、远端 cancel、rollback 或 exactly-once delivery 已存在。
 * @lang en This test fixes write uncertainty and does not claim transaction, remote cancel, rollback, or exactly-once delivery exists.
 */
async function testProtectsStartedWriteUncertainty() {
  // <lang><zh-CN>创建 delayed write source，用于测试启动后的取消。</zh-CN><en>Create delayed write source for testing cancellation after start.</en></lang>
  const deferredWrite = createDeferred();

  // <lang><zh-CN>构造 write host，local 为唯一 fixed authority。</zh-CN><en>Construct write host with local as single fixed authority.</en></lang>
  const writeInitialization = createAsyncProviderHost({
    declaration: createDeclaration({
      kind: 'write',
      retry: {
        maxAttempts: 1
      }
    }),
    sourcePolicy: createLocalPolicy(),
    sourceProviders: createLocalSources(() => deferredWrite.promise)
  });
  assert.equal(writeInitialization.ok, true);

  // <lang><zh-CN>开始 write 并等 source 已进入 pending 状态。</zh-CN><en>Start write and wait until source has entered pending state.</en></lang>
  const writeHandle = writeInitialization.host.start({ command: 'mock-write' });
  await flushMicrotasks();

  // <lang><zh-CN>请求取消后 Promise 保持 pending，等待 source 或 timeout 给出确定安全结论。</zh-CN><en>After requesting cancel, Promise remains pending until source or timeout gives a safe conclusion.</en></lang>
  assert.equal(writeHandle.cancel(), true);

  // <lang><zh-CN>即使 source 之后回 success，runtime 也只能返回 unknown/cancelled reason。</zh-CN><en>Even when source later returns success, runtime can only return unknown with cancelled reason.</en></lang>
  deferredWrite.resolve({
    kind: 'success',
    value: {
      receipt: 'not-public'
    }
  });
  const cancelledAfterStart = await writeHandle.promise;
  assert.equal(cancelledAfterStart.kind, 'failure');
  assert.equal(cancelledAfterStart.code, 'unknown');
  assert.equal(cancelledAfterStart.source.degradedReason, 'cancelled');

  // <lang><zh-CN>构造第二个 write source，它能够明确证明在 commit 前取消。</zh-CN><en>Construct second write source that can explicitly prove cancellation before commit.</en></lang>
  const preCommitInitialization = createAsyncProviderHost({
    declaration: createDeclaration({
      kind: 'write',
      retry: {
        maxAttempts: 1
      }
    }),
    sourcePolicy: createLocalPolicy(),
    sourceProviders: createLocalSources(async (_request, control) => {
      // <lang><zh-CN>等待一轮 microtask，让测试在 source pending 时发送 cancel。</zh-CN><en>Wait one microtask so test can send cancel while source is pending.</en></lang>
      await Promise.resolve();

      // <lang><zh-CN>source 明确检查 control，而不是由 runtime 猜测是否已提交。</zh-CN><en>Source explicitly checks control rather than runtime guessing whether it committed.</en></lang>
      return control.isCancellationRequested()
        ? { kind: 'cancelled', phase: 'before-commit' }
        : { kind: 'success', value: {} };
    })
  });
  assert.equal(preCommitInitialization.ok, true);

  // <lang><zh-CN>在 source 自己确认前请求取消。</zh-CN><en>Request cancellation before source confirms itself.</en></lang>
  const preCommitHandle = preCommitInitialization.host.start({ command: 'pre-commit-cancel' });
  await Promise.resolve();
  assert.equal(preCommitHandle.cancel(), true);
  const preCommitOutcome = await preCommitHandle.promise;
  assert.equal(preCommitOutcome.code, 'cancelled');
}

/**
 * <lang><zh-CN>验证已启动 write timeout 固定 unknown，且迟到 source failure 不泄漏异常内容。</zh-CN><en>Verifies started write timeout is fixed unknown and late source failure leaks no exception content.</en></lang>
 * @returns {Promise<void>} <lang><zh-CN>完成时 resolve。</zh-CN><en>Resolves when complete.</en></lang>
 * @lang zh-CN 超时仅表明本层未确认结果；它不证明 source 没有写入，也不触发 fallback/retry。
 * @lang en Timeout means only this layer did not confirm result; it proves no source non-write and triggers no fallback/retry.
 */
async function testTimesOutStartedWriteAsUnknown() {
  // <lang><zh-CN>创建 delayed write source 和手工 scheduler。</zh-CN><en>Create delayed write source and manual scheduler.</en></lang>
  const deferred = createDeferred();
  const scheduler = createManualScheduler();

  // <lang><zh-CN>初始化 local write host。</zh-CN><en>Initialize local write host.</en></lang>
  const initialization = createAsyncProviderHost({
    declaration: createDeclaration({
      kind: 'write',
      retry: {
        maxAttempts: 1
      }
    }),
    sourcePolicy: createLocalPolicy(),
    sourceProviders: createLocalSources(() => deferred.promise),
    timeoutMs: 10,
    schedule: scheduler.schedule,
    clearSchedule: scheduler.clearSchedule
  });
  assert.equal(initialization.ok, true);

  // <lang><zh-CN>启动 write 并让 source invocation 标记已开始。</zh-CN><en>Start write and let source invocation mark itself started.</en></lang>
  const handle = initialization.host.start({ command: 'slow-write' });
  await flushMicrotasks();

  // <lang><zh-CN>触发 timeout；结果必须为 unknown，metadata 原因是 timeout。</zh-CN><en>Trigger timeout; result must be unknown with timeout metadata reason.</en></lang>
  assert.equal(scheduler.runNext(), true);
  const outcome = await handle.promise;
  assert.equal(outcome.code, 'unknown');
  assert.equal(outcome.source.degradedReason, 'timeout');

  // <lang><zh-CN>提交一个包含禁止文本的迟到失败；它不能进入 terminal result/observation。</zh-CN><en>Submit late failure containing forbidden text; it cannot enter terminal result/observation.</en></lang>
  deferred.resolve({
    kind: 'failure',
    code: 'unavailable',
    retryable: true,
    secret: 'must-not-be-accepted'
  });
  await flushMicrotasks();
  const observationText = JSON.stringify(initialization.host.getObservation());
  assert.equal(observationText.includes('must-not-be-accepted'), false);
  assert.equal(initialization.host.getObservation().lateResultsDiscarded, 1);
}

// <lang><zh-CN>逐项登记行为测试；名称描述公开 contract 行为，而不暴露内部 source、fixture 或实现路径。</zh-CN><en>Register behavior tests individually; names describe public contract behavior and expose no internal source, fixture, or implementation path.</en></lang>
test('validates async declaration and source-policy boundaries', testValidatesDeclarationAndPolicyBoundary);
test('completes local read with isolated plain data', testCompletesLocalReadWithIsolation);
test('retries read then visibly degrades to local', testRetriesReadThenDegradesToLocal);
test('never retries or falls back a write authority', testNeverFallsBackOrRetriesWrite);
test('times out read and discards late result', testTimesOutReadAndDiscardsLateResult);
test('cancels read and discards late result', testCancelsReadBeforeLateResult);
test('protects uncertainty of started write cancellation', testProtectsStartedWriteUncertainty);
test('maps started write timeout to unknown without leakage', testTimesOutStartedWriteAsUnknown);
