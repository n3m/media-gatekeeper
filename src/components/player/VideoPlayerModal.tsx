"use client";

import { useRef, useEffect } from "react";
import { ExternalLink, FolderOpen } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BassBoostPanel } from "@/components/player/BassBoostPanel";
import { useBassBoost, type BassBoostPresetName } from "@/hooks/useBassBoost";
import { api } from "@/lib/tauri";
import { formatDuration, formatFileSize } from "@/lib/utils";
import type { WarehouseItem } from "@/types/warehouse-item";

interface VideoPlayerModalProps {
  item: WarehouseItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoPlayerModal({
  item,
  open,
  onOpenChange,
}: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bassBoost = useBassBoost();

  // Convert file path to a playable src URL
  const videoSrc = item?.file_path ? convertFileSrc(item.file_path) : null;

  // Connect video to bass boost when video loads
  useEffect(() => {
    if (videoRef.current && open && videoSrc) {
      bassBoost.connectVideo(videoRef.current);
    }
    return () => {
      bassBoost.disconnectVideo();
    };
  }, [open, videoSrc, bassBoost]);

  // Handle opening in default system player
  const handleOpenInPlayer = async () => {
    if (item?.file_path) {
      try {
        await api.shell.openInDefaultApp(item.file_path);
      } catch (error) {
        console.error("Failed to open in default player:", error);
      }
    }
  };

  // Handle showing in folder
  const handleShowInFolder = async () => {
    if (item?.file_path) {
      try {
        await api.shell.showInFolder(item.file_path);
      } catch (error) {
        console.error("Failed to show in folder:", error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">
            {item?.title ?? "Video Player"}
          </DialogTitle>
        </DialogHeader>

        {/* Video Player */}
        <div className="flex-1 bg-black rounded-lg overflow-hidden min-h-0">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No video selected
            </div>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex items-start justify-between gap-4 pt-4">
          {/* Bass Boost Panel */}
          <BassBoostPanel
            enabled={bassBoost.enabled}
            onEnabledChange={bassBoost.setEnabled}
            preset={bassBoost.preset}
            onPresetChange={(preset) =>
              bassBoost.setPreset(preset as BassBoostPresetName)
            }
            customGain={bassBoost.customGain}
            onCustomGainChange={bassBoost.setCustomGain}
            presets={bassBoost.PRESETS}
          />

          {/* Action Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInPlayer}
              disabled={!item}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Player
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowInFolder}
              disabled={!item}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Show in Folder
            </Button>
          </div>
        </div>

        {/* Metadata */}
        {item && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2 border-t border-border">
            {item.platform && (
              <span>
                <span className="text-foreground font-medium">Platform:</span>{" "}
                {item.platform}
              </span>
            )}
            {item.duration !== null && (
              <span>
                <span className="text-foreground font-medium">Duration:</span>{" "}
                {formatDuration(item.duration)}
              </span>
            )}
            <span>
              <span className="text-foreground font-medium">Size:</span>{" "}
              {formatFileSize(item.file_size)}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
