'use client';

import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Pipette } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(color);
  
  // Directly initialize without effect to avoid cascading renders, as typeof window check is safe here.
  const isEyeDropperSupported = typeof window !== 'undefined' && 'EyeDropper' in window;

  // We only update the local input value if the color prop changes
  // to a valid color that doesn't match the current input.
  if (color !== inputValue && /^#([0-9A-F]{3}){1,2}$/i.test(color)) {
    // Check if the current input value is functionally identical to the new color
    // to avoid overriding intermediate valid inputs while typing.
    const isSame = inputValue.toLowerCase() === color.toLowerCase();
    if (!isSame) {
      setInputValue(color);
    }
  } else if (color !== inputValue && /^(rgba?|hsla?)\(/i.test(color)) {
    // Fallback sync for rgba/hsla colors, though HexColorPicker doesn't support them natively
    setInputValue(color);
  }

  const handlePickerChange = (newColor: string) => {
    setInputValue(newColor);
    onChange(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (/^(#[0-9A-F]{3,8}|rgba?\(|hsla?\()/i.test(val)) {
      onChange(val);
    }
  };

  const handleEyedropper = async () => {
    if (!isEyeDropperSupported) return;
    try {
      // @ts-expect-error - constructor instantiation
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      if (result && result.sRGBHex) {
        handlePickerChange(result.sRGBHex);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Convert potential rgba/hsla to a hex format just for the HexColorPicker display
  // so it doesn't crash or break visually.
  const pickerColor = /^#([0-9A-F]{3}){1,2}$/i.test(color) ? color : '#000000';
  
  const isValidColor = (val: string) => /^(#[0-9A-F]{3,8}|rgba?\(|hsla?\()/i.test(val);

  return (
    <Popover>
      <PopoverTrigger
        className={`flex h-10 w-full items-center justify-start gap-3 rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent transition-colors ${className || ''}`}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-5 w-5 shrink-0 rounded-sm border shadow-sm"
            style={{
              background: color || 'repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 50%/6px 6px',
            }}
          />
          <div
            className="h-4 w-4 shrink-0 rounded-full border shadow-sm"
            style={{
              background: color || 'transparent',
            }}
          />
        </div>
        <span className="flex-1 text-left tabular-nums text-foreground">
          {color || '#000000'}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 shadow-lg" align="start">
        <div className="flex flex-col gap-3">
          <HexColorPicker color={pickerColor} onChange={handlePickerChange} />
          
          <div className="flex items-center gap-2">
            {isEyeDropperSupported && (
              <button
                onClick={handleEyedropper}
                className="flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent transition-colors"
                title="Pick color from screen"
              >
                <Pipette className="h-4 w-4" />
              </button>
            )}
            <div
              className="h-8 w-8 shrink-0 rounded-full border shadow-sm"
              style={{ background: isValidColor(color) ? color : '#000000' }}
            />
            <Input
              value={inputValue}
              onChange={handleInputChange}
              className="h-8 flex-1 font-mono text-xs"
              placeholder="#000000 or rgba()"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
