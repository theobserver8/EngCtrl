import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getRow, renderApp, sectionTitles } from "./test/renderApp";

const GUARD_MS = 450; // the delete confirmation ignores activations for 400 ms
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("loading (task 3)", () => {
  it("loads the tasks automatically when the page opens", async () => {
    const { api } = await renderApp();

    expect(api.calls[0]).toEqual({ method: "GET", path: "/todos", body: undefined });
    expect(screen.queryByRole("button", { name: /load tasks/i })).not.toBeInTheDocument();
  });

  it("shows favourites in their own section, without duplicates (task 4)", async () => {
    await renderApp();

    expect(sectionTitles(/favourites/i)).toEqual(["Check rebar"]);
    expect(sectionTitles(/^tasks/i)).toEqual(["Inspect formwork", "Concrete test"]);
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
    expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();

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

describe("favourites (task 4)", () => {
  it("moves a task to the favourites section and back", async () => {
    const { api, user } = await renderApp();

    await user.click(screen.getByRole("button", { name: "Mark as favourite: Inspect formwork" }));

    await waitFor(() => expect(sectionTitles(/favourites/i)).toEqual(["Inspect formwork", "Check rebar"]));
    expect(api.mutations("PATCH")[0].body).toEqual({ favorite: true });
    expect(screen.getByRole("button", { name: "Remove from favourites: Inspect formwork" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Remove from favourites: Inspect formwork" }));

    await waitFor(() => expect(sectionTitles(/favourites/i)).toEqual(["Check rebar"]));
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
    expect(sectionTitles(/^tasks/i)).toEqual(["Inspect formwork", "Concrete test"]);
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
