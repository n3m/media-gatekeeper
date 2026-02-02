"use client";

import { useState } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Library,
  FolderOpen,
  Download,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface SetupWizardProps {
  onComplete: () => void;
}

const STEPS = ["welcome", "library", "quality", "complete"] as const;

const QUALITY_OPTIONS = [
  {
    value: "best",
    label: "Best Quality",
    description: "Highest available audio/video quality",
  },
  {
    value: "1080p",
    label: "1080p HD",
    description: "Full HD video quality",
  },
  {
    value: "720p",
    label: "720p HD",
    description: "HD video, smaller file sizes",
  },
  {
    value: "480p",
    label: "480p SD",
    description: "Standard definition, fastest downloads",
  },
];

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const { updateSettings } = useAppSettings();
  const [step, setStep] = useState<number>(0);
  const [libraryPath, setLibraryPath] = useState<string>("");
  const [quality, setQuality] = useState<string>("best");
  const [saving, setSaving] = useState(false);

  const handleNext = () => {
    if (step === 2) {
      // Moving to complete step
      setStep((s) => s + 1);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleSkip = async () => {
    setSaving(true);
    try {
      await updateSettings({ first_run_completed: true });
      onComplete();
    } catch {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await updateSettings({
        library_path: libraryPath || undefined,
        default_quality: quality,
        first_run_completed: true,
      });
      onComplete();
    } catch {
      setSaving(false);
    }
  };

  const handleSelectLibraryPath = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true });
      if (selected) setLibraryPath(selected as string);
    } catch (error) {
      console.error("Failed to open folder picker:", error);
    }
  };

  const currentStep = STEPS[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 pt-6">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                index <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Welcome Step */}
        {currentStep === "welcome" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Library className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                Welcome to N3Ms Media Library
              </CardTitle>
              <CardDescription className="text-base">
                Your personal media management solution. Let&apos;s get you set
                up in just a few steps.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              <p>
                We&apos;ll help you configure your library location and
                preferred download quality settings.
              </p>
            </CardContent>
          </>
        )}

        {/* Library Step */}
        {currentStep === "library" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <FolderOpen className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                Where should we store your media?
              </CardTitle>
              <CardDescription className="text-base">
                Choose a folder where your downloaded media will be saved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  onClick={handleSelectLibraryPath}
                  className="w-full justify-start h-auto py-3"
                >
                  <FolderOpen className="mr-2 h-5 w-5" />
                  {libraryPath ? (
                    <span className="truncate">{libraryPath}</span>
                  ) : (
                    "Choose folder..."
                  )}
                </Button>
                {!libraryPath && (
                  <p className="text-sm text-muted-foreground text-center">
                    Or leave empty to use the default location
                  </p>
                )}
              </div>
            </CardContent>
          </>
        )}

        {/* Quality Step */}
        {currentStep === "quality" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Download className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                Select default download quality
              </CardTitle>
              <CardDescription className="text-base">
                Choose the preferred quality for your media downloads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={quality}
                onValueChange={setQuality}
                className="space-y-3"
              >
                {QUALITY_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setQuality(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </>
        )}

        {/* Complete Step */}
        {currentStep === "complete" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl">You&apos;re all set!</CardTitle>
              <CardDescription className="text-base">
                Your media library is ready to use.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Library Location</span>
                  <span className="font-medium truncate max-w-[200px]">
                    {libraryPath || "Default"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Download Quality</span>
                  <span className="font-medium">
                    {QUALITY_OPTIONS.find((q) => q.value === quality)?.label ||
                      quality}
                  </span>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Navigation */}
        <CardFooter className="flex justify-between gap-2">
          {step > 0 && step < 3 ? (
            <Button variant="outline" onClick={handleBack} disabled={saving}>
              Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            {step < 3 && (
              <Button variant="ghost" onClick={handleSkip} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Skip Setup
              </Button>
            )}
            {step < 3 && (
              <Button onClick={handleNext}>
                {step === 2 ? "Finish" : "Next"}
              </Button>
            )}
            {step === 3 && (
              <Button onClick={handleComplete} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Started
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
