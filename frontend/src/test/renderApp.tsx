import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import App from "../App";
import type { Locale } from "../i18n/config";
import { I18nProvider } from "../i18n/I18nProvider";
import type { Todo } from "../types/todo";
import { createFakeApi, SEED_TODOS } from "./fakeApi";

interface RenderAppOptions {
  locale?: Locale;
  todos?: Todo[];
  /** Start with the server unreachable (the first load fails). */
  offline?: boolean;
}

/** Renders the whole app against an in-memory API and waits for the first load. */
export async function renderApp({
  locale = "en",
  todos = SEED_TODOS,
  offline = false,
}: RenderAppOptions = {}) {
  const api = createFakeApi(todos);
  api.state.offline = offline;
  vi.stubGlobal("fetch", api.fetch);
  const user = userEvent.setup();

  render(
    <I18nProvider initialLocale={locale}>
      <App />
    </I18nProvider>,
  );
  if (!offline && todos.length > 0) await screen.findByText(todos[0].title);

  return { api, user };
}

/** The list item of a task, found by its title. */
export function getRow(title: string): HTMLElement {
  const row = screen.getByText(title).closest("li");
  if (!row) throw new Error(`No row for "${title}"`);
  return row;
}

/** Titles of the rows inside the section whose heading starts with `heading`. */
export function sectionTitles(heading: RegExp): string[] {
  const section = screen.getByRole("heading", { name: heading }).closest("section");
  if (!section) throw new Error(`No section ${heading}`);
  return within(section)
    .queryAllByRole("listitem")
    .map((item) => item.querySelector("[id]")?.textContent ?? "");
}
