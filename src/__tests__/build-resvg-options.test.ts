import { describe, it, expect } from 'vitest';
import { buildResvgOptions } from '@/lib/svg-pipeline/options';
import type { ConvertOptions } from '@/lib/svg-pipeline/options';

const base: ConvertOptions = {
  width: null,
  height: null,
  svgWidth: 100,
  svgHeight: 100,
  lockAspectRatio: true,
  dpi: 150,
  background: 'transparent',
  fitMode: 'fit',
};

describe('buildResvgOptions', () => {
  it('returns mode=original when both width and height are null', () => {
    const opts = buildResvgOptions(base);
    expect(opts.fitTo).toEqual({ mode: 'original' });
  });

  it('returns mode=width when only width is provided', () => {
    const opts = buildResvgOptions({ ...base, width: 500 });
    expect(opts.fitTo).toEqual({ mode: 'width', value: 500 });
  });

  it('returns mode=height when only height is provided', () => {
    const opts = buildResvgOptions({ ...base, height: 300 });
    expect(opts.fitTo).toEqual({ mode: 'height', value: 300 });
  });

  it('fit mode (default) picks min zoom so the result fits inside target box', () => {
    const opts = buildResvgOptions({
      ...base,
      width: 200,
      height: 800,
      svgWidth: 100,
      svgHeight: 100,
      fitMode: 'fit',
    });
    expect(opts.fitTo).toEqual({ mode: 'zoom', value: 2 });
  });

  it('crop mode picks max zoom so the result fills target box', () => {
    const opts = buildResvgOptions({
      ...base,
      width: 200,
      height: 800,
      svgWidth: 100,
      svgHeight: 100,
      fitMode: 'crop',
    });
    expect(opts.fitTo).toEqual({ mode: 'zoom', value: 8 });
  });

  it('stretch mode falls back to width-based since resvg cannot non-uniformly stretch', () => {
    const opts = buildResvgOptions({
      ...base,
      width: 200,
      height: 800,
      fitMode: 'stretch',
    });
    expect(opts.fitTo).toEqual({ mode: 'width', value: 200 });
  });

  it('falls back to mode=width when svgWidth is 0 to avoid div-by-zero', () => {
    const opts = buildResvgOptions({
      ...base,
      width: 200,
      height: 200,
      svgWidth: 0,
      svgHeight: 0,
      fitMode: 'fit',
    });
    expect(opts.fitTo).toEqual({ mode: 'width', value: 200 });
  });

  it('omits background when set to transparent', () => {
    const opts = buildResvgOptions({ ...base, background: 'transparent' });
    expect(opts.background).toBeUndefined();
  });

  it('forwards background when not transparent', () => {
    const opts = buildResvgOptions({ ...base, background: '#ffffff' });
    expect(opts.background).toBe('#ffffff');
  });

  it('passes dpi through verbatim', () => {
    const opts = buildResvgOptions({ ...base, dpi: 300 });
    expect(opts.dpi).toBe(300);
  });
});
