import { formatReference } from "../../utils/format";
import type { Todo } from "../../types/todo";
import Checkbox from "../ui/Checkbox";

interface TodoItemProps {
  todo: Todo;
  isPending?: boolean;
  onToggle: (todo: Todo) => void;
}

function TodoItem({ todo, isPending = false, onToggle }: TodoItemProps) {
  return (
    <li aria-busy={isPending} className={`transition-opacity duration-150 ${isPending ? "opacity-60" : ""}`}>
      <label className="-mx-3 flex cursor-pointer items-center gap-4 rounded-control px-3 py-3.5 transition-colors duration-150 hover:bg-brand-soft/50">
        <Checkbox checked={todo.completed} disabled={isPending} onChange={() => onToggle(todo)} />
        <span
          className={`min-w-0 flex-1 text-[15px] leading-snug break-words transition-colors duration-150 ${
            todo.completed ? "text-ink-faint line-through decoration-ink-faint/70 decoration-1" : "text-ink"
          }`}
        >
          {todo.title}
        </span>
        <span className="font-mono text-[11px] text-ink-faint tabular-nums">
          {formatReference(todo.id)}
        </span>
      </label>
    </li>
  );
}

export default TodoItem;
