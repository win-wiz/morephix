'use client';

import { useCallback, useState } from 'react';
import { Upload, Link } from 'lucide-react';
import { MAX_FILE_SIZE } from '@/lib/shared/constants';

type DropZoneProps = {
  onFilesAccepted: (files: File[]) => void;
  onUrlImport: (url: string) => void;
};

export function DropZone({ onFilesAccepted, onUrlImport }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');

  const validateAndAccept = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const validFiles: File[] = [];
      let nonSvg = 0;
      let oversize = 0;
      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith('.svg')) {
          nonSvg += 1;
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          oversize += 1;
          continue;
        }
        validFiles.push(file);
      }
      if (nonSvg > 0 || oversize > 0) {
        const parts: string[] = [];
        if (nonSvg > 0) parts.push(`${nonSvg} non-SVG`);
        if (oversize > 0) parts.push(`${oversize} over 10MB`);
        setError(`Ignored ${parts.join(', ')} file(s)`);
      }
      if (validFiles.length > 0) {
        onFilesAccepted(validFiles);
      }
    },
    [onFilesAccepted]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        validateAndAccept(e.dataTransfer.files);
      }
    },
    [validateAndAccept]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        validateAndAccept(e.target.files);
      }
    },
    [validateAndAccept]
  );

  const handleUrlSubmit = useCallback(() => {
    const url = urlInput.trim();
    if (!url) return;
    onUrlImport(url);
    setUrlInput('');
  }, [urlInput, onUrlImport]);

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleUrlSubmit();
    },
    [handleUrlSubmit]
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed p-14 transition-all duration-200 bg-background/50 backdrop-blur-sm ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[0.99]'
            : 'border-border hover:bg-background/80 hover:border-primary/50'
        }`}
      >
        <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm border transition-transform duration-200 ${isDragging ? 'scale-110 text-primary' : 'text-primary group-hover:scale-110'}`}>
          <Upload className="h-5 w-5" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">
            Drag and drop SVG files here, or
            <label className="cursor-pointer text-primary ml-1 hover:underline underline-offset-4">
              <span>browse files</span>
              <input
                type="file"
                accept=".svg"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
            </label>
          </p>
          <p className="text-xs text-muted-foreground">Supports batch processing. Max file size: 10MB.</p>
        </div>
        {error && (
          <div className="mt-2 rounded-md bg-destructive/10 px-3 py-1.5 text-xs text-destructive font-medium">
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-2xl border-2 border-border bg-background/50 backdrop-blur-sm px-4 py-3 transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
          <Link className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            placeholder="Paste SVG URL (e.g. https://...)"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <button
          onClick={handleUrlSubmit}
          disabled={!urlInput.trim()}
          className="shrink-0 rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 disabled:hover:bg-primary shadow-sm"
        >
          Import URL
        </button>
      </div>
    </div>
  );
}