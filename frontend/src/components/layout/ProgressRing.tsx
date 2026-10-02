import { useI18n } from "../../i18n/useI18n";

const SEGMENTS = 12;
const SIZE = 64;
const RADIUS = 26;
const STROKE = 6;
const GAP_DEGREES = 7;

function polar(angleDegrees: number): [number, number] {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return [SIZE / 2 + RADIUS * Math.cos(radians), SIZE / 2 + RADIUS * Math.sin(radians)];
}

/** SVG arc for segment `index`, clockwise from 12 o'clock, with a gap between segments. */
function segmentPath(index: number): string {
  const step = 360 / SEGMENTS;
  const [x0, y0] = polar(index * step + GAP_DEGREES / 2);
  const [x1, y1] = polar((index + 1) * step - GAP_DEGREES / 2);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${RADIUS} ${RADIUS} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

const PATHS = Array.from({ length: SEGMENTS }, (_, index) => segmentPath(index));

interface ProgressRingProps {
  completed: number;
  total: number;
}

/**
 * Completion gauge echoing the segmented "o" of the CEMOSA logo: segments fill in lime,
 * one after another, as tasks are completed.
 */
function ProgressRing({ completed, total }: ProgressRingProps) {
  const { t } = useI18n();
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const filled = total === 0 ? 0 : Math.round((completed / total) * SEGMENTS);

  return (
    <div
      role="progressbar"
      aria-label={t.progress.label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={t.progress.value(percent)}
      className="relative grid size-14 shrink-0 place-items-center"
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 size-full" aria-hidden="true">
        {PATHS.map((d, index) => (
          <path
            key={d}
            d={d}
            fill="none"
            strokeWidth={STROKE}
            className={`transition-[stroke] duration-(--motion-slow) ease-in-out-soft ${index < filled ? "stroke-lime" : "stroke-line"}`}
            // Staggered fill: segments light up one after another.
            style={{ transitionDelay: `${index * 45}ms` }}
          />
        ))}
      </svg>
      <span className="font-mono text-[12px] font-medium text-ink tabular-nums" aria-hidden="true">
        {percent}
        <span className="text-[9px] text-ink-faint">%</span>
      </span>
    </div>
  );
}

export default ProgressRing;
