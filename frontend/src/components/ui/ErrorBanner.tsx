import { AlertIcon, CloseIcon } from "./icons";

interface ErrorBannerProps {
  message: string;
  /** When provided, a retry action is shown (used when nothing could be loaded). */
  onRetry?: () => void;
  retryLabel?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
}

function ErrorBanner({ message, onRetry, retryLabel, onDismiss, dismissLabel }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-control border border-danger/25 bg-danger-soft py-3 pr-2 pl-4 text-sm text-danger"
    >
      <AlertIcon className="mt-0.5 size-4 shrink-0" />
      <p className="min-w-0 flex-1 py-px">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="focus-ring -my-1 shrink-0 cursor-pointer rounded-[6px] px-2 py-1 font-medium underline decoration-danger/40 underline-offset-4 transition-colors hover:decoration-danger"
        >
          {retryLabel}
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          title={dismissLabel}
          className="focus-ring -my-1 grid size-7 shrink-0 cursor-pointer place-items-center rounded-[6px] transition-colors hover:bg-danger/10"
        >
          <CloseIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export default ErrorBanner;
