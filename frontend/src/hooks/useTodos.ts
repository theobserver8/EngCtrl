import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, toApiError } from "../api/client";
import { todosApi } from "../api/todos";
import type { Todo } from "../types/todo";

export type LoadStatus = "idle" | "loading" | "success" | "error";

export interface UseTodosResult {
  todos: Todo[];
  status: LoadStatus;
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
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<ApiError | null>(null);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<number>>(() => new Set());
  const [isCreating, setIsCreating] = useState(false);

  // Only the latest list request may update the state; older ones are aborted.
  const listRequest = useRef<AbortController | null>(null);
  useEffect(() => () => listRequest.current?.abort(), []);

  const markPending = useCallback((id: number, pending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;

    setStatus("loading");
    try {
      const data = await todosApi.list(controller.signal);
      setTodos(data);
      setStatus("success");
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(toApiError(err));
      setStatus("error");
    }
  }, []);

  const addTodo = useCallback(async (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return false;

    setIsCreating(true);
    try {
      await todosApi.create({ title: trimmed });
      setError(null);
      return true;
    } catch (err) {
      setError(toApiError(err));
      return false;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const toggleTodo = useCallback(
    async (todo: Todo) => {
      markPending(todo.id, true);
      try {
        const updated = await todosApi.update(todo.id, { completed: !todo.completed });
        setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setError(null);
      } catch (err) {
        setError(toApiError(err));
      } finally {
        markPending(todo.id, false);
      }
    },
    [markPending],
  );

  const clearError = useCallback(() => setError(null), []);

  return { todos, status, error, pendingIds, isCreating, refresh, addTodo, toggleTodo, clearError };
}
