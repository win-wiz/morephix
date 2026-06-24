import { initWasm, Resvg } from '@resvg/resvg-wasm';
import type { ResvgOptions } from './options';

declare const self: WorkerGlobalScope & typeof globalThis;

// initPromise 缓存：避免与底部首次 ensureInit().then() 形成并发 init 竞态。
// @resvg/resvg-wasm 同 worker 上下文只能成功初始化一次，竞态调用会抛错。
// 注意：首次失败后保留 rejected promise，使语义与 client 端 initError 粘性一致——
// 同一 worker 实例上的 WASM 失败视为永久失败，由 client 走服务端 fallback，
// 真正的重试需要刷新页面（重建 worker）。
let initPromise: Promise<void> | null = null;

function ensureInit(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = initWasm('/resvg.wasm');
  return initPromise;
}

export type WorkerRequest = {
  type: 'convert';
  svg: string;
  options: ResvgOptions;
};

export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'init-error'; message: string }
  | { type: 'success'; png: ArrayBuffer; width: number; height: number }
  | { type: 'error'; message: string };

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  if (e.data.type === 'convert') {
    let resvg: InstanceType<typeof Resvg> | null = null;
    let rendered: ReturnType<InstanceType<typeof Resvg>['render']> | null = null;
    try {
      await ensureInit();
      resvg = new Resvg(e.data.svg, e.data.options);
      rendered = resvg.render();
      const png = rendered.asPng();
      // png 是从 wasm memory 复制出的独立 Uint8Array，
      // transfer png.buffer 后再 free 是安全的（wasm 端不再持有该 buffer）。
      // png.buffer 在 lib.dom 中类型为 ArrayBufferLike，wasm 不会产出 SharedArrayBuffer，
      // 这里断言为 ArrayBuffer 以满足 WorkerResponse 的强类型。
      const buffer = png.buffer as ArrayBuffer;
      const result: WorkerResponse = {
        type: 'success',
        png: buffer,
        width: rendered.width,
        height: rendered.height,
      };
      self.postMessage(result, [buffer]);
    } catch (err) {
      const result: WorkerResponse = {
        type: 'error',
        message: err instanceof Error ? err.message : 'Unknown conversion error',
      };
      self.postMessage(result);
    } finally {
      // 无论成功失败都释放 wasm 端内存，避免 worker 长期累积导致 OOM。
      try { rendered?.free(); } catch { /* ignore */ }
      try { resvg?.free(); } catch { /* ignore */ }
    }
  }
};

ensureInit().then(
  () => self.postMessage({ type: 'ready' } as WorkerResponse),
  (err) => {
    const message = err instanceof Error ? err.message : 'WASM initialization failed';
    self.postMessage({ type: 'init-error', message } as WorkerResponse);
  }
);
