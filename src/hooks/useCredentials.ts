import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/tauri";
import type { Credential, CreateCredentialRequest, UpdateCredentialRequest } from "@/types/credential";

export function useCredentials(platform?: string) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = platform
        ? await api.credentials.getByPlatform(platform)
        : await api.credentials.getAll();
      setCredentials(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const createCredential = useCallback(
    async (request: CreateCredentialRequest) => {
      const credential = await api.credentials.create(request);
      await fetchCredentials();
      return credential;
    },
    [fetchCredentials]
  );

  const updateCredential = useCallback(
    async (id: string, request: UpdateCredentialRequest) => {
      const credential = await api.credentials.update(id, request);
      await fetchCredentials();
      return credential;
    },
    [fetchCredentials]
  );

  const deleteCredential = useCallback(
    async (id: string) => {
      await api.credentials.delete(id);
      await fetchCredentials();
    },
    [fetchCredentials]
  );

  const setAsDefault = useCallback(
    async (id: string) => {
      await api.credentials.update(id, { is_default: true });
      await fetchCredentials();
    },
    [fetchCredentials]
  );

  return {
    credentials,
    loading,
    error,
    refetch: fetchCredentials,
    createCredential,
    updateCredential,
    deleteCredential,
    setAsDefault,
  };
}
