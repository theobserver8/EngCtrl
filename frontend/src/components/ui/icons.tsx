import type { SVGProps } from "react";

// Inline line icons (1.5px stroke on a 16px grid) so they inherit `currentColor`
// and need no icon library.
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3.5v9M3.5 8h9" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 8.5l3 3 6-7" />
    </Icon>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 8a5 5 0 1 1-1.46-3.54" />
      <path d="M13 3v2.5h-2.5" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2.5l6 11H2z" />
      <path d="M8 7v2.5M8 11.5v.01" />
    </Icon>
  );
}
