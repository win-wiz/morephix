export type ParseResult = {
  width: number | null;
  height: number | null;
};

function toString(input: string | Uint8Array): string {
  return typeof input === 'string' ? input : new TextDecoder().decode(input);
}

// 只接受有限正数，过滤 NaN / Infinity / <=0 / 解析失败的脏值，
// 否则会让 buildResvgOptions 算出 ∞ / 负 zoom 导致 wasm 渲染异常。
function safeParse(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseSvg(input: string | Uint8Array): ParseResult {
  const svg = toString(input);
  const explicitWidth = svg.match(/<svg[^>]*\swidth=["']([^"']+)["']/);
  const explicitHeight = svg.match(/<svg[^>]*\sheight=["']([^"']+)["']/);

  let width = safeParse(explicitWidth?.[1]);
  let height = safeParse(explicitHeight?.[1]);

  if (width !== null && height !== null) {
    return { width, height };
  }

  const viewBox = svg.match(/<svg[^>]*\sviewBox=["']([^"']+)["']/);
  if (viewBox) {
    const parts = viewBox[1].trim().split(/[\s,]+/);
    if (parts.length === 4) {
      width ??= safeParse(parts[2]);
      height ??= safeParse(parts[3]);
    }
  }

  return { width, height };
}
