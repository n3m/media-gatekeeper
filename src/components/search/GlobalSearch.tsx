import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Video, FileVideo, Loader2, X } from "lucide-react";
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search... (Ctrl+K)"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.trim() && setIsOpen(true)}
          className="pl-9 pr-8"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden">
          <ScrollArea className="max-h-80">
            {loading && (
              <div className="flex items-center justify-center p-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Searching...
              </div>
            )}

            {!loading && !hasResults && query.trim() && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No results found for "{query}"
              </div>
            )}

            {!loading && hasResults && (
              <div className="py-1">
                {/* Creators */}
                {results.creators.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Creators
                    </div>
                    {results.creators.map((creator) => (
                      <button
                        key={creator.id}
                        onClick={() => handleResultClick(`/creators/${creator.id}`)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 text-sm",
                          "hover:bg-accent hover:text-accent-foreground transition-colors",
                          "text-left"
                        )}
                      >
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{creator.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Feed Items */}
                {results.feed_items.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide border-t border-border mt-1 pt-2">
                      Feed Items
                    </div>
                    {results.feed_items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          // Navigate to the creator's feed tab
                          // We need to find the creator from the source
                          // For now, just close the dropdown
                          setIsOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 text-sm",
                          "hover:bg-accent hover:text-accent-foreground transition-colors",
                          "text-left"
                        )}
                      >
                        <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{item.title}</span>
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
                  <div>
                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide border-t border-border mt-1 pt-2">
                      Downloaded Videos
                    </div>
                    {results.warehouse_items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(`/creators/${item.creator_id}?tab=warehouse`)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 text-sm",
                          "hover:bg-accent hover:text-accent-foreground transition-colors",
                          "text-left"
                        )}
                      >
                        <FileVideo className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{item.title}</span>
                          {item.platform && (
                            <span className="text-xs text-muted-foreground">{item.platform}</span>
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
