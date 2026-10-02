import { useEffect, useState } from "react";
import { useI18n } from "../../i18n/useI18n";
import { TrashIcon } from "../ui/icons";

const CONFIRM_TIMEOUT_MS = 3000;

interface DeleteTodoButtonProps {
  title: string;
  onConfirm: () => void;
}

/**
 * Two-step delete: the first click arms the button ("Delete?"), the second one confirms.
 * It disarms itself after a few seconds, on blur or with Escape — no modal needed.
 */
function DeleteTodoButton({ title, onConfirm }: DeleteTodoButtonProps) {
  const { t } = useI18n();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timeout = window.setTimeout(() => setArmed(false), CONFIRM_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [armed]);

  const handleClick = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    onConfirm();
  };

  const label = armed ? t.tasks.confirmDelete(title) : t.tasks.delete(title);

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={() => setArmed(false)}
      onKeyDown={(event) => event.key === "Escape" && setArmed(false)}
      aria-label={label}
      title={label}
      className={`focus-ring inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-[6px] px-2 text-xs font-medium transition-[background-color,color,opacity] duration-150 pointer-coarse:h-10 ${
        armed
          ? "bg-danger text-white"
          : "text-ink-faint opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-danger-soft hover:text-danger focus-visible:opacity-100 pointer-coarse:opacity-100"
      }`}
    >
      <TrashIcon className="size-4" />
      {armed && <span aria-hidden="true">{t.tasks.confirmDeleteShort}</span>}
    </button>
  );
}

export default DeleteTodoButton;
