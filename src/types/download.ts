export interface DownloadStartedEvent {
  feed_item_id: string;
}

export interface DownloadProgressEvent {
  feed_item_id: string;
  percent: number;
  speed: string;
}

export interface DownloadCompletedEvent {
  feed_item_id: string;
  warehouse_item_id: string;
}

export interface DownloadErrorEvent {
  feed_item_id: string;
  error: string;
}
