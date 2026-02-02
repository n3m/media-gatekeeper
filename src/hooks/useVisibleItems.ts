import { useCallback, useEffect, useRef, useState } from "react";

interface UseVisibleItemsOptions {
  /** Debounce delay in milliseconds before triggering callback */
  debounceMs?: number;
  /** Root margin for IntersectionObserver */
  rootMargin?: string;
  /** Threshold for considering an element visible */
  threshold?: number;
}

interface UseVisibleItemsReturn {
  /** Register a row element for visibility tracking */
  registerRow: (id: string, element: HTMLElement | null) => void;
  /** Currently visible item IDs */
  visibleIds: Set<string>;
}

/**
 * Hook to track which items are currently visible in the viewport
 * Uses IntersectionObserver for efficient visibility detection
 */
export function useVisibleItems(
  options: UseVisibleItemsOptions = {}
): UseVisibleItemsReturn {
  const { debounceMs = 300, rootMargin = "0px", threshold = 0.1 } = options;

  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementMapRef = useRef<Map<string, HTMLElement>>(new Map());
  const pendingVisibleRef = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced update of visible IDs
  const flushVisibleUpdates = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setVisibleIds(new Set(pendingVisibleRef.current));
    }, debounceMs);
  }, [debounceMs]);

  // Initialize IntersectionObserver
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        let changed = false;

        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-item-id");
          if (!id) return;

          if (entry.isIntersecting) {
            if (!pendingVisibleRef.current.has(id)) {
              pendingVisibleRef.current.add(id);
              changed = true;
            }
          } else {
            if (pendingVisibleRef.current.has(id)) {
              pendingVisibleRef.current.delete(id);
              changed = true;
            }
          }
        });

        if (changed) {
          flushVisibleUpdates();
        }
      },
      { rootMargin, threshold }
    );

    // Observe all currently registered elements
    elementMapRef.current.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [rootMargin, threshold, flushVisibleUpdates]);

  // Register a row element
  const registerRow = useCallback((id: string, element: HTMLElement | null) => {
    const currentElement = elementMapRef.current.get(id);

    if (element) {
      // Set data attribute for identification
      element.setAttribute("data-item-id", id);

      // If element changed, update registration
      if (currentElement !== element) {
        // Unobserve old element if exists
        if (currentElement) {
          observerRef.current?.unobserve(currentElement);
        }

        // Register new element
        elementMapRef.current.set(id, element);
        observerRef.current?.observe(element);
      }
    } else {
      // Element removed, unregister
      if (currentElement) {
        observerRef.current?.unobserve(currentElement);
        elementMapRef.current.delete(id);
        pendingVisibleRef.current.delete(id);
      }
    }
  }, []);

  return { registerRow, visibleIds };
}
