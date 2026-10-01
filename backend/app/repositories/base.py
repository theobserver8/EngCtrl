from abc import ABC, abstractmethod

from app.schemas.todo import Todo, TodoCreate


class TodoRepository(ABC):
    """Persistence contract for todos. Routes depend on this, never on a concrete storage."""

    @abstractmethod
    def list_all(self) -> list[Todo]:
        """Return every todo, in insertion order."""

    @abstractmethod
    def add(self, data: TodoCreate) -> Todo:
        """Persist a new todo and return it with its assigned id."""
