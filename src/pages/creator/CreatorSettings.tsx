import { useSources } from "@/hooks/useSources";
import { AddSourceDialog } from "@/components/sources/AddSourceDialog";
import { SourcesTable } from "@/components/sources/SourcesTable";

interface CreatorSettingsProps {
  creatorId: string;
}

export function CreatorSettings({ creatorId }: CreatorSettingsProps) {
  const { sources, loading, error, createSource, deleteSource } = useSources(creatorId);

  const handleAddSource = async (platform: "youtube" | "patreon", channelUrl: string) => {
    await createSource({ platform, channel_url: channelUrl });
  };

  const handleDeleteSource = async (id: string) => {
    await deleteSource(id);
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Loading sources...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Sources</h2>
          <p className="text-sm text-muted-foreground">
            Manage YouTube and Patreon channels for this creator
          </p>
        </div>
        <AddSourceDialog onSubmit={handleAddSource} />
      </div>

      <SourcesTable sources={sources} onDelete={handleDeleteSource} />
    </div>
  );
}
