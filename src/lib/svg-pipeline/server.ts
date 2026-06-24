import { initWasm, Resvg } from '@resvg/resvg-wasm';
import type { ResvgOptions } from './options';

type WasmSource = ArrayBuffer | WebAssembly.Module | string;

// initPromise 缓存：保证并发请求共享同一次 WASM 初始化。
// 注意 initWasm 在同一进程内只能成功执行一次，竞态多次调用会抛错。
//
// 失败语义与 worker.ts 故意相反：
// - server：Cloudflare Workers 冷启动可能换 isolate，失败清缓存允许下次请求重试。
// - worker：同一 worker 实例失败重试也救不了（需重建 worker），失败粘性更准确。
let initPromise: Promise<void> | null = null;

function ensureInit(wasmSource?: WasmSource): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
        if (!wasmSource) {
          throw new Error('wasmSource is required');
        }
        await initWasm(wasmSource);
    } catch (err) {
      // 失败时清掉缓存，下一次请求可以重试。
      initPromise = null;
      throw err instanceof Error
        ? new Error(`Failed to initialize Resvg WASM on server: ${err.message}`)
        : new Error('Failed to initialize Resvg WASM on server');
    }
  })();
  return initPromise;
}

export async function convertOnServer(
  svg: string,
  options: ResvgOptions,
  wasmSource?: WasmSource
): Promise<{ png: Uint8Array; width: number; height: number }> {
  await ensureInit(wasmSource);
  let resvg: InstanceType<typeof Resvg> | null = null;
  let rendered: ReturnType<InstanceType<typeof Resvg>['render']> | null = null;
  try {
    resvg = new Resvg(svg, options);
    rendered = resvg.render();
    const png = rendered.asPng();
    return { png, width: rendered.width, height: rendered.height };
  } finally {
    try { rendered?.free(); } catch { /* ignore */ }
    try { resvg?.free(); } catch { /* ignore */ }
  }
}
