import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CreatorList } from "@/pages/CreatorList";
import { CreatorView } from "@/pages/CreatorView";
import { Settings } from "@/pages/Settings";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTheme } from "@/hooks/useTheme";
import { SetupWizard } from "@/components/setup";

function App() {
  const { settings, loading, refetch } = useAppSettings();
  const { resolvedTheme } = useTheme();
  const [showWizard, setShowWizard] = useState<boolean | null>(null);

  // Determine if we should show wizard after settings load
  useEffect(() => {
    if (settings) {
      setShowWizard(!settings.first_run_completed);
    }
  }, [settings]);

  const handleWizardComplete = () => {
    setShowWizard(false);
    refetch(); // Refresh settings after wizard completes
  };

  // Show loading while fetching initial settings
  if (loading || showWizard === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show wizard if first run not completed
  if (showWizard) {
    return (
      <div className={`min-h-screen bg-background text-foreground ${resolvedTheme}`}>
        <SetupWizard onComplete={handleWizardComplete} />
      </div>
    );
  }

  // Normal app
  return (
    <div className={`min-h-screen bg-background text-foreground ${resolvedTheme}`}>
      <Toaster position="bottom-right" theme={resolvedTheme} />
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
