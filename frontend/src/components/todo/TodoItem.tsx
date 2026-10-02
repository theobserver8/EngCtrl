import { useId } from "react";
import { formatReference } from "../../utils/format";
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
  /** Focus the favourite toggle on mount (the row just moved between sections). */
  focusFavoriteOnMount?: boolean;
}

function TodoItem({
  todo,
  isPending = false,
  onToggle,
  onToggleFavorite,
  onDelete,
  focusFavoriteOnMount = false,
}: TodoItemProps) {
  const titleId = useId();
  const descriptionId = useId();

  // While a request is in flight the row ignores new toggles, but it is not `disabled`:
  // that would flash the not-allowed cursor on every click. The row only dims when the
  // request is slow (delayed transition), so fast responses cause no visual change.
  const handleToggle = () => {
    if (!isPending) onToggle(todo);
  };
  const handleToggleFavorite = () => {
    if (!isPending) onToggleFavorite(todo);
  };

  return (
    <li
      aria-busy={isPending}
      className={`transition-opacity duration-200 ${isPending ? "opacity-60 delay-300" : "delay-0"}`}
    >
      {/* Negative margin on an inner wrapper: the hover background bleeds slightly past the
          column while the list dividers stay aligned with the section heading. */}
      <div
        className={`group relative -mx-3 rounded-control px-3 transition-colors duration-150 hover:bg-brand-soft/50 ${
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
              className={`min-w-0 flex-1 text-[15px] leading-snug break-words transition-colors duration-150 ${
                todo.completed
                  ? "text-ink-faint line-through decoration-ink-faint/70 decoration-1"
                  : "text-ink"
              }`}
            >
              {todo.title}
            </span>
          </label>

          {/* Height of a single-line row: the controls stay aligned with the title line. */}
          <div className="flex h-[49px] shrink-0 items-center gap-0.5">
            <DeleteTodoControls
              title={todo.title}
              onConfirm={() => onDelete(todo)}
            >
              {/* Decorative: hidden on small screens to leave room for the title. */}
              <span className="mx-1 hidden font-mono text-[11px] text-ink-faint tabular-nums sm:inline">
                {formatReference(todo.id)}
              </span>
              <FavoriteToggle
                title={todo.title}
                favorite={todo.favorite}
                onToggle={handleToggleFavorite}
                autoFocus={focusFavoriteOnMount}
              />
            </DeleteTodoControls>
          </div>
        </div>

        {/* Below the top row, so it uses the full width on small screens instead of the
            narrow column left by the controls. Indented to align with the title. */}
        {todo.description && (
          <p
            id={descriptionId}
            className={`-mt-2 pb-3.5 pl-9 text-[13px] leading-relaxed break-words whitespace-pre-line transition-colors duration-150 sm:pr-32 ${
              todo.completed ? "text-ink-faint" : "text-ink-soft"
            }`}
          >
            {todo.description}
          </p>
        )}
      </div>
    </li>
  );
}

export default TodoItem;
