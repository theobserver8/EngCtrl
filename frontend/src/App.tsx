// src/App.tsx
import { useState } from "react";
import type { Todo } from "./types/todo";
import { getTodos, createTodo, toggleTodoStatus } from "./api/todo";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");

  const loadTodos = () => {
    getTodos().then((data) => {
      setTodos(data);
    });
  };

  const addTodo = () => {
    if (!title.trim()) return;
    createTodo(title)
  };

  const toggleTodo = (id: number) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    toggleTodoStatus(id, todo.completed).then((updated) => {
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">ToDo List</h1>

        <div className="flex gap-2 mb-8">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTodo}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition cursor-pointer"
          >
            Add
          </button>
          <button
            onClick={loadTodos}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition cursor-pointer"
          >
            Load Tasks
          </button>
        </div>

        <ul className="space-y-2">
          {todos.map((todo) => (
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
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
