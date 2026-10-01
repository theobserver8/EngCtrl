import { formatCount } from "../../utils/format";

interface TitleBlockProps {
  total: number;
  completed: number;
  date?: Date;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Drawing title block ("cajetín"): live register metadata in a hairline grid. */
function TitleBlock({ total, completed, date = new Date() }: TitleBlockProps) {
  const cells = [
    { label: "Date", value: dateFormatter.format(date) },
    { label: "Total", value: formatCount(total) },
    { label: "Done", value: formatCount(completed) },
    { label: "Open", value: formatCount(total - completed) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-line bg-line font-mono">
      {cells.map(({ label, value }) => (
        <div key={label} className="bg-sheet px-3 py-2 sm:min-w-28">
          <dt className="text-[10px] tracking-[0.14em] text-ink-faint uppercase">{label}</dt>
          <dd className="mt-0.5 text-[13px] text-ink tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default TitleBlock;
