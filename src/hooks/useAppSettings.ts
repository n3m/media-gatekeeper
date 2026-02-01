import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/tauri";
import type { AppSettings, UpdateAppSettingsRequest } from "@/types/app-settings";

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.settings.get();
      setSettings(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (request: UpdateAppSettingsRequest) => {
    try {
      setError(null);
      const result = await api.settings.update(request);
      setSettings(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, []);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings,
  };
}
