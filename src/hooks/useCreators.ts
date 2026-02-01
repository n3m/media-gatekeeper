import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/tauri";
import type { Creator, CreateCreatorRequest, UpdateCreatorRequest } from "@/types/creator";

export function useCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.creators.getAll();
      setCreators(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const createCreator = async (request: CreateCreatorRequest) => {
    const creator = await api.creators.create(request);
    setCreators((prev) => [...prev, creator].sort((a, b) => a.name.localeCompare(b.name)));
    return creator;
  };

  const updateCreator = async (id: string, request: UpdateCreatorRequest) => {
    const creator = await api.creators.update(id, request);
    setCreators((prev) =>
      prev.map((c) => (c.id === id ? creator : c)).sort((a, b) => a.name.localeCompare(b.name))
    );
    return creator;
  };

  const deleteCreator = async (id: string) => {
    await api.creators.delete(id);
    setCreators((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    creators,
    loading,
    error,
    refetch: fetchCreators,
    createCreator,
    updateCreator,
    deleteCreator,
  };
}
