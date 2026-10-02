import { formatReference } from "../../utils/format";
import type { Todo } from "../../types/todo";
import Checkbox from "../ui/Checkbox";
import DeleteTodoControls from "./DeleteTodoControls";

interface TodoItemProps {
  todo: Todo;
  isPending?: boolean;
  onToggle: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

function TodoItem({ todo, isPending = false, onToggle, onDelete }: TodoItemProps) {
  // While a request is in flight the row ignores new toggles, but it is not `disabled`:
  // that would flash the not-allowed cursor on every click. The row only dims when the
  // request is slow (delayed transition), so fast responses cause no visual change.
  const handleChange = () => {
    if (!isPending) onToggle(todo);
  };

  return (
    <li
      aria-busy={isPending}
      className={`transition-opacity duration-200 ${isPending ? "opacity-60 delay-300" : "delay-0"}`}
    >
      {/* Negative margin on an inner wrapper: the hover background bleeds slightly past the
          column while the list dividers stay aligned with the section heading. */}
      <div className="group -mx-3 flex items-center gap-2 rounded-control px-3 transition-colors duration-150 hover:bg-brand-soft/50">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 py-3.5">
          <Checkbox checked={todo.completed} aria-disabled={isPending} onChange={handleChange} />
          <span
            className={`min-w-0 flex-1 text-[15px] leading-snug break-words transition-colors duration-150 ${
              todo.completed ? "text-ink-faint line-through decoration-ink-faint/70 decoration-1" : "text-ink"
            }`}
          >
            {todo.title}
          </span>
        </label>
        <DeleteTodoControls title={todo.title} onConfirm={() => onDelete(todo)}>
          <span className="ml-1 font-mono text-[11px] text-ink-faint tabular-nums">
            {formatReference(todo.id)}
          </span>
        </DeleteTodoControls>
      </div>
    </li>
  );
}

export default TodoItem;
