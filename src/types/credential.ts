export interface Credential {
  id: string;
  label: string;
  platform: string;
  cookie_path: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCredentialRequest {
  label: string;
  platform: string;
  cookie_path: string;
  is_default?: boolean;
}

export interface UpdateCredentialRequest {
  label?: string;
  cookie_path?: string;
  is_default?: boolean;
}
