// Placeholder rows shown only during the first load, shaped like real task rows.
const ROW_WIDTHS = ["w-2/5", "w-3/5", "w-1/3", "w-1/2"];

interface TodoListSkeletonProps {
  label: string;
}

function TodoListSkeleton({ label }: TodoListSkeletonProps) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <ul aria-hidden="true" className="divide-y divide-line motion-safe:animate-pulse">
        {ROW_WIDTHS.map((width) => (
          <li key={width} className="flex items-center gap-4 py-4">
            <span className="size-5 shrink-0 rounded-[5px] bg-line" />
            <span className={`h-3 rounded-full bg-line ${width}`} />
            <span className="ml-auto h-2.5 w-9 rounded-full bg-line/70" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoListSkeleton;
