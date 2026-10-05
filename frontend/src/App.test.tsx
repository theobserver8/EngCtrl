import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SEED_TODOS } from "./test/fakeApi";
import { getRow, renderApp, visiblePanel, visibleTitles } from "./test/renderApp";

const GUARD_MS = 450; // the delete confirmation ignores activations for 400 ms
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("loading (task 3)", () => {
  it("loads the tasks automatically when the page opens", async () => {
    const { api } = await renderApp();

    expect(api.calls[0]).toEqual({ method: "GET", path: "/todos", body: undefined });
    expect(screen.queryByRole("button", { name: /load tasks/i })).not.toBeInTheDocument();
  });

  it("shows every task, and the favourites in their own view (task 4)", async () => {
    const { user } = await renderApp();

    expect(screen.getByRole("tab", { name: /tasks · 03/i })).toHaveAttribute("aria-selected", "true");
    expect(visibleTitles()).toEqual(["Inspect formwork", "Concrete test", "Check rebar"]);

    await user.click(screen.getByRole("tab", { name: /favourites · 01/i }));

    expect(screen.getByRole("tab", { name: /favourites/i })).toHaveAttribute("aria-selected", "true");
    expect(visibleTitles()).toEqual(["Check rebar"]);
  });

  it("switches views with the arrow keys", async () => {
    const { user } = await renderApp();

    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: /favourites/i })).toHaveFocus();
    expect(visibleTitles()).toEqual(["Check rebar"]);

    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: /tasks/i })).toHaveFocus();
  });

  it("shows task descriptions (task 4)", async () => {
    await renderApp();

    expect(within(getRow("Concrete test")).getByText("Slab, level 2")).toBeInTheDocument();
  });

  it("shows an empty state when there are no tasks", async () => {
    await renderApp({ todos: [] });

    expect(await screen.findByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it("explains a failed first load and lets the user retry", async () => {
    const { api, user } = await renderApp({ offline: true });

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach the server/i);
    expect(within(visiblePanel()).getByText(/could not be loaded/i)).toBeInTheDocument();

    api.state.offline = false;
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Inspect formwork")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("adding tasks", () => {
  it("creates a task with a description and reloads the list (task 3 and 4)", async () => {
    const { api, user } = await renderApp();

    await user.type(screen.getByLabelText("New task"), "Load test");
    await user.click(screen.getByRole("button", { name: /add description/i }));
    await user.type(screen.getByLabelText("Description"), "Beam V-12");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Load test")).toBeInTheDocument();
    expect(api.mutations("POST")[0].body).toEqual({ title: "Load test", description: "Beam V-12" });
    expect(api.calls.at(-1)).toMatchObject({ method: "GET", path: "/todos" });
    expect(screen.getByLabelText("New task")).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent("Task added: Load test");
  });

  it("does not submit an empty title", async () => {
    const { api, user } = await renderApp();

    await user.type(screen.getByLabelText("New task"), "   {Enter}");

    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(api.mutations("POST")).toHaveLength(0);
  });
});

describe("completing tasks (task 1)", () => {
  it("saves the completion status in the backend and reloads", async () => {
    const { api, user } = await renderApp();

    await user.click(screen.getByRole("checkbox", { name: "Inspect formwork" }));

    expect(screen.getByRole("checkbox", { name: "Inspect formwork" })).toBeChecked();
    await waitFor(() => expect(api.todos.find((todo) => todo.id === 1)?.completed).toBe(true));
    expect(api.mutations("PATCH")[0]).toEqual({ method: "PATCH", path: "/todos/1", body: { completed: true } });
    await waitFor(() => expect(api.calls.at(-1)?.method).toBe("GET"));
  });

  it("rolls back the checkbox and shows an error when saving fails", async () => {
    const { api, user } = await renderApp();
    api.state.offline = true;

    await user.click(screen.getByRole("checkbox", { name: "Inspect formwork" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reach the server/i);
    expect(screen.getByRole("checkbox", { name: "Inspect formwork" })).not.toBeChecked();
  });
});

describe("overlapping actions", () => {
  it("does not undo a pending change when another action finishes first", async () => {
    const { api, user } = await renderApp();
    const releaseSlowSave = api.hold("PATCH", "/todos/3");

    await user.click(screen.getByRole("checkbox", { name: "Check rebar" })); // slow save
    await user.click(screen.getByRole("checkbox", { name: "Inspect formwork" })); // fast save
    await waitFor(() => expect(api.todos.find((todo) => todo.id === 1)?.completed).toBe(true));
    await wait(100);

    // The slow change must still be on screen: no reload may bring the old server state.
    expect(screen.getByRole("checkbox", { name: "Check rebar" })).toBeChecked();

    releaseSlowSave();
    await waitFor(() => expect(api.todos.find((todo) => todo.id === 3)?.completed).toBe(true));
    await waitFor(() => expect(api.calls.at(-1)?.method).toBe("GET"));
    expect(screen.getByRole("checkbox", { name: "Check rebar" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Inspect formwork" })).toBeChecked();
  });

  it("does not bring back a row whose deletion is still in progress", async () => {
    const { api, user } = await renderApp();
    const releaseSlowDelete = api.hold("DELETE", "/todos/1");

    await user.click(screen.getByRole("button", { name: "Delete task: Inspect formwork" }));
    await wait(GUARD_MS);
    await user.click(screen.getByRole("button", { name: "Confirm deletion of task: Inspect formwork" }));
    await user.click(screen.getByRole("checkbox", { name: "Concrete test" }));
    await waitFor(() => expect(api.todos.find((todo) => todo.id === 2)?.completed).toBe(false));
    await wait(100);

    expect(screen.queryByText("Inspect formwork")).not.toBeInTheDocument();

    releaseSlowDelete();
    await waitFor(() => expect(api.todos.map((todo) => todo.id)).toEqual([2, 3]));
    await waitFor(() => expect(api.calls.at(-1)?.method).toBe("GET"));
    expect(screen.queryByText("Inspect formwork")).not.toBeInTheDocument();
  });
});

describe("favourites (task 4)", () => {
  it("keeps a new favourite among the tasks and adds it to the favourites view", async () => {
    const { api, user } = await renderApp();

    await user.click(screen.getByRole("button", { name: "Mark as favourite: Inspect formwork" }));

    expect(await screen.findByRole("tab", { name: /favourites · 02/i })).toBeInTheDocument();
    expect(api.mutations("PATCH")[0].body).toEqual({ favorite: true });
    expect(visibleTitles()).toEqual(["Inspect formwork", "Concrete test", "Check rebar"]);
    expect(screen.getByRole("button", { name: "Remove from favourites: Inspect formwork" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("tab", { name: /favourites/i }));

    expect(visibleTitles()).toEqual(["Inspect formwork", "Check rebar"]);
  });

  it("removes a task from the favourites view when it is unmarked there", async () => {
    const { user } = await renderApp();
    await user.click(screen.getByRole("tab", { name: /favourites/i }));

    await user.click(screen.getByRole("button", { name: "Remove from favourites: Check rebar" }));

    // The last favourite is gone: the tab tucks away and the view (and focus) return to the tasks.
    await waitFor(() => expect(screen.queryByRole("tab", { name: /favourites/i })).not.toBeInTheDocument());
    expect(screen.getByRole("tab", { name: /tasks/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /tasks/i })).toHaveFocus();
    expect(visibleTitles()).toEqual(["Inspect formwork", "Concrete test", "Check rebar"]);
    expect(screen.getByRole("button", { name: "Mark as favourite: Check rebar" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("tucks the favourites tab away while there are none, and brings it back with the first one", async () => {
    const { user } = await renderApp();

    await user.click(screen.getByRole("button", { name: "Remove from favourites: Check rebar" }));

    await waitFor(() => expect(screen.queryByRole("tab", { name: /favourites/i })).not.toBeInTheDocument());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /tasks/i })).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("button", { name: "Mark as favourite: Concrete test" }));

    expect(await screen.findByRole("tab", { name: /favourites · 01/i })).toBeInTheDocument();
  });
});

describe("trash", () => {
  it("keeps the trash tab tucked away until a task is in the trash, and lists it there", async () => {
    await renderApp();
    expect(screen.queryByRole("tab", { name: /trash/i })).not.toBeInTheDocument();

    cleanup();
    const { user } = await renderApp({
      todos: SEED_TODOS.map((todo) => ({ ...todo, trashed: todo.id === 2 })),
    });

    await user.click(screen.getByRole("tab", { name: /trash · 01/i }));

    expect(visibleTitles()).toEqual(["Concrete test"]);
  });
});

describe("deleting tasks (task 2)", () => {
  it("asks for confirmation and deletes on the second, deliberate click", async () => {
    const { api, user } = await renderApp();
    const trash = screen.getByRole("button", { name: "Delete task: Inspect formwork" });

    await user.click(trash);
    expect(trash).toHaveAttribute("aria-pressed", "true");
    expect(api.mutations("DELETE")).toHaveLength(0);

    await wait(GUARD_MS);
    await user.click(screen.getByRole("button", { name: "Confirm deletion of task: Inspect formwork" }));

    await waitFor(() => expect(screen.queryByText("Inspect formwork")).not.toBeInTheDocument());
    expect(api.mutations("DELETE")[0].path).toBe("/todos/1");
    expect(api.todos.map((todo) => todo.id)).toEqual([2, 3]);
    expect(screen.getByRole("status")).toHaveTextContent("Task deleted: Inspect formwork");
  });

  it("never deletes on an accidental double click on the trash button", async () => {
    const { api, user } = await renderApp();
    const trash = screen.getByRole("button", { name: "Delete task: Inspect formwork" });

    await user.dblClick(trash);

    expect(trash).toHaveAttribute("aria-pressed", "false");
    expect(api.mutations("DELETE")).toHaveLength(0);
  });

  it("ignores a confirmation that comes too fast after arming", async () => {
    const { api, user } = await renderApp();

    await user.click(screen.getByRole("button", { name: "Delete task: Inspect formwork" }));
    await user.click(screen.getByRole("button", { name: "Confirm deletion of task: Inspect formwork" }));

    expect(api.mutations("DELETE")).toHaveLength(0);
    expect(screen.getByText("Inspect formwork")).toBeInTheDocument();
  });

  it("cancels the confirmation with Escape", async () => {
    const { user } = await renderApp();
    const trash = screen.getByRole("button", { name: "Delete task: Inspect formwork" });

    await user.click(trash);
    await user.keyboard("{Escape}");

    expect(trash).toHaveAttribute("aria-pressed", "false");
    expect(trash).toHaveFocus();
  });

  it("returns keyboard focus to the trash button when the confirmation times out", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { user } = await renderApp();
      const trash = screen.getByRole("button", { name: "Delete task: Inspect formwork" });

      trash.focus();
      await user.keyboard("{Enter}");
      expect(screen.getByRole("button", { name: "Confirm deletion of task: Inspect formwork" })).toHaveFocus();

      act(() => vi.advanceTimersByTime(4100));

      expect(trash).toHaveAttribute("aria-pressed", "false");
      expect(trash).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it("treats a task already deleted elsewhere as deleted, without an error", async () => {
    const { api, user } = await renderApp();
    api.removeOnServer(1);

    await user.click(screen.getByRole("button", { name: "Delete task: Inspect formwork" }));
    await wait(GUARD_MS);
    await user.click(screen.getByRole("button", { name: "Confirm deletion of task: Inspect formwork" }));

    await waitFor(() => expect(screen.queryByText("Inspect formwork")).not.toBeInTheDocument());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("puts the task back if the deletion fails", async () => {
    const { api, user } = await renderApp();

    await user.click(screen.getByRole("button", { name: "Delete task: Inspect formwork" }));
    await wait(GUARD_MS);
    api.state.offline = true;
    await user.click(screen.getByRole("button", { name: "Confirm deletion of task: Inspect formwork" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(visibleTitles()).toEqual(["Inspect formwork", "Concrete test", "Check rebar"]);
  });
});

describe("language", () => {
  it("switches the interface between English and Spanish and remembers the choice", async () => {
    const { user } = await renderApp({ locale: "en" });

    await user.click(screen.getByRole("button", { name: "Español" }));

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Registro de tareas");
    expect(screen.getByRole("checkbox", { name: "Inspect formwork" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Español" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.lang).toBe("es");
    expect(window.localStorage.getItem("cemosa.todo.locale")).toBe("es");
  });
});

describe("progress", () => {
  it("reports the completion percentage", async () => {
    await renderApp();

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
  });
});
