import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/tauri";
import type { Creator } from "@/types/creator";
import { Dashboard } from "./creator/Dashboard";
import { CreatorSettings } from "./creator/CreatorSettings";
import { Feed } from "./creator/Feed";
import { Warehouse } from "./creator/Warehouse";
import { cn } from "@/lib/utils";

export function CreatorView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCreator = async () => {
      try {
        setLoading(true);
        const data = await api.creators.get(id);
        setCreator(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchCreator();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-glow" />
          <p className="text-muted-foreground text-sm">Loading creator...</p>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-destructive">!</span>
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">
            {error || "Creator not found"}
          </h2>
          <Button variant="ghost" onClick={() => navigate("/")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go back
          </Button>
        </div>
      </div>
    );
  }

  const initials = creator.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Back navigation */}
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground animate-fade-in"
      >
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          All Creators
        </Link>
      </Button>

      {/* Creator header */}
      <div className="flex items-center gap-5 mb-8 animate-fade-up">
        {/* Avatar with glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-glow/20 blur-2xl rounded-full" />
          <Avatar className="h-20 w-20 border-2 border-glow/30 relative">
            <AvatarImage src={creator.photo_path || undefined} className="object-cover" />
            <AvatarFallback className="text-2xl font-display font-bold bg-gradient-to-br from-surface to-surface-elevated text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight mb-1">
            {creator.name}
          </h1>
          <p className="text-muted-foreground">
            0 sources · 0 videos
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <TabsList className="bg-muted/30 border border-border/50 p-1 h-auto gap-1">
          {["dashboard", "settings", "feed", "warehouse"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className={cn(
                "px-4 py-2 capitalize font-medium",
                "data-[state=active]:bg-glow/10 data-[state=active]:text-glow",
                "data-[state=active]:shadow-none"
              )}
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="dashboard" className="m-0">
            <Dashboard creatorId={creator.id} />
          </TabsContent>
          <TabsContent value="settings" className="m-0">
            <CreatorSettings creatorId={creator.id} />
          </TabsContent>
          <TabsContent value="feed" className="m-0">
            <Feed creatorId={creator.id} />
          </TabsContent>
          <TabsContent value="warehouse" className="m-0">
            <Warehouse creatorId={creator.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
