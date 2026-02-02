import { useCreators } from "@/hooks/useCreators";
import { CreatorCard } from "@/components/creators/CreatorCard";
import { CreateCreatorDialog } from "@/components/creators/CreateCreatorDialog";
import { Loader2, Users, Sparkles } from "lucide-react";

export function CreatorList() {
  const { creators, loading, error, createCreator } = useCreators();

  const handleCreateCreator = async (name: string) => {
    await createCreator({ name });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-glow" />
          <p className="text-muted-foreground text-sm">Loading creators...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-down">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight mb-1">
            Your Creators
          </h1>
          <p className="text-muted-foreground">
            {creators.length === 0
              ? "Start by adding your first creator"
              : `Managing ${creators.length} creator${creators.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <CreateCreatorDialog onSubmit={handleCreateCreator} />
      </div>

      {creators.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 animate-fade-up">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-glow/20 blur-3xl rounded-full" />
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-glow/20 to-glow/5 flex items-center justify-center border border-glow/30">
              <Users className="h-10 w-10 text-glow" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-semibold mb-2">No creators yet</h2>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            Add your first creator to start tracking their content from YouTube and Patreon.
          </p>
          <CreateCreatorDialog onSubmit={handleCreateCreator} />
        </div>
      ) : (
        /* Creator grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {creators.map((creator, index) => (
            <CreatorCard key={creator.id} creator={creator} index={index} />
          ))}
        </div>
      )}

      {/* Decorative footer */}
      {creators.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-12 text-muted-foreground/40 text-sm animate-fade-up" style={{ animationDelay: "0.5s" }}>
          <Sparkles className="h-4 w-4" />
          <span>Your personal media vault</span>
        </div>
      )}
    </div>
  );
}
