import { useState } from "react";
import { FolderOpen, Upload } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
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
import { api } from "@/lib/tauri";
import type { WarehouseItem } from "@/types/warehouse-item";

interface ImportVideoDialogProps {
  creatorId: string;
  onImported: (item: WarehouseItem) => void;
}

type Platform = "youtube" | "patreon" | "other";

function extractTitleFromFilename(filePath: string): string {
  // Get the filename from the path
  const filename = filePath.split(/[/\\]/).pop() || "";
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "");
  // Replace underscores with spaces
  return nameWithoutExt.replace(/_/g, " ");
}

export function ImportVideoDialog({ creatorId, onImported }: ImportVideoDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filePath, setFilePath] = useState("");
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("other");
  const [loading, setLoading] = useState(false);

  const handleSelectFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Video", extensions: ["mp4", "mkv", "webm", "avi", "mov"] }],
      });

      if (selected && typeof selected === "string") {
        setFilePath(selected);
        setTitle(extractTitleFromFilename(selected));
      }
    } catch (err) {
      console.error("Failed to open file picker:", err);
      toast.error("Failed to open file picker");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filePath || !title.trim()) return;

    try {
      setLoading(true);
      const item = await api.warehouse.import({
        source_path: filePath,
        creator_id: creatorId,
        title: title.trim(),
        platform: platform,
      });
      toast.success(`Imported: ${title.trim()}`);
      onImported(item);
      resetForm();
      setDialogOpen(false);
    } catch (err) {
      console.error("Failed to import video:", err);
      toast.error(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFilePath("");
    setTitle("");
    setPlatform("other");
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Import Video
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Import Video</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Video File</Label>
              <div className="flex gap-2">
                <Input
                  id="file"
                  value={filePath}
                  readOnly
                  placeholder="Select a video file..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleSelectFile}>
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="patreon">Patreon</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!filePath || !title.trim() || loading}>
              {loading ? "Importing..." : "Import"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
