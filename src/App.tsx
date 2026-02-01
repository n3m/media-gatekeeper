import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { CreatorList } from "@/pages/CreatorList";
import { Settings } from "@/pages/Settings";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<CreatorList />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
