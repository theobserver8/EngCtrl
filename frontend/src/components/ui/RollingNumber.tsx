import { useState } from "react";

interface RollingNumberProps {
  value: number;
  format?: (value: number) => string;
  /**
   * False while the value is not real data yet (e.g. loading): it is shown as is, and so is the
   * first value once ready, so the first load does not roll.
   */
  ready?: boolean;
}

interface Roll {
  /** Increments on every change: used as a React key to restart the animation. */
  key: number;
  direction: "up" | "down";
}

/**
 * A number that rolls in from the direction of its change, like a mechanical counter
 * (from below when it grows, from above when it shrinks). The first value shows as is.
 */
function RollingNumber({ value, format = String, ready = true }: RollingNumberProps) {
  // Derived during render (not in an effect) so the roll starts in the same frame as the change.
  // null: no real value yet.
  const current = ready ? value : null;
  const [previous, setPrevious] = useState(current);
  const [roll, setRoll] = useState<Roll | null>(null);
  if (current !== previous) {
    setPrevious(current);
    if (current !== null && previous !== null) {
      setRoll({ key: (roll?.key ?? 0) + 1, direction: current > previous ? "up" : "down" });
    }
  }

  return (
    // Clips the incoming number to its own line while it slides in.
    <span className="inline-flex overflow-hidden">
      <span
        key={roll?.key}
        className={
          roll === null
            ? undefined
            : roll.direction === "up"
              ? "motion-safe:animate-[count-up_var(--motion-gentle)_var(--ease-in-out-soft)]"
              : "motion-safe:animate-[count-down_var(--motion-gentle)_var(--ease-in-out-soft)]"
        }
      >
        {format(value)}
      </span>
    </span>
  );
}

export default RollingNumber;
