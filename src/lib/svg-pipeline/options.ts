export type ConvertOptions = {
  width: number | null;
  height: number | null;
  svgWidth: number;
  svgHeight: number;
  lockAspectRatio: boolean;
  dpi: number;
  background: string;
  fitMode: 'fit' | 'stretch' | 'crop';
};

type FitTo =
  | { mode: 'original' }
  | { mode: 'width'; value: number }
  | { mode: 'height'; value: number }
  | { mode: 'zoom'; value: number };

export type ResvgOptions = {
  fitTo: FitTo;
  dpi: number;
  background?: string;
  font: { fontBuffers: never[] };
};

// resvg-wasm 的 fitTo 仅支持等比缩放（width/height/zoom/original），
// 因此 stretch 无法在引擎层实现，crop 也只能等比放大到撑满目标矩形之一。
// 真正像素级 stretch/crop 需要在 PNG 后用 canvas 重采样/裁剪。
export function buildResvgOptions(opts: ConvertOptions): ResvgOptions {
  const fitTo = resolveFitTo(opts);
  return {
    fitTo,
    dpi: opts.dpi,
    ...(opts.background !== 'transparent' && { background: opts.background }),
    font: { fontBuffers: [] },
  };
}

function resolveFitTo(opts: ConvertOptions): FitTo {
  const { width, height, svgWidth, svgHeight, fitMode } = opts;

  if (width === null && height === null) {
    return { mode: 'original' };
  }
  if (width !== null && height === null) {
    return { mode: 'width', value: width };
  }
  if (height !== null && width === null) {
    return { mode: 'height', value: height };
  }

  // width 和 height 都给了：按 fitMode 决定 zoom 系数。
  const w = width as number;
  const h = height as number;
  if (svgWidth <= 0 || svgHeight <= 0) {
    return { mode: 'width', value: w };
  }

  const zoomX = w / svgWidth;
  const zoomY = h / svgHeight;

  if (fitMode === 'crop') {
    return { mode: 'zoom', value: Math.max(zoomX, zoomY) };
  }
  if (fitMode === 'stretch') {
    // resvg 无法非等比 stretch，按 width 作为基准（与 crop/fit 不同的语义提示）。
    return { mode: 'width', value: w };
  }
  // fit（默认）：完整显示，不超出目标矩形。
  return { mode: 'zoom', value: Math.min(zoomX, zoomY) };
}
