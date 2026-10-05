import { useEffect, useRef, useState, type ReactNode } from "react";
import AppHeader from "./components/layout/AppHeader";
import Sheet from "./components/layout/Sheet";
import TodoForm from "./components/todo/TodoForm";
import TodoList from "./components/todo/TodoList";
import TodoListSkeleton from "./components/todo/TodoListSkeleton";
import EmptyState from "./components/ui/EmptyState";
import ErrorBanner from "./components/ui/ErrorBanner";
import { StarIcon } from "./components/ui/icons";
import Tabs, { type TabsHandle } from "./components/ui/Tabs";
import { useTodos } from "./hooks/useTodos";
import { useI18n } from "./i18n/useI18n";
import type { Todo, TodoDraft } from "./types/todo";
import { getErrorMessage } from "./utils/errorMessage";

type TaskView = "all" | "favorites";

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
  const [view, setView] = useState<TaskView>("all");
  const tabsRef = useRef<TabsHandle>(null);
  // Rows of the first load appear at once; rows added or moved afterwards open smoothly.
  const [animateNewRows, setAnimateNewRows] = useState(false);
  useEffect(() => {
    if (status === "success") setAnimateNewRows(true);
  }, [status]);

  const favorites = todos.filter((todo) => todo.favorite);
  const completedCount = todos.filter((todo) => todo.completed).length;
  const loadFailed = status === "error";
  const loaded = status === "success";

  const handleAdd = async (draft: TodoDraft) => {
    const added = await addTodo(draft);
    if (added) setAnnouncement(t.announcements.added(draft.title.trim()));
    return added;
  };

  const handleToggleFavorite = async (todo: Todo) => {
    // Unmarked from the favourites view, the row closes and would take the focus with it:
    // hand it to the tab so keyboard users keep their place.
    if (view === "favorites" && todo.favorite) tabsRef.current?.focusSelectedTab();
    if (await toggleFavorite(todo)) {
      setAnnouncement(
        todo.favorite
          ? t.announcements.unfavorited(todo.title)
          : t.announcements.favorited(todo.title),
      );
    }
  };

  const handleDelete = async (todo: Todo) => {
    if (await deleteTodo(todo))
      setAnnouncement(t.announcements.deleted(todo.title));
  };

  const listProps = {
    pendingIds,
    onToggle: toggleTodo,
    onToggleFavorite: handleToggleFavorite,
    onDelete: handleDelete,
    animateNewRows,
  };

  /** Content of a view's panel: the first load, a failed load, the list or its empty state. */
  const renderPanel = (list: Todo[], empty: ReactNode, leaveOnUnfavorite = false) => {
    if (status === "loading") return <TodoListSkeleton label={t.tasks.loading} />;
    if (loadFailed)
      return (
        <p className="py-8 text-center text-sm text-ink-faint">
          {t.tasks.unavailable}
        </p>
      );
    return list.length > 0 ? (
      <TodoList todos={list} leaveOnUnfavorite={leaveOnUnfavorite} {...listProps} />
    ) : (
      empty
    );
  };

  const syncIndicator = isRefreshing && (
    <span
      aria-hidden="true"
      className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-ink-faint uppercase motion-safe:animate-[fade-in_var(--motion-base)_var(--ease-out-soft)]"
    >
      <span className="size-1.5 rounded-full bg-brand motion-safe:animate-pulse" />
      <span className="hidden sm:inline">{t.tasks.syncing}</span>
    </span>
  );

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <div
        aria-hidden="true"
        className="blueprint-grid pointer-events-none fixed inset-0"
      />

      <main className="relative mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <Sheet>
          <AppHeader total={todos.length} completed={completedCount} ready={loaded} />

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

          <div aria-busy={isRefreshing} className="mt-10">
            <Tabs
              ref={tabsRef}
              label={t.tasks.views}
              selected={view}
              onSelect={setView}
              aside={syncIndicator}
              tabs={[
                {
                  id: "all",
                  label: t.tasks.heading,
                  count: loaded ? todos.length : undefined,
                  panel: renderPanel(todos, <EmptyState message={t.tasks.empty} />),
                },
                {
                  id: "favorites",
                  label: t.tasks.favoritesHeading,
                  count: loaded ? favorites.length : undefined,
                  signalChanges: true,
                  // Tucked behind "Tasks" until there is a favourite to show.
                  collapsed: favorites.length === 0,
                  icon: (
                    <StarIcon
                      className={`size-3.5 transition-[fill] duration-(--motion-base) ${
                        favorites.length > 0 ? "fill-lime" : "fill-transparent"
                      }`}
                    />
                  ),
                  panel: renderPanel(
                    favorites,
                    <p className="py-4 text-[13px] text-ink-faint">
                      {t.tasks.favoritesEmpty}
                    </p>,
                    true,
                  ),
                },
              ]}
            />
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
