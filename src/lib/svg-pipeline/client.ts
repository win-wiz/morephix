import type { ResvgOptions } from './options';
import type { WorkerResponse } from './worker';

type ConvertCallback = (
  err: string | null,
  result?: { png: ArrayBuffer; width: number; height: number }
) => void;

type QueueItem = {
  svg: string;
  options: ResvgOptions;
  callback: ConvertCallback;
};

let worker: Worker | null = null;
let ready = false;
let initError: string | null = null;
// 用于 whenReady() 单次 resolve/reject 通知。Worker 触发 'ready'/'init-error' 时调用并清空。
let readyResolvers: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];
// 等待 worker 'ready' 之前积压的请求；ready 后 flush。
const pendingQueue: QueueItem[] = [];
// 已 ready 后的任务队列，确保 worker 单插槽回调不被并发覆盖。
const runQueue: QueueItem[] = [];
let currentCallback: ConvertCallback | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' }
    );
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.type === 'ready') {
        ready = true;
        const resolvers = readyResolvers;
        readyResolvers = [];
        resolvers.forEach((r) => r.resolve());
        // ready 前积压的请求统一搬到 runQueue，再 runNext 一次启动消费。
        runQueue.push(...pendingQueue.splice(0));
        runNext();
        return;
      }
      if (e.data.type === 'init-error') {
        const message = e.data.message;
        const err = new Error(message);
        initError = message;
        const resolvers = readyResolvers;
        readyResolvers = [];
        resolvers.forEach((r) => r.reject(err));
        // 把积压请求和已入队请求统一以失败回调返回，让上层走 fallback。
        const drained = [...pendingQueue.splice(0), ...runQueue.splice(0)];
        drained.forEach((item) => item.callback(message));
        currentCallback = null;
        return;
      }
      if (e.data.type === 'success') {
        const cb = currentCallback;
        currentCallback = null;
        cb?.(null, { png: e.data.png, width: e.data.width, height: e.data.height });
      } else if (e.data.type === 'error') {
        const cb = currentCallback;
        currentCallback = null;
        cb?.(e.data.message);
      }
      runNext();
    };
  }
  return worker;
}

function enqueue(item: QueueItem) {
  runQueue.push(item);
  runNext();
}

function runNext() {
  if (currentCallback) return;
  const next = runQueue.shift();
  if (!next) return;
  currentCallback = next.callback;
  getWorker().postMessage({ type: 'convert', svg: next.svg, options: next.options });
}

export function whenReady(): Promise<void> {
  if (ready) return Promise.resolve();
  if (initError) return Promise.reject(new Error(initError));
  getWorker();
  return new Promise<void>((resolve, reject) => {
    readyResolvers.push({ resolve, reject });
  });
}

export function isReady(): boolean {
  return ready;
}

export function convert(
  svg: string,
  options: ResvgOptions,
  callback: ConvertCallback
) {
  if (initError) {
    callback(initError);
    return;
  }
  if (!ready) {
    pendingQueue.push({ svg, options, callback });
    getWorker();
    return;
  }
  enqueue({ svg, options, callback });
}

// Promise 包装版，便于 async/await 调用。
// 内部仍走 callback 版 convert，复用同一条 worker 串行队列；
// 保留 convert 是为了渐进迁移期间不破坏现有调用方。
export function convertAsync(
  svg: string,
  options: ResvgOptions
): Promise<{ png: ArrayBuffer; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    convert(svg, options, (err, result) => {
      if (err) reject(new Error(err));
      else resolve(result!);
    });
  });
}
