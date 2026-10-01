// Mirrors the backend schemas in backend/app/schemas/todo.py.

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

export type TodoCreate = Pick<Todo, "title"> & Partial<Pick<Todo, "completed">>;

export type TodoUpdate = Partial<Omit<Todo, "id">>;
