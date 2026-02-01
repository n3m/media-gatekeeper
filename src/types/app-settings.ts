export interface AppSettings {
  library_path: string;
  default_quality: string;
  sync_interval_seconds: number;
  theme: string;
  first_run_completed: boolean;
  notifications_enabled: boolean;
  bass_boost_preset: string;
  bass_boost_custom_gain: number;
}

export interface UpdateAppSettingsRequest {
  library_path?: string;
  default_quality?: string;
  sync_interval_seconds?: number;
  theme?: string;
  first_run_completed?: boolean;
  notifications_enabled?: boolean;
  bass_boost_preset?: string;
  bass_boost_custom_gain?: number;
}
