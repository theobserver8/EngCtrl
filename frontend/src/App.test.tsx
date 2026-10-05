import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SEED_TODOS } from "./test/fakeApi";
import { getRow, renderApp, visiblePanel, visibleTitles } from "./test/renderApp";

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

  it("does not undo a move to the trash that is still in progress", async () => {
    const { api, user } = await renderApp();
    const releaseSlowTrash = api.hold("PATCH", "/todos/1");

    await user.click(screen.getByRole("button", { name: "Move to the trash: Inspect formwork" }));
    await user.click(screen.getByRole("checkbox", { name: "Concrete test" }));
    await waitFor(() => expect(api.todos.find((todo) => todo.id === 2)?.completed).toBe(false));
    await wait(100);

    expect(screen.getByRole("button", { name: "Restore from the trash: Inspect formwork" })).toBeInTheDocument();

    releaseSlowTrash();
    await waitFor(() => expect(api.todos.find((todo) => todo.id === 1)?.trashed).toBe(true));
    await waitFor(() => expect(api.calls.at(-1)?.method).toBe("GET"));
    expect(screen.getByRole("button", { name: "Restore from the trash: Inspect formwork" })).toBeInTheDocument();
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

describe("trash (task 2)", () => {
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

  it("moves a task to the trash at once, without deleting it, and keeps it among the tasks", async () => {
    const { api, user } = await renderApp();

    await user.click(screen.getByRole("button", { name: "Move to the trash: Inspect formwork" }));

    expect(await screen.findByRole("tab", { name: /trash · 01/i })).toBeInTheDocument();
    expect(api.mutations("PATCH")[0]).toMatchObject({ path: "/todos/1", body: { trashed: true } });
    expect(api.mutations("DELETE")).toHaveLength(0);
    expect(visibleTitles()).toEqual(["Inspect formwork", "Concrete test", "Check rebar"]);
    // The same button now restores it, so the focus stays in place.
    expect(screen.getByRole("button", { name: "Restore from the trash: Inspect formwork" })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Moved to the trash: Inspect formwork");
  });

  it("restores a task from the tasks view, keeping its other fields", async () => {
    const { api, user } = await renderApp({
      todos: SEED_TODOS.map((todo) => ({ ...todo, trashed: todo.id === 3 })),
    });

    await user.click(screen.getByRole("button", { name: "Restore from the trash: Check rebar" }));

    await waitFor(() => expect(screen.queryByRole("tab", { name: /trash/i })).not.toBeInTheDocument());
    expect(api.mutations("PATCH")[0].body).toEqual({ trashed: false });
    expect(api.todos.find((todo) => todo.id === 3)).toMatchObject({ favorite: true, trashed: false });
    expect(screen.getByRole("button", { name: "Move to the trash: Check rebar" })).toBeInTheDocument();
  });

  it("keeps a trashed favourite in the favourites view, offering to restore it", async () => {
    const { user } = await renderApp({
      todos: SEED_TODOS.map((todo) => ({ ...todo, trashed: todo.id === 3 })),
    });

    await user.click(screen.getByRole("tab", { name: /favourites · 01/i }));

    expect(visibleTitles()).toEqual(["Check rebar"]);
    expect(within(visiblePanel()).getByRole("button", { name: "Restore from the trash: Check rebar" })).toBeInTheDocument();
  });

  it("only offers to restore in the trash view, and closes the view with its last task", async () => {
    const { user } = await renderApp({
      todos: SEED_TODOS.map((todo) => ({ ...todo, trashed: todo.id === 3 })),
    });
    await user.click(screen.getByRole("tab", { name: /trash · 01/i }));
    const row = getRow("Check rebar");

    expect(within(row).getAllByRole("button").map((button) => button.getAttribute("aria-label"))).toEqual([
      "Restore from the trash: Check rebar",
    ]);

    await user.click(within(row).getByRole("button", { name: "Restore from the trash: Check rebar" }));

    // The trash is empty: its tab tucks away and the view (and focus) return to the tasks.
    await waitFor(() => expect(screen.queryByRole("tab", { name: /trash/i })).not.toBeInTheDocument());
    expect(screen.getByRole("tab", { name: /tasks/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /tasks/i })).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Restored from the trash: Check rebar");
  });

  it("empties the trash with a single request and returns to the tasks", async () => {
    const { api, user } = await renderApp({
      todos: SEED_TODOS.map((todo) => ({ ...todo, trashed: todo.id !== 2 })),
    });
    await user.click(screen.getByRole("tab", { name: /trash · 02/i }));

    await user.click(screen.getByRole("button", { name: "Empty the trash and delete its 2 tasks?" }));

    await waitFor(() => expect(screen.queryByRole("tab", { name: /trash/i })).not.toBeInTheDocument());
    expect(api.mutations("DELETE")).toEqual([{ method: "DELETE", path: "/todos", query: "?ids=1&ids=3" }]);
    expect(api.todos.map((todo) => todo.id)).toEqual([2]);
    expect(screen.getByRole("tab", { name: /tasks · 01/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /tasks/i })).toHaveFocus();
    expect(visibleTitles()).toEqual(["Concrete test"]);
    expect(screen.getByRole("status")).toHaveTextContent("Trash emptied: 2 tasks deleted");
  });

  it("says how many tasks emptying the trash deletes", async () => {
    const { user } = await renderApp({
      locale: "es",
      todos: SEED_TODOS.map((todo) => ({ ...todo, trashed: todo.id === 3 })),
    });

    await user.click(screen.getByRole("tab", { name: /papelera · 01/i }));

    expect(screen.getByRole("button", { name: "¿Vaciar la papelera y eliminar su tarea?" })).toBeInTheDocument();
  });

  it("sends a single request on a double click", async () => {
    const { api, user } = await renderApp({
      todos: SEED_TODOS.map((todo) => ({ ...todo, trashed: todo.id !== 2 })),
    });
    await user.click(screen.getByRole("tab", { name: /trash · 02/i }));
    const button = screen.getByRole("button", { name: "Empty the trash and delete its 2 tasks?" });

    act(() => {
      button.click();
      button.click();
    });

    await waitFor(() => expect(screen.queryByRole("tab", { name: /trash/i })).not.toBeInTheDocument());
    expect(api.mutations("DELETE")).toHaveLength(1);
  });

  it("empties the trash even if one of its tasks was already deleted elsewhere", async () => {
    const { api, user } = await renderApp({
      todos: SEED_TODOS.map((todo) => ({ ...todo, trashed: todo.id !== 2 })),
    });
    api.removeOnServer(1);
    await user.click(screen.getByRole("tab", { name: /trash · 02/i }));

    await user.click(screen.getByRole("button", { name: "Empty the trash and delete its 2 tasks?" }));

    await waitFor(() => expect(screen.queryByRole("tab", { name: /trash/i })).not.toBeInTheDocument());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("brings the trash back if emptying it fails", async () => {
    const { api, user } = await renderApp({
      todos: SEED_TODOS.map((todo) => ({ ...todo, trashed: todo.id !== 2 })),
    });
    await user.click(screen.getByRole("tab", { name: /trash · 02/i }));
    api.state.offline = true;

    await user.click(screen.getByRole("button", { name: "Empty the trash and delete its 2 tasks?" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(await screen.findByRole("tab", { name: /trash · 02/i })).toBeInTheDocument();
    expect(api.todos.map((todo) => todo.id)).toEqual([1, 2, 3]);
  });

  it("takes the task out of the trash again if the move cannot be saved", async () => {
    const { api, user } = await renderApp();
    api.state.offline = true;

    await user.click(screen.getByRole("button", { name: "Move to the trash: Inspect formwork" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Move to the trash: Inspect formwork" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /trash/i })).not.toBeInTheDocument();
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
