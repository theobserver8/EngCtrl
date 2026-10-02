import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, toApiError } from "../api/client";
import { todosApi } from "../api/todos";
import type { Todo, TodoDraft, TodoUpdate } from "../types/todo";

/** State of the first load. Later reloads are reported through `isRefreshing`. */
export type LoadStatus = "loading" | "success" | "error";

export interface UseTodosResult {
  todos: Todo[];
  status: LoadStatus;
  /** True while the list is being reloaded in the background after the first load. */
  isRefreshing: boolean;
  /** Last action error, or else the last load error. */
  error: ApiError | null;
  /** Ids of todos with a request in flight, so the UI can disable them individually. */
  pendingIds: ReadonlySet<number>;
  isCreating: boolean;
  refresh: () => Promise<void>;
  /** Resolves to true when the todo was created, so the form knows when to reset. */
  addTodo: (draft: TodoDraft) => Promise<boolean>;
  /** Optimistic toggles: resolve to true when the change was saved. */
  toggleTodo: (todo: Todo) => Promise<boolean>;
  toggleFavorite: (todo: Todo) => Promise<boolean>;
  /** Resolves to true when the todo is gone from the server. */
  deleteTodo: (todo: Todo) => Promise<boolean>;
  clearError: () => void;
}

export function useTodos(): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<ApiError | null>(null);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(() => new Set());
  const [isCreating, setIsCreating] = useState(false);

  // Only the latest list request may update the state; older ones are aborted.
  const listRequest = useRef<AbortController | null>(null);
  const hasLoaded = useRef(false);

  const refresh = useCallback(async () => {
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;

    if (hasLoaded.current) setIsRefreshing(true);
    else setStatus("loading");

    try {
      const data = await todosApi.list(controller.signal);
      hasLoaded.current = true;
      setTodos(data);
      setStatus("success");
      setLoadError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      setLoadError(toApiError(err));
      // A failed background reload keeps the current list on screen.
      if (!hasLoaded.current) setStatus("error");
    } finally {
      if (listRequest.current === controller) setIsRefreshing(false);
    }
  }, []);

  // Load on mount; abort any in-flight list request on unmount.
  useEffect(() => {
    void refresh();
    return () => listRequest.current?.abort();
  }, [refresh]);

  /**
   * Runs a mutation and always reloads the list afterwards (also on failure, to resync
   * with the server, e.g. when the todo was removed elsewhere).
   */
  const runAction = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      // A list request started before this mutation would bring stale data and could undo
      // the optimistic update on screen (e.g. a deleted row reappearing for a moment).
      listRequest.current?.abort();
      try {
        await action();
        setActionError(null);
        return true;
      } catch (err) {
        setActionError(toApiError(err));
        return false;
      } finally {
        void refresh();
      }
    },
    [refresh],
  );

  const markPending = useCallback((id: number, pending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const addTodo = useCallback(
    async ({ title, description }: TodoDraft) => {
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();
      if (!trimmedTitle) return false;

      setIsCreating(true);
      try {
        return await runAction(() =>
          todosApi.create({
            title: trimmedTitle,
            ...(trimmedDescription && { description: trimmedDescription }),
          }),
        );
      } finally {
        setIsCreating(false);
      }
    },
    [runAction],
  );

  /**
   * Applies a change on screen instantly, then saves it. On failure the previous values are
   * restored explicitly: the reload that follows may fail too (e.g. the server is down).
   */
  const patchOptimistic = useCallback(
    async (todo: Todo, changes: TodoUpdate) => {
      const previous = Object.fromEntries(
        Object.keys(changes).map((key) => [key, todo[key as keyof TodoUpdate]]),
      ) as TodoUpdate;
      const apply = (values: TodoUpdate) =>
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, ...values } : t)));

      apply(changes);
      markPending(todo.id, true);
      try {
        const saved = await runAction(() => todosApi.update(todo.id, changes));
        if (!saved) apply(previous);
        return saved;
      } finally {
        markPending(todo.id, false);
      }
    },
    [runAction, markPending],
  );

  const toggleTodo = useCallback(
    (todo: Todo) => patchOptimistic(todo, { completed: !todo.completed }),
    [patchOptimistic],
  );

  const toggleFavorite = useCallback(
    (todo: Todo) => patchOptimistic(todo, { favorite: !todo.favorite }),
    [patchOptimistic],
  );

  const deleteTodo = useCallback(
    async (todo: Todo) => {
      // Optimistic removal. Server order is id order (ids only grow), so a rollback can
      // put the todo back in its place by sorting.
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
      const deleted = await runAction(async () => {
        try {
          await todosApi.remove(todo.id);
        } catch (err) {
          // Already deleted (e.g. from another tab): the intent is fulfilled, not an error.
          if (err instanceof ApiError && err.status === 404) return;
          throw err;
        }
      });
      if (!deleted) {
        setTodos((prev) =>
          prev.some((t) => t.id === todo.id) ? prev : [...prev, todo].sort((a, b) => a.id - b.id),
        );
      }
      return deleted;
    },
    [runAction],
  );

  const clearError = useCallback(() => {
    setActionError(null);
    setLoadError(null);
  }, []);

  return {
    todos,
    status,
    isRefreshing,
    error: actionError ?? loadError,
    pendingIds,
    isCreating,
    refresh,
    addTodo,
    toggleTodo,
    toggleFavorite,
    deleteTodo,
    clearError,
  };
}
