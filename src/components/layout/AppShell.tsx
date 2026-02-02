import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AppShell() {
  return (
    <div className="flex h-screen noise">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <Outlet />
        </ScrollArea>
      </main>
    </div>
  );
}
