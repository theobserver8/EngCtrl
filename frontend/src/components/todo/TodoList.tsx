import type { Todo } from "../../types/todo";
import TodoItem from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  pendingIds: ReadonlySet<number>;
  onToggle: (todo: Todo) => void;
  onToggleFavorite: (todo: Todo) => void;
  onTrash: (todo: Todo) => void;
  onRestore: (todo: Todo) => void;
  /** Rows close before being unmarked as favourite (this is the favourites list). */
  leaveOnUnfavorite?: boolean;
  /** This is the trash list: rows only offer to restore, and close when restored. */
  inTrashView?: boolean;
  /** Animate rows that mount from now on (off during the first load of the list). */
  animateNewRows?: boolean;
}

function TodoList({
  todos,
  pendingIds,
  onToggle,
  onToggleFavorite,
  onTrash,
  onRestore,
  leaveOnUnfavorite = false,
  inTrashView = false,
  animateNewRows = false,
}: TodoListProps) {
  return (
    // Fades in when it replaces the loading skeleton or when a list gets its first row.
    <ul className="divide-y divide-line motion-safe:animate-[fade-in_var(--motion-base)_var(--ease-out-soft)]">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isPending={pendingIds.has(todo.id)}
          onToggle={onToggle}
          onToggleFavorite={onToggleFavorite}
          onTrash={onTrash}
          onRestore={onRestore}
          leaveOnUnfavorite={leaveOnUnfavorite}
          inTrashView={inTrashView}
          animateEnter={animateNewRows}
        />
      ))}
    </ul>
  );
}

export default TodoList;
