import type { Todo, TodoCreate, TodoUpdate } from "../types/todo";
import { request } from "./client";

const RESOURCE = "/todos";

export const todosApi = {
  list: (signal?: AbortSignal) => request<Todo[]>(RESOURCE, { signal }),

  create: (data: TodoCreate) => request<Todo>(RESOURCE, { method: "POST", body: data }),

  update: (id: number, changes: TodoUpdate) =>
    request<Todo>(`${RESOURCE}/${id}`, { method: "PATCH", body: changes }),

  remove: (id: number) => request<void>(`${RESOURCE}/${id}`, { method: "DELETE" }),

  /** Deletes several todos in a single request (`?ids=1&ids=2`). Unknown ids are ignored. */
  removeMany: (ids: readonly number[]) => {
    const query = new URLSearchParams(ids.map((id) => ["ids", String(id)]));
    return request<void>(`${RESOURCE}?${query}`, { method: "DELETE" });
  },
};
