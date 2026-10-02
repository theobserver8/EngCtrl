import json
import os
import tempfile
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from app.core.exceptions import StorageError, TodoNotFoundError
from app.repositories.base import TodoRepository
from app.schemas.todo import Todo, TodoCreate, TodoUpdate


@dataclass
class _Store:
    """In-memory view of the data file."""

    todos: list[Todo]
    # Persisted counter so ids are never reused after a delete: a stale client acting on
    # a deleted id gets a 404 instead of silently modifying a newer todo.
    next_id: int


class JsonTodoRepository(TodoRepository):
    """Stores todos in a JSON file: ``{"next_id": int, "todos": [...]}``.

    Sync FastAPI endpoints run in a thread pool, so every read-modify-write cycle is
    serialized with a lock, and files are written atomically to avoid corrupting the
    data if the process stops halfway through a write. Legacy files (a plain list of
    todos, records without ids or newer fields) are migrated on first read.
    """

    def __init__(self, path: Path) -> None:
        self._path = path
        self._lock = threading.RLock()

    def list_all(self) -> list[Todo]:
        with self._lock:
            return self._load().todos

    def add(self, data: TodoCreate) -> Todo:
        with self._lock:
            store = self._load()
            todo = Todo(id=store.next_id, **data.model_dump())
            store.todos.append(todo)
            store.next_id += 1
            self._save(store)
            return todo

    def update(self, todo_id: int, data: TodoUpdate) -> Todo:
        with self._lock:
            store = self._load()
            index = self._index_of(store.todos, todo_id)
            updated = store.todos[index].model_copy(update=data.changes())
            store.todos[index] = updated
            self._save(store)
            return updated

    def delete(self, todo_id: int) -> None:
        with self._lock:
            store = self._load()
            del store.todos[self._index_of(store.todos, todo_id)]
            self._save(store)

    @staticmethod
    def _index_of(todos: list[Todo], todo_id: int) -> int:
        for index, todo in enumerate(todos):
            if todo.id == todo_id:
                return index
        raise TodoNotFoundError(todo_id)

    def _load(self) -> _Store:
        if not self._path.exists():
            return _Store(todos=[], next_id=1)
        try:
            raw = json.loads(self._path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise StorageError(f"Could not read todos from {self._path.name}") from exc

        store, migrated = self._parse(raw)
        if migrated:
            self._save(store)
        return store

    def _parse(self, raw: Any) -> tuple[_Store, bool]:
        """Validate the file content. Returns the store and whether it had to be migrated."""
        if isinstance(raw, list):  # Legacy format: a plain list of todos.
            records, stored_next_id, migrated = raw, None, True
        elif isinstance(raw, dict) and isinstance(raw.get("todos"), list):
            records, stored_next_id, migrated = raw["todos"], raw.get("next_id"), False
        else:
            raise StorageError(f"Unexpected data format in {self._path.name}")
        if not all(isinstance(item, dict) for item in records):
            raise StorageError(f"Unexpected data format in {self._path.name}")

        # Validate the records that already have an id first: Pydantic coerces hand-edited
        # values such as "7" or 7.0, and the counter must be computed from the real ids.
        validated = [self._validate(item) if "id" in item else None for item in records]
        known_ids = [todo.id for todo in validated if todo is not None]
        duplicates = sorted({todo_id for todo_id in known_ids if known_ids.count(todo_id) > 1})
        if duplicates:
            raise StorageError(f"Duplicate todo id {duplicates[0]} in {self._path.name}")

        # The counter can never be lower than the highest existing id (e.g. if edited by
        # hand); a missing or inconsistent counter is repaired and saved.
        next_id = max(known_ids, default=0) + 1
        if isinstance(stored_next_id, int) and stored_next_id > next_id:
            next_id = stored_next_id
        elif stored_next_id != next_id:
            migrated = True

        todos: list[Todo] = []
        for item, todo in zip(records, validated):
            if todo is None:  # Legacy record without id: give it the next free one.
                item = {**item, "id": next_id}
                todo = self._validate(item)
                next_id += 1
                migrated = True
            # Records written by older versions (e.g. without description/favorite) or edited
            # by hand are rewritten in their normalized form.
            migrated = migrated or item != todo.model_dump()
            todos.append(todo)
        return _Store(todos=todos, next_id=next_id), migrated

    def _validate(self, item: dict[str, Any]) -> Todo:
        try:
            return Todo.model_validate(item)
        except ValidationError as exc:
            raise StorageError(f"Invalid todo record in {self._path.name}") from exc

    def _save(self, store: _Store) -> None:
        document = {
            "next_id": store.next_id,
            "todos": [todo.model_dump() for todo in store.todos],
        }
        payload = json.dumps(document, indent=2, ensure_ascii=False)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        fd, tmp_name = tempfile.mkstemp(dir=self._path.parent, suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as tmp:
                tmp.write(payload + "\n")
            os.replace(tmp_name, self._path)
        except OSError as exc:
            Path(tmp_name).unlink(missing_ok=True)
            raise StorageError(f"Could not write todos to {self._path.name}") from exc
