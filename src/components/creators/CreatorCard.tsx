import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Creator } from "@/types/creator";

interface CreatorCardProps {
  creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const initials = creator.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link to={`/creators/${creator.id}`}>
      <Card className="hover:bg-accent transition-colors cursor-pointer">
        <CardContent className="flex flex-col items-center p-6 gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={creator.photo_path || undefined} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h3 className="font-semibold">{creator.name}</h3>
            <p className="text-sm text-muted-foreground">0 videos</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
