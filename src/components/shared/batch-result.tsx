'use client';

import { Download, Check, X, Loader2, RotateCcw, FileDown, Trash2 } from 'lucide-react';
import { zip } from 'fflate';
import type { BatchItem } from '@/lib/shared/batch';

type BatchResultProps = {
  items: BatchItem[];
  progress: { total: number; done: number; pending: number; converting: number; error: number };
  onReset: () => void;
  onRemoveItem?: (id: string) => void;
};

function StatusIcon({ status }: { status: BatchItem['status'] }) {
  switch (status) {
    case 'pending':
      return <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />;
    case 'converting':
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    case 'done':
      return <Check className="h-4 w-4 text-green-600" />;
    case 'error':
      return <X className="h-4 w-4 text-destructive" />;
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 避免同名 SVG(如 logo.svg, subdir/logo.svg)在 ZIP 中互相覆盖。
// 重名时按 `name (2).png`、`name (3).png` 递增。
function uniqueFileName(baseName: string, taken: Set<string>): string {
  if (!taken.has(baseName)) {
    taken.add(baseName);
    return baseName;
  }
  const dot = baseName.lastIndexOf('.');
  const stem = dot === -1 ? baseName : baseName.slice(0, dot);
  const ext = dot === -1 ? '' : baseName.slice(dot);
  for (let i = 2; ; i++) {
    const candidate = `${stem} (${i})${ext}`;
    if (!taken.has(candidate)) {
      taken.add(candidate);
      return candidate;
    }
  }
}

async function downloadZip(items: BatchItem[]) {
  const doneItems = items.filter((item) => item.status === 'done' && item.pngBlob);
  if (doneItems.length === 0) return;

  const fileData: Record<string, Uint8Array> = {};
  const taken = new Set<string>();

  await Promise.all(
    doneItems.map(async (item) => {
      const pngName = uniqueFileName(item.fileName.replace(/\.svg$/i, '.png'), taken);
      const buf = await item.pngBlob!.arrayBuffer();
      fileData[pngName] = new Uint8Array(buf);
    })
  );

  zip(fileData, (err, data) => {
    if (err) {
      console.error('[BatchResult] ZIP packaging failed:', err);
      return;
    }
    const blob = new Blob([data], { type: 'application/zip' });
    downloadBlob(blob, 'svg-to-png.zip');
  });
}

export function BatchResult({ items, progress, onReset, onRemoveItem }: BatchResultProps) {
  const allDone = progress.total > 0 && progress.done + progress.error === progress.total && progress.converting === 0;
  const hasDone = progress.done > 0;
  const percent = progress.total > 0 ? Math.round(((progress.done + progress.error) / progress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {allDone ? 'Conversion Complete' : `${progress.done + progress.error}/${progress.total} Completed`}
          </span>
          <span className="text-muted-foreground">{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Item list */}
      <div className="divide-y rounded-xl border bg-background shadow-sm overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
            <StatusIcon status={item.status} />
            <span className="flex-1 truncate text-sm font-medium">{item.fileName}</span>
            {item.status === 'done' && item.width && item.height && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md tabular-nums">{item.width}×{item.height}</span>
            )}
            {item.status === 'done' && item.pngBlob && (
              <button
                onClick={() => downloadBlob(item.pngBlob!, item.fileName.replace(/\.svg$/i, '.png'))}
                className="rounded-md p-1.5 hover:bg-accent hover:text-foreground text-muted-foreground transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            {item.status === 'error' && item.error && (
              <span className="text-xs text-destructive truncate max-w-[200px] bg-destructive/10 px-2 py-1 rounded-md">{item.error}</span>
            )}
            {onRemoveItem && (
              <button
                onClick={() => onRemoveItem(item.id)}
                className="rounded-md p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center pt-2">
        {allDone && hasDone && (
          <button
            onClick={() => downloadZip(items)}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 transition-all shadow-sm hover:shadow"
          >
            <FileDown className="h-4 w-4" />
            Download All (ZIP)
          </button>
        )}
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border bg-background px-5 py-2.5 text-sm font-medium hover:bg-accent hover:text-foreground text-muted-foreground transition-colors shadow-sm"
        >
          <RotateCcw className="h-4 w-4" />
          Upload More
        </button>
      </div>
    </div>
  );
}