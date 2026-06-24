import { MAX_FILE_SIZE } from './constants';

// 拒绝指向私网 / 回环 / link-local 的 hostname。
// 浏览器 fetch 受 CORS 保护，但 DNS 解析与 TCP 连接已经发生，
// 仍可作为内网设备探测面，需在请求前阻断。
const PRIVATE_HOSTNAME_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127(?:\.\d{1,3}){3}$/,
  /^0(?:\.\d{1,3}){3}$/,
  /^10(?:\.\d{1,3}){3}$/,
  /^192\.168(?:\.\d{1,3}){2}$/,
  /^172\.(1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/,
  /^169\.254(?:\.\d{1,3}){2}$/,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
];

export function isPrivateHostname(hostname: string): boolean {
  // IPv6 通常带方括号包裹，去掉再比对。
  const host = hostname.replace(/^\[|\]$/g, '');
  return PRIVATE_HOSTNAME_PATTERNS.some((re) => re.test(host));
}

export type ImportError =
  | { kind: 'invalid-url' }
  | { kind: 'invalid-protocol' }
  | { kind: 'private-host' }
  | { kind: 'http-error'; status: number }
  | { kind: 'invalid-content-type'; contentType: string }
  | { kind: 'too-large' }
  | { kind: 'not-svg' }
  | { kind: 'timeout' }
  | { kind: 'network'; message: string };

export function formatImportError(err: ImportError): string {
  switch (err.kind) {
    case 'invalid-url':
      return 'Invalid URL format';
    case 'invalid-protocol':
      return 'Only http(s) protocols are supported';
    case 'private-host':
      return 'For security reasons, private or local addresses are not supported';
    case 'http-error':
      return `Download failed (${err.status})`;
    case 'invalid-content-type':
      return `Unsupported content type: ${err.contentType}`;
    case 'too-large':
      return 'File size cannot exceed 10MB';
    case 'not-svg':
      return 'URL content is not an SVG';
    case 'timeout':
      return 'Download timed out (30s)';
    case 'network':
      return err.message;
  }
}

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function isAcceptableContentType(ct: string | null): boolean {
  if (!ct) return true;
  const lower = ct.toLowerCase();
  return (
    lower.includes('image/svg') ||
    lower.includes('text/xml') ||
    lower.includes('application/xml') ||
    lower.includes('text/plain') ||
    lower.includes('application/octet-stream')
  );
}

// 流式读取响应体，累计超过 MAX_FILE_SIZE 即 abort，避免先下完才发现超大。
// 同时返回 UTF-8 真实字节数，供调用方做批量总量校验（string.length 是 UTF-16 单位）。
async function readWithLimit(
  response: Response,
  maxBytes: number,
  signal: AbortSignal
): Promise<{ ok: true; text: string; byteSize: number } | { ok: false; reason: 'too-large' }> {
  const body = response.body;
  if (!body) {
    const text = await response.text();
    const byteSize = new TextEncoder().encode(text).byteLength;
    if (byteSize > maxBytes) return { ok: false, reason: 'too-large' };
    return { ok: true, text, byteSize };
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (true) {
      if (signal.aborted) throw new DOMException('aborted', 'AbortError');
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        if (received > maxBytes) {
          await reader.cancel().catch(() => {});
          return { ok: false, reason: 'too-large' };
        }
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(merged), byteSize: received };
}

export type ImportResult =
  | { ok: true; fileName: string; svg: string; byteSize: number }
  | { ok: false; error: ImportError };

// 单次跳转最大次数；防止 redirect loop 与无限链式跳转。
const MAX_REDIRECTS = 5;

// 手动跟随重定向，对每一跳的 Location 都重新过协议白名单和私网黑名单。
// 默认 fetch redirect: 'follow' 只会在最终 URL 阻断 CORS，但 DNS/TCP 已发生；
// 更糟的是同源 redirect 完全绕过 CORS，可被用来打同源内部接口（SSRF 间接面）。
async function fetchFollowingChecked(
  startUrl: URL,
  signal: AbortSignal
): Promise<{ ok: true; response: Response } | { ok: false; error: ImportError }> {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let resp: Response;
    try {
      resp = await fetch(current.toString(), { signal, redirect: 'manual' });
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        return { ok: false, error: { kind: 'timeout' } };
      }
      return {
        ok: false,
        error: { kind: 'network', message: err instanceof Error ? err.message : '网络错误' },
      };
    }

    // redirect: 'manual' 下，浏览器把 3xx 暴露为 opaqueredirect/0 状态。
    // 我们靠 Location 头判断是否需要继续跳；任一无效都直接拒绝。
    const status = resp.status;
    const isRedirectStatus =
      resp.type === 'opaqueredirect' || (status >= 300 && status < 400);
    if (!isRedirectStatus) {
      return { ok: true, response: resp };
    }

    const location = resp.headers.get('location');
    if (!location) {
      // opaqueredirect 在浏览器里读不到 location 头——这种情况无法安全续跳，直接拒绝。
      return { ok: false, error: { kind: 'network', message: '重定向目标未知（受浏览器限制无法读取 Location）' } };
    }
    let nextUrl: URL;
    try {
      nextUrl = new URL(location, current);
    } catch {
      return { ok: false, error: { kind: 'invalid-url' } };
    }
    if (nextUrl.protocol !== 'http:' && nextUrl.protocol !== 'https:') {
      return { ok: false, error: { kind: 'invalid-protocol' } };
    }
    if (isPrivateHostname(nextUrl.hostname)) {
      return { ok: false, error: { kind: 'private-host' } };
    }
    current = nextUrl;
  }
  return { ok: false, error: { kind: 'network', message: '重定向次数过多' } };
}

export async function importSvgFromUrl(
  rawUrl: string,
  signal: AbortSignal
): Promise<ImportResult> {
  const url = parseUrl(rawUrl);
  if (!url) return { ok: false, error: { kind: 'invalid-url' } };
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: { kind: 'invalid-protocol' } };
  }
  if (isPrivateHostname(url.hostname)) {
    return { ok: false, error: { kind: 'private-host' } };
  }

  const follow = await fetchFollowingChecked(url, signal);
  if (!follow.ok) return { ok: false, error: follow.error };
  const resp = follow.response;

  if (!resp.ok) {
    return { ok: false, error: { kind: 'http-error', status: resp.status } };
  }

  const contentType = resp.headers.get('content-type');
  if (!isAcceptableContentType(contentType)) {
    return {
      ok: false,
      error: { kind: 'invalid-content-type', contentType: contentType ?? 'unknown' },
    };
  }

  const contentLength = Number(resp.headers.get('content-length'));
  if (contentLength && contentLength > MAX_FILE_SIZE) {
    return { ok: false, error: { kind: 'too-large' } };
  }

  const read = await readWithLimit(resp, MAX_FILE_SIZE, signal);
  if (!read.ok) return { ok: false, error: { kind: 'too-large' } };

  if (!/<svg[\s>]/i.test(read.text)) {
    return { ok: false, error: { kind: 'not-svg' } };
  }

  // 解析文件名用最终重定向后的 URL（resp.url 是最后一跳）。
  const finalUrl = (() => {
    try { return new URL(resp.url || url.toString()); } catch { return url; }
  })();
  const baseName = finalUrl.pathname.split('/').pop()?.split('?')[0] || 'imported.svg';
  const fileName = baseName.toLowerCase().endsWith('.svg') ? baseName : `${baseName}.svg`;
  return { ok: true, fileName, svg: read.text, byteSize: read.byteSize };
}