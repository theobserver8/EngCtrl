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
}

function TodoList({
  todos,
  pendingIds,
  onToggle,
  onToggleFavorite,
  onDelete,
  focusFavoriteId = null,
}: TodoListProps) {
  return (
    <ul className="divide-y divide-line">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isPending={pendingIds.has(todo.id)}
          onToggle={onToggle}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDelete}
          focusFavoriteOnMount={todo.id === focusFavoriteId}
        />
      ))}
    </ul>
  );
}

export default TodoList;
