import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { CreatorList } from "@/pages/CreatorList";
import { CreatorView } from "@/pages/CreatorView";
import { Settings } from "@/pages/Settings";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <Toaster position="bottom-right" theme="dark" />
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<CreatorList />} />
            <Route path="/creators/:id" element={<CreatorView />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
