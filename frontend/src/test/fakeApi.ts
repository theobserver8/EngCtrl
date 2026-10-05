import { vi } from "vitest";
import type { Todo } from "../types/todo";

export interface RecordedCall {
  method: string;
  path: string;
  /** Query string, e.g. "?ids=1&ids=2" ("" when there is none). */
  query?: string;
  body?: unknown;
}

export const SEED_TODOS: Todo[] = [
  { id: 1, title: "Inspect formwork", description: null, completed: false, favorite: false, trashed: false },
  { id: 2, title: "Concrete test", description: "Slab, level 2", completed: true, favorite: false, trashed: false },
  { id: 3, title: "Check rebar", description: null, completed: false, favorite: true, trashed: false },
];

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/**
 * In-memory implementation of the backend API, installed in place of `fetch`.
 * It mirrors the real contract (status codes, never-reused ids) and records every call.
 */
export function createFakeApi(seed: Todo[] = SEED_TODOS) {
  let todos: Todo[] = structuredClone(seed);
  let nextId = Math.max(0, ...todos.map((todo) => todo.id)) + 1;
  const calls: RecordedCall[] = [];
  const state = { offline: false };
  const holds: { method: string; path: string; until: Promise<void> }[] = [];

  const handler = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    if (init.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const url = new URL(String(input));
    const method = init.method ?? "GET";
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path: url.pathname, ...(url.search && { query: url.search }), body });

    if (state.offline) throw new TypeError("Failed to fetch");

    const hold = holds.find((entry) => entry.method === method && entry.path === url.pathname);
    if (hold) {
      holds.splice(holds.indexOf(hold), 1);
      await hold.until; // a slow server: the change is applied only when released
    }

    const match = url.pathname.match(/^\/todos(?:\/(\d+))?$/);
    if (!match) return json(404, { detail: "Not Found" });
    const id = match[1] ? Number(match[1]) : undefined;

    if (id === undefined) {
      if (method === "GET") return json(200, todos);
      if (method === "POST") {
        const todo: Todo = {
          description: null,
          completed: false,
          favorite: false,
          trashed: false,
          ...body,
          id: nextId++,
        };
        todos = [...todos, todo];
        return json(201, todo);
      }
      if (method === "DELETE") {
        const ids = url.searchParams.getAll("ids").map(Number);
        if (ids.length === 0) return json(422, { detail: "ids required" });
        todos = todos.filter((todo) => !ids.includes(todo.id));
        return new Response(null, { status: 204 });
      }
      return json(405, { detail: "Method Not Allowed" });
    }

    const index = todos.findIndex((todo) => todo.id === id);
    if (index === -1) return json(404, { detail: `Todo ${id} not found` });
    if (method === "PATCH") {
      todos = todos.map((todo) => (todo.id === id ? { ...todo, ...body } : todo));
      return json(200, todos[index]);
    }
    if (method === "DELETE") {
      todos = todos.filter((todo) => todo.id !== id);
      return new Response(null, { status: 204 });
    }
    return json(405, { detail: "Method Not Allowed" });
  };

  return {
    fetch: vi.fn(handler),
    calls,
    state,
    /** Current server-side data. */
    get todos() {
      return todos;
    },
    /** Holds the next matching request until the returned function is called. */
    hold(method: string, path: string): () => void {
      let release!: () => void;
      holds.push({ method, path, until: new Promise<void>((resolve) => (release = resolve)) });
      return release;
    },
    /** Simulates a change made by someone else (e.g. another tab). */
    removeOnServer(id: number) {
      todos = todos.filter((todo) => todo.id !== id);
    },
    /** Calls with the given method, ignoring the list reloads. */
    mutations(method: string) {
      return calls.filter((call) => call.method === method);
    },
  };
}

export type FakeApi = ReturnType<typeof createFakeApi>;
