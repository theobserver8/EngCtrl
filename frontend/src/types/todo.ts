// Mirrors the backend schemas in backend/app/schemas/todo.py.

export const TODO_LIMITS = {
  titleMaxLength: 120,
  descriptionMaxLength: 500,
} as const;

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  favorite: boolean;
  /** In the trash: still listed, pending a permanent delete. Never set when creating. */
  trashed: boolean;
}

export type TodoCreate = Pick<Todo, "title"> &
  Partial<Pick<Todo, "description" | "completed" | "favorite">>;

export type TodoUpdate = Partial<Omit<Todo, "id">>;

/** Raw values typed in the creation form. */
export interface TodoDraft {
  title: string;
  description: string;
}
