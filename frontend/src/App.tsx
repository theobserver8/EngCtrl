import { useEffect, useRef, useState, type ReactNode } from "react";
import AppHeader from "./components/layout/AppHeader";
import Sheet from "./components/layout/Sheet";
import TodoForm from "./components/todo/TodoForm";
import TodoList from "./components/todo/TodoList";
import TodoListSkeleton from "./components/todo/TodoListSkeleton";
import EmptyState from "./components/ui/EmptyState";
import ErrorBanner from "./components/ui/ErrorBanner";
import Button from "./components/ui/Button";
import { StarIcon, TrashIcon } from "./components/ui/icons";
import Tabs, { type TabsHandle } from "./components/ui/Tabs";
import { useTodos } from "./hooks/useTodos";
import { useI18n } from "./i18n/useI18n";
import type { Todo, TodoDraft } from "./types/todo";
import { getErrorMessage } from "./utils/errorMessage";
import { MOTION_MS, prefersReducedMotion } from "./utils/motion";

type TaskView = "all" | "favorites" | "trash";

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
    trashTodo,
    restoreTodo,
    emptyTrash,
    clearError,
  } = useTodos();
  // Polite live region so screen reader users hear the outcome of their actions.
  const [announcement, setAnnouncement] = useState("");
  const [view, setView] = useState<TaskView>("all");
  // The trash rows are closing before the trash is emptied: the button ignores further clicks.
  // The ref guards at once, even against clicks that arrive before the next render.
  const [emptyingTrash, setEmptyingTrash] = useState(false);
  const emptyingTrashRef = useRef(false);
  const tabsRef = useRef<TabsHandle>(null);
  // Rows of the first load appear at once; rows added or moved afterwards open smoothly.
  const [animateNewRows, setAnimateNewRows] = useState(false);
  useEffect(() => {
    if (status === "success") setAnimateNewRows(true);
  }, [status]);

  const favorites = todos.filter((todo) => todo.favorite);
  const trashed = todos.filter((todo) => todo.trashed);
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

  const handleTrash = async (todo: Todo) => {
    if (await trashTodo(todo)) setAnnouncement(t.announcements.trashed(todo.title));
  };

  const handleRestore = async (todo: Todo) => {
    // Restored from the trash view, the row closes and would take the focus with it (see above).
    if (view === "trash") tabsRef.current?.focusSelectedTab();
    if (await restoreTodo(todo)) setAnnouncement(t.announcements.restored(todo.title));
  };

  const handleEmptyTrash = () => {
    if (emptyingTrashRef.current) return;
    const count = trashed.length;
    emptyingTrashRef.current = true;
    setEmptyingTrash(true);
    const empty = async () => {
      // The trash tab tucks away once empty and the view returns to the tasks: hand the focus to
      // that tab now, before the button it is on goes away.
      tabsRef.current?.focusTab("all");
      if (await emptyTrash()) setAnnouncement(t.announcements.trashEmptied(count));
      emptyingTrashRef.current = false;
      setEmptyingTrash(false);
    };
    // Every row closes first, then they are deleted at once (a single request).
    if (prefersReducedMotion()) void empty();
    else window.setTimeout(() => void empty(), MOTION_MS.slow);
  };

  const listProps = {
    pendingIds,
    onToggle: toggleTodo,
    onToggleFavorite: handleToggleFavorite,
    onTrash: handleTrash,
    onRestore: handleRestore,
    animateNewRows,
  };

  /** Content of a view's panel: the first load, a failed load, the list or its empty state. */
  const renderPanel = (
    list: Todo[],
    empty?: ReactNode,
    variant?: { leaveOnUnfavorite?: boolean; inTrashView?: boolean; closing?: boolean },
  ) => {
    if (status === "loading") return <TodoListSkeleton label={t.tasks.loading} />;
    if (loadFailed)
      return (
        <p className="py-8 text-center text-sm text-ink-faint">
          {t.tasks.unavailable}
        </p>
      );
    return list.length > 0 ? (
      <TodoList todos={list} {...variant} {...listProps} />
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
                  // No empty state: without favourites the tab is tucked away and cannot be opened.
                  panel: renderPanel(favorites, undefined, { leaveOnUnfavorite: true }),
                },
                {
                  id: "trash",
                  label: t.tasks.trashHeading,
                  count: loaded ? trashed.length : undefined,
                  signalChanges: true,
                  // Last, tucked behind the others until something is moved to the trash.
                  collapsed: trashed.length === 0,
                  icon: <TrashIcon className="size-3.5" />,
                  panel: (
                    <>
                      {renderPanel(trashed, undefined, { inTrashView: true, closing: emptyingTrash })}
                      {/* Kept while the emptied trash fades out of view (its tab tucks away). */}
                      {loaded && (
                        <div className="border-t border-line pt-4 pb-4">
                          <Button
                            variant="danger"
                            icon={<TrashIcon />}
                            onClick={handleEmptyTrash}
                            aria-disabled={emptyingTrash}
                            className="w-full text-balance"
                          >
                            {t.tasks.emptyTrash}
                          </Button>
                        </div>
                      )}
                    </>
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
