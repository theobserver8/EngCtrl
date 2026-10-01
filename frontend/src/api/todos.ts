import type { Todo, TodoCreate, TodoUpdate } from "../types/todo";
import { request } from "./client";

const RESOURCE = "/todos";

export const todosApi = {
  list: (signal?: AbortSignal) => request<Todo[]>(RESOURCE, { signal }),

  create: (data: TodoCreate) => request<Todo>(RESOURCE, { method: "POST", body: data }),

  update: (id: number, changes: TodoUpdate) =>
    request<Todo>(`${RESOURCE}/${id}`, { method: "PATCH", body: changes }),
};
