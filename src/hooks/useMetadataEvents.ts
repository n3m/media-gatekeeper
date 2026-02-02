import { useCallback, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { api } from "@/lib/tauri";
import type { MetadataEvent } from "@/types/feed-item";

interface UseMetadataEventsOptions {
  onMetadataStarted?: (event: MetadataEvent) => void;
  onMetadataCompleted?: (event: MetadataEvent) => void;
  onMetadataError?: (event: MetadataEvent) => void;
}

interface UseMetadataEventsReturn {
  /** Fetch metadata for specific feed items (pauses background worker during fetch) */
  fetchMetadata: (feedItemIds: string[]) => Promise<void>;
  /** Get incomplete metadata items for a creator */
  getIncompleteItems: (creatorId: string, limit?: number) => Promise<string[]>;
  /** Pause background metadata worker */
  pauseWorker: () => Promise<void>;
  /** Resume background metadata worker */
  resumeWorker: () => Promise<void>;
}

/**
 * Hook to listen to metadata update events and control the metadata worker
 */
export function useMetadataEvents(
  options: UseMetadataEventsOptions = {}
): UseMetadataEventsReturn {
  const { onMetadataStarted, onMetadataCompleted, onMetadataError } = options;

  // Listen to metadata events
  useEffect(() => {
    const unlistenPromise = listen<MetadataEvent>("metadata_update", (event) => {
      const data = event.payload;

      switch (data.status) {
        case "started":
          onMetadataStarted?.(data);
          break;
        case "completed":
          onMetadataCompleted?.(data);
          break;
        case "error":
          onMetadataError?.(data);
          break;
      }
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [onMetadataStarted, onMetadataCompleted, onMetadataError]);

  const fetchMetadata = useCallback(async (feedItemIds: string[]) => {
    await api.metadata.fetch(feedItemIds);
  }, []);

  const getIncompleteItems = useCallback(
    async (creatorId: string, limit?: number) => {
      return api.metadata.getIncomplete(creatorId, limit);
    },
    []
  );

  const pauseWorker = useCallback(async () => {
    await api.metadata.pauseWorker();
  }, []);

  const resumeWorker = useCallback(async () => {
    await api.metadata.resumeWorker();
  }, []);

  return {
    fetchMetadata,
    getIncompleteItems,
    pauseWorker,
    resumeWorker,
  };
}
