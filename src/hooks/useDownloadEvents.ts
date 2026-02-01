import { useEffect, useCallback } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type {
  DownloadStartedEvent,
  DownloadProgressEvent,
  DownloadCompletedEvent,
  DownloadErrorEvent,
} from "@/types/download";

interface UseDownloadEventsOptions {
  onDownloadStarted?: (event: DownloadStartedEvent) => void;
  onDownloadProgress?: (event: DownloadProgressEvent) => void;
  onDownloadCompleted?: (event: DownloadCompletedEvent) => void;
  onDownloadError?: (event: DownloadErrorEvent) => void;
}

export function useDownloadEvents(options: UseDownloadEventsOptions) {
  const { onDownloadStarted, onDownloadProgress, onDownloadCompleted, onDownloadError } = options;

  useEffect(() => {
    const unlistenFns: UnlistenFn[] = [];

    const setupListeners = async () => {
      if (onDownloadStarted) {
        const unlisten = await listen<DownloadStartedEvent>("download_started", (event) => {
          onDownloadStarted(event.payload);
        });
        unlistenFns.push(unlisten);
      }

      if (onDownloadProgress) {
        const unlisten = await listen<DownloadProgressEvent>("download_progress", (event) => {
          onDownloadProgress(event.payload);
        });
        unlistenFns.push(unlisten);
      }

      if (onDownloadCompleted) {
        const unlisten = await listen<DownloadCompletedEvent>("download_completed", (event) => {
          onDownloadCompleted(event.payload);
        });
        unlistenFns.push(unlisten);
      }

      if (onDownloadError) {
        const unlisten = await listen<DownloadErrorEvent>("download_error", (event) => {
          onDownloadError(event.payload);
        });
        unlistenFns.push(unlisten);
      }
    };

    setupListeners();

    return () => {
      unlistenFns.forEach((unlisten) => unlisten());
    };
  }, [onDownloadStarted, onDownloadProgress, onDownloadCompleted, onDownloadError]);
}

// Hook for triggering downloads
export function useDownload() {
  const downloadItems = useCallback(async (feedItemIds: string[]) => {
    const { api } = await import("@/lib/tauri");
    await api.download.items(feedItemIds);
  }, []);

  const cancelDownload = useCallback(async (feedItemId: string) => {
    const { api } = await import("@/lib/tauri");
    await api.download.cancel(feedItemId);
  }, []);

  return { downloadItems, cancelDownload };
}
