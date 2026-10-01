import AppHeader from "./components/layout/AppHeader";
import Sheet from "./components/layout/Sheet";
import TodoForm from "./components/todo/TodoForm";
import TodoList from "./components/todo/TodoList";
import TodoListSkeleton from "./components/todo/TodoListSkeleton";
import ErrorBanner from "./components/ui/ErrorBanner";
import { useTodos } from "./hooks/useTodos";
import { useI18n } from "./i18n/useI18n";
import { getErrorMessage } from "./utils/errorMessage";
import { formatCount } from "./utils/format";

function App() {
  const { t } = useI18n();
  const {
    todos,
    status,
    isRefreshing,
    error,
    pendingIds,
    isCreating,
    refresh,
    addTodo,
    toggleTodo,
    clearError,
  } = useTodos();
  const completedCount = todos.filter((todo) => todo.completed).length;
  const loadFailed = status === "error";

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <div aria-hidden="true" className="blueprint-grid pointer-events-none fixed inset-0" />

      <main className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <Sheet>
          <AppHeader total={todos.length} completed={completedCount} />

          <div className="mt-10">
            <TodoForm onSubmit={addTodo} isSubmitting={isCreating} />
          </div>

          {error && (
            <div className="mt-6">
              <ErrorBanner
                message={getErrorMessage(error, t.errors)}
                onRetry={loadFailed ? refresh : undefined}
                retryLabel={t.actions.retry}
                onDismiss={loadFailed ? undefined : clearError}
                dismissLabel={t.actions.dismiss}
              />
            </div>
          )}

          <section aria-labelledby="tasks-heading" aria-busy={isRefreshing} className="mt-10">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-2.5">
              <h2 id="tasks-heading" className="label-mono">
                {t.tasks.heading} · {formatCount(todos.length)}
              </h2>
              {isRefreshing && (
                <span
                  aria-hidden="true"
                  className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase"
                >
                  <span className="size-1.5 rounded-full bg-brand motion-safe:animate-pulse" />
                  {t.tasks.syncing}
                </span>
              )}
            </div>

            {status === "loading" && <TodoListSkeleton label={t.tasks.loading} />}
            {status === "success" &&
              (todos.length > 0 ? (
                <TodoList todos={todos} pendingIds={pendingIds} onToggle={toggleTodo} />
              ) : (
                <p className="py-8 text-center text-sm text-ink-faint">{t.tasks.empty}</p>
              ))}
          </section>
        </Sheet>

        <footer className="mt-6 flex items-center justify-between px-1 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
          <span>{t.footer.project}</span>
          <span>{t.footer.revision}</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
