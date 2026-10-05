from abc import ABC, abstractmethod
from collections.abc import Collection

from app.schemas.todo import Todo, TodoCreate, TodoUpdate


class TodoRepository(ABC):
    """Persistence contract for todos. Routes depend on this, never on a concrete storage."""

    @abstractmethod
    def list_all(self) -> list[Todo]:
        """Return every todo, in insertion order."""

    @abstractmethod
    def add(self, data: TodoCreate) -> Todo:
        """Persist a new todo and return it with its assigned id."""

    @abstractmethod
    def update(self, todo_id: int, data: TodoUpdate) -> Todo:
        """Apply a partial update and return the updated todo.

        Raises:
            TodoNotFoundError: if no todo has the given id.
        """

    @abstractmethod
    def delete(self, todo_id: int) -> None:
        """Remove a todo. Ids of deleted todos are never reused.

        Raises:
            TodoNotFoundError: if no todo has the given id.
        """

    @abstractmethod
    def delete_many(self, todo_ids: Collection[int]) -> None:
        """Remove several todos in a single operation (all or none are written).

        Ids with no todo are ignored: deleting is idempotent, so a todo already deleted
        elsewhere does not make the whole operation fail.
        """
