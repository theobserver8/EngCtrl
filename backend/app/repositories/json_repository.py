import json
import os
import tempfile
import threading
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from app.core.exceptions import StorageError, TodoNotFoundError
from app.repositories.base import TodoRepository
from app.schemas.todo import Todo, TodoCreate, TodoUpdate


class JsonTodoRepository(TodoRepository):
    """Stores todos in a JSON file.

    Sync FastAPI endpoints run in a thread pool, so every read-modify-write cycle is
    serialized with a lock, and files are written atomically to avoid corrupting the
    data if the process stops halfway through a write.
    """

    def __init__(self, path: Path) -> None:
        self._path = path
        self._lock = threading.RLock()

    def list_all(self) -> list[Todo]:
        with self._lock:
            return self._load()

    def add(self, data: TodoCreate) -> Todo:
        with self._lock:
            todos = self._load()
            todo = Todo(id=self._next_id(todos), **data.model_dump())
            todos.append(todo)
            self._save(todos)
            return todo

    def update(self, todo_id: int, data: TodoUpdate) -> Todo:
        with self._lock:
            todos = self._load()
            index = self._index_of(todos, todo_id)
            updated = todos[index].model_copy(update=data.changes())
            todos[index] = updated
            self._save(todos)
            return updated

    @staticmethod
    def _index_of(todos: list[Todo], todo_id: int) -> int:
        for index, todo in enumerate(todos):
            if todo.id == todo_id:
                return index
        raise TodoNotFoundError(todo_id)

    @staticmethod
    def _next_id(todos: list[Todo]) -> int:
        return max((todo.id for todo in todos), default=0) + 1

    def _load(self) -> list[Todo]:
        if not self._path.exists():
            return []
        try:
            raw = json.loads(self._path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise StorageError(f"Could not read todos from {self._path.name}") from exc
        if not isinstance(raw, list) or not all(isinstance(item, dict) for item in raw):
            raise StorageError(f"Unexpected data format in {self._path.name}")

        todos, migrated = self._normalize(raw)
        if migrated:
            self._save(todos)
        return todos

    def _normalize(self, raw: list[dict[str, Any]]) -> tuple[list[Todo], bool]:
        """Validate stored records, assigning ids to legacy records that have none.

        Returns the todos and whether any record had to be migrated.
        """
        next_id = max((item["id"] for item in raw if "id" in item), default=0) + 1
        todos: list[Todo] = []
        migrated = False
        for item in raw:
            if "id" not in item:
                item = {**item, "id": next_id}
                next_id += 1
                migrated = True
            try:
                todos.append(Todo.model_validate(item))
            except ValidationError as exc:
                raise StorageError(f"Invalid todo record in {self._path.name}") from exc
        return todos, migrated

    def _save(self, todos: list[Todo]) -> None:
        payload = json.dumps([todo.model_dump() for todo in todos], indent=2, ensure_ascii=False)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp_name = tempfile.mkstemp(dir=self._path.parent, suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as tmp:
                tmp.write(payload + "\n")
            os.replace(tmp_name, self._path)
        except OSError as exc:
            Path(tmp_name).unlink(missing_ok=True)
            raise StorageError(f"Could not write todos to {self._path.name}") from exc
