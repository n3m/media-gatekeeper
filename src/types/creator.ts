export interface Creator {
  id: string;
  name: string;
  photo_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCreatorRequest {
  name: string;
  photo_path?: string | null;
}

export interface UpdateCreatorRequest {
  name?: string;
  photo_path?: string | null;
}
