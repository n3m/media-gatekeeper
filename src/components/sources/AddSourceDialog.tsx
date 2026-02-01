import { useState } from "react";
import { Plus } from "lucide-react";
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

interface AddSourceDialogProps {
  onSubmit: (platform: "youtube" | "patreon", channelUrl: string) => Promise<void>;
}

export function AddSourceDialog({ onSubmit }: AddSourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<"youtube" | "patreon">("youtube");
  const [channelUrl, setChannelUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelUrl.trim()) return;

    try {
      setLoading(true);
      await onSubmit(platform, channelUrl.trim());
      setChannelUrl("");
      setPlatform("youtube");
      setOpen(false);
    } catch (err) {
      console.error("Failed to add source:", err);
    } finally {
      setLoading(false);
    }
  };

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
              <Select value={platform} onValueChange={(v) => setPlatform(v as "youtube" | "patreon")}>
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
              <Label htmlFor="channelUrl">Channel URL</Label>
              <Input
                id="channelUrl"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder={platform === "youtube"
                  ? "https://youtube.com/@channel"
                  : "https://patreon.com/creator"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!channelUrl.trim() || loading}>
              {loading ? "Adding..." : "Add Source"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
