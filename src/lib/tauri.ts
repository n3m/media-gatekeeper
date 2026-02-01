import { invoke } from "@tauri-apps/api/core";
import type { Creator, CreateCreatorRequest, UpdateCreatorRequest } from "@/types/creator";
import type { Source, CreateSourceRequest, UpdateSourceRequest } from "@/types/source";
import type { FeedItem, CreateFeedItemRequest, UpdateFeedItemRequest, FeedItemCounts } from "@/types/feed-item";
import type { WarehouseItem, CreateWarehouseItemRequest } from "@/types/warehouse-item";
import type { AppSettings, UpdateAppSettingsRequest } from "@/types/app-settings";
import type {
  FeedItemSearchResult,
  WarehouseItemSearchResult,
  CreatorSearchResult,
  GlobalSearchResults,
} from "@/types/search";

export const api = {
  creators: {
    getAll: () => invoke<Creator[]>("get_creators"),
    get: (id: string) => invoke<Creator>("get_creator", { id }),
    create: (request: CreateCreatorRequest) => invoke<Creator>("create_creator", { request }),
    update: (id: string, request: UpdateCreatorRequest) => invoke<Creator>("update_creator", { id, request }),
    delete: (id: string) => invoke<void>("delete_creator", { id }),
  },
  sources: {
    getByCreator: (creatorId: string) => invoke<Source[]>("get_sources_by_creator", { creatorId }),
    create: (request: CreateSourceRequest) => invoke<Source>("create_source", { request }),
    update: (id: string, request: UpdateSourceRequest) => invoke<Source>("update_source", { id, request }),
    delete: (id: string) => invoke<void>("delete_source", { id }),
  },
  feedItems: {
    getBySource: (sourceId: string) => invoke<FeedItem[]>("get_feed_items_by_source", { sourceId }),
    getByCreator: (creatorId: string) => invoke<FeedItem[]>("get_feed_items_by_creator", { creatorId }),
    create: (request: CreateFeedItemRequest) => invoke<FeedItem>("create_feed_item", { request }),
    update: (id: string, request: UpdateFeedItemRequest) => invoke<FeedItem>("update_feed_item", { id, request }),
    getCounts: (creatorId: string) => invoke<FeedItemCounts>("get_feed_item_counts", { creatorId }),
  },
  sync: {
    source: (sourceId: string) => invoke<void>("sync_source", { sourceId }),
    creator: (creatorId: string) => invoke<void>("sync_creator", { creatorId }),
    all: () => invoke<void>("sync_all"),
  },
  download: {
    items: (feedItemIds: string[]) => invoke<void>("download_items", { feedItemIds }),
    cancel: (feedItemId: string) => invoke<void>("cancel_download", { feedItemId }),
  },
  warehouse: {
    getByCreator: (creatorId: string) => invoke<WarehouseItem[]>("get_warehouse_items_by_creator", { creatorId }),
    create: (request: CreateWarehouseItemRequest) => invoke<WarehouseItem>("create_warehouse_item", { request }),
    delete: (id: string) => invoke<void>("delete_warehouse_item", { id }),
    import: (request: { source_path: string; creator_id: string; title: string; platform?: string }) =>
      invoke<WarehouseItem>("import_video", { request }),
  },
  shell: {
    openInDefaultApp: (filePath: string) => invoke<void>("open_file_in_default_app", { filePath }),
    showInFolder: (filePath: string) => invoke<void>("show_in_folder", { filePath }),
  },
  settings: {
    get: () => invoke<AppSettings>("get_app_settings"),
    update: (request: UpdateAppSettingsRequest) => invoke<AppSettings>("update_app_settings", { request }),
  },
  search: {
    feedItems: (query: string, creatorId?: string, limit?: number) =>
      invoke<FeedItemSearchResult[]>("search_feed_items", { query, creatorId, limit }),
    warehouseItems: (query: string, creatorId?: string, limit?: number) =>
      invoke<WarehouseItemSearchResult[]>("search_warehouse_items", { query, creatorId, limit }),
    creators: (query: string, limit?: number) =>
      invoke<CreatorSearchResult[]>("search_creators", { query, limit }),
    global: (query: string, limit?: number) =>
      invoke<GlobalSearchResults>("global_search", { query, limit }),
  },
  notifications: {
    checkPermission: () => invoke<string>("check_notification_permission"),
    requestPermission: () => invoke<string>("request_notification_permission"),
    sendTest: () => invoke<void>("send_test_notification"),
  },
};
