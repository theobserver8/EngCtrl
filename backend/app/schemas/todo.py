from typing import Annotated, Any, Self

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    StringConstraints,
    field_validator,
    model_validator,
)

TITLE_MAX_LENGTH = 120
DESCRIPTION_MAX_LENGTH = 500


def _blank_to_none(value: str | None) -> str | None:
    """A blank description is stored as null, so there is a single way to say "no description"."""
    return value or None


Title = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=TITLE_MAX_LENGTH)
]
Description = Annotated[
    Annotated[str, StringConstraints(strip_whitespace=True, max_length=DESCRIPTION_MAX_LENGTH)]
    | None,
    AfterValidator(_blank_to_none),
]


class TodoBase(BaseModel):
    title: Title
    description: Description = None
    completed: bool = False
    favorite: bool = False


class TodoCreate(TodoBase):
    """Payload to create a todo. The id is assigned by the repository."""

    model_config = ConfigDict(extra="forbid")


class TodoUpdate(BaseModel):
    """Partial update: only the fields sent by the client are changed.

    ``description`` accepts null (or a blank string) to clear it; the other fields cannot be null.
    """

    model_config = ConfigDict(extra="forbid")

    title: Title | None = None
    description: Description = None
    completed: bool | None = None
    favorite: bool | None = None

    @field_validator("title", "completed", "favorite")
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
