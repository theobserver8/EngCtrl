import { useId, type ReactNode } from "react";
import { formatCount } from "../../utils/format";

interface TodoSectionProps {
  title: string;
  count: number;
  /** Optional content on the right of the heading (e.g. the syncing indicator). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A titled block of the register, e.g. "FAVOURITES · 02". */
function TodoSection({ title, count, aside, children, className = "" }: TodoSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="flex items-center justify-between gap-4 border-b border-line pb-2.5">
        <h2 id={headingId} className="label-mono">
          {title} · {formatCount(count)}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export default TodoSection;
