import { useEffect, useState } from "react";
import { useAppSettings } from "./useAppSettings";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

export function useTheme() {
  const { settings } = useAppSettings();
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  // Get the theme preference from settings
  const theme = (settings?.theme as Theme) || "dark";

  useEffect(() => {
    // Function to get system preference
    const getSystemTheme = (): ResolvedTheme => {
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return "dark";
    };

    // Function to resolve the theme
    const resolveTheme = (): ResolvedTheme => {
      if (theme === "system") {
        return getSystemTheme();
      }
      return theme as ResolvedTheme;
    };

    // Apply theme to document
    const applyTheme = (resolved: ResolvedTheme) => {
      const root = document.documentElement;
      if (resolved === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
      setResolvedTheme(resolved);
    };

    // Initial application
    applyTheme(resolveTheme());

    // Listen for system theme changes if using system preference
    if (theme === "system" && typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return {
    theme,
    resolvedTheme,
  };
}
