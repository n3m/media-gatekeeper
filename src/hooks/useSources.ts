import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/tauri";
import type { Source, CreateSourceRequest, UpdateSourceRequest } from "@/types/source";

export function useSources(creatorId: string) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    if (!creatorId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.sources.getByCreator(creatorId);
      setSources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const createSource = async (request: Omit<CreateSourceRequest, "creator_id">) => {
    const source = await api.sources.create({ ...request, creator_id: creatorId });
    setSources((prev) => [source, ...prev]);
    return source;
  };

  const updateSource = async (id: string, request: UpdateSourceRequest) => {
    const source = await api.sources.update(id, request);
    setSources((prev) => prev.map((s) => (s.id === id ? source : s)));
    return source;
  };

  const deleteSource = async (id: string) => {
    await api.sources.delete(id);
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    sources,
    loading,
    error,
    refetch: fetchSources,
    createSource,
    updateSource,
    deleteSource,
  };
}
