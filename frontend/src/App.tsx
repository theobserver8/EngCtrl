import { useState } from "react";
import AppHeader from "./components/layout/AppHeader";
import Sheet from "./components/layout/Sheet";
import TodoForm from "./components/todo/TodoForm";
import TodoList from "./components/todo/TodoList";
import TodoListSkeleton from "./components/todo/TodoListSkeleton";
import TodoSection from "./components/todo/TodoSection";
import ErrorBanner from "./components/ui/ErrorBanner";
import { useTodos } from "./hooks/useTodos";
import { useI18n } from "./i18n/useI18n";
import type { Todo, TodoDraft } from "./types/todo";
import { getErrorMessage } from "./utils/errorMessage";

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
    toggleFavorite,
    deleteTodo,
    clearError,
  } = useTodos();
  // Polite live region so screen reader users hear the outcome of their actions.
  const [announcement, setAnnouncement] = useState("");
  // A todo that changes section is remounted; its favourite toggle gets the focus back.
  const [focusFavoriteId, setFocusFavoriteId] = useState<number | null>(null);

  const favorites = todos.filter((todo) => todo.favorite);
  const others = todos.filter((todo) => !todo.favorite);
  const completedCount = todos.filter((todo) => todo.completed).length;
  const loadFailed = status === "error";
  const loaded = status === "success";

  const handleAdd = async (draft: TodoDraft) => {
    const added = await addTodo(draft);
    if (added) setAnnouncement(t.announcements.added(draft.title.trim()));
    return added;
  };

  const handleToggleFavorite = async (todo: Todo) => {
    setFocusFavoriteId(todo.id);
    if (await toggleFavorite(todo)) {
      setAnnouncement(
        todo.favorite ? t.announcements.unfavorited(todo.title) : t.announcements.favorited(todo.title),
      );
    }
  };

  const handleDelete = async (todo: Todo) => {
    if (await deleteTodo(todo)) setAnnouncement(t.announcements.deleted(todo.title));
  };

  const listProps = {
    pendingIds,
    onToggle: toggleTodo,
    onToggleFavorite: handleToggleFavorite,
    onDelete: handleDelete,
    focusFavoriteId,
  };

  const syncIndicator = isRefreshing && (
    <span
      aria-hidden="true"
      className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase"
    >
      <span className="size-1.5 rounded-full bg-brand motion-safe:animate-pulse" />
      {t.tasks.syncing}
    </span>
  );

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <div aria-hidden="true" className="blueprint-grid pointer-events-none fixed inset-0" />

      <main className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <Sheet>
          <AppHeader total={todos.length} completed={completedCount} />

          <div className="mt-10">
            <TodoForm onSubmit={handleAdd} isSubmitting={isCreating} />
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

          <div aria-busy={isRefreshing}>
            {loaded && todos.length > 0 && (
              <TodoSection
                title={t.tasks.favoritesHeading}
                count={favorites.length}
                aside={syncIndicator}
                className="mt-10"
              >
                {favorites.length > 0 ? (
                  <TodoList todos={favorites} {...listProps} />
                ) : (
                  <p className="py-4 text-[13px] text-ink-faint">{t.tasks.favoritesEmpty}</p>
                )}
              </TodoSection>
            )}

            <TodoSection
              title={t.tasks.heading}
              count={others.length}
              aside={loaded && todos.length > 0 ? null : syncIndicator}
              className="mt-10"
            >
              {status === "loading" && <TodoListSkeleton label={t.tasks.loading} />}
              {loaded &&
                (others.length > 0 ? (
                  <TodoList todos={others} {...listProps} />
                ) : (
                  <p className="py-8 text-center text-sm text-ink-faint">
                    {todos.length > 0 ? t.tasks.allFavorites : t.tasks.empty}
                  </p>
                ))}
            </TodoSection>
          </div>
        </Sheet>

        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>

        <footer className="mt-6 flex items-center justify-between px-1 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase">
          <span>{t.footer.project}</span>
          <span>{t.footer.revision}</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
