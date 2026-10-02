import { useId, useState } from "react";
import { formatReference } from "../../utils/format";
import { MOTION_MS, prefersReducedMotion } from "../../utils/motion";
import type { Todo } from "../../types/todo";
import Checkbox from "../ui/Checkbox";
import DeleteTodoControls from "./DeleteTodoControls";
import FavoriteToggle from "./FavoriteToggle";

interface TodoItemProps {
  todo: Todo;
  isPending?: boolean;
  onToggle: (todo: Todo) => void;
  onToggleFavorite: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  /** Close the row before unmarking it as favourite (it is in the favourites list, which it leaves). */
  leaveOnUnfavorite?: boolean;
  /** Open the row with an animation when it mounts (false for the rows of the first load). */
  animateEnter?: boolean;
}

function TodoItem({
  todo,
  isPending = false,
  onToggle,
  onToggleFavorite,
  onDelete,
  leaveOnUnfavorite = false,
  animateEnter = false,
}: TodoItemProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [leaving, setLeaving] = useState(false);
  // Captured once: adding an animation class to an already mounted row would replay it.
  const [enterAnimated] = useState(animateEnter);

  // While a request is in flight the row ignores new toggles, but it is not `disabled`:
  // that would flash the not-allowed cursor on every click. The row only dims when the
  // request is slow (delayed transition), so fast responses cause no visual change.
  const handleToggle = () => {
    if (!isPending) onToggle(todo);
  };
  /**
   * Closes the row (fade + height collapse) and then runs the action, so the list closes the
   * gap smoothly. Used when the row leaves its list: deleted, or unmarked in the favourites.
   */
  const leaveThen = (action: () => void) => {
    if (prefersReducedMotion()) {
      action();
      return;
    }
    setLeaving(true);
    window.setTimeout(action, MOTION_MS.slow);
  };

  const handleToggleFavorite = () => {
    if (isPending || leaving) return;
    if (leaveOnUnfavorite && todo.favorite) leaveThen(() => onToggleFavorite(todo));
    else onToggleFavorite(todo);
  };
  const handleDelete = () => leaveThen(() => onDelete(todo));

  return (
    <li
      aria-busy={isPending}
      inert={leaving}
      // minmax(0, 1fr) keeps the column at the list's width: an auto column would grow to the
      // longest unbroken word of the title or description and push the row out of the frame.
      className={`grid grid-cols-[minmax(0,1fr)] transition-[grid-template-rows,opacity] duration-(--motion-slow) ease-in-out-soft ${
        enterAnimated ? "motion-safe:animate-[row-in_var(--motion-slow)_var(--ease-in-out-soft)]" : ""
      } ${
        leaving
          ? "grid-rows-[0fr] opacity-0"
          : `grid-rows-[1fr] ${isPending ? "opacity-60 delay-300" : "delay-0"}`
      }`}
    >
      {/* Grid row 1fr -> 0fr collapses the height on exit; only the vertical axis is clipped
          so the hover background can still bleed sideways. */}
      <div className="min-h-0 overflow-y-clip">
        {/* Negative margin on an inner wrapper: the hover background bleeds slightly past the
          column while the list dividers stay aligned with the section heading. */}
        <div
          className={`group relative -mx-3 rounded-control px-3 transition-colors hover:bg-brand-soft/50 ${
            todo.favorite
              ? "before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-lime"
              : ""
          }`}
        >
          <div className="flex items-start gap-2">
            <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-4 py-3.5">
              <Checkbox
                checked={todo.completed}
                aria-disabled={isPending}
                aria-labelledby={titleId}
                aria-describedby={todo.description ? descriptionId : undefined}
                onChange={handleToggle}
              />
              <span
                id={titleId}
                className={`min-w-0 flex-1 text-[15px] leading-snug break-words transition-colors duration-(--motion-base) ${
                  todo.completed ? "text-ink-faint" : "text-ink"
                }`}
              >
                <span className="strike" data-struck={todo.completed}>
                  {todo.title}
                </span>
              </span>
            </label>

            {/* Height of a single-line row: the controls stay aligned with the title line. */}
            <div className="flex h-[49px] shrink-0 items-center gap-0.5">
              <DeleteTodoControls title={todo.title} onConfirm={handleDelete}>
                {/* Decorative: hidden on small screens to leave room for the title. */}
                <span className="mx-1 hidden font-mono text-[11px] text-ink-faint tabular-nums sm:inline">
                  {formatReference(todo.id)}
                </span>
                <FavoriteToggle
                  title={todo.title}
                  favorite={todo.favorite}
                  onToggle={handleToggleFavorite}
                />
              </DeleteTodoControls>
            </div>
          </div>

          {/* Below the top row, so it uses the full width on small screens instead of the
            narrow column left by the controls. Indented to align with the title. */}
          {todo.description && (
            <p
              id={descriptionId}
              className={`-mt-2 pb-3.5 pl-9 text-[13px] leading-relaxed break-words whitespace-pre-line transition-colors duration-(--motion-base) sm:pr-32 ${
                todo.completed ? "text-ink-faint" : "text-ink-soft"
              }`}
            >
              {todo.description}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

export default TodoItem;
