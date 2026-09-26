from abc import abstractmethod
from typing import Any

from app.repositories.interfaces.base import BaseRepository


class AuditRepositoryInterface(BaseRepository):
    """Audit records are append-only: update and delete are not permitted."""

    def update(self, entity_id: str, **kwargs) -> Any | None:
        raise NotImplementedError("Audit events are append-only")

    def delete(self, entity_id: str) -> bool:
        raise NotImplementedError("Audit events are append-only")

    @abstractmethod
    def get_by_entity(self, entity_type: str, entity_id: str) -> list[Any]: ...

    @abstractmethod
    def count(self) -> int: ...
