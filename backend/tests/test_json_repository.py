import threading
from pathlib import Path

import pytest

from app.core.exceptions import StorageError, TodoNotFoundError
from app.repositories.json_repository import JsonTodoRepository
from app.schemas.todo import TodoCreate, TodoUpdate
from tests.conftest import read_file


class TestCrud:
    def test_add_assigns_incremental_ids(self, repository: JsonTodoRepository) -> None:
        first = repository.add(TodoCreate(title="A"))
        second = repository.add(TodoCreate(title="B"))

        assert (first.id, second.id) == (3, 4)

    def test_update_applies_only_given_fields(self, repository: JsonTodoRepository) -> None:
        updated = repository.update(2, TodoUpdate(completed=False))

        assert updated.completed is False
        assert updated.favorite is True

    def test_update_unknown_raises(self, repository: JsonTodoRepository) -> None:
        with pytest.raises(TodoNotFoundError):
            repository.update(99, TodoUpdate(completed=True))

    def test_delete_unknown_raises_and_keeps_file(self, repository: JsonTodoRepository, data_file: Path) -> None:
        before = data_file.read_text(encoding="utf-8")

        with pytest.raises(TodoNotFoundError):
            repository.delete(99)
        assert data_file.read_text(encoding="utf-8") == before

    def test_ids_are_not_reused_after_deleting_the_last_one(self, repository: JsonTodoRepository) -> None:
        repository.delete(2)

        assert repository.add(TodoCreate(title="C")).id == 3


class TestMigrations:
    def test_legacy_list_without_ids_is_migrated(self, write_data) -> None:
        path = write_data([{"title": "A", "completed": True}, {"title": "B"}])

        todos = JsonTodoRepository(path).list_all()

        assert [(todo.id, todo.title) for todo in todos] == [(1, "A"), (2, "B")]
        stored = read_file(path)
        assert stored["next_id"] == 3
        assert stored["todos"][0] == {
            "title": "A",
            "description": None,
            "completed": True,
            "favorite": False,
            "trashed": False,
            "id": 1,
        }

    def test_missing_ids_continue_from_the_counter(self, write_data) -> None:
        path = write_data({"next_id": 10, "todos": [{"title": "A", "id": 2}, {"title": "B"}]})

        assert [todo.id for todo in JsonTodoRepository(path).list_all()] == [2, 10]
        assert read_file(path)["next_id"] == 11

    def test_counter_lower_than_highest_id_is_repaired(self, write_data) -> None:
        path = write_data({"next_id": 1, "todos": [{"title": "A", "id": 5}]})

        assert JsonTodoRepository(path).add(TodoCreate(title="B")).id == 6

    @pytest.mark.parametrize("stored_id", ["7", 7.0], ids=["string", "float"])
    def test_hand_edited_ids_count_for_the_counter(self, write_data, stored_id) -> None:
        # Pydantic coerces "7" and 7.0 to 7: the counter must not hand out 7 again.
        path = write_data({"next_id": 1, "todos": [{"title": "A", "id": stored_id}]})
        repository = JsonTodoRepository(path)

        new_ids = [repository.add(TodoCreate(title=f"T{i}")).id for i in range(7)]

        assert new_ids == [8, 9, 10, 11, 12, 13, 14]
        assert read_file(path)["todos"][0]["id"] == 7

    def test_current_format_is_not_rewritten(self, data_file: Path) -> None:
        JsonTodoRepository(data_file).list_all()
        before = data_file.read_text(encoding="utf-8")

        JsonTodoRepository(data_file).list_all()

        assert data_file.read_text(encoding="utf-8") == before


class TestStorageErrors:
    @pytest.mark.parametrize(
        "content",
        ["{not json", {}, {"todos": "x"}, {"todos": [1]}, [{"title": "A", "id": "abc"}], [{"title": ""}]],
        ids=["invalid-json", "empty-object", "todos-not-list", "record-not-object", "bad-id", "invalid-record"],
    )
    def test_invalid_files_raise_storage_error(self, write_data, content) -> None:
        with pytest.raises(StorageError):
            JsonTodoRepository(write_data(content)).list_all()

    @pytest.mark.parametrize(
        "records",
        [
            [{"title": "A", "id": 3}, {"title": "B", "id": 3}],
            [{"title": "A", "id": 3}, {"title": "B", "id": "3"}],
        ],
        ids=["same-int", "int-and-string"],
    )
    def test_duplicate_ids_raise_storage_error(self, write_data, records) -> None:
        with pytest.raises(StorageError, match="Duplicate todo id 3"):
            JsonTodoRepository(write_data({"next_id": 4, "todos": records})).list_all()


class TestConcurrency:
    def test_parallel_adds_and_deletes_lose_nothing(self, write_data) -> None:
        path = write_data({"next_id": 1, "todos": []})
        repository = JsonTodoRepository(path)
        for index in range(20):
            repository.add(TodoCreate(title=f"seed {index}"))

        threads = [threading.Thread(target=repository.delete, args=(todo_id,)) for todo_id in range(1, 11)]
        threads += [threading.Thread(target=repository.add, args=(TodoCreate(title=f"new {i}"),)) for i in range(10)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join()

        ids = [todo.id for todo in repository.list_all()]
        assert len(ids) == 20
        assert len(set(ids)) == 20
        assert min(ids) == 11
        assert read_file(path)["next_id"] == 31
        assert not list(path.parent.glob("*.tmp"))
