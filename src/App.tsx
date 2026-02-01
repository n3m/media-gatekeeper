import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CreatorList } from "@/pages/CreatorList";
import { Settings } from "@/pages/Settings";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CreatorList />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
