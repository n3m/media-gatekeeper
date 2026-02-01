import { Link, useLocation } from "react-router-dom";
import { Home, Settings, Library } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Creators", icon: Home },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-card h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Library className="h-6 w-6" />
          <span className="font-semibold text-lg">N3Ms Media Library</span>
        </div>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
