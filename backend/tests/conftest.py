import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.repositories.json_repository import JsonTodoRepository

SEED_TODOS = [
    {
        "id": 1,
        "title": "Inspect formwork",
        "description": None,
        "completed": False,
        "favorite": False,
        "trashed": False,
    },
    {
        "id": 2,
        "title": "Concrete test",
        "description": "Slab, level 2",
        "completed": True,
        "favorite": True,
        "trashed": False,
    },
]


@pytest.fixture
def data_file(tmp_path: Path) -> Path:
    """An isolated data file per test, seeded with two todos."""
    path = tmp_path / "todos.json"
    path.write_text(json.dumps({"next_id": 3, "todos": SEED_TODOS}), encoding="utf-8")
    return path


@pytest.fixture
def write_data(tmp_path: Path) -> Callable[[Any], Path]:
    """Writes arbitrary content (e.g. legacy or corrupt data) to an isolated file."""

    def write(content: Any) -> Path:
        path = tmp_path / "custom.json"
        text = content if isinstance(content, str) else json.dumps(content)
        path.write_text(text, encoding="utf-8")
        return path

    return write


@pytest.fixture
def repository(data_file: Path) -> JsonTodoRepository:
    return JsonTodoRepository(data_file)


@pytest.fixture
def client(data_file: Path) -> TestClient:
    return TestClient(create_app(Settings(data_file=data_file)))


def read_file(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))
