import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../../i18n/I18nProvider";
import TodoForm from "./TodoForm";

function renderForm(result = true) {
  const onSubmit = vi.fn(async () => result);
  render(
    <I18nProvider initialLocale="en">
      <TodoForm onSubmit={onSubmit} />
    </I18nProvider>,
  );
  return { onSubmit, user: userEvent.setup() };
}

describe("TodoForm", () => {
  it("submits the title with Enter and resets", async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText("New task"), "Inspect formwork{Enter}");

    expect(onSubmit).toHaveBeenCalledWith({ title: "Inspect formwork", description: "" });
    expect(screen.getByLabelText("New task")).toHaveValue("");
  });

  it("keeps the text when the creation fails", async () => {
    const { user } = renderForm(false);

    await user.type(screen.getByLabelText("New task"), "Inspect formwork{Enter}");

    expect(screen.getByLabelText("New task")).toHaveValue("Inspect formwork");
  });

  it("opens the description, focuses it and submits with Ctrl+Enter", async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText("New task"), "Load test");
    await user.click(screen.getByRole("button", { name: "Add description" }));
    expect(screen.getByLabelText("Description")).toHaveFocus();

    await user.keyboard("Line one{Enter}Line two");
    expect(onSubmit).not.toHaveBeenCalled(); // plain Enter adds a new line
    expect(screen.getByText("17/500")).toBeInTheDocument();

    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(onSubmit).toHaveBeenCalledWith({ title: "Load test", description: "Line one\nLine two" });
  });

  it("does not send a description that was removed", async () => {
    const { onSubmit, user } = renderForm();

    await user.click(screen.getByRole("button", { name: "Add description" }));
    await user.type(screen.getByLabelText("Description"), "Draft");
    await user.click(screen.getByRole("button", { name: "Remove description" }));
    await user.type(screen.getByLabelText("New task"), "Title{Enter}");

    expect(onSubmit).toHaveBeenCalledWith({ title: "Title", description: "" });
  });

  it("disables the submit button for blank titles", async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText("New task"), "   ");

    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
