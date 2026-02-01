import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-4xl font-bold">N3Ms Media Library</h1>
        <Button>Get Started</Button>
      </div>
    </div>
  );
}

export default App;
