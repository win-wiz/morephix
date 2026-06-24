'use client';

import { useState, useEffect } from 'react';
import { History, Trash2, Clock, RotateCcw } from 'lucide-react';
import { getAllHistoryRecords, deleteHistoryRecord, clearAllHistory, type HistoryRecord } from '@/lib/shared/history-db';
import { formatDistanceToNow } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';

type HistoryPanelProps = {
  onRestore?: (record: HistoryRecord) => void;
};

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function HistoryPanel({ onRestore }: HistoryPanelProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await getAllHistoryRecords();
      setRecords(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line
      loadRecords();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteHistoryRecord(id);
    await loadRecords();
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      await clearAllHistory();
      await loadRecords();
    }
  };

  const handleRestore = (record: HistoryRecord) => {
    setIsOpen(false);
    if (onRestore) {
      onRestore(record);
    } else {
      // 派发自定义事件，让 ConverterApp 监听并处理
      const event = new CustomEvent('morephix:restore-history', { detail: record });
      window.dispatchEvent(event);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger>
        <div
          className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted cursor-pointer"
          title="Recent Conversions"
        >
          <History className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Recent Conversions</span>
        </div>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col h-full border-l p-0 gap-0">
        <SheetHeader className="border-b px-6 py-4 flex-none space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <History className="h-4 w-4" />
              Recent Conversions
            </SheetTitle>
            {records.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors mr-6"
              >
                Clear All
              </button>
            )}
          </div>
          <SheetDescription>
            100% Local. Auto-deletes oldest records when exceeding 50 items or 100MB.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Loading history...
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                <History className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No recent conversions found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  onClick={() => handleRestore(record)}
                  className="group relative flex flex-col gap-2 p-3.5 rounded-xl border bg-card hover:bg-accent hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="truncate font-medium text-sm flex-1" title={record.fileName}>
                      {record.fileName}
                    </div>
                    <button
                      onClick={(e) => handleDelete(record.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 -m-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-all"
                      title="Delete record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5" title={new Date(record.timestamp).toLocaleString()}>
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(record.timestamp, { addSuffix: true })}
                    </div>
                    <div className="flex items-center gap-3">
                      <span>{formatBytes(record.byteSize)}</span>
                      <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                        <RotateCcw className="h-3 w-3" /> Restore
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}