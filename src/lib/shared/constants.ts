export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 服务端 /api/convert 请求体上限。
// 客户端 fallback 把 SVG 原文（≤ MAX_FILE_SIZE）通过 JSON.stringify 包裹一层
// （双引号转义 + Unicode \uXXXX + options 字段），实际字节数会显著放大。
// 留 1.5x 余量避免合法上传被 413 拒绝。
export const MAX_REQUEST_BYTES = Math.floor(MAX_FILE_SIZE * 1.5);

// 批量上传约束：避免用户一次拖入海量大文件耗尽浏览器内存。
export const MAX_BATCH_FILES = 50;
export const MAX_BATCH_TOTAL_BYTES = 100 * 1024 * 1024;
