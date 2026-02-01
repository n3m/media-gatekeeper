import { Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Source } from "@/types/source";

interface SourcesTableProps {
  sources: Source[];
  onDelete: (id: string) => Promise<void>;
}

function getStatusBadge(status: Source["status"]) {
  switch (status) {
    case "validated":
      return <Badge variant="default" className="bg-green-600">Validated</Badge>;
    case "pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
  }
}

function getPlatformBadge(platform: Source["platform"]) {
  switch (platform) {
    case "youtube":
      return <Badge variant="outline" className="border-red-500 text-red-500">YouTube</Badge>;
    case "patreon":
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Patreon</Badge>;
  }
}

export function SourcesTable({ sources, onDelete }: SourcesTableProps) {
  if (sources.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sources added yet. Add a YouTube or Patreon channel to get started.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Platform</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Synced</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((source) => (
          <TableRow key={source.id}>
            <TableCell>{getPlatformBadge(source.platform)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="truncate max-w-[300px]">
                  {source.channel_name || source.channel_url}
                </span>
                <a
                  href={source.channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </TableCell>
            <TableCell>{getStatusBadge(source.status)}</TableCell>
            <TableCell className="text-muted-foreground">
              {source.last_synced_at
                ? new Date(source.last_synced_at).toLocaleDateString()
                : "Never"}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(source.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
