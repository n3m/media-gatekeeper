"use client";

import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface BassBoostPanelProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  preset: string;
  onPresetChange: (preset: string) => void;
  customGain: number;
  onCustomGainChange: (gain: number) => void;
  presets: readonly { name: string; gain: number }[];
}

export function BassBoostPanel({
  enabled,
  onEnabledChange,
  preset,
  onPresetChange,
  customGain,
  onCustomGainChange,
  presets,
}: BassBoostPanelProps) {
  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg bg-muted/50">
      {/* Row 1: Toggle switch with "Bass Boost" label */}
      <div className="flex items-center gap-2">
        <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        <Label className="text-sm font-medium text-foreground">
          Bass Boost
        </Label>
      </div>

      {/* Row 2: Preset buttons (only visible when enabled) */}
      {enabled && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button
              key={p.name}
              variant={preset === p.name ? "default" : "outline"}
              size="sm"
              onClick={() => onPresetChange(p.name)}
              className="text-xs"
            >
              {p.name}
            </Button>
          ))}
        </div>
      )}

      {/* Row 3: Custom slider (only visible when enabled AND Custom selected) */}
      {enabled && preset === "Custom" && (
        <div className="flex items-center gap-4">
          <Slider
            value={[customGain]}
            onValueChange={([value]) => onCustomGainChange(value)}
            min={0}
            max={30}
            step={1}
            className="w-48"
          />
          <span className="text-sm text-muted-foreground w-12">
            {customGain} dB
          </span>
        </div>
      )}
    </div>
  );
}
