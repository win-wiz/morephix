// src/__tests__/batch-converter.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BatchConverter } from '@/lib/shared/batch';

describe('BatchConverter', () => {
  let converter: BatchConverter;

  beforeEach(() => {
    converter = new BatchConverter();
  });

  it('addFile creates a pending item with correct data', () => {
    const item = converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
    expect(item.fileName).toBe('a.svg');
    expect(item.status).toBe('pending');
    expect(item.svg).toBe('<svg>1</svg>');
    expect(item.attemptId).toBe(0);
  });

  it('addFile defaults svgWidth/svgHeight to null when omitted', () => {
    const item = converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
    expect(item.svgWidth).toBeNull();
    expect(item.svgHeight).toBeNull();
  });

  it('addFile preserves svgWidth/svgHeight when provided', () => {
    const item = converter.addFile({
      fileName: 'c.svg',
      svg: '<svg>3</svg>',
      svgWidth: 200,
      svgHeight: 100,
    });
    expect(item.svgWidth).toBe(200);
    expect(item.svgHeight).toBe(100);
  });

  it('addFile creates unique ids across multiple calls', () => {
    const a = converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
    const b = converter.addFile({ fileName: 'b.svg', svg: '<svg>2</svg>' });
    expect(a.id).not.toBe(b.id);
    expect(converter.getItems()).toHaveLength(2);
  });

  it('updateItem updates status and result data', () => {
    const item = converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
    converter.updateItem(item.id, {
      status: 'done',
      width: 100,
      height: 100,
    });
    const updated = converter.getItems();
    expect(updated[0].status).toBe('done');
    expect(updated[0].width).toBe(100);
  });

  it('updateItem with error sets error status', () => {
    const item = converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
    converter.updateItem(item.id, {
      status: 'error',
      error: 'WASM init failed',
    });
    const updated = converter.getItems();
    expect(updated[0].status).toBe('error');
    expect(updated[0].error).toBe('WASM init failed');
  });

  it('updateItem is a noop for unknown id', () => {
    const item = converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
    const before = converter.getItems();
    converter.updateItem('non-existent-id', { status: 'done' });
    const after = converter.getItems();
    expect(after).toEqual(before);
    expect(item.status).toBe('pending');
  });

  it('item statuses can be counted from getItems', () => {
    const a = converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
    converter.addFile({ fileName: 'b.svg', svg: '<svg>2</svg>' });
    converter.updateItem(a.id, { status: 'done' });
    const items = converter.getItems();
    expect(items).toHaveLength(2);
    expect(items.filter((it) => it.status === 'done')).toHaveLength(1);
    expect(items.filter((it) => it.status === 'pending')).toHaveLength(1);
  });

  it('reset clears all items', () => {
    converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
    converter.reset();
    expect(converter.getItems()).toHaveLength(0);
  });

  describe('resetItem', () => {
    it('resets item to pending and increments attemptId', () => {
      const item = converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
      converter.updateItem(item.id, { status: 'done', width: 100, height: 100 });
      const newAttemptId = converter.resetItem(item.id);
      const reset = converter.getItem(item.id);
      expect(reset?.status).toBe('pending');
      expect(reset?.attemptId).toBe(1);
      expect(newAttemptId).toBe(1);
      expect(reset?.width).toBeUndefined();
      expect(reset?.height).toBeUndefined();
    });

    it('resetItem on rapid successive calls keeps attemptId monotonic', () => {
      const item = converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
      converter.resetItem(item.id);
      converter.resetItem(item.id);
      converter.resetItem(item.id);
      expect(converter.getItem(item.id)?.attemptId).toBe(3);
    });

    it('resetItem returns null for unknown id', () => {
      expect(converter.resetItem('unknown')).toBeNull();
    });

    it('resetItem revokes the previous pngUrl', () => {
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const item = converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
      converter.updateItem(item.id, { status: 'done', pngUrl: 'blob:fake-url' });
      converter.resetItem(item.id);
      expect(revokeSpy).toHaveBeenCalledWith('blob:fake-url');
      revokeSpy.mockRestore();
    });
  });

  describe('removeItem', () => {
    it('removes item and revokes pngUrl', () => {
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const item = converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
      converter.updateItem(item.id, { status: 'done', pngUrl: 'blob:fake-url' });
      converter.removeItem(item.id);
      expect(converter.getItems()).toHaveLength(0);
      expect(revokeSpy).toHaveBeenCalledWith('blob:fake-url');
      revokeSpy.mockRestore();
    });

    it('removeItem is a noop for unknown id', () => {
      converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
      converter.removeItem('unknown');
      expect(converter.getItems()).toHaveLength(1);
    });
  });

  describe('getTotalBytes', () => {
    it('uses byteSize when provided (UTF-8 真实字节数)', () => {
      converter.addFile({ fileName: 'a.svg', svg: 'a'.repeat(10), byteSize: 10 });
      converter.addFile({ fileName: 'b.svg', svg: 'b'.repeat(20), byteSize: 20 });
      expect(converter.getTotalBytes()).toBe(30);
    });

    it('falls back to TextEncoder byteLength when byteSize omitted', () => {
      // 纯 ASCII 与 svg.length 一致；中文会算出更大的 UTF-8 字节数。
      converter.addFile({ fileName: 'c.svg', svg: 'hello' });
      expect(converter.getTotalBytes()).toBe(5);
    });

    it('handles non-ASCII svg length correctly via TextEncoder', () => {
      converter.addFile({ fileName: 'cn.svg', svg: '中文SVG内容😊' });
      // svg.length=9（UTF-16 code unit，emoji 占 2），
      // 实际 UTF-8 字节数：中(3)+文(3)+S(1)+V(1)+G(1)+内(3)+容(3)+😊(4) = 19。
      expect(converter.getTotalBytes()).toBe(19);
    });

    it('returns 0 when empty', () => {
      expect(converter.getTotalBytes()).toBe(0);
    });
  });

  describe('reset', () => {
    it('revokes all pngUrls when clearing items', () => {
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const a = converter.addFile({ fileName: 'a.svg', svg: '<svg>1</svg>' });
      const b = converter.addFile({ fileName: 'b.svg', svg: '<svg>2</svg>' });
      converter.updateItem(a.id, { status: 'done', pngUrl: 'blob:a' });
      converter.updateItem(b.id, { status: 'done', pngUrl: 'blob:b' });
      converter.reset();
      expect(revokeSpy).toHaveBeenCalledWith('blob:a');
      expect(revokeSpy).toHaveBeenCalledWith('blob:b');
      revokeSpy.mockRestore();
    });
  });
});