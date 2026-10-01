import AppHeader from "./components/layout/AppHeader";
import Sheet from "./components/layout/Sheet";
import TodoForm from "./components/todo/TodoForm";
import TodoList from "./components/todo/TodoList";
import Button from "./components/ui/Button";
import { AlertIcon, RefreshIcon } from "./components/ui/icons";
import { useTodos } from "./hooks/useTodos";
import { formatCount } from "./utils/format";

function App() {
  const { todos, status, error, pendingIds, isCreating, refresh, addTodo, toggleTodo } =
    useTodos();
  const completedCount = todos.filter((todo) => todo.completed).length;
  const isLoading = status === "loading";

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <div aria-hidden="true" className="blueprint-grid pointer-events-none fixed inset-0" />

      <main className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <Sheet>
          <AppHeader total={todos.length} completed={completedCount} />

          <div className="mt-10 flex flex-wrap items-end gap-3">
            <TodoForm onSubmit={addTodo} isSubmitting={isCreating} />
            <Button
              variant="secondary"
              onClick={refresh}
              disabled={isLoading}
              icon={<RefreshIcon className={isLoading ? "motion-safe:animate-spin" : ""} />}
            >
              Load tasks
            </Button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-control border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
            >
              <AlertIcon className="mt-0.5 size-4 shrink-0" />
              <span>{error.message}</span>
            </div>
          )}

          <section aria-labelledby="tasks-heading" className="mt-10">
            <h2 id="tasks-heading" className="label-mono border-b border-line pb-2.5">
              Tasks · {formatCount(todos.length)}
            </h2>
            {todos.length > 0 ? (
              <TodoList todos={todos} pendingIds={pendingIds} onToggle={toggleTodo} />
            ) : (
              <p className="py-8 text-center text-sm text-ink-faint">
                {status === "idle" ? "Load the register to see your tasks." : "No tasks yet."}
              </p>
            )}
          </section>
        </Sheet>

        <footer className="mt-6 flex items-center justify-between px-1 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
          <span>CEMOSA · Ingeniería y Control</span>
          <span>Rev. 01</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
