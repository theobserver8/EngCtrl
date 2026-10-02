import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom has no matchMedia. Report "reduced motion" so exit animations resolve immediately
// and tests do not depend on timers.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string): MediaQueryList =>
    ({
      matches: query.includes("prefers-reduced-motion: reduce"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList,
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
