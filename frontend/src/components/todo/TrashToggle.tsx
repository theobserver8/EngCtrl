import { useI18n } from "../../i18n/useI18n";
import { RestoreIcon, TrashIcon } from "../ui/icons";

interface TrashToggleProps {
  title: string;
  trashed: boolean;
  onToggle: () => void;
}

/**
 * Moves the task to the trash, or restores it once there. A single button whose icon
 * crossfades, so the focus stays in place when the action switches. Nothing is deleted
 * from here (only when the trash is emptied), so no confirmation is needed.
 */
function TrashToggle({ title, trashed, onToggle }: TrashToggleProps) {
  const { t } = useI18n();
  const label = trashed ? t.tasks.restore(title) : t.tasks.trash(title);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={`focus-ring grid size-8 shrink-0 cursor-pointer place-items-center rounded-[6px] transition-[background-color,color,opacity] duration-(--motion-base) pointer-coarse:size-10 ${
        trashed
          ? // Always visible, like a lit star: it shows the state and the way back.
            "text-brand hover:bg-brand-soft"
          : // Revealed on hover or *keyboard* focus in the row. Not `focus-within`: a mouse
            // click leaves focus on the checkbox/button and the icon would stay visible.
            "text-ink-faint opacity-0 group-hover:opacity-100 group-has-focus-visible:opacity-100 hover:bg-danger-soft hover:text-danger pointer-coarse:opacity-100"
      }`}
    >
      {/* Both icons stacked in the same cell, crossfading. */}
      <TrashIcon
        className={`col-start-1 row-start-1 size-4 transition-opacity duration-(--motion-base) ${trashed ? "opacity-0" : ""}`}
      />
      <RestoreIcon
        className={`col-start-1 row-start-1 size-4 transition-opacity duration-(--motion-base) ${trashed ? "" : "opacity-0"}`}
      />
    </button>
  );
}

export default TrashToggle;
