import { useState } from "react";
import { Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface AddCredentialDialogProps {
  onSubmit: (data: {
    label: string;
    platform: string;
    cookie_path: string;
    is_default?: boolean;
  }) => Promise<void>;
}

export function AddCredentialDialog({ onSubmit }: AddCredentialDialogProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [cookiePath, setCookiePath] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectFile = async () => {
    const { open: openDialog } = await import("@tauri-apps/plugin-dialog");
    const selected = await openDialog({
      filters: [{ name: "Cookie Files", extensions: ["txt", "json", "sqlite"] }],
    });
    if (selected) {
      setCookiePath(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !cookiePath.trim()) return;

    try {
      setLoading(true);
      await onSubmit({
        label: label.trim(),
        platform: "patreon",
        cookie_path: cookiePath.trim(),
        is_default: isDefault,
      });
      setLabel("");
      setCookiePath("");
      setIsDefault(false);
      setOpen(false);
    } catch (err) {
      console.error("Failed to add credential:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Patreon Cookie
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Patreon Cookie</DialogTitle>
            <DialogDescription>
              Add a Netscape-format cookie file exported from your browser. This allows
              syncing content from your Patreon subscriptions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Main Account"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cookiePath">Cookie File</Label>
              <div className="flex gap-2">
                <Input
                  id="cookiePath"
                  value={cookiePath}
                  onChange={(e) => setCookiePath(e.target.value)}
                  placeholder="/path/to/cookies.txt"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleSelectFile}>
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Export cookies from your browser using an extension like "Get cookies.txt"
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked === true)}
              />
              <Label htmlFor="isDefault" className="text-sm font-normal">
                Set as default for Patreon sources
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!label.trim() || !cookiePath.trim() || loading}>
              {loading ? "Adding..." : "Add Cookie"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
