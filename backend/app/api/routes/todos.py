from fastapi import APIRouter, status

from app.api.dependencies import TodoRepositoryDep
from app.schemas.todo import Todo, TodoCreate

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=list[Todo])
def list_todos(repository: TodoRepositoryDep) -> list[Todo]:
    """Get all todos."""
    return repository.list_all()


@router.post("", response_model=Todo, status_code=status.HTTP_201_CREATED)
def create_todo(payload: TodoCreate, repository: TodoRepositoryDep) -> Todo:
    """Create a new todo."""
    return repository.add(payload)
