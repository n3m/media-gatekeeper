export interface WarehouseItem {
  id: string;
  creator_id: string;
  feed_item_id: string | null;
  title: string;
  file_path: string;
  thumbnail_path: string | null;
  platform: string | null;
  original_url: string | null;
  published_at: string | null;
  duration: number | null;
  file_size: number;
  imported_at: string;
  is_manual_import: boolean;
}

export interface CreateWarehouseItemRequest {
  creator_id: string;
  feed_item_id?: string | null;
  title: string;
  file_path: string;
  thumbnail_path?: string | null;
  platform?: string | null;
  original_url?: string | null;
  published_at?: string | null;
  duration?: number | null;
  file_size: number;
  is_manual_import: boolean;
}
