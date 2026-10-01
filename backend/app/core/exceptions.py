from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class StorageError(Exception):
    """Raised when the persistence layer cannot read or write the data."""


def register_exception_handlers(app: FastAPI) -> None:
    """Translate domain exceptions into HTTP responses."""

    @app.exception_handler(StorageError)
    async def storage_error_handler(_: Request, exc: StorageError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc)},
        )
