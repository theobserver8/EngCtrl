import { useI18n } from "../../i18n/useI18n";
import { formatCount } from "../../utils/format";

interface TitleBlockProps {
  total: number;
  completed: number;
  date?: Date;
}

/** Drawing title block ("cajetín"): live register metadata in a hairline grid. */
function TitleBlock({ total, completed, date = new Date() }: TitleBlockProps) {
  const { t, formatDate } = useI18n();
  const cells = [
    { id: "date", label: t.titleBlock.date, value: formatDate(date) },
    { id: "total", label: t.titleBlock.total, value: formatCount(total) },
    { id: "done", label: t.titleBlock.done, value: formatCount(completed) },
    { id: "open", label: t.titleBlock.open, value: formatCount(total - completed) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-line bg-line font-mono">
      {cells.map(({ id, label, value }) => (
        <div key={id} className="bg-sheet px-3 py-2 sm:min-w-28">
          <dt className="text-[10px] tracking-[0.14em] text-ink-faint uppercase">{label}</dt>
          <dd className="mt-0.5 text-[13px] text-ink tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default TitleBlock;
