import { useState, useEffect } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCredentials } from "@/hooks/useCredentials";

interface AddSourceDialogProps {
  onSubmit: (
    platform: "youtube" | "patreon",
    channelUrl: string,
    credentialId?: string
  ) => Promise<void>;
}

export function AddSourceDialog({ onSubmit }: AddSourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"youtube" | "patreon">("youtube");
  const [channelUrl, setChannelUrl] = useState("");
  const [credentialId, setCredentialId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { credentials, loading: credentialsLoading } = useCredentials("patreon");

  // Set default credential when credentials load or platform changes
  useEffect(() => {
    if (platform === "patreon" && credentials.length > 0) {
      const defaultCred = credentials.find((c) => c.is_default);
      setCredentialId(defaultCred?.id || credentials[0].id);
    } else {
      setCredentialId("");
    }
  }, [platform, credentials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelUrl.trim()) return;

    try {
      setLoading(true);
      await onSubmit(
        platform,
        channelUrl.trim(),
        platform === "patreon" ? credentialId || undefined : undefined
      );
      setChannelUrl("");
      setPlatform("youtube");
      setCredentialId("");
      setOpen(false);
    } catch (err) {
      console.error("Failed to add source:", err);
    } finally {
      setLoading(false);
    }
  };

  const showCredentialWarning = platform === "patreon" && !credentialsLoading && credentials.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Source</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select
                value={platform}
                onValueChange={(v) => setPlatform(v as "youtube" | "patreon")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="patreon">Patreon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channelUrl">
                {platform === "youtube" ? "Channel URL" : "Creator URL"}
              </Label>
              <Input
                id="channelUrl"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder={
                  platform === "youtube"
                    ? "https://youtube.com/@channel"
                    : "https://patreon.com/creator"
                }
              />
            </div>

            {platform === "patreon" && (
              <div className="space-y-2">
                <Label htmlFor="credential">Cookie Credential</Label>
                {showCredentialWarning ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">
                      No Patreon cookies configured. Add one in Settings first.
                    </p>
                  </div>
                ) : (
                  <Select
                    value={credentialId}
                    onValueChange={setCredentialId}
                    disabled={credentialsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credential" />
                    </SelectTrigger>
                    <SelectContent>
                      {credentials.map((cred) => (
                        <SelectItem key={cred.id} value={cred.id}>
                          {cred.label}
                          {cred.is_default && " (Default)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !channelUrl.trim() ||
                loading ||
                (platform === "patreon" && credentials.length === 0)
              }
            >
              {loading ? "Adding..." : "Add Source"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
