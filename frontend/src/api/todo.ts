import type { Todo } from "../types/todo";

const BASE_URL = "http://localhost:8000/todos";

export const getTodos = async (): Promise<Todo[]> => {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Error fetching todos");
  return res.json();
};

export const createTodo = async (title: string): Promise<void> => {
  await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, completed: false }),
  });
};

export const toggleTodoStatus = async (
  id: number,
  currentStatus: boolean
): Promise<Todo> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ completed: !currentStatus }),
  });
  if (!res.ok) throw new Error("Error toggling todo status");
  return res.json();
};
