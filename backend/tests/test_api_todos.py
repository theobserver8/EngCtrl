from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from tests.conftest import read_file


class TestListTodos:
    def test_returns_all_todos_in_order(self, client: TestClient) -> None:
        response = client.get("/todos")

        assert response.status_code == 200
        assert [todo["id"] for todo in response.json()] == [1, 2]

    def test_returns_every_field(self, client: TestClient) -> None:
        todo = client.get("/todos").json()[1]

        assert todo == {
            "id": 2,
            "title": "Concrete test",
            "description": "Slab, level 2",
            "completed": True,
            "favorite": True,
            "trashed": False,
        }

    def test_missing_data_file_means_empty_list(self, tmp_path: Path) -> None:
        client = TestClient(create_app(Settings(data_file=tmp_path / "missing.json")))

        assert client.get("/todos").json() == []


class TestCreateTodo:
    def test_creates_with_defaults(self, client: TestClient, data_file: Path) -> None:
        response = client.post("/todos", json={"title": "Check rebar"})

        assert response.status_code == 201
        assert response.json() == {
            "id": 3,
            "title": "Check rebar",
            "description": None,
            "completed": False,
            "favorite": False,
            "trashed": False,
        }
        assert read_file(data_file)["todos"][-1]["title"] == "Check rebar"

    def test_trims_text_and_keeps_description(self, client: TestClient) -> None:
        response = client.post(
            "/todos",
            json={"title": "  Load test  ", "description": "  Beam V-12\nCheck deflection ", "favorite": True},
        )

        body = response.json()
        assert body["title"] == "Load test"
        assert body["description"] == "Beam V-12\nCheck deflection"
        assert body["favorite"] is True

    def test_blank_description_is_stored_as_null(self, client: TestClient) -> None:
        assert client.post("/todos", json={"title": "A", "description": "   "}).json()["description"] is None

    def test_accepts_accents(self, client: TestClient) -> None:
        assert client.post("/todos", json={"title": "Inspección de hormigón"}).json()["title"] == (
            "Inspección de hormigón"
        )

    @pytest.mark.parametrize(
        "payload",
        [
            {},
            {"title": ""},
            {"title": "   "},
            {"title": "x" * 121},
            {"title": "A", "description": "x" * 501},
            {"title": "A", "unknown": True},
            {"title": "A", "completed": "maybe"},
            {"title": "A", "trashed": True},
        ],
        ids=[
            "missing-title",
            "empty",
            "blank",
            "too-long",
            "description-too-long",
            "unknown-field",
            "bad-type",
            "created-in-trash",
        ],
    )
    def test_rejects_invalid_payloads(self, client: TestClient, payload: dict, data_file: Path) -> None:
        before = data_file.read_text(encoding="utf-8")

        assert client.post("/todos", json=payload).status_code == 422
        assert data_file.read_text(encoding="utf-8") == before


class TestUpdateTodo:
    def test_marks_as_completed(self, client: TestClient, data_file: Path) -> None:
        response = client.patch("/todos/1", json={"completed": True})

        assert response.status_code == 200
        assert response.json()["completed"] is True
        assert read_file(data_file)["todos"][0]["completed"] is True

    def test_only_sent_fields_change(self, client: TestClient) -> None:
        response = client.patch("/todos/2", json={"favorite": False})

        body = response.json()
        assert body["favorite"] is False
        assert body["completed"] is True
        assert body["description"] == "Slab, level 2"

    def test_moves_to_the_trash_and_back_keeping_the_other_fields(
        self, client: TestClient, data_file: Path
    ) -> None:
        trashed = client.patch("/todos/2", json={"trashed": True}).json()

        assert trashed["trashed"] is True
        assert (trashed["completed"], trashed["favorite"]) == (True, True)
        assert read_file(data_file)["todos"][1]["trashed"] is True

        restored = client.patch("/todos/2", json={"trashed": False}).json()

        assert restored == {**trashed, "trashed": False}

    def test_updates_title_and_description(self, client: TestClient) -> None:
        body = client.patch("/todos/1", json={"title": " Renamed ", "description": "Details"}).json()

        assert (body["title"], body["description"]) == ("Renamed", "Details")

    def test_null_description_clears_it(self, client: TestClient) -> None:
        assert client.patch("/todos/2", json={"description": None}).json()["description"] is None

    def test_unknown_todo_returns_404(self, client: TestClient) -> None:
        response = client.patch("/todos/999", json={"completed": True})

        assert response.status_code == 404
        assert response.json() == {"detail": "Todo 999 not found"}

    @pytest.mark.parametrize(
        "payload",
        [
            {},
            {"title": None},
            {"completed": None},
            {"favorite": None},
            {"trashed": None},
            {"title": " "},
            {"complete": True},
        ],
        ids=["empty", "null-title", "null-completed", "null-favorite", "null-trashed", "blank-title", "typo-field"],
    )
    def test_rejects_invalid_payloads(self, client: TestClient, payload: dict) -> None:
        assert client.patch("/todos/1", json=payload).status_code == 422

    @pytest.mark.parametrize("todo_id", ["0", "-1", "abc"])
    def test_rejects_invalid_ids(self, client: TestClient, todo_id: str) -> None:
        assert client.patch(f"/todos/{todo_id}", json={"completed": True}).status_code == 422


class TestDeleteTodo:
    def test_deletes_and_returns_204(self, client: TestClient, data_file: Path) -> None:
        response = client.delete("/todos/1")

        assert response.status_code == 204
        assert response.content == b""
        assert [todo["id"] for todo in read_file(data_file)["todos"]] == [2]

    def test_second_delete_returns_404(self, client: TestClient) -> None:
        client.delete("/todos/1")

        assert client.delete("/todos/1").status_code == 404

    def test_deleted_ids_are_never_reused(self, client: TestClient) -> None:
        client.delete("/todos/2")

        assert client.post("/todos", json={"title": "New"}).json()["id"] == 3

    def test_updating_a_deleted_todo_returns_404(self, client: TestClient) -> None:
        client.delete("/todos/1")

        assert client.patch("/todos/1", json={"completed": True}).status_code == 404


class TestDeleteTodos:
    def test_deletes_every_given_todo_in_one_request(self, client: TestClient, data_file: Path) -> None:
        client.post("/todos", json={"title": "Kept"})

        response = client.delete("/todos", params={"ids": [1, 2]})

        assert response.status_code == 204
        assert response.content == b""
        assert [todo["title"] for todo in read_file(data_file)["todos"]] == ["Kept"]

    def test_ignores_ids_already_deleted(self, client: TestClient, data_file: Path) -> None:
        client.delete("/todos/1")

        assert client.delete("/todos", params={"ids": [1, 2, 999]}).status_code == 204
        assert read_file(data_file)["todos"] == []

    def test_deleted_ids_are_never_reused(self, client: TestClient) -> None:
        client.delete("/todos", params={"ids": [1, 2]})

        assert client.post("/todos", json={"title": "New"}).json()["id"] == 3

    @pytest.mark.parametrize(
        "query",
        ["", "?ids=", "?ids=0", "?ids=1&ids=-1", "?ids=abc", "?" + "&".join(["ids=1"] * 1001)],
        ids=["missing", "empty", "zero", "negative", "not-a-number", "too-many"],
    )
    def test_rejects_invalid_ids(self, client: TestClient, query: str, data_file: Path) -> None:
        before = data_file.read_text(encoding="utf-8")

        assert client.delete(f"/todos{query}").status_code == 422
        assert data_file.read_text(encoding="utf-8") == before


class TestErrorsAndCors:
    def test_corrupt_storage_returns_500_with_clear_message(self, write_data) -> None:
        client = TestClient(create_app(Settings(data_file=write_data("{not json"))))

        response = client.get("/todos")

        assert response.status_code == 500
        assert response.json() == {"detail": "Could not read todos from custom.json"}

    def test_cors_preflight_allows_the_frontend(self, client: TestClient) -> None:
        response = client.options(
            "/todos/1",
            headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "DELETE"},
        )

        assert response.status_code == 200
        assert "DELETE" in response.headers["access-control-allow-methods"]

    def test_cors_origins_are_configurable(self, data_file: Path) -> None:
        settings = Settings(data_file=data_file, cors_origins=("http://allowed.test",))
        client = TestClient(create_app(settings))

        allowed = client.get("/todos", headers={"Origin": "http://allowed.test"})
        other = client.get("/todos", headers={"Origin": "http://other.test"})

        assert allowed.headers.get("access-control-allow-origin") == "http://allowed.test"
        assert "access-control-allow-origin" not in other.headers
