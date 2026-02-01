import { useEffect, useCallback } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import type { SyncEvent } from "@/types/feed-item";

interface UseSyncEventsOptions {
  onSyncStarted?: (event: SyncEvent) => void;
  onSyncCompleted?: (event: SyncEvent) => void;
  onSyncError?: (event: SyncEvent) => void;
}

export function useSyncEvents(options: UseSyncEventsOptions) {
  const { onSyncStarted, onSyncCompleted, onSyncError } = options;

  useEffect(() => {
    const unlistenFns: UnlistenFn[] = [];

    const setupListeners = async () => {
      if (onSyncStarted) {
        const unlisten = await listen<SyncEvent>("sync_started", (event) => {
          onSyncStarted(event.payload);
        });
        unlistenFns.push(unlisten);
      }

      if (onSyncCompleted) {
        const unlisten = await listen<SyncEvent>("sync_completed", (event) => {
          onSyncCompleted(event.payload);
        });
        unlistenFns.push(unlisten);
      }

      if (onSyncError) {
        const unlisten = await listen<SyncEvent>("sync_error", (event) => {
          onSyncError(event.payload);
        });
        unlistenFns.push(unlisten);
      }
    };

    setupListeners();

    return () => {
      unlistenFns.forEach((unlisten) => unlisten());
    };
  }, [onSyncStarted, onSyncCompleted, onSyncError]);
}

// Hook for triggering syncs
export function useSync() {
  const syncSource = useCallback(async (sourceId: string) => {
    const { api } = await import("@/lib/tauri");
    await api.sync.source(sourceId);
  }, []);

  const syncCreator = useCallback(async (creatorId: string) => {
    const { api } = await import("@/lib/tauri");
    await api.sync.creator(creatorId);
  }, []);

  const syncAll = useCallback(async () => {
    const { api } = await import("@/lib/tauri");
    await api.sync.all();
  }, []);

  return {
    syncSource,
    syncCreator,
    syncAll,
  };
}
