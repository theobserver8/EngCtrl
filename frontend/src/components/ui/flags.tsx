import { useId, type SVGProps } from "react";

// Inline SVG flags: emoji flags render as plain letters on Windows.
// Official flag colours are intentionally hard-coded here (they are not theme tokens).
type FlagProps = SVGProps<SVGSVGElement>;

const FLAG_DEFAULTS = {
  preserveAspectRatio: "xMidYMid slice",
  "aria-hidden": true,
  focusable: false,
} as const;

export function SpainFlag(props: FlagProps) {
  return (
    <svg viewBox="0 0 750 500" {...FLAG_DEFAULTS} {...props}>
      <rect width="750" height="500" fill="#AA151B" />
      <rect y="125" width="750" height="250" fill="#F1BF00" />
    </svg>
  );
}

export function UnitedKingdomFlag(props: FlagProps) {
  // Unique ids: several instances can be on the page at the same time.
  const clipId = useId();
  return (
    <svg viewBox="0 0 60 30" {...FLAG_DEFAULTS} {...props}>
      <clipPath id={clipId}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath={`url(#${clipId})`}
        stroke="#C8102E"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}
