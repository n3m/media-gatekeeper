import { useState, useCallback, useRef, useEffect } from "react";
import { api } from "@/lib/tauri";
import type { GlobalSearchResults } from "@/types/search";

interface UseSearchOptions {
  debounceMs?: number;
  limit?: number;
}

interface UseSearchResult {
  query: string;
  setQuery: (query: string) => void;
  results: GlobalSearchResults | null;
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  clearResults: () => void;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchResult {
  const { debounceMs = 300, limit = 10 } = options;

  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<GlobalSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (searchQuery: string) => {
      // Cancel any pending search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (!searchQuery.trim()) {
        setResults(null);
        setLoading(false);
        setError(null);
        return;
      }

      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        const searchResults = await api.search.global(searchQuery, limit);
        setResults(searchResults);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the search
      debounceTimerRef.current = setTimeout(() => {
        search(newQuery);
      }, debounceMs);
    },
    [debounceMs, search]
  );

  const clearResults = useCallback(() => {
    setQueryState("");
    setResults(null);
    setError(null);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    search,
    clearResults,
  };
}

// Hook for searching within a specific creator's content
interface UseCreatorSearchOptions {
  creatorId: string;
  debounceMs?: number;
  limit?: number;
}

interface UseCreatorSearchResult {
  query: string;
  setQuery: (query: string) => void;
  feedItemResults: Awaited<ReturnType<typeof api.search.feedItems>> | null;
  warehouseItemResults: Awaited<ReturnType<typeof api.search.warehouseItems>> | null;
  loading: boolean;
  error: string | null;
  clearResults: () => void;
}

export function useCreatorSearch(options: UseCreatorSearchOptions): UseCreatorSearchResult {
  const { creatorId, debounceMs = 300, limit = 50 } = options;

  const [query, setQueryState] = useState("");
  const [feedItemResults, setFeedItemResults] = useState<Awaited<
    ReturnType<typeof api.search.feedItems>
  > | null>(null);
  const [warehouseItemResults, setWarehouseItemResults] = useState<Awaited<
    ReturnType<typeof api.search.warehouseItems>
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setFeedItemResults(null);
        setWarehouseItemResults(null);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [feedResults, warehouseResults] = await Promise.all([
          api.search.feedItems(searchQuery, creatorId, limit),
          api.search.warehouseItems(searchQuery, creatorId, limit),
        ]);

        setFeedItemResults(feedResults);
        setWarehouseItemResults(warehouseResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setFeedItemResults(null);
        setWarehouseItemResults(null);
      } finally {
        setLoading(false);
      }
    },
    [creatorId, limit]
  );

  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        search(newQuery);
      }, debounceMs);
    },
    [debounceMs, search]
  );

  const clearResults = useCallback(() => {
    setQueryState("");
    setFeedItemResults(null);
    setWarehouseItemResults(null);
    setError(null);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    feedItemResults,
    warehouseItemResults,
    loading,
    error,
    clearResults,
  };
}
