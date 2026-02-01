export interface Source {
  id: string;
  creator_id: string;
  platform: "youtube" | "patreon";
  channel_url: string;
  channel_name: string | null;
  credential_id: string | null;
  status: "pending" | "validated" | "error";
  last_synced_at: string | null;
  created_at: string;
}

export interface CreateSourceRequest {
  creator_id: string;
  platform: "youtube" | "patreon";
  channel_url: string;
  credential_id?: string | null;
}

export interface UpdateSourceRequest {
  channel_url?: string;
  credential_id?: string | null;
  status?: "pending" | "validated" | "error";
  channel_name?: string;
}
