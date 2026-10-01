import type { Todo } from "../../types/todo";

interface TodoItemProps {
  todo: Todo;
  isPending?: boolean;
  onToggle: (todo: Todo) => void;
}

function TodoItem({ todo, isPending = false, onToggle }: TodoItemProps) {
  return (
    <li
      aria-busy={isPending}
      className={`bg-gray-50 rounded-lg border border-gray-200 transition-opacity ${
        isPending ? "opacity-60" : ""
      }`}
    >
      <label className="flex items-center gap-2 p-3 cursor-pointer">
        <input
          type="checkbox"
          checked={todo.completed}
          disabled={isPending}
          onChange={() => onToggle(todo)}
          className="cursor-pointer"
        />
        <span className={todo.completed ? "line-through text-gray-400" : ""}>{todo.title}</span>
      </label>
    </li>
  );
}

export default TodoItem;
