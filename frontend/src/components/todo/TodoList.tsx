import type { Todo } from "../../types/todo";
import TodoItem from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  pendingIds: ReadonlySet<number>;
  onToggle: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
}

function TodoList({ todos, pendingIds, onToggle, onDelete }: TodoListProps) {
  return (
    <ul className="divide-y divide-line">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          isPending={pendingIds.has(todo.id)}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

export default TodoList;
