import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/tauri";
import type { FeedItem, FeedItemCounts } from "@/types/feed-item";

export function useFeedItems(creatorId: string) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [counts, setCounts] = useState<FeedItemCounts>({ total: 0, downloaded: 0, not_downloaded: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedItems = useCallback(async () => {
    if (!creatorId) return;

    try {
      setLoading(true);
      setError(null);
      const [items, itemCounts] = await Promise.all([
        api.feedItems.getByCreator(creatorId),
        api.feedItems.getCounts(creatorId),
      ]);
      setFeedItems(items);
      setCounts(itemCounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    fetchFeedItems();
  }, [fetchFeedItems]);

  return {
    feedItems,
    counts,
    loading,
    error,
    refetch: fetchFeedItems,
  };
}
