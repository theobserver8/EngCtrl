from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import todos
from app.core.config import Settings, get_settings
from app.core.exceptions import register_exception_handlers
from app.repositories.json_repository import JsonTodoRepository


def create_app(settings: Settings | None = None) -> FastAPI:
    """Application factory: wires settings, storage, middleware and routes."""
    settings = settings or get_settings()

    app = FastAPI(title=settings.app_name, version="1.0.0")
    app.state.todo_repository = JsonTodoRepository(settings.data_file)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)
    app.include_router(todos.router)

    return app


app = create_app()
