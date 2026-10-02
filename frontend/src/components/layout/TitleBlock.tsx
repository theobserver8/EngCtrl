import { useI18n } from "../../i18n/useI18n";
import { formatCount } from "../../utils/format";
import ProgressRing from "./ProgressRing";

interface TitleBlockProps {
  total: number;
  completed: number;
  date?: Date;
}

/**
 * Drawing title block ("cajetín"): a full-width strip with the progress gauge and the live
 * register metadata. One row on desktop; gauge on top of a 2x2 grid on small screens.
 */
function TitleBlock({ total, completed, date = new Date() }: TitleBlockProps) {
  const { t, formatDate } = useI18n();
  const cells = [
    { id: "date", label: t.titleBlock.date, value: formatDate(date) },
    { id: "total", label: t.titleBlock.total, value: formatCount(total) },
    { id: "done", label: t.titleBlock.done, value: formatCount(completed) },
    { id: "open", label: t.titleBlock.open, value: formatCount(total - completed) },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-line bg-line font-mono sm:grid-cols-[auto_repeat(4,minmax(0,1fr))]">
      <div className="col-span-2 flex items-center gap-3 bg-sheet px-3 py-2.5 sm:col-span-1 sm:px-4">
        <dt className="text-[10px] tracking-[0.14em] text-ink-faint uppercase sm:sr-only">
          {t.progress.label}
        </dt>
        <dd className="order-first">
          <ProgressRing total={total} completed={completed} />
        </dd>
      </div>
      {cells.map(({ id, label, value }) => (
        <div key={id} className="flex flex-col justify-center bg-sheet px-3 py-2.5 sm:px-4">
          <dt className="text-[10px] tracking-[0.14em] text-ink-faint uppercase">{label}</dt>
          <dd className="mt-0.5 text-[13px] text-ink tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default TitleBlock;
