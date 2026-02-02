import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedActions } from "@/components/feed/FeedActions";
import { FeedTable } from "@/components/feed/FeedTable";
import { useFeedItems } from "@/hooks/useFeedItems";
import { useSources } from "@/hooks/useSources";
import { useSyncEvents, useSync } from "@/hooks/useSyncEvents";
import { useDownloadEvents, useDownload } from "@/hooks/useDownloadEvents";
import { useMetadataEvents } from "@/hooks/useMetadataEvents";
import { api } from "@/lib/tauri";
import type { FeedItem, SyncEvent, MetadataEvent } from "@/types/feed-item";
import type {
  DownloadStartedEvent,
  DownloadProgressEvent,
  DownloadCompletedEvent,
  DownloadErrorEvent,
} from "@/types/download";

export interface DownloadProgress {
  percent: number;
  speed: string;
}

interface FeedProps {
  creatorId: string;
}

export function Feed({ creatorId }: FeedProps) {
  // Fetch data
  const { feedItems, loading: feedLoading, error: feedError, refetch: refetchFeed } = useFeedItems(creatorId);
  const { sources, loading: sourcesLoading, error: sourcesError } = useSources(creatorId);
  const { syncCreator } = useSync();
  const { downloadItems } = useDownload();

  // Filter state
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  // Download progress state
  const [downloadProgress, setDownloadProgress] = useState<Map<string, DownloadProgress>>(new Map());

  // FTS search state
  const [searchResultIds, setSearchResultIds] = useState<Set<string> | null>(null);
  const [_isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Visibility tracking for progressive metadata loading (from virtualized table)
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  // Track which items are actively being fetched (for "Loading" vs "Pending" display)
  const [loadingMetadataIds, setLoadingMetadataIds] = useState<Set<string>>(new Set());

  // Metadata events hook
  const { fetchMetadata } = useMetadataEvents({
    onMetadataStarted: useCallback((event: MetadataEvent) => {
      setLoadingMetadataIds((prev) => new Set([...prev, event.feed_item_id]));
    }, []),
    onMetadataCompleted: useCallback((event: MetadataEvent) => {
      setLoadingMetadataIds((prev) => {
        const next = new Set(prev);
        next.delete(event.feed_item_id);
        return next;
      });
      // Refetch to update the UI with new metadata
      refetchFeed();
    }, [refetchFeed]),
    onMetadataError: useCallback((event: MetadataEvent) => {
      console.error("Metadata fetch failed:", event.message);
      setLoadingMetadataIds((prev) => {
        const next = new Set(prev);
        next.delete(event.feed_item_id);
        return next;
      });
    }, []),
  });

  // Debounce ref for metadata fetching
  const metadataFetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch metadata for visible incomplete items
  useEffect(() => {
    if (metadataFetchDebounceRef.current) {
      clearTimeout(metadataFetchDebounceRef.current);
    }

    // Find visible items that need metadata and aren't already loading
    const incompleteVisibleIds: string[] = [];
    visibleIds.forEach((id) => {
      const item = feedItems.find((i) => i.id === id);
      if (item && !item.metadata_complete && !loadingMetadataIds.has(id)) {
        incompleteVisibleIds.push(id);
      }
    });

    if (incompleteVisibleIds.length === 0) {
      return;
    }

    // Debounce the fetch request
    metadataFetchDebounceRef.current = setTimeout(async () => {
      // Immediately mark as loading to prevent duplicate fetches
      setLoadingMetadataIds((prev) => new Set([...prev, ...incompleteVisibleIds]));

      try {
        await fetchMetadata(incompleteVisibleIds);
      } catch (err) {
        console.error("Failed to fetch metadata:", err);
        // On error, remove from loading so they can be retried
        setLoadingMetadataIds((prev) => {
          const next = new Set(prev);
          incompleteVisibleIds.forEach((id) => next.delete(id));
          return next;
        });
      }
    }, 500);

    return () => {
      if (metadataFetchDebounceRef.current) {
        clearTimeout(metadataFetchDebounceRef.current);
      }
    };
  }, [visibleIds, feedItems, loadingMetadataIds, fetchMetadata]);

  // Perform FTS search when query changes
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResultIds(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await api.search.feedItems(searchQuery, creatorId, 100);
        setSearchResultIds(new Set(results.map((r) => r.id)));
      } catch (err) {
        console.error("FTS search failed, falling back to local filter:", err);
        // Fallback: use null to indicate local filtering should be used
        setSearchResultIds(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, creatorId]);

  // Handle sync events
  useSyncEvents({
    onSyncStarted: useCallback(() => {
      setIsSyncing(true);
    }, []),
    onSyncCompleted: useCallback((event: SyncEvent) => {
      setIsSyncing(false);
      refetchFeed();
      const newItemsMessage = event.new_items !== null && event.new_items > 0
        ? ` Found ${event.new_items} new item${event.new_items === 1 ? "" : "s"}.`
        : "";
      toast.success(`Sync completed!${newItemsMessage}`);
    }, [refetchFeed]),
    onSyncError: useCallback((event: SyncEvent) => {
      setIsSyncing(false);
      toast.error(`Sync failed: ${event.message || "Unknown error"}`);
    }, []),
  });

  // Handle download events
  useDownloadEvents({
    onDownloadStarted: useCallback((event: DownloadStartedEvent) => {
      setDownloadProgress((prev) => {
        const next = new Map(prev);
        next.set(event.feed_item_id, { percent: 0, speed: "" });
        return next;
      });
    }, []),
    onDownloadProgress: useCallback((event: DownloadProgressEvent) => {
      setDownloadProgress((prev) => {
        const next = new Map(prev);
        next.set(event.feed_item_id, { percent: event.percent, speed: event.speed });
        return next;
      });
    }, []),
    onDownloadCompleted: useCallback((event: DownloadCompletedEvent) => {
      setDownloadProgress((prev) => {
        const next = new Map(prev);
        next.delete(event.feed_item_id);
        return next;
      });
      refetchFeed();
      // Find item title for toast
      const item = feedItems.find((i) => i.id === event.feed_item_id);
      const title = item?.title || "Item";
      toast.success(`Downloaded: ${title}`);
    }, [refetchFeed, feedItems]),
    onDownloadError: useCallback((event: DownloadErrorEvent) => {
      setDownloadProgress((prev) => {
        const next = new Map(prev);
        next.delete(event.feed_item_id);
        return next;
      });
      refetchFeed();
      // Find item title for toast
      const item = feedItems.find((i) => i.id === event.feed_item_id);
      const title = item?.title || "Item";
      toast.error(`Download failed for "${title}": ${event.error}`);
    }, [refetchFeed, feedItems]),
  });

  // Filter feed items
  const filteredItems = useMemo(() => {
    let items: FeedItem[] = feedItems;

    // Filter by source
    if (selectedSourceId !== null) {
      items = items.filter((item) => item.source_id === selectedSourceId);
    }

    // Filter by status
    if (selectedStatus !== null) {
      items = items.filter((item) => item.download_status === selectedStatus);
    }

    // Filter by search query using FTS results
    if (searchQuery.trim()) {
      if (searchResultIds !== null) {
        // Use FTS search results
        items = items.filter((item) => searchResultIds.has(item.id));
      } else {
        // Fallback to local search if FTS failed
        const query = searchQuery.toLowerCase();
        items = items.filter((item) => item.title.toLowerCase().includes(query));
      }
    }

    return items;
  }, [feedItems, selectedSourceId, selectedStatus, searchQuery, searchResultIds]);

  // Handlers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedSourceId(null);
    setSelectedStatus(null);
    setSearchQuery("");
  }, []);

  const handleDownloadSelected = useCallback(async () => {
    // Filter to only items that are not_downloaded
    const idsToDownload = Array.from(selectedIds).filter((id) => {
      const item = feedItems.find((i) => i.id === id);
      return item?.download_status === "not_downloaded";
    });

    if (idsToDownload.length === 0) {
      toast.info("No items to download. Selected items may already be downloaded or downloading.");
      return;
    }

    try {
      await downloadItems(idsToDownload);
      toast.info(`Starting download of ${idsToDownload.length} item${idsToDownload.length === 1 ? "" : "s"}...`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(`Failed to start download: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [selectedIds, feedItems, downloadItems]);

  const handleSyncNow = useCallback(async () => {
    try {
      setIsSyncing(true);
      await syncCreator(creatorId);
    } catch (err) {
      setIsSyncing(false);
      toast.error(`Failed to start sync: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [syncCreator, creatorId]);

  // Loading state
  const isLoading = feedLoading || sourcesLoading;
  const error = feedError || sourcesError;

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading feed...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">Error loading feed: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <FeedFilters
          sources={sources}
          selectedSourceId={selectedSourceId}
          onSourceChange={setSelectedSourceId}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearFilters={handleClearFilters}
        />
        <FeedActions
          selectedCount={selectedIds.size}
          totalCount={filteredItems.length}
          onDownloadSelected={handleDownloadSelected}
          onSyncNow={handleSyncNow}
          isSyncing={isSyncing}
        />
      </div>
      <FeedTable
        items={filteredItems}
        sources={sources}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        downloadProgress={downloadProgress}
        loadingMetadataIds={loadingMetadataIds}
        onVisibleItemsChange={setVisibleIds}
      />
    </div>
  );
}
