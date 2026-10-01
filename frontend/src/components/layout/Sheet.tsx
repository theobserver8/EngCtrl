import type { ReactNode } from "react";

const CROP_MARKS = [
  "-top-3 -left-3 border-t border-l",
  "-top-3 -right-3 border-t border-r",
  "-bottom-3 -left-3 border-b border-l",
  "-bottom-3 -right-3 border-b border-r",
];

interface SheetProps {
  children: ReactNode;
}

/** Main document surface: a drawing sheet with registration marks and the lime rules of the logo. */
function Sheet({ children }: SheetProps) {
  return (
    <article className="relative rounded-sheet border border-line bg-sheet shadow-sheet">
      {CROP_MARKS.map((position) => (
        <span
          key={position}
          aria-hidden="true"
          className={`pointer-events-none absolute hidden size-3 border-ink-faint/50 sm:block ${position}`}
        />
      ))}

      <div aria-hidden="true" className="absolute -top-px left-6 flex gap-1.5 sm:left-10">
        <span className="h-1 w-14 rounded-b-[2px] bg-lime" />
        <span className="h-1 w-5 rounded-b-[2px] bg-lime" />
      </div>

      <div className="px-5 py-8 sm:px-10 sm:py-10">{children}</div>
    </article>
  );
}

export default Sheet;
