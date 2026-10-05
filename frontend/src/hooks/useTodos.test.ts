import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createFakeApi, SEED_TODOS } from "../test/fakeApi";
import type { Todo } from "../types/todo";
import { useTodos } from "./useTodos";

async function renderTodos(todos: Todo[] = SEED_TODOS) {
  const api = createFakeApi(todos);
  vi.stubGlobal("fetch", api.fetch);
  const hook = renderHook(() => useTodos());
  await waitFor(() => expect(hook.result.current.status).toBe("success"));
  return { api, result: hook.result };
}

const byId = (todos: Todo[], id: number) => todos.find((todo) => todo.id === id);

describe("trash", () => {
  it("moves a todo to the trash and restores it, keeping its other fields", async () => {
    const { api, result } = await renderTodos();
    const favourite = byId(result.current.todos, 3)!;

    let saved = false;
    await act(async () => {
      saved = await result.current.trashTodo(favourite);
    });

    expect(saved).toBe(true);
    expect(api.mutations("PATCH")[0]).toMatchObject({ path: "/todos/3", body: { trashed: true } });
    expect(byId(result.current.todos, 3)).toEqual({ ...favourite, trashed: true });

    await act(async () => {
      await result.current.restoreTodo(byId(result.current.todos, 3)!);
    });

    expect(api.mutations("PATCH")[1].body).toEqual({ trashed: false });
    expect(byId(result.current.todos, 3)).toEqual(favourite);
  });

  it("shows the move at once and rolls it back if it cannot be saved", async () => {
    const { api, result } = await renderTodos();
    api.state.offline = true;

    let promise!: Promise<boolean>;
    act(() => {
      promise = result.current.trashTodo(result.current.todos[0]);
    });
    expect(result.current.todos[0].trashed).toBe(true);

    await act(async () => {
      expect(await promise).toBe(false);
    });
    expect(result.current.todos[0].trashed).toBe(false);
  });

  it("empties the trash with a single request for every trashed todo", async () => {
    const trashedSeed = SEED_TODOS.map((todo) => ({ ...todo, trashed: todo.id !== 2 }));
    const { api, result } = await renderTodos(trashedSeed);

    let deleted = false;
    await act(async () => {
      deleted = await result.current.emptyTrash();
    });

    expect(deleted).toBe(true);
    expect(api.mutations("DELETE")).toEqual([{ method: "DELETE", path: "/todos", query: "?ids=1&ids=3" }]);
    expect(result.current.todos.map((todo) => todo.id)).toEqual([2]);
    expect(api.todos.map((todo) => todo.id)).toEqual([2]);
  });

  it("puts the trashed todos back in their place if emptying fails", async () => {
    const trashedSeed = SEED_TODOS.map((todo) => ({ ...todo, trashed: todo.id !== 2 }));
    const { api, result } = await renderTodos(trashedSeed);
    api.state.offline = true;

    let deleted = true;
    await act(async () => {
      deleted = await result.current.emptyTrash();
    });

    expect(deleted).toBe(false);
    expect(result.current.todos).toEqual(trashedSeed);
    expect(result.current.error?.isNetworkError).toBe(true);
  });

  it("does not call the server when the trash is empty", async () => {
    const { api, result } = await renderTodos();

    await act(async () => {
      expect(await result.current.emptyTrash()).toBe(true);
    });

    expect(api.mutations("DELETE")).toEqual([]);
  });
});
