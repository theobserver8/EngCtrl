import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATA_FILE = Path(__file__).parent / "todos.json"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Todo(BaseModel):
    title: str
    completed: bool = False


def load_todos() -> list[Todo]:
    """Load todos from the JSON file."""
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return [Todo(**todo) for todo in json.load(f)]


def save_todos(todos: list[Todo]):
    """
    Save todos to the JSON file.

    Args:
        todos (list[Todo]): List of Todo objects to save.
    """
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump([todo.model_dump() for todo in todos], f, indent=2)


@app.get("/todos", response_model=list[Todo])
def get_todos():
    """Get all todos."""
    return load_todos()


@app.post("/todos", response_model=Todo)
def add_todo(todo: Todo):
    """
    Add a new todo.

    Args:
        todo (Todo): The todo to add.
    """
    todos = load_todos()
    todos.append(todo)
    save_todos(todos)
    return todo
