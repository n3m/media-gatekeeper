import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video, ChevronRight } from "lucide-react";
import type { Creator } from "@/types/creator";
import { cn } from "@/lib/utils";

interface CreatorCardProps {
  creator: Creator;
  index?: number;
}

export function CreatorCard({ creator, index = 0 }: CreatorCardProps) {
  const initials = creator.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      to={`/creators/${creator.id}`}
      className="block opacity-0 animate-fade-up"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "forwards" }}
    >
      <Card className={cn(
        "group relative overflow-hidden",
        "bg-card/50 border-border/50",
        "hover:border-glow/30 hover:bg-card",
        "transition-all duration-300 ease-out",
        "tilt-card"
      )}>
        {/* Gradient background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-glow/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Content */}
        <div className="relative p-6 flex flex-col items-center gap-4">
          {/* Avatar with glow effect */}
          <div className="relative">
            <div className="absolute inset-0 bg-glow/20 blur-2xl rounded-full scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500" />
            <Avatar className="h-24 w-24 border-2 border-border/50 group-hover:border-glow/30 transition-colors relative">
              <AvatarImage src={creator.photo_path || undefined} className="object-cover" />
              <AvatarFallback className="text-2xl font-display font-bold bg-gradient-to-br from-surface to-surface-elevated text-muted-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Name and stats */}
          <div className="text-center w-full">
            <h3 className="font-display font-semibold text-lg truncate mb-1 group-hover:text-glow transition-colors">
              {creator.name}
            </h3>
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Video className="h-3.5 w-3.5" />
              <span>0 videos</span>
            </div>
          </div>

          {/* Hover arrow indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <ChevronRight className="h-5 w-5 text-glow" />
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-glow/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </Card>
    </Link>
  );
}
