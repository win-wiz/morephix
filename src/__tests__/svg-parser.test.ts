import { describe, it, expect } from 'vitest';
import { parseSvg } from '@/lib/svg-pipeline/svg-parser';

describe('parseSvg', () => {
  it('extracts width and height from SVG attributes', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect/></svg>';
    const result = parseSvg(svg);
    expect(result.width).toBe(200);
    expect(result.height).toBe(150);
  });

  it('extracts dimensions from viewBox when width/height are missing', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect/></svg>';
    const result = parseSvg(svg);
    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
  });

  it('prefers explicit width/height over viewBox', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 300 200"><rect/></svg>';
    const result = parseSvg(svg);
    expect(result.width).toBe(100);
    expect(result.height).toBe(80);
  });

  it('returns null dimensions when no size info available', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    const result = parseSvg(svg);
    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
  });

  it('accepts Uint8Array input', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle/></svg>';
    const bytes = new TextEncoder().encode(svg);
    const result = parseSvg(bytes);
    expect(result.width).toBe(50);
    expect(result.height).toBe(50);
  });

  it('rejects non-positive width/height and falls back to viewBox', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="-100" height="0" viewBox="0 0 300 200"><rect/></svg>';
    const result = parseSvg(svg);
    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
  });

  it('rejects non-numeric width and falls back to viewBox', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="abc" height="def" viewBox="0 0 120 80"><rect/></svg>';
    const result = parseSvg(svg);
    expect(result.width).toBe(120);
    expect(result.height).toBe(80);
  });
});
