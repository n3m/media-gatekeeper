export interface FeedItem {
  id: string;
  source_id: string;
  external_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string | null;
  duration: number | null;
  download_status: "not_downloaded" | "downloading" | "downloaded" | "error";
  warehouse_item_id: string | null;
  metadata_complete: boolean;
  created_at: string;
}

export interface CreateFeedItemRequest {
  source_id: string;
  external_id: string;
  title: string;
  thumbnail_url?: string | null;
  published_at?: string | null;
  duration?: number | null;
}

export interface UpdateFeedItemRequest {
  download_status?: "not_downloaded" | "downloading" | "downloaded" | "error";
  warehouse_item_id?: string | null;
}

export interface FeedItemCounts {
  total: number;
  downloaded: number;
  not_downloaded: number;
}

export interface SyncEvent {
  source_id: string;
  status: "started" | "completed" | "error";
  message: string | null;
  new_items: number | null;
}

export interface MetadataEvent {
  feed_item_id: string;
  status: "started" | "completed" | "error";
  message?: string;
}
