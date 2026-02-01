import { useState, useMemo, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedActions } from "@/components/feed/FeedActions";
import { FeedTable } from "@/components/feed/FeedTable";
import { useFeedItems } from "@/hooks/useFeedItems";
import { useSources } from "@/hooks/useSources";
import { useSyncEvents, useSync } from "@/hooks/useSyncEvents";
import type { FeedItem, SyncEvent } from "@/types/feed-item";

interface FeedProps {
  creatorId: string;
}

export function Feed({ creatorId }: FeedProps) {
  // Fetch data
  const { feedItems, loading: feedLoading, error: feedError, refetch: refetchFeed } = useFeedItems(creatorId);
  const { sources, loading: sourcesLoading, error: sourcesError } = useSources(creatorId);
  const { syncCreator } = useSync();

  // Filter state
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);

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

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => item.title.toLowerCase().includes(query));
    }

    return items;
  }, [feedItems, selectedSourceId, selectedStatus, searchQuery]);

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

  const handleDownloadSelected = useCallback(() => {
    // TODO: Implement download functionality
    toast.info(`Download ${selectedIds.size} item${selectedIds.size === 1 ? "" : "s"} - Coming soon!`);
  }, [selectedIds.size]);

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
      />
    </div>
  );
}
