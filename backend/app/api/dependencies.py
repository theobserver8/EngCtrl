from typing import Annotated

from fastapi import Depends, Request

from app.repositories.base import TodoRepository


def get_todo_repository(request: Request) -> TodoRepository:
    """Return the repository created at startup (overridable in tests)."""
    return request.app.state.todo_repository


TodoRepositoryDep = Annotated[TodoRepository, Depends(get_todo_repository)]
