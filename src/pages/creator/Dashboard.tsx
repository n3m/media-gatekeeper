import { useFeedItems } from "@/hooks/useFeedItems";
import { useSources } from "@/hooks/useSources";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Video, Download, Clock, Folder, TrendingUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  creatorId: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
  index: number;
  progress?: { value: number; max: number };
}

function StatCard({ title, value, subtitle, icon, iconBg, index, progress }: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/50 bg-card/50 hover:bg-card transition-colors",
        "opacity-0 animate-fade-up"
      )}
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-display font-bold tracking-tight animate-count-up" style={{ animationDelay: `${index * 100 + 200}ms` }}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center">
            {progress ? (
              <ProgressRing value={progress.value} max={progress.max} size={56} strokeWidth={4}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
                  {icon}
                </div>
              </ProgressRing>
            ) : (
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconBg)}>
                {icon}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      {/* Subtle gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-glow/20 to-transparent" />
    </Card>
  );
}

export function Dashboard({ creatorId }: DashboardProps) {
  const { counts, loading: feedLoading } = useFeedItems(creatorId);
  const { sources, loading: sourcesLoading } = useSources(creatorId);

  const loading = feedLoading || sourcesLoading;

  // Get last sync time from sources
  const lastSyncedSource = sources
    .filter((s) => s.last_synced_at)
    .sort((a, b) => new Date(b.last_synced_at!).getTime() - new Date(a.last_synced_at!).getTime())[0];

  const formatLastSync = () => {
    if (!lastSyncedSource?.last_synced_at) return "Never";
    const date = new Date(lastSyncedSource.last_synced_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const downloadPercent = counts.total > 0
    ? Math.round((counts.downloaded / counts.total) * 100)
    : 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-glow" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Videos"
          value={counts.total}
          subtitle="In feed"
          icon={<Video className="h-5 w-5 text-blue-400" />}
          iconBg="bg-blue-500/10"
          index={0}
        />
        <StatCard
          title="Downloaded"
          value={counts.downloaded}
          subtitle={counts.total > 0 ? `${downloadPercent}% complete` : "No videos yet"}
          icon={<Download className="h-5 w-5 text-glow" />}
          iconBg="bg-glow/10"
          index={1}
          progress={{ value: counts.downloaded, max: counts.total }}
        />
        <StatCard
          title="Sources"
          value={sources.length}
          subtitle="Connected channels"
          icon={<Folder className="h-5 w-5 text-purple-400" />}
          iconBg="bg-purple-500/10"
          index={2}
        />
        <StatCard
          title="Last Sync"
          value={formatLastSync()}
          subtitle="Most recent update"
          icon={<Clock className="h-5 w-5 text-emerald-400" />}
          iconBg="bg-emerald-500/10"
          index={3}
        />
      </div>

      {/* Quick insights */}
      {counts.total > 0 && (
        <Card className="border-border/50 bg-card/50 opacity-0 animate-fade-up" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-glow/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-glow" />
              </div>
              <h3 className="font-display font-semibold">Quick Stats</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Pending</p>
                <p className="font-semibold text-lg">{counts.total - counts.downloaded}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg per source</p>
                <p className="font-semibold text-lg">
                  {sources.length > 0 ? Math.round(counts.total / sources.length) : 0}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Download rate</p>
                <p className="font-semibold text-lg">{downloadPercent}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active sources</p>
                <p className="font-semibold text-lg">
                  {sources.filter(s => s.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
