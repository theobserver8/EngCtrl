import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useI18n } from "../../i18n/useI18n";
import { TrashIcon } from "../ui/icons";

const CONFIRM_TIMEOUT_MS = 4000;
/** Activations of the confirm button this soon after arming are ignored (double click / double Enter). */
const CONFIRM_GUARD_MS = 400;

interface DeleteTodoControlsProps {
  title: string;
  onConfirm: () => void;
  /** Content placed between the confirm button and the trash button (the reference code). */
  children: ReactNode;
}

/**
 * Two-step delete: the trash button toggles a "Delete?" confirmation that appears in a
 * different position (left of the reference code), so an accidental double click arms and
 * cancels instead of deleting. It also disarms on Escape, when focus leaves both buttons or
 * after a few seconds.
 */
function DeleteTodoControls({
  title,
  onConfirm,
  children,
}: DeleteTodoControlsProps) {
  const { t } = useI18n();
  const [armed, setArmed] = useState(false);
  const armedAt = useRef(0);
  const trashRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!armed) return;
    confirmRef.current?.focus();
    const timeout = window.setTimeout(
      () => setArmed(false),
      CONFIRM_TIMEOUT_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [armed]);

  const toggle = () => {
    if (!armed) armedAt.current = performance.now();
    setArmed(!armed);
  };

  const confirm = () => {
    if (!armed || performance.now() - armedAt.current < CONFIRM_GUARD_MS)
      return;
    setArmed(false);
    onConfirm();
  };

  const cancelOnEscape = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !armed) return;
    setArmed(false);
    trashRef.current?.focus();
  };

  // Disarm when focus moves outside the pair (moving between both buttons keeps it armed).
  const cancelOnBlur = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (next !== trashRef.current && next !== confirmRef.current)
      setArmed(false);
  };

  const trashLabel = armed
    ? t.tasks.cancelDelete(title)
    : t.tasks.delete(title);

  return (
    <>
      {/* Always mounted, collapsed to zero width while disarmed: opening its column makes
          the reference code slide aside instead of jumping. `inert` keeps it out of the tab
          order and the accessibility tree while hidden. */}
      <div
        inert={!armed}
        className={`grid transition-[grid-template-columns,opacity] duration-(--motion-base) ease-in-out-soft ${
          armed ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0"
        }`}
      >
        <div className="min-w-0 overflow-hidden">
          {/* Padding inside the clipped box leaves room for the focus ring. */}
          <div className="p-[3px]">
            <button
              ref={confirmRef}
              type="button"
              onClick={confirm}
              onBlur={cancelOnBlur}
              onKeyDown={cancelOnEscape}
              aria-label={t.tasks.confirmDelete(title)}
              className="focus-ring inline-flex h-7 cursor-pointer items-center rounded-[6px] bg-danger px-2.5 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-danger/90 pointer-coarse:h-9"
            >
              {t.tasks.confirmDeleteShort}
            </button>
          </div>
        </div>
      </div>

      {children}

      <button
        ref={trashRef}
        type="button"
        onClick={toggle}
        onBlur={cancelOnBlur}
        onKeyDown={cancelOnEscape}
        aria-label={trashLabel}
        aria-pressed={armed}
        title={trashLabel}
        className={`focus-ring grid size-8 shrink-0 cursor-pointer place-items-center rounded-[6px] transition-[background-color,color,opacity] duration-(--motion-base) pointer-coarse:size-10 ${
          armed
            ? "bg-danger-soft text-danger"
            : // Revealed on hover or *keyboard* focus in the row. Not `focus-within`: a mouse
              // click leaves focus on the checkbox/button and the icon would stay visible.
              "text-ink-faint opacity-0 group-hover:opacity-100 group-has-focus-visible:opacity-100 hover:bg-danger-soft hover:text-danger pointer-coarse:opacity-100"
        }`}
      >
        <TrashIcon className="size-4" />
      </button>
    </>
  );
}

export default DeleteTodoControls;
