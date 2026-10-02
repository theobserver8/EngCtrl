from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class StorageError(Exception):
    """Raised when the persistence layer cannot read or write the data."""


class TodoNotFoundError(Exception):
    """Raised when a todo with the requested id does not exist."""

    def __init__(self, todo_id: int) -> None:
        super().__init__(f"Todo {todo_id} not found")
        self.todo_id = todo_id


def register_exception_handlers(app: FastAPI) -> None:
    """Translate domain exceptions into HTTP responses."""

    @app.exception_handler(TodoNotFoundError)
    async def not_found_handler(_: Request, exc: TodoNotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": str(exc)},
        )

    @app.exception_handler(StorageError)
    async def storage_error_handler(_: Request, exc: StorageError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc)},
        )
