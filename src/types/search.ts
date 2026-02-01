export interface FeedItemSearchResult {
  id: string;
  source_id: string;
  external_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string | null;
  duration: number | null;
  download_status: string;
  rank: number;
}

export interface WarehouseItemSearchResult {
  id: string;
  creator_id: string;
  title: string;
  file_path: string;
  thumbnail_path: string | null;
  platform: string | null;
  duration: number | null;
  file_size: number;
  rank: number;
}

export interface CreatorSearchResult {
  id: string;
  name: string;
  photo_path: string | null;
  rank: number;
}

export interface GlobalSearchResults {
  creators: CreatorSearchResult[];
  feed_items: FeedItemSearchResult[];
  warehouse_items: WarehouseItemSearchResult[];
}
