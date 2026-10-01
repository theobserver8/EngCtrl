import React from "react";
import type { Todo } from "../types/todo";

interface TodoItemProps {
  todo: Todo;
  toggleTodo: (id: number) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, toggleTodo }) => {
  return (
    <li
      key={todo.id}
      className={`flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 ${
        todo.completed ? "line-through text-gray-400" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.id)}
        className="cursor-pointer"
      />
      <span>{todo.title}</span>
    </li>
  );
};

export default TodoItem;
