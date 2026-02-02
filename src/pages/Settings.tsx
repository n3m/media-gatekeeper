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
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
  index: number;
  action?: React.ReactNode;
}

function SettingsSection({ title, description, icon, iconColor, children, index, action }: SettingsSectionProps) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-card/50 overflow-hidden",
        "opacity-0 animate-fade-up"
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "forwards" }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconColor)}>
              {icon}
            </div>
            <div>
              <CardTitle className="font-display text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

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

  const handleSelectLibraryPath = async () => {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({ directory: true });
    if (selected) {
      setLocalSettings((prev) =>
        prev ? { ...prev, library_path: selected } : null
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-glow" />
          <p className="text-muted-foreground text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-destructive">!</span>
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">Failed to load settings</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!localSettings) {
    return null;
  }

  const currentPreset = BASS_BOOST_PRESETS.find(
    (p) => p.name === localSettings.bass_boost_preset
  );
  const showCustomGainSlider = localSettings.bass_boost_preset === "Custom";

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-down">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-glow/10 flex items-center justify-center">
            <SettingsIcon className="h-5 w-5 text-glow" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground ml-13">
          Configure your global preferences
        </p>
      </div>

      {/* Storage Section */}
      <SettingsSection
        title="Storage"
        description="Configure where your media library is stored"
        icon={<HardDrive className="h-5 w-5 text-blue-400" />}
        iconColor="bg-blue-500/10"
        index={0}
      >
        <div className="space-y-2">
          <Label htmlFor="library-path" className="text-sm">Library Path</Label>
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
              className="flex-1 bg-surface border-border/50"
            />
            <Button variant="outline" onClick={handleSelectLibraryPath} className="border-border/50">
              <FolderOpen className="h-4 w-4 mr-2" />
              Browse
            </Button>
          </div>
        </div>
      </SettingsSection>

      {/* Downloads Section */}
      <SettingsSection
        title="Downloads"
        description="Configure default download quality settings"
        icon={<Download className="h-5 w-5 text-glow" />}
        iconColor="bg-glow/10"
        index={1}
      >
        <div className="space-y-2">
          <Label htmlFor="default-quality" className="text-sm">Default Quality</Label>
          <Select
            value={localSettings.default_quality}
            onValueChange={(value) =>
              setLocalSettings((prev) =>
                prev ? { ...prev, default_quality: value } : null
              )
            }
          >
            <SelectTrigger id="default-quality" className="w-full bg-surface border-border/50">
              <SelectValue placeholder="Select quality" />
            </SelectTrigger>
            <SelectContent className="glass border-border/50">
              {QUALITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SettingsSection>

      {/* Sync Section */}
      <SettingsSection
        title="Sync"
        description="Configure how often the library syncs with sources"
        icon={<RefreshCw className="h-5 w-5 text-emerald-400" />}
        iconColor="bg-emerald-500/10"
        index={2}
      >
        <div className="space-y-2">
          <Label htmlFor="sync-interval" className="text-sm">Sync Interval</Label>
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
            <SelectTrigger id="sync-interval" className="w-full bg-surface border-border/50">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent className="glass border-border/50">
              {SYNC_INTERVAL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SettingsSection>

      {/* Appearance Section */}
      <SettingsSection
        title="Appearance"
        description="Customize the look and feel of the application"
        icon={<Palette className="h-5 w-5 text-purple-400" />}
        iconColor="bg-purple-500/10"
        index={3}
      >
        <div className="space-y-3">
          <Label htmlFor="theme" className="text-sm">Theme</Label>
          <Select
            value={localSettings.theme}
            onValueChange={(value) => {
              setLocalSettings((prev) =>
                prev ? { ...prev, theme: value } : null
              );
              // Apply theme immediately for instant feedback
              const root = document.documentElement;
              if (value === "dark") {
                root.classList.add("dark");
                root.classList.remove("light");
              } else if (value === "light") {
                root.classList.add("light");
                root.classList.remove("dark");
              } else if (value === "system") {
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                if (prefersDark) {
                  root.classList.add("dark");
                  root.classList.remove("light");
                } else {
                  root.classList.add("light");
                  root.classList.remove("dark");
                }
              }
            }}
          >
            <SelectTrigger id="theme" className="w-full bg-surface border-border/50">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent className="glass border-border/50">
              {THEME_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            System follows your OS preference
          </p>
        </div>
      </SettingsSection>

      {/* Notifications Section */}
      <SettingsSection
        title="Notifications"
        description="Configure notification preferences"
        icon={<Bell className="h-5 w-5 text-rose-400" />}
        iconColor="bg-rose-500/10"
        index={4}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled" className="text-sm">
                Enable Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
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
              className="data-[state=checked]:bg-glow"
            />
          </div>
          <div className="pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await api.notifications.requestPermission();
                  await api.notifications.sendTest();
                  toast.success("Test notification sent");
                } catch (err) {
                  toast.error(`Failed: ${err instanceof Error ? err.message : String(err)}`);
                }
              }}
              className="border-border/50"
            >
              <BellRing className="h-4 w-4 mr-2" />
              Send Test
            </Button>
          </div>
        </div>
      </SettingsSection>

      {/* Patreon Credentials Section */}
      <SettingsSection
        title="Patreon Credentials"
        description="Manage cookie files for Patreon access"
        icon={<Key className="h-5 w-5 text-orange-400" />}
        iconColor="bg-orange-500/10"
        index={5}
        action={
          <AddCredentialDialog
            onSubmit={async (data) => {
              try {
                await createCredential(data);
                toast.success("Credential added");
              } catch (err) {
                toast.error(`Failed: ${err instanceof Error ? err.message : String(err)}`);
                throw err;
              }
            }}
          />
        }
      >
        <CredentialsList
          credentials={credentials}
          loading={credentialsLoading}
          onDelete={async (id) => {
            try {
              await deleteCredential(id);
              toast.success("Credential deleted");
            } catch (err) {
              toast.error(`Failed: ${err instanceof Error ? err.message : String(err)}`);
            }
          }}
          onSetDefault={async (id) => {
            try {
              await setAsDefault(id);
              toast.success("Default credential updated");
            } catch (err) {
              toast.error(`Failed: ${err instanceof Error ? err.message : String(err)}`);
            }
          }}
        />
      </SettingsSection>

      {/* Bass Boost Defaults Section */}
      <SettingsSection
        title="Bass Boost Defaults"
        description="Configure default bass boost settings for playback"
        icon={<Volume2 className="h-5 w-5 text-cyan-400" />}
        iconColor="bg-cyan-500/10"
        index={6}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bass-preset" className="text-sm">Preset</Label>
            <Select
              value={localSettings.bass_boost_preset}
              onValueChange={(value) =>
                setLocalSettings((prev) =>
                  prev ? { ...prev, bass_boost_preset: value } : null
                )
              }
            >
              <SelectTrigger id="bass-preset" className="w-full bg-surface border-border/50">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent className="glass border-border/50">
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="custom-gain" className="text-sm">Custom Gain</Label>
                <span className="text-sm font-medium text-glow">
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
                Adjust from 0 to 40dB
              </p>
            </div>
          )}

          {!showCustomGainSlider && currentPreset && (
            <p className="text-sm text-muted-foreground">
              Current gain: <span className="text-glow font-medium">+{currentPreset.gain}dB</span>
            </p>
          )}
        </div>
      </SettingsSection>

      {/* Save Button */}
      <div
        className="flex justify-end pt-4 opacity-0 animate-fade-up"
        style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-glow hover:bg-glow/90 text-glow-foreground shadow-lg shadow-glow/20 min-w-[140px]"
        >
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
