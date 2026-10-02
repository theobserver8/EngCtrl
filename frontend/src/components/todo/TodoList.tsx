import type { Todo } from "../../types/todo";
import TodoItem from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  pendingIds: ReadonlySet<number>;
  onToggle: (todo: Todo) => void;
  onToggleFavorite: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  /** Id of the todo whose favourite toggle should receive focus when it mounts. */
  focusFavoriteId?: number | null;
  /** Animate rows that mount from now on (off during the first load of the list). */
  animateNewRows?: boolean;
}

function TodoList({
  todos,
  pendingIds,
  onToggle,
  onToggleFavorite,
  onDelete,
  focusFavoriteId = null,
  animateNewRows = false,
}: TodoListProps) {
  return (
    // Fades in when it replaces the loading skeleton or when a section gets its first row.
    <ul className="divide-y divide-line motion-safe:animate-[fade-in_var(--motion-base)_var(--ease-out-soft)]">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isPending={pendingIds.has(todo.id)}
          onToggle={onToggle}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDelete}
          focusFavoriteOnMount={todo.id === focusFavoriteId}
          animateEnter={animateNewRows}
        />
      ))}
    </ul>
  );
}

export default TodoList;
