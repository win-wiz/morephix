'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { DropZone } from '@/components/shared/drop-zone';
import { BatchResult } from '@/components/shared/batch-result';
import { AdvancedOptions } from './advanced-options';
import { WasmStatus } from '@/components/shared/wasm-status';
import { convert, whenReady } from '@/lib/svg-pipeline/client';
import { parseSvg } from '@/lib/svg-pipeline/svg-parser';
import { buildResvgOptions, type ConvertOptions } from '@/lib/svg-pipeline/options';
import { BatchConverter, type BatchItem } from '@/lib/shared/batch';
import { importSvgFromUrl, formatImportError } from '@/lib/shared/url-import';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { addHistoryRecord, type HistoryRecord } from '@/lib/shared/history-db';
import {
  MAX_FILE_SIZE,
  MAX_REQUEST_BYTES,
  MAX_BATCH_FILES,
  MAX_BATCH_TOTAL_BYTES,
} from '@/lib/shared/constants';

const DEFAULT_OPTIONS: ConvertOptions = {
  width: null,
  height: null,
  svgWidth: 100,
  svgHeight: 100,
  lockAspectRatio: true,
  dpi: 150,
  background: 'transparent',
  fitMode: 'fit',
};

// ConvertOptions 是扁平对象，所有字段都是原始值，可用 shallow equal 安全比较。
function sameOptions(a: ConvertOptions, b: ConvertOptions): boolean {
  return (
    a.width === b.width &&
    a.height === b.height &&
    a.svgWidth === b.svgWidth &&
    a.svgHeight === b.svgHeight &&
    a.lockAspectRatio === b.lockAspectRatio &&
    a.dpi === b.dpi &&
    a.background === b.background &&
    a.fitMode === b.fitMode
  );
}

export function ConverterApp() {
  const [options, setOptions] = useLocalStorage<ConvertOptions>('morephix_svg_options', DEFAULT_OPTIONS);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [wasmReady, setWasmReady] = useState(false);
  const [wasmLoading, setWasmLoading] = useState(true);
  const [wasmFailed, setWasmFailed] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  // 用 useState lazy init 而非 useRef,避免 React 19 strict mode double-invoke 时重复构造。
  const [converter] = useState(() => new BatchConverter());
  const convertingRef = useRef(false);
  // 让 processQueue 始终看到最新的 options,无需把它当依赖重建闭包。
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // 跟踪所有 in-flight 的 fallback fetch,reset / unmount 时一次性 abort,
  // 避免请求结果在组件销毁后才回来打到已 revoke 的 state。
  const inFlightControllersRef = useRef<Set<AbortController>>(new Set());

  useEffect(() => {
    let cancelled = false;
    whenReady().then(
      () => {
        if (cancelled) return;
        setWasmReady(true);
        setWasmLoading(false);
        setWasmFailed(false);
      },
      () => {
        // WASM 初始化失败:UI 退出 loading 状态,
        // 后续 convert 会立刻回失败回调走服务端 fallback。
        if (cancelled) return;
        setWasmReady(false);
        setWasmLoading(false);
        setWasmFailed(true);
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // unmount 时回收所有未释放的 PNG Object URL,并 abort 所有 in-flight fallback。
  useEffect(() => {
    const inFlight = inFlightControllersRef.current;
    return () => {
      for (const item of converter.getItems()) {
        if (item.pngUrl) URL.revokeObjectURL(item.pngUrl);
      }
      for (const ctrl of inFlight) {
        try { ctrl.abort(); } catch { /* ignore */ }
      }
      inFlight.clear();
    };
  }, [converter]);

  const syncItems = useCallback(() => {
    setItems(converter.getItems());
  }, [converter]);

  const saveToHistory = useCallback((item: BatchItem, opts: ConvertOptions) => {
    const recordOptions = {
      ...opts,
      svgWidth: item.svgWidth ?? opts.svgWidth,
      svgHeight: item.svgHeight ?? opts.svgHeight,
    };
    void addHistoryRecord({
      fileName: item.fileName,
      svgContent: item.svg,
      byteSize: item.byteSize,
      options: recordOptions,
    });
  }, []);

  // 生产-消费循环:处理直到 pending 队列被排空,期间新进来的 pending 也会被吃掉。
  const processQueue = useCallback(() => {
    if (convertingRef.current) return;

    const pickNext = () => converter.getItems().find((it) => it.status === 'pending');

    const first = pickNext();
    if (!first) return;
    convertingRef.current = true;

    const runOne = (item: BatchItem) => {
      // 记录此次尝试的 attemptId,回调里靠它判断结果是否已作废。
      // 比 status === 'converting' 更可靠:resetItem 会原子递增 attemptId,
      // 即使发生 reset→pick→reset 的快速序列也能识别为不同尝试。
      const myAttemptId = item.attemptId;
      converter.updateItem(item.id, { status: 'converting' });
      syncItems();

      const isStale = () => {
        const current = converter.getItem(item.id);
        return !current || current.attemptId !== myAttemptId;
      };

      // 使用 item 自带的真实 SVG 尺寸构造 resvg options,
      // 保证 fitMode/zoom 计算的基准是每个文件的真实比例,而不是 UI 默认 100x100。
      const opts = optionsRef.current;
      const resvgOptions = buildResvgOptions({
        ...opts,
        svgWidth: item.svgWidth ?? opts.svgWidth,
        svgHeight: item.svgHeight ?? opts.svgHeight,
      });

      convert(item.svg, resvgOptions, async (err, result) => {
        // 在写回结果前确认这次转换没有被 handleOptionsChange / removeItem 作废。
        if (isStale()) {
          syncItems();
          const next = pickNext();
          if (next) runOne(next);
          else convertingRef.current = false;
          return;
        }
        if (err) {
          // 客户端 worker 失败(含 init-error 粘性后的所有后续 item)回退到 /api/convert。
          // 这是 WASM 永久失败时唯一能让批量转换继续工作的路径,删除会使整批转换全报错。
          const ctrl = new AbortController();
          inFlightControllersRef.current.add(ctrl);
          const timeoutId = setTimeout(() => ctrl.abort(), 30_000);
          try {
            const requestBody = JSON.stringify({
              svg: item.svg,
              options: {
                ...opts,
                svgWidth: item.svgWidth ?? opts.svgWidth,
                svgHeight: item.svgHeight ?? opts.svgHeight,
              },
            });
            // JSON.stringify 后的实际字节数(双引号转义 + Unicode \uXXXX)可能比 svg.length 大很多。
            // 客户端先校验一次,给出明确错误而不是等服务端 413。
            if (requestBody.length > MAX_REQUEST_BYTES) {
              throw new Error('SVG is too large for server-side fallback conversion.');
            }
            const resp = await fetch('/api/convert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: requestBody,
              signal: ctrl.signal,
            });
            if (isStale()) {
              syncItems();
              const next = pickNext();
              if (next) runOne(next);
              else convertingRef.current = false;
              return;
            }
            if (!resp.ok) {
              const data = await resp.json().catch(() => ({}));
              throw new Error(data.error || `Server conversion failed (${resp.status})`);
            }
            const buf = await resp.arrayBuffer();
            if (isStale()) {
              syncItems();
              const next = pickNext();
              if (next) runOne(next);
              else convertingRef.current = false;
              return;
            }
            const width = Number(resp.headers.get('X-Width')) || 0;
            const height = Number(resp.headers.get('X-Height')) || 0;
            const blob = new Blob([buf], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            converter.updateItem(item.id, {
              status: 'done',
              pngBlob: blob,
              pngUrl: url,
              width,
              height,
            });
            
            // 成功后保存到历史记录
            saveToHistory(item, opts);
          } catch (fallbackErr) {
            if (!isStale()) {
              const message =
                fallbackErr instanceof DOMException && fallbackErr.name === 'AbortError'
                  ? 'Server conversion timed out or was cancelled'
                  : fallbackErr instanceof Error
                    ? fallbackErr.message
                    : 'Conversion failed';
              converter.updateItem(item.id, { status: 'error', error: message });
            }
          } finally {
            clearTimeout(timeoutId);
            inFlightControllersRef.current.delete(ctrl);
          }
        } else {
          const blob = new Blob([result!.png], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          converter.updateItem(item.id, {
            status: 'done',
            pngBlob: blob,
            pngUrl: url,
            width: result!.width,
            height: result!.height,
          });
          
          // 成功后保存到历史记录
          saveToHistory(item, opts);
        }
        syncItems();

        const next = pickNext();
        if (next) {
          runOne(next);
        } else {
          convertingRef.current = false;
        }
      });
    };

    runOne(first);
  }, [syncItems, converter, saveToHistory]);

  // 用第一个有真实尺寸的 item 驱动 AdvancedOptions 的锁定比例/预设基准。
  // 派生而非 setState,避免 effect 内 setState 触发级联渲染。
  const representative = useMemo(
    () => items.find((it) => it.svgWidth && it.svgHeight),
    [items]
  );
  const displayOptions = useMemo<ConvertOptions>(
    () =>
      representative
        ? { ...options, svgWidth: representative.svgWidth!, svgHeight: representative.svgHeight! }
        : options,
    [options, representative]
  );

  // 校验单次新增是否会突破批量总量限制,返回允许处理的子集与拒绝信息。
  const validateBatchAddition = useCallback(
    (additions: Array<{ size: number }>): { accepted: number; rejected: number; reason: string | null } => {
      const currentCount = converter.getItems().length;
      const currentBytes = converter.getTotalBytes();
      let accepted = 0;
      let bytes = currentBytes;
      for (const a of additions) {
        if (currentCount + accepted >= MAX_BATCH_FILES) break;
        if (bytes + a.size > MAX_BATCH_TOTAL_BYTES) break;
        accepted += 1;
        bytes += a.size;
      }
      const rejected = additions.length - accepted;
      if (rejected === 0) return { accepted, rejected, reason: null };
      const reason =
        currentCount + accepted >= MAX_BATCH_FILES
          ? `Batch file limit reached (${MAX_BATCH_FILES}). Ignored ${rejected} file(s).`
          : `Batch size limit exceeded (${MAX_BATCH_TOTAL_BYTES / 1024 / 1024}MB). Ignored ${rejected} file(s).`;
      return { accepted, rejected, reason };
    },
    [converter]
  );

  const handleFilesAccepted = useCallback(
    async (files: File[]) => {
      setBatchError(null);
      const sized = files.map((f) => ({ file: f, size: f.size }));
      const { accepted, reason } = validateBatchAddition(sized);
      if (reason) setBatchError(reason);
      const accepted_files = sized.slice(0, accepted);
      for (const { file } of accepted_files) {
        try {
          if (file.size > MAX_FILE_SIZE) {
            const item = converter.addFile({ fileName: file.name, svg: '', byteSize: 0 });
            converter.updateItem(item.id, { status: 'error', error: 'File size cannot exceed 10MB' });
            continue;
          }
          const svg = await file.text();
          const { width, height } = parseSvg(svg);
          converter.addFile({
            fileName: file.name,
            svg,
            // file.size 已是 UTF-8 字节数，避免再用 TextEncoder 二次编码。
            byteSize: file.size,
            svgWidth: width,
            svgHeight: height,
          });
        } catch (err) {
          const item = converter.addFile({ fileName: file.name, svg: '', byteSize: 0 });
          converter.updateItem(item.id, {
            status: 'error',
            error: err instanceof Error ? err.message : 'Failed to read file',
          });
        }
      }
      syncItems();
      processQueue();
    },
    [syncItems, processQueue, converter, validateBatchAddition]
  );

  const handleUrlImport = useCallback(
    async (url: string) => {
      setBatchError(null);
      // URL 导入暂以单个文件计入限额(下载前无法精确知道大小,先按 0 占位由实际下载后判断)。
      const { accepted, reason } = validateBatchAddition([{ size: 0 }]);
      if (reason) setBatchError(reason);
      if (accepted === 0) return;
      const ctrl = new AbortController();
      inFlightControllersRef.current.add(ctrl);
      const timeoutId = setTimeout(() => ctrl.abort(), 30_000);
      try {
        const result = await importSvgFromUrl(url, ctrl.signal);
        if (!result.ok) {
          const displayUrl = url.length > 60 ? `${url.slice(0, 57)}...` : url;
          const item = converter.addFile({ fileName: `URL: ${displayUrl}`, svg: '', byteSize: 0 });
          converter.updateItem(item.id, {
            status: 'error',
            error: formatImportError(result.error),
          });
          syncItems();
          return;
        }
        // 下载完成后用真实字节数（importSvgFromUrl 返回的累计 byteSize）再次校验总量。
        const overByBytes =
          converter.getTotalBytes() + result.byteSize > MAX_BATCH_TOTAL_BYTES;
        if (overByBytes) {
          setBatchError(`Batch size limit exceeded (${MAX_BATCH_TOTAL_BYTES / 1024 / 1024}MB). Ignored this import.`);
          return;
        }
        const { width, height } = parseSvg(result.svg);
        converter.addFile({
          fileName: result.fileName,
          svg: result.svg,
          byteSize: result.byteSize,
          svgWidth: width,
          svgHeight: height,
        });
        syncItems();
        processQueue();
      } finally {
        clearTimeout(timeoutId);
        inFlightControllersRef.current.delete(ctrl);
      }
    },
    [syncItems, processQueue, converter, validateBatchAddition]
  );

  const handleOptionsChange = useCallback(
    (newOptions: ConvertOptions) => {
      // shallow equal early return:避免子组件回传同值时触发整批重转。
      if (sameOptions(newOptions, options)) return;
      setOptions(newOptions);
      // 把已完成、出错、以及正在转换的 item 全部重置回 pending。
      // resetItem 递增 attemptId,正在 converting 的 item 在回调里通过 isStale() 丢弃旧结果。
      const affected = converter
        .getItems()
        .filter((item) => item.status !== 'pending');
      if (affected.length === 0) return;

      for (const item of affected) {
        converter.resetItem(item.id);
      }
      syncItems();
      processQueue();
    },
    [options, setOptions, syncItems, processQueue, converter]
  );

  const handleRemoveItem = useCallback(
    (id: string) => {
      converter.removeItem(id);
      syncItems();
    },
    [syncItems, converter]
  );

  const handleReset = useCallback(() => {
    // abort 所有 in-flight fetch,避免其结果在 reset 后写回 state。
    for (const ctrl of inFlightControllersRef.current) {
      try { ctrl.abort(); } catch { /* ignore */ }
    }
    inFlightControllersRef.current.clear();
    converter.reset();
    setItems([]);
    setOptions(DEFAULT_OPTIONS);
    setBatchError(null);
    convertingRef.current = false;
  }, [converter, setOptions]);

  const hasItems = items.length > 0;
  // 从 items 派生 progress,不能在 render 阶段读 converterRef.current(React 19 规则)。
  const progress = useMemo(() => {
    const counts = { total: items.length, done: 0, pending: 0, converting: 0, error: 0 };
    for (const item of items) {
      counts[item.status] += 1;
    }
    return counts;
  }, [items]);

  const handleRestoreHistory = useCallback((record: HistoryRecord) => {
    // 恢复配置
    setOptions(record.options);
    
    // 清空现有队列，加入历史记录中的 SVG
    converter.reset();
    setItems([]);
    setBatchError(null);
    convertingRef.current = false;
    
    const { width, height } = parseSvg(record.svgContent);
    converter.addFile({
      fileName: record.fileName,
      svg: record.svgContent,
      byteSize: record.byteSize,
      svgWidth: width,
      svgHeight: height,
    });
    
    syncItems();
    processQueue();
  }, [converter, setOptions, syncItems, processQueue]);

  // 监听从 Header HistoryPanel 发出的恢复事件
  useEffect(() => {
    const handleRestoreEvent = (e: Event) => {
      const customEvent = e as CustomEvent<HistoryRecord>;
      if (customEvent.detail) {
        handleRestoreHistory(customEvent.detail);
      }
    };
    
    window.addEventListener('morephix:restore-history', handleRestoreEvent);
    return () => {
      window.removeEventListener('morephix:restore-history', handleRestoreEvent);
    };
  }, [handleRestoreHistory]);

  return (
    <div className="space-y-4">
      {!hasItems && (
        <DropZone onFilesAccepted={handleFilesAccepted} onUrlImport={handleUrlImport} />
      )}

      {batchError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive"
        >
          {batchError}
        </div>
      )}

      {hasItems && (
        <BatchResult
          items={items}
          progress={progress}
          onReset={handleReset}
          onRemoveItem={handleRemoveItem}
        />
      )}

      <AdvancedOptions options={displayOptions} onChange={handleOptionsChange} />

      <div className="flex justify-center pt-2">
        <WasmStatus isReady={wasmReady} isLoading={wasmLoading} hasFailed={wasmFailed} />
      </div>
    </div>
  );
}
