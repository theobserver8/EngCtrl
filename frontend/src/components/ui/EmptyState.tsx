interface EmptyStateProps {
  message: string;
}

/** Quiet empty state: a small line drawing of an inspection sheet and one sentence. */
function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center motion-safe:animate-[fade-in_var(--motion-slow)_var(--ease-out-soft)]">
      <svg
        viewBox="0 0 64 64"
        className="size-16 text-line-strong"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="14" y="10" width="36" height="46" rx="4" />
        <path d="M25 10v-2.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2V10" />
        <rect x="21" y="22" width="5" height="5" rx="1" className="fill-lime stroke-ink-faint" />
        <path d="M22.3 24.6l1.2 1.2 2.2-2.4" className="stroke-ink" />
        <path d="M30 24.5h13M21 34h5M30 34h10M21 43h5M30 43h12" />
      </svg>
      <p className="max-w-xs text-sm text-ink-faint">{message}</p>
    </div>
  );
}

export default EmptyState;
