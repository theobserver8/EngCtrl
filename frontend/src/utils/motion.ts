/** Motion scale in ms, mirrored from the --motion-* CSS variables in index.css. */
export const MOTION_MS = {
  fast: 200,
  base: 320,
  slow: 450,
  view: 550,
} as const;

export function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
