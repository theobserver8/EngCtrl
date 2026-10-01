import TodoForm from "./components/todo/TodoForm";
import TodoList from "./components/todo/TodoList";
import { useTodos } from "./hooks/useTodos";

function App() {
  const { todos, status, error, pendingIds, isCreating, refresh, addTodo, toggleTodo } =
    useTodos();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <main className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">ToDo List</h1>

        <div className="flex gap-2 mb-8">
          <TodoForm onSubmit={addTodo} isSubmitting={isCreating} />
          <button
            type="button"
            onClick={refresh}
            disabled={status === "loading"}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition cursor-pointer disabled:opacity-50"
          >
            Load Tasks
          </button>
        </div>

        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            {error.message}
          </p>
        )}

        <TodoList todos={todos} pendingIds={pendingIds} onToggle={toggleTodo} />
      </main>
    </div>
  );
}

export default App;
