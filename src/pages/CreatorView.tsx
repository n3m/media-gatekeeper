import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/tauri";
import type { Creator } from "@/types/creator";
import { Dashboard } from "./creator/Dashboard";
import { CreatorSettings } from "./creator/CreatorSettings";
import { Feed } from "./creator/Feed";
import { Warehouse } from "./creator/Warehouse";

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
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="p-8">
        <p className="text-destructive">Error: {error || "Creator not found"}</p>
        <Button variant="link" onClick={() => navigate("/")}>
          Go back
        </Button>
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
    <div className="p-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Link>
      </Button>

      <div className="flex items-center gap-4 mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={creator.photo_path || undefined} />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{creator.name}</h1>
          <p className="text-muted-foreground">0 sources · 0 videos</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="warehouse">Warehouse</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <Dashboard />
        </TabsContent>
        <TabsContent value="settings">
          <CreatorSettings />
        </TabsContent>
        <TabsContent value="feed">
          <Feed />
        </TabsContent>
        <TabsContent value="warehouse">
          <Warehouse />
        </TabsContent>
      </Tabs>
    </div>
  );
}
