import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ConvertOptions } from '@/lib/svg-pipeline/options';

export type HistoryRecord = {
  id: string;             // 唯一 ID (例如 uuid 或时间戳)
  fileName: string;       // 原文件名
  svgContent: string;     // SVG 字符串内容
  byteSize: number;       // 字节大小，用于计算总容量
  options: ConvertOptions;// 当时的转换配置
  timestamp: number;      // 转换时间
};

interface MorephixDB extends DBSchema {
  svgHistory: {
    key: string;
    value: HistoryRecord;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'morephix_db';
const DB_VERSION = 1;
const STORE_NAME = 'svgHistory';

// 限制配置
const MAX_HISTORY_ITEMS = 50;
const MAX_HISTORY_BYTES = 100 * 1024 * 1024; // 100MB

let dbPromise: Promise<IDBPDatabase<MorephixDB>> | null = null;

async function getDB() {
  if (typeof window === 'undefined') return null; // 仅在客户端运行
  if (!dbPromise) {
    dbPromise = openDB<MorephixDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * 清理过旧的记录（基于数量和总容量）
 */
async function enforceLimits(db: IDBPDatabase<MorephixDB>) {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('by-timestamp');

  // 获取所有记录，按时间升序（最旧的在前面）
  // 仅保存 id 和 byteSize 以避免将巨型 svgContent 载入内存导致溢出
  let cursor = await index.openCursor();
  const allRecords: { id: string; byteSize: number }[] = [];
  
  while (cursor) {
    allRecords.push({ id: cursor.value.id, byteSize: cursor.value.byteSize || 0 });
    cursor = await cursor.continue();
  }

  if (allRecords.length === 0) return;

  // 计算当前总量
  let totalBytes = allRecords.reduce((acc, record) => acc + record.byteSize, 0);
  let itemsCount = allRecords.length;
  
  const idsToDelete: string[] = [];

  // 从最旧的记录开始，如果超限就将其标记为删除
  for (const record of allRecords) {
    if (itemsCount <= MAX_HISTORY_ITEMS && totalBytes <= MAX_HISTORY_BYTES) {
      break; // 满足限制，停止淘汰
    }
    idsToDelete.push(record.id);
    itemsCount -= 1;
    totalBytes -= (record.byteSize || 0);
  }

  // 执行删除
  for (const id of idsToDelete) {
    await store.delete(id);
  }

  await tx.done;
}

export async function addHistoryRecord(record: Omit<HistoryRecord, 'id' | 'timestamp'>) {
  const db = await getDB();
  if (!db) return;

  const fullRecord: HistoryRecord = {
    ...record,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).add(fullRecord);
  await tx.done;

  // 添加后执行清理
  await enforceLimits(db);
}

export async function getAllHistoryRecords(): Promise<HistoryRecord[]> {
  const db = await getDB();
  if (!db) return [];

  // 获取所有记录，然后按时间戳降序排列（最新的在最前）
  const records = await db.getAllFromIndex(STORE_NAME, 'by-timestamp');
  return records.reverse();
}

export async function clearAllHistory() {
  const db = await getDB();
  if (!db) return;
  await db.clear(STORE_NAME);
}

export async function deleteHistoryRecord(id: string) {
  const db = await getDB();
  if (!db) return;
  await db.delete(STORE_NAME, id);
}
