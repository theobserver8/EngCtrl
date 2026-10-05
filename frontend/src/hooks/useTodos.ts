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
  /** Optimistic moves in and out of the trash; the other fields are kept. */
  trashTodo: (todo: Todo) => Promise<boolean>;
  restoreTodo: (todo: Todo) => Promise<boolean>;
  /** Deletes every todo in the trash with a single request. Resolves to true once they are gone. */
  emptyTrash: () => Promise<boolean>;
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
  // Mutations still waiting for the server. While any is in flight, a list snapshot may not
  // include it yet, so applying it would undo that change on screen.
  const actionsInFlight = useRef(0);

  const refresh = useCallback(async () => {
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;

    if (hasLoaded.current) setIsRefreshing(true);
    else setStatus("loading");

    try {
      const data = await todosApi.list(controller.signal);
      // Stale if an action started meanwhile; the last action to finish reloads again.
      if (actionsInFlight.current > 0) return;
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
   * Runs a mutation and reloads the list afterwards (also on failure, to resync with the
   * server, e.g. when the todo was removed elsewhere). When actions overlap, only the last
   * one to finish reloads, so no snapshot taken before a pending change undoes it on screen.
   */
  const runAction = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      // A list request started before this mutation would bring stale data and could undo
      // the optimistic update on screen (e.g. a deleted row reappearing for a moment).
      listRequest.current?.abort();
      actionsInFlight.current += 1;
      try {
        await action();
        setActionError(null);
        return true;
      } catch (err) {
        setActionError(toApiError(err));
        return false;
      } finally {
        actionsInFlight.current -= 1;
        if (actionsInFlight.current === 0) void refresh();
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

  const trashTodo = useCallback(
    (todo: Todo) => patchOptimistic(todo, { trashed: true }),
    [patchOptimistic],
  );

  const restoreTodo = useCallback(
    (todo: Todo) => patchOptimistic(todo, { trashed: false }),
    [patchOptimistic],
  );

  const emptyTrash = useCallback(async () => {
    // The trash as it is on screen when the user confirms.
    const trashed = todos.filter((todo) => todo.trashed);
    if (trashed.length === 0) return true;
    const ids = new Set(trashed.map((todo) => todo.id));

    // Optimistic removal, rolled back like a single delete (server order is id order).
    setTodos((prev) => prev.filter((t) => !ids.has(t.id)));
    // Ids already deleted elsewhere are ignored by the server: no 404 to handle here.
    const deleted = await runAction(() => todosApi.removeMany([...ids]));
    if (!deleted) {
      setTodos((prev) => {
        const missing = trashed.filter((todo) => !prev.some((t) => t.id === todo.id));
        return [...prev, ...missing].sort((a, b) => a.id - b.id);
      });
    }
    return deleted;
  }, [todos, runAction]);

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
    trashTodo,
    restoreTodo,
    emptyTrash,
    deleteTodo,
    clearError,
  };
}
