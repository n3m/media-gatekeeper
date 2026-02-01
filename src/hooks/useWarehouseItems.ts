import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/tauri";
import type { WarehouseItem } from "@/types/warehouse-item";

export function useWarehouseItems(creatorId: string) {
  const [warehouseItems, setWarehouseItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouseItems = useCallback(async () => {
    if (!creatorId) return;

    try {
      setLoading(true);
      setError(null);
      const items = await api.warehouse.getByCreator(creatorId);
      setWarehouseItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [creatorId]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      await api.warehouse.delete(id);
      setWarehouseItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchWarehouseItems();
  }, [fetchWarehouseItems]);

  return {
    warehouseItems,
    loading,
    error,
    refetch: fetchWarehouseItems,
    deleteItem,
  };
}
