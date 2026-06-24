export type BatchItem = {
  id: string;
  fileName: string;
  svg: string;
  // SVG 内容的真实 UTF-8 字节数。
  // 不能用 svg.length 兜底——string.length 数的是 UTF-16 code unit，
  // 中文/emoji 会让批量总量上限被系统性低估，造成 MAX_BATCH_TOTAL_BYTES 失守。
  byteSize: number;
  // 该 SVG 文件解析出的原始尺寸（用于等比锁定与 fitMode 计算）。
  // 解析不到时保持 null，buildResvgOptions 会安全回退。
  svgWidth: number | null;
  svgHeight: number | null;
  status: 'pending' | 'converting' | 'done' | 'error';
  // 每次 reset / 重排队都自增；worker 回调对比 attemptId 决定结果是否已作废，
  // 避免 status 比对在快速 reset→pick→reset 序列下的 ABA 隐患。
  attemptId: number;
  pngBlob?: Blob;
  pngUrl?: string;
  width?: number;
  height?: number;
  error?: string;
};

type FileInput = {
  fileName: string;
  svg: string;
  // 调用方传入真实字节数（如 File.size 或下载流累计长度）；
  // 省略时由 TextEncoder 现算，避免对 svg.length 形成隐式依赖。
  byteSize?: number;
  svgWidth?: number | null;
  svgHeight?: number | null;
};

export class BatchConverter {
  private items: BatchItem[] = [];
  private idCounter = 0;

  private nextId(): string {
    this.idCounter += 1;
    return `item-${this.idCounter}-${Date.now()}`;
  }

  addFile(file: FileInput): BatchItem {
    const item: BatchItem = {
      id: this.nextId(),
      fileName: file.fileName,
      svg: file.svg,
      byteSize: file.byteSize ?? new TextEncoder().encode(file.svg).byteLength,
      svgWidth: file.svgWidth ?? null,
      svgHeight: file.svgHeight ?? null,
      status: 'pending',
      attemptId: 0,
    };
    this.items.push(item);
    return item;
  }

  updateItem(
    id: string,
    patch: Partial<Omit<BatchItem, 'id' | 'fileName' | 'svg' | 'byteSize' | 'svgWidth' | 'svgHeight' | 'attemptId'>>
  ): void {
    const idx = this.items.findIndex((item) => item.id === id);
    if (idx === -1) return;
    this.items[idx] = { ...this.items[idx], ...patch };
  }

  // 重置 item 为 pending 状态，递增 attemptId 让旧回调失效，并 revoke 旧 ObjectURL。
  // 返回新 attemptId，调用方可在新一次 runOne 时持有以校验作废。
  resetItem(id: string): number | null {
    const idx = this.items.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    const prev = this.items[idx];
    if (prev.pngUrl) {
      try { URL.revokeObjectURL(prev.pngUrl); } catch { /* ignore */ }
    }
    const attemptId = prev.attemptId + 1;
    this.items[idx] = {
      ...prev,
      status: 'pending',
      attemptId,
      pngBlob: undefined,
      pngUrl: undefined,
      width: undefined,
      height: undefined,
      error: undefined,
    };
    return attemptId;
  }

  // 删除一个 item，自动 revoke ObjectURL。
  removeItem(id: string): void {
    const idx = this.items.findIndex((item) => item.id === id);
    if (idx === -1) return;
    const item = this.items[idx];
    if (item.pngUrl) {
      try { URL.revokeObjectURL(item.pngUrl); } catch { /* ignore */ }
    }
    this.items.splice(idx, 1);
  }

  getItem(id: string): BatchItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  getItems(): BatchItem[] {
    return [...this.items];
  }

  // 当前累计真实字节数（用于批量总量上限校验）。
  getTotalBytes(): number {
    let total = 0;
    for (const item of this.items) {
      total += item.byteSize;
    }
    return total;
  }

  reset(): void {
    for (const item of this.items) {
      if (item.pngUrl) {
        try { URL.revokeObjectURL(item.pngUrl); } catch { /* ignore */ }
      }
    }
    this.items = [];
  }
}