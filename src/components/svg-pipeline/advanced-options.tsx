'use client';

import { useState, useCallback } from 'react';
import { Settings2, Lock, Unlock, Link2, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import type { ConvertOptions } from '@/lib/svg-pipeline/options';

import { ColorPicker } from '@/components/ui/color-picker';

type AdvancedOptionsProps = {
  options: ConvertOptions;
  onChange: (options: ConvertOptions) => void;
};

const SIZE_PRESET_GROUPS = [
  {
    label: 'Icons',
    presets: [
      { label: 'Favicon', width: 32, height: 32 },
      { label: 'App Icon', width: 512, height: 512 },
      { label: 'App Store', width: 1024, height: 1024 },
    ],
  },
  {
    label: 'Social Media',
    presets: [
      { label: 'Twitter', width: 400, height: 400 },
      { label: 'Wordless', width: 460, height: 460 },
      { label: 'Discord', width: 512, height: 512 },
    ],
  },
  {
    label: 'General',
    presets: [
      { label: '128', width: 128, height: 0 },
      { label: '256', width: 256, height: 0 },
      { label: '512', width: 512, height: 0 },
      { label: '1024', width: 1024, height: 0 },
      { label: '2048', width: 2048, height: 0 },
    ],
  },
];

const DPI_PRESETS = [
  { value: 72, label: '72', hint: 'Screen' },
  { value: 150, label: '150', hint: 'General' },
  { value: 300, label: '300', hint: 'Print' },
];

// 背景色调色板：包含透明 + 黑白灰阶 + 常用品牌色。
// value 是写入 ConvertOptions.background 的真实值；preview 决定色块视觉。
type Swatch = {
  label: string;
  value: string;
  preview: string;
  isTransparent?: boolean;
};

const BG_SWATCHES: Swatch[] = [
  { label: 'Transparent', value: 'transparent', preview: '', isTransparent: true },
  { label: 'White', value: '#ffffff', preview: '#ffffff' },
  { label: 'Light Gray', value: '#f5f5f5', preview: '#f5f5f5' },
  { label: 'Gray', value: '#9ca3af', preview: '#9ca3af' },
  { label: 'Dark Gray', value: '#374151', preview: '#374151' },
  { label: 'Black', value: '#000000', preview: '#000000' },
  { label: 'Red', value: '#ef4444', preview: '#ef4444' },
  { label: 'Orange', value: '#f97316', preview: '#f97316' },
  { label: 'Yellow', value: '#eab308', preview: '#eab308' },
  { label: 'Green', value: '#22c55e', preview: '#22c55e' },
  { label: 'Blue', value: '#3b82f6', preview: '#3b82f6' },
  { label: 'Purple', value: '#a855f7', preview: '#a855f7' },
];

const FIT_PRESETS: Array<{ label: string; value: ConvertOptions['fitMode']; hint: string }> = [
  { label: 'Fit', value: 'fit', hint: 'Keep Ratio' },
  { label: 'Stretch', value: 'stretch', hint: 'Fill' },
  { label: 'Crop', value: 'crop', hint: 'Center' },
];

function sanitizeDimension(raw: number | null): number | null {
  if (raw === null) return null;
  return Number.isFinite(raw) && raw > 0 ? raw : null;
}

function isValidColor(value: string): boolean {
  return /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i.test(value);
}

function summarizeSize(options: ConvertOptions): string {
  return options.width && options.height ? `${options.width}×${options.height}` : 'Original';
}

function summarizeBg(options: ConvertOptions): string {
  const matched = BG_SWATCHES.find((s) => s.value === options.background);
  return matched ? `${matched.label} BG` : 'Custom BG';
}

function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function AdvancedOptions({ options, onChange }: AdvancedOptionsProps) {
  const [open, setOpen] = useState(false);
  // draft 是 Sheet 内的本地草稿，点「应用」才 commit 到外层 options。
  const [draft, setDraft] = useState<ConvertOptions>(options);
  const [customBg, setCustomBg] = useState('');

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setDraft({ ...options });
        // 如果当前 background 不在 swatch 预设里，回填到自定义输入框。
        const inSwatches = BG_SWATCHES.some((s) => s.value === options.background);
        setCustomBg(inSwatches ? '' : options.background);
      }
      setOpen(isOpen);
    },
    [options]
  );

  const updateDraft = useCallback((patch: Partial<ConvertOptions>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, []);

  const handleApply = useCallback(() => {
    const trimmed = customBg.trim();
    const finalDraft =
      trimmed && isValidColor(trimmed)
        ? { ...draft, background: trimmed }
        : draft;
    onChange(finalDraft);
    setOpen(false);
  }, [draft, customBg, onChange]);

  const isCustomBg = !BG_SWATCHES.some((s) => s.value === draft.background);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {/* 主页入口：状态卡 — 标题/摘要在左，编辑按钮在右 */}
      <div className="rounded-xl border bg-background/50 px-4 py-3.5 shadow-sm transition-colors hover:bg-background/80">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              Export Settings
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground flex items-center gap-2">
              <span className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">{summarizeSize(options)}</span>
              <span className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{options.dpi} DPI</span>
              <span className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{summarizeBg(options)}</span>
            </p>
          </div>
          <SheetTrigger
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
            aria-label="Edit Export Settings"
          >
            <Settings2 className="h-4 w-4" />
            Edit Config
          </SheetTrigger>
        </div>
      </div>

      <SheetContent side="right" className="flex flex-col w-full sm:!max-w-xl p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Export Settings</SheetTitle>
          <SheetDescription>Click &quot;Apply&quot; to save your changes.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {/* 尺寸 */}
          <section className="space-y-4">
            <SectionHeader title="Dimensions" hint="Leave empty to use original SVG size" />

            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <label className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Width (px)</span>
                <input
                  type="number"
                  value={draft.width ?? ''}
                  placeholder="Auto"
                  onChange={(e) => {
                    const w = e.target.value ? sanitizeDimension(Number(e.target.value)) : null;
                    updateDraft({
                      width: w,
                      ...(draft.lockAspectRatio && w && draft.svgWidth
                        ? { height: Math.round((w / draft.svgWidth) * draft.svgHeight) }
                        : {}),
                    });
                  }}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm tabular-nums"
                />
              </label>

              <button
                onClick={() => updateDraft({ lockAspectRatio: !draft.lockAspectRatio })}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                  draft.lockAspectRatio ? 'bg-accent text-foreground' : 'hover:bg-accent text-muted-foreground'
                }`}
                title={draft.lockAspectRatio ? 'Aspect ratio locked' : 'Lock aspect ratio'}
                aria-label={draft.lockAspectRatio ? 'Aspect ratio locked' : 'Lock aspect ratio'}
              >
                {draft.lockAspectRatio ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </button>

              <label className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Height (px)</span>
                <input
                  type="number"
                  value={draft.height ?? ''}
                  placeholder="Auto"
                  onChange={(e) => {
                    const h = e.target.value ? sanitizeDimension(Number(e.target.value)) : null;
                    updateDraft({
                      height: h,
                      ...(draft.lockAspectRatio && h && draft.svgHeight
                        ? { width: Math.round((h / draft.svgHeight) * draft.svgWidth) }
                        : {}),
                    });
                  }}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm tabular-nums"
                />
              </label>
            </div>

            {draft.lockAspectRatio && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link2 className="h-3 w-3" />
                Changing one side will automatically sync the other to keep ratio
              </p>
            )}

            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              {SIZE_PRESET_GROUPS.map((group) => (
                <div key={group.label} className="grid grid-cols-[64px_1fr] items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.presets.map((p) => {
                      const targetHeight =
                        p.height === 0 && draft.lockAspectRatio && draft.svgWidth
                          ? Math.round((p.width / draft.svgWidth) * draft.svgHeight)
                          : p.height === 0
                            ? draft.height
                            : p.height;
                      const isActive =
                        draft.width === p.width && draft.height === targetHeight;
                      return (
                        <button
                          key={p.label}
                          onClick={() => updateDraft({ width: p.width, height: targetHeight })}
                          className={`min-w-[60px] rounded-md border px-3 py-1.5 text-xs transition-colors ${
                            isActive
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-background hover:bg-accent hover:text-accent-foreground'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          <section className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <SectionHeader title="DPI" />
              <div className="grid grid-cols-3 gap-2">
                {DPI_PRESETS.map((d) => {
                  const isActive = draft.dpi === d.value;
                  return (
                    <button
                      key={d.value}
                      onClick={() => updateDraft({ dpi: d.value })}
                      className={`flex flex-col items-center gap-0.5 rounded-md border px-2 py-2 transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <span className="text-sm font-medium tabular-nums">{d.label}</span>
                      <span className={`text-[10px] ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {d.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeader title="Fit Mode" />
              <div className="grid grid-cols-3 gap-2">
                {FIT_PRESETS.map((f) => {
                  const isActive = draft.fitMode === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => updateDraft({ fitMode: f.value })}
                      className={`flex flex-col items-center gap-0.5 rounded-md border px-2 py-2 transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <span className="text-sm font-medium">{f.label}</span>
                      <span className={`text-[10px] ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        {f.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <Separator />

          {/* 背景色：调色板 swatches + 自定义输入框 */}
          <section className="space-y-3">
            <SectionHeader title="Background Color" hint="Pick a preset or enter a custom color" />

            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-6">
                {BG_SWATCHES.map((s) => {
                  const isActive = !isCustomBg && draft.background === s.value;
                  return (
                    <button
                      key={s.value}
                      onClick={() => {
                        updateDraft({ background: s.value });
                        setCustomBg('');
                      }}
                      title={s.label}
                      aria-label={s.label}
                      className={`group relative flex aspect-square items-center justify-center rounded-md border-2 transition-all ${
                        isActive
                          ? 'border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                          : 'border-border hover:border-foreground/40'
                      }`}
                      style={
                        s.isTransparent
                          ? { background: 'repeating-conic-gradient(#d4d4d4 0% 25%, #fff 0% 50%) 50%/8px 8px' }
                          : { background: s.preview }
                      }
                    >
                      {isActive && (
                        <Check
                          className={`h-4 w-4 drop-shadow ${
                            s.value === '#ffffff' || s.value === '#f5f5f5' || s.isTransparent
                              ? 'text-foreground'
                              : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Custom Color</span>
              <ColorPicker
                color={customBg}
                onChange={(color) => {
                  setCustomBg(color);
                  updateDraft({ background: color });
                }}
              />
              {customBg.trim() && !isValidColor(customBg.trim()) && (
                <p className="text-xs text-destructive">Invalid color format, will be ignored</p>
              )}
            </div>
          </section>
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <div className="flex w-full justify-end gap-3">
            <button
              onClick={handleCancel}
              className="rounded-md border border-zinc-200 px-5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors dark:border-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Apply & Re-convert
            </button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}