from typing import Annotated

from fastapi import APIRouter, Path, status

from app.api.dependencies import TodoRepositoryDep
from app.schemas.todo import Todo, TodoCreate, TodoUpdate

router = APIRouter(prefix="/todos", tags=["todos"])

TodoId = Annotated[int, Path(ge=1, description="Todo identifier")]

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
