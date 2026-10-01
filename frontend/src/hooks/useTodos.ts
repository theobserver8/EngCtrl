import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, toApiError } from "../api/client";
import { todosApi } from "../api/todos";
import type { Todo } from "../types/todo";

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
  addTodo: (title: string) => Promise<boolean>;
  toggleTodo: (todo: Todo) => Promise<void>;
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
    async (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return false;

      setIsCreating(true);
      try {
        return await runAction(() => todosApi.create({ title: trimmed }));
      } finally {
        setIsCreating(false);
      }
    },
    [runAction],
  );

  const toggleTodo = useCallback(
    async (todo: Todo) => {
      const setCompleted = (completed: boolean) =>
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed } : t)));

      // Optimistic update so the checkbox reacts instantly. On failure it is rolled back
      // explicitly: the reload that follows may fail too (e.g. the server is down).
      setCompleted(!todo.completed);
      markPending(todo.id, true);
      try {
        const saved = await runAction(() => todosApi.update(todo.id, { completed: !todo.completed }));
        if (!saved) setCompleted(todo.completed);
      } finally {
        markPending(todo.id, false);
      }
    },
    [runAction, markPending],
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
    clearError,
  };
}
