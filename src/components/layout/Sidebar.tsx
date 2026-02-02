import { Link, useLocation } from "react-router-dom";
import { Home, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "@/components/search/GlobalSearch";

const navItems = [
  { path: "/", label: "Creators", icon: Home },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-72 h-screen flex flex-col p-3 bg-background/50">
      {/* Glass panel container */}
      <div className="flex-1 flex flex-col glass rounded-2xl overflow-hidden glow-border">
        {/* Logo header */}
        <div className="p-5 border-b border-border/50">
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-glow/20 blur-xl rounded-full group-hover:bg-glow/40 transition-colors duration-500" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-glow/20 to-glow/5 flex items-center justify-center border border-glow/30 group-hover:border-glow/50 transition-colors">
                <Sparkles className="h-5 w-5 text-glow" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg tracking-tight">
                N3Ms
              </span>
              <span className="text-xs text-muted-foreground -mt-0.5">
                Media Library
              </span>
            </div>
          </Link>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border/50">
          <GlobalSearch />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-glow/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {/* Active glow indicator */}
                {isActive && (
                  <>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-glow rounded-r-full shadow-[0_0_10px_2px_hsl(var(--glow)/0.5)]" />
                    <div className="absolute inset-0 bg-glow/5 rounded-xl" />
                  </>
                )}
                <Icon className={cn(
                  "h-5 w-5 relative z-10 transition-colors",
                  isActive && "text-glow"
                )} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer accent */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
            <div className="w-1.5 h-1.5 rounded-full bg-glow/50 animate-pulse" />
            <span>Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
