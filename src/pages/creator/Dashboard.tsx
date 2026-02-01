import { useFeedItems } from "@/hooks/useFeedItems";
import { useSources } from "@/hooks/useSources";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Download, Clock, Folder } from "lucide-react";

interface DashboardProps {
  creatorId: string;
}

export function Dashboard({ creatorId }: DashboardProps) {
  const { counts, loading: feedLoading } = useFeedItems(creatorId);
  const { sources, loading: sourcesLoading } = useSources(creatorId);

  const loading = feedLoading || sourcesLoading;

  // Get last sync time from sources
  const lastSyncedSource = sources
    .filter((s) => s.last_synced_at)
    .sort((a, b) => new Date(b.last_synced_at!).getTime() - new Date(a.last_synced_at!).getTime())[0];

  const lastSyncTime = lastSyncedSource?.last_synced_at
    ? new Date(lastSyncedSource.last_synced_at).toLocaleString()
    : "Never";

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.total}</div>
            <p className="text-xs text-muted-foreground">In feed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Downloaded</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.downloaded}</div>
            <p className="text-xs text-muted-foreground">
              {counts.total > 0
                ? `${Math.round((counts.downloaded / counts.total) * 100)}% of total`
                : "No videos yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sources</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sources.length}</div>
            <p className="text-xs text-muted-foreground">Connected channels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{lastSyncTime}</div>
            <p className="text-xs text-muted-foreground">Most recent sync</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
