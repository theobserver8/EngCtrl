from typing import Annotated, Any, Self

from pydantic import BaseModel, ConfigDict, StringConstraints, field_validator, model_validator

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]


class TodoBase(BaseModel):
    title: Title
    completed: bool = False


class TodoCreate(TodoBase):
    """Payload to create a todo. The id is assigned by the repository."""

    model_config = ConfigDict(extra="forbid")


class TodoUpdate(BaseModel):
    """Partial update: only the fields sent by the client are changed."""

    model_config = ConfigDict(extra="forbid")

    title: Title | None = None
    completed: bool | None = None

    @field_validator("title", "completed")
    @classmethod
    def reject_explicit_null(cls, value: Any) -> Any:
        # Omitting a field means "keep it"; sending null for a required field is an error.
        if value is None:
            raise ValueError("field cannot be null")
        return value

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> Self:
        if not self.model_fields_set:
            raise ValueError("at least one field must be provided")
        return self

    def changes(self) -> dict[str, Any]:
        """Fields explicitly sent by the client."""
        return self.model_dump(exclude_unset=True)


class Todo(TodoBase):
    """A persisted todo."""

    id: int
