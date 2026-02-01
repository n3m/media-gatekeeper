import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useCredentials } from "@/hooks/useCredentials";
import { BASS_BOOST_PRESETS } from "@/hooks/useBassBoost";
import { api } from "@/lib/tauri";
import type { AppSettings } from "@/types/app-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddCredentialDialog, CredentialsList } from "@/components/credentials";
import {
  Loader2,
  FolderOpen,
  HardDrive,
  Download,
  RefreshCw,
  Palette,
  Bell,
  Volume2,
  Save,
  BellRing,
  Key,
} from "lucide-react";

const QUALITY_OPTIONS = [
  { value: "best", label: "Best Available" },
  { value: "1080p", label: "1080p" },
  { value: "720p", label: "720p" },
  { value: "480p", label: "480p" },
  { value: "360p", label: "360p" },
];

const SYNC_INTERVAL_OPTIONS = [
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 900, label: "15 minutes" },
  { value: 1800, label: "30 minutes" },
  { value: 3600, label: "1 hour" },
];

const THEME_OPTIONS = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

export function Settings() {
  const { settings, loading, error, updateSettings } = useAppSettings();
  const {
    credentials,
    loading: credentialsLoading,
    createCredential,
    deleteCredential,
    setAsDefault,
  } = useCredentials("patreon");
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync local state with fetched settings
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;
    setSaving(true);
    try {
      await updateSettings(localSettings);
      toast.success("Settings saved");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Handler for library path folder picker
  const handleSelectLibraryPath = async () => {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({ directory: true });
    if (selected) {
      setLocalSettings((prev) =>
        prev ? { ...prev, library_path: selected } : null
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Settings</h1>
        <div className="text-destructive">Failed to load settings: {error}</div>
      </div>
    );
  }

  // No settings loaded yet
  if (!localSettings) {
    return null;
  }

  const currentPreset = BASS_BOOST_PRESETS.find(
    (p) => p.name === localSettings.bass_boost_preset
  );
  const showCustomGainSlider = localSettings.bass_boost_preset === "Custom";

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure your global preferences
        </p>
      </div>

      {/* Storage Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HardDrive className="h-5 w-5" />
            Storage
          </CardTitle>
          <CardDescription>
            Configure where your media library is stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="library-path">Library Path</Label>
            <div className="flex gap-2">
              <Input
                id="library-path"
                value={localSettings.library_path}
                onChange={(e) =>
                  setLocalSettings((prev) =>
                    prev ? { ...prev, library_path: e.target.value } : null
                  )
                }
                placeholder="/path/to/library"
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSelectLibraryPath}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Downloads Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Download className="h-5 w-5" />
            Downloads
          </CardTitle>
          <CardDescription>
            Configure default download quality settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-quality">Default Quality</Label>
            <Select
              value={localSettings.default_quality}
              onValueChange={(value) =>
                setLocalSettings((prev) =>
                  prev ? { ...prev, default_quality: value } : null
                )
              }
            >
              <SelectTrigger id="default-quality">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="h-5 w-5" />
            Sync
          </CardTitle>
          <CardDescription>
            Configure how often the library syncs with sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sync-interval">Sync Interval</Label>
            <Select
              value={localSettings.sync_interval_seconds.toString()}
              onValueChange={(value) =>
                setLocalSettings((prev) =>
                  prev
                    ? { ...prev, sync_interval_seconds: parseInt(value, 10) }
                    : null
                )
              }
            >
              <SelectTrigger id="sync-interval">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {SYNC_INTERVAL_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={localSettings.theme}
              onValueChange={(value) =>
                setLocalSettings((prev) =>
                  prev ? { ...prev, theme: value } : null
                )
              }
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color scheme. System follows your OS preference.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled">
                Enable Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive OS notifications for downloads and sync updates
              </p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={localSettings.notifications_enabled}
              onCheckedChange={(checked) =>
                setLocalSettings((prev) =>
                  prev ? { ...prev, notifications_enabled: checked } : null
                )
              }
            />
          </div>
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await api.notifications.requestPermission();
                  await api.notifications.sendTest();
                  toast.success("Test notification sent");
                } catch (err) {
                  toast.error(`Failed to send test notification: ${err instanceof Error ? err.message : String(err)}`);
                }
              }}
            >
              <BellRing className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patreon Credentials Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="h-5 w-5" />
                Patreon Credentials
              </CardTitle>
              <CardDescription>
                Manage cookie files for Patreon access
              </CardDescription>
            </div>
            <AddCredentialDialog
              onSubmit={async (data) => {
                try {
                  await createCredential(data);
                  toast.success("Credential added");
                } catch (err) {
                  toast.error(`Failed to add credential: ${err instanceof Error ? err.message : String(err)}`);
                  throw err;
                }
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <CredentialsList
            credentials={credentials}
            loading={credentialsLoading}
            onDelete={async (id) => {
              try {
                await deleteCredential(id);
                toast.success("Credential deleted");
              } catch (err) {
                toast.error(`Failed to delete credential: ${err instanceof Error ? err.message : String(err)}`);
              }
            }}
            onSetDefault={async (id) => {
              try {
                await setAsDefault(id);
                toast.success("Default credential updated");
              } catch (err) {
                toast.error(`Failed to update default: ${err instanceof Error ? err.message : String(err)}`);
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Bass Boost Defaults Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="h-5 w-5" />
            Bass Boost Defaults
          </CardTitle>
          <CardDescription>
            Configure default bass boost settings for playback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bass-preset">Preset</Label>
            <Select
              value={localSettings.bass_boost_preset}
              onValueChange={(value) =>
                setLocalSettings((prev) =>
                  prev ? { ...prev, bass_boost_preset: value } : null
                )
              }
            >
              <SelectTrigger id="bass-preset">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                {BASS_BOOST_PRESETS.map((preset) => (
                  <SelectItem key={preset.name} value={preset.name}>
                    {preset.name}
                    {preset.name !== "Custom" && ` (+${preset.gain}dB)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showCustomGainSlider && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-gain">Custom Gain</Label>
                <span className="text-sm text-muted-foreground">
                  +{localSettings.bass_boost_custom_gain}dB
                </span>
              </div>
              <Slider
                id="custom-gain"
                value={[localSettings.bass_boost_custom_gain]}
                onValueChange={([value]) =>
                  setLocalSettings((prev) =>
                    prev ? { ...prev, bass_boost_custom_gain: value } : null
                  )
                }
                min={0}
                max={40}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Adjust the bass boost gain from 0 to 40dB
              </p>
            </div>
          )}

          {!showCustomGainSlider && currentPreset && (
            <p className="text-sm text-muted-foreground">
              Current gain: +{currentPreset.gain}dB
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
