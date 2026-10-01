from typing import Annotated

from pydantic import BaseModel, StringConstraints

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]


class TodoBase(BaseModel):
    title: Title
    completed: bool = False


class TodoCreate(TodoBase):
    """Payload to create a todo. The id is assigned by the repository."""


class Todo(TodoBase):
    """A persisted todo."""

    id: int
