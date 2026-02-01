import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSources } from "@/hooks/useSources";
import { useSyncEvents, useSync } from "@/hooks/useSyncEvents";
import { AddSourceDialog } from "@/components/sources/AddSourceDialog";
import { SourcesTable } from "@/components/sources/SourcesTable";
import type { SyncEvent } from "@/types/feed-item";

interface CreatorSettingsProps {
  creatorId: string;
}

export function CreatorSettings({ creatorId }: CreatorSettingsProps) {
  const { sources, loading, error, createSource, deleteSource, refetch } = useSources(creatorId);
  const { syncSource, syncCreator } = useSync();
  const [syncingSourceIds, setSyncingSourceIds] = useState<Set<string>>(new Set());

  // Handle sync events
  useSyncEvents({
    onSyncStarted: useCallback((event: SyncEvent) => {
      setSyncingSourceIds((prev) => new Set(prev).add(event.source_id));
    }, []),
    onSyncCompleted: useCallback((event: SyncEvent) => {
      setSyncingSourceIds((prev) => {
        const next = new Set(prev);
        next.delete(event.source_id);
        return next;
      });
      refetch();
      toast.success(`Sync completed: ${event.new_items || 0} new items found`);
    }, [refetch]),
    onSyncError: useCallback((event: SyncEvent) => {
      setSyncingSourceIds((prev) => {
        const next = new Set(prev);
        next.delete(event.source_id);
        return next;
      });
      refetch();
      toast.error(`Sync failed: ${event.message || "Unknown error"}`);
    }, [refetch]),
  });

  const handleAddSource = async (
    platform: "youtube" | "patreon",
    channelUrl: string,
    credentialId?: string
  ) => {
    const source = await createSource({
      platform,
      channel_url: channelUrl,
      credential_id: credentialId,
    });
    // Automatically sync the new source
    await syncSource(source.id);
  };

  const handleDeleteSource = async (id: string) => {
    await deleteSource(id);
  };

  const handleSyncSource = async (id: string) => {
    await syncSource(id);
  };

  const handleSyncAll = async () => {
    await syncCreator(creatorId);
    toast.info("Syncing all sources...");
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading sources...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Sources</h2>
          <p className="text-sm text-muted-foreground">
            Manage YouTube and Patreon channels for this creator
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sources.length > 0 && (
            <Button variant="outline" onClick={handleSyncAll}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All
            </Button>
          )}
          <AddSourceDialog onSubmit={handleAddSource} />
        </div>
      </div>

      <SourcesTable
        sources={sources}
        syncingSourceIds={syncingSourceIds}
        onDelete={handleDeleteSource}
        onSync={handleSyncSource}
      />
    </div>
  );
}
