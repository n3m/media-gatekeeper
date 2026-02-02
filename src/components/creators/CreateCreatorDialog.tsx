import { useState } from "react";
import { Plus, Loader2, UserPlus } from "lucide-react";
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

interface CreateCreatorDialogProps {
  onSubmit: (name: string) => Promise<void>;
}

export function CreateCreatorDialog({ onSubmit }: CreateCreatorDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await onSubmit(name.trim());
      setName("");
      setOpen(false);
    } catch (err) {
      console.error("Failed to create creator:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-glow hover:bg-glow/90 text-glow-foreground shadow-lg shadow-glow/20 hover:shadow-glow/30 transition-all">
          <Plus className="h-4 w-4 mr-2" />
          Add Creator
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-border/50 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-xl bg-glow/10 flex items-center justify-center mb-2">
              <UserPlus className="h-6 w-6 text-glow" />
            </div>
            <DialogTitle className="text-center font-display text-xl">Add New Creator</DialogTitle>
            <DialogDescription className="text-center">
              Start tracking content from a new creator
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Creator Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter creator name"
                autoFocus
                className="h-11 bg-surface border-border/50 focus-visible:ring-glow/30 focus-visible:border-glow/30"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || loading}
              className="flex-1 sm:flex-none bg-glow hover:bg-glow/90 text-glow-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
