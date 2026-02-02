import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Video, FileVideo, Loader2, X, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearch } from "@/hooks/useSearch";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const navigate = useNavigate();
  const { query, setQuery, results, loading, clearResults } = useSearch({
    debounceMs: 300,
    limit: 5,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      // Escape to close
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim()) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    clearResults();
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
    clearResults();
  };

  const hasResults =
    results &&
    (results.creators.length > 0 ||
      results.feed_items.length > 0 ||
      results.warehouse_items.length > 0);

  const showDropdown = isOpen && (query.trim().length > 0 || hasResults);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "relative rounded-xl transition-all duration-300",
          isFocused && "ring-2 ring-glow/30 ring-offset-2 ring-offset-background"
        )}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            query.trim() && setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          className="pl-9 pr-16 h-10 bg-surface-elevated border-border/50 rounded-xl placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-glow/30"
        />
        {query ? (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted rounded-md"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        ) : (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-muted-foreground/40 text-xs pointer-events-none">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 glass rounded-xl shadow-xl border border-border/50 z-50 overflow-hidden animate-fade-down">
          <ScrollArea className="max-h-80">
            {loading && (
              <div className="flex items-center justify-center p-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2 text-glow" />
                <span className="text-sm">Searching...</span>
              </div>
            )}

            {!loading && !hasResults && query.trim() && (
              <div className="p-6 text-center">
                <p className="text-muted-foreground text-sm">
                  No results for "<span className="text-foreground">{query}</span>"
                </p>
              </div>
            )}

            {!loading && hasResults && (
              <div className="py-2">
                {/* Creators */}
                {results.creators.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Creators
                    </div>
                    {results.creators.map((creator, index) => (
                      <button
                        key={creator.id}
                        onClick={() => handleResultClick(`/creators/${creator.id}`)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-sm",
                          "hover:bg-glow/5 transition-colors",
                          "text-left group",
                          index === 0 && "animate-fade-up"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-glow/10 flex items-center justify-center group-hover:bg-glow/20 transition-colors">
                          <User className="h-4 w-4 text-glow" />
                        </div>
                        <span className="truncate font-medium">{creator.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Feed Items */}
                {results.feed_items.length > 0 && (
                  <div className="border-t border-border/50">
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Feed Items
                    </div>
                    {results.feed_items.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setIsOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-sm",
                          "hover:bg-glow/5 transition-colors",
                          "text-left group"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-glow/10 transition-colors">
                          <Video className="h-4 w-4 text-muted-foreground group-hover:text-glow transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="truncate block font-medium">{item.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.download_status === "done" ? "Downloaded" : "In Feed"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Warehouse Items */}
                {results.warehouse_items.length > 0 && (
                  <div className="border-t border-border/50">
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Downloaded Videos
                    </div>
                    {results.warehouse_items.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(`/creators/${item.creator_id}?tab=warehouse`)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-sm",
                          "hover:bg-glow/5 transition-colors",
                          "text-left group"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                          <FileVideo className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="truncate block font-medium">{item.title}</span>
                          {item.platform && (
                            <span className="text-xs text-muted-foreground capitalize">{item.platform}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
