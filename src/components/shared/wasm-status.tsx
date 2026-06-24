'use client';

type WasmStatusProps = {
  isReady: boolean;
  isLoading: boolean;
  hasFailed?: boolean;
};

export function WasmStatus({ isReady, isLoading, hasFailed }: WasmStatusProps) {
  if (hasFailed) {
    return (
      <p className="text-xs text-muted-foreground">
        Using server-side fallback (client-side conversion engine unavailable)
      </p>
    );
  }

  if (isReady) {
    return (
      <p className="text-xs text-muted-foreground">
        Conversion engine ready
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="text-xs text-muted-foreground animate-pulse">
        Loading conversion engine...
      </p>
    );
  }

  return null;
}