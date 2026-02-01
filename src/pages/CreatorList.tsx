import { useCreators } from "@/hooks/useCreators";
import { CreatorCard } from "@/components/creators/CreatorCard";
import { CreateCreatorDialog } from "@/components/creators/CreateCreatorDialog";

export function CreatorList() {
  const { creators, loading, error, createCreator } = useCreators();

  const handleCreateCreator = async (name: string) => {
    await createCreator({ name });
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Creators</h1>
        <CreateCreatorDialog onSubmit={handleCreateCreator} />
      </div>

      {creators.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No creators yet. Add your first one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      )}
    </div>
  );
}
