import json
from abc import ABC, abstractmethod
from typing import Any

from app.domain.models.entities import (
    Activity,
    Evidence,
    Idea,
    Innovation,
    Milestone,
    Notification,
    Organization,
    Position,
    PositionApplication,
    Project,
    Review,
    Team,
    User,
    ValidationSprint,
)


class BaseRepository(ABC):
    @abstractmethod
    def create(self, entity: Any) -> Any: ...

    @abstractmethod
    def get_by_id(self, entity_id: str) -> Any | None: ...

    @abstractmethod
    def get_all(self) -> list[Any]: ...

    @abstractmethod
    def update(self, entity_id: str, **kwargs) -> Any | None: ...

    @abstractmethod
    def delete(self, entity_id: str) -> bool: ...


