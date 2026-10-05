from typing import Annotated

from fastapi import APIRouter, Path, Query, Response, status
from pydantic import Field

from app.api.dependencies import TodoRepositoryDep
from app.schemas.todo import Todo, TodoCreate, TodoUpdate

router = APIRouter(prefix="/todos", tags=["todos"])

TodoId = Annotated[int, Path(ge=1, description="Todo identifier")]
MAX_BULK_DELETE = 1000
TodoIds = Annotated[
    list[Annotated[int, Field(ge=1)]],
    Query(min_length=1, max_length=MAX_BULK_DELETE, description="Identifiers of the todos to delete"),
]

NOT_FOUND_RESPONSE = {status.HTTP_404_NOT_FOUND: {"description": "Todo not found"}}


@router.get("", response_model=list[Todo])
def list_todos(repository: TodoRepositoryDep) -> list[Todo]:
    """Get all todos."""
    return repository.list_all()


@router.post("", response_model=Todo, status_code=status.HTTP_201_CREATED)
def create_todo(payload: TodoCreate, repository: TodoRepositoryDep) -> Todo:
    """Create a new todo."""
    return repository.add(payload)


@router.patch("/{todo_id}", response_model=Todo, responses=NOT_FOUND_RESPONSE)
def update_todo(todo_id: TodoId, payload: TodoUpdate, repository: TodoRepositoryDep) -> Todo:
    """Partially update a todo (e.g. mark it as completed)."""
    return repository.update(todo_id, payload)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_todos(ids: TodoIds, repository: TodoRepositoryDep) -> Response:
    """Delete several todos in one request (e.g. emptying the trash): `?ids=1&ids=2`.

    Ids with no todo are ignored, so retrying or racing another client never fails.
    """
    repository.delete_many(set(ids))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/{todo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    responses=NOT_FOUND_RESPONSE,
)
def delete_todo(todo_id: TodoId, repository: TodoRepositoryDep) -> Response:
    """Delete a todo."""
    repository.delete(todo_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
