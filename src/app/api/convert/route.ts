import { NextRequest, NextResponse } from 'next/server';
import { convertOnServer } from '@/lib/svg-pipeline/server';
import { buildResvgOptions, ConvertOptions } from '@/lib/svg-pipeline/options';
import { MAX_FILE_SIZE, MAX_REQUEST_BYTES } from '@/lib/shared/constants';

function getWasmUrl(request: NextRequest): string {
  const url = new URL('/resvg.wasm', request.url);
  return url.href;
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get('content-length'));
    if (contentLength && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }

    const body = await request.json();
    const { svg, options } = body as { svg: string; options: ConvertOptions };

    if (!svg || typeof svg !== 'string') {
      return NextResponse.json(
        { error: 'Invalid SVG content' },
        { status: 400 }
      );
    }
    // Content-Length 是第一道闸（可能缺失或不可信）；这里用解析后的 svg 长度做二次校验，
    // 防止 chunked / 无 Content-Length 的请求绕过上限造成内存放大。
    if (svg.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'SVG content too large' }, { status: 413 });
    }
    if (!options || typeof options !== 'object') {
      return NextResponse.json(
        { error: 'Invalid conversion options' },
        { status: 400 }
      );
    }

    const resvgOptions = buildResvgOptions(options);
    const wasmUrl = getWasmUrl(request);
    const result = await convertOnServer(svg, resvgOptions, wasmUrl);

    // 二进制响应：与客户端 fallback (resp.arrayBuffer + X-Width/X-Height) 对齐，
    // 避免把 PNG 在 JSON 里展开成 number[] 造成体积爆炸。
    return new NextResponse(result.png as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'X-Width': String(result.width),
        'X-Height': String(result.height),
      },
    });
  } catch (err) {
    console.error('[api/convert] conversion failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server conversion failed' },
      { status: 500 }
    );
  }
}
