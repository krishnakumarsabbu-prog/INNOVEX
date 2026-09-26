from abc import abstractmethod
from typing import Any

from app.repositories.interfaces.base import BaseRepository


class ActivityRepositoryInterface(BaseRepository):
    @abstractmethod
    def get_by_entity(self, entity_type: str, entity_id: str) -> list[Any]: ...

    @abstractmethod
    def count(self) -> int: ...


class NotificationRepositoryInterface(BaseRepository):
    @abstractmethod
    def get_by_user(self, user_id: str) -> list[Any]: ...

    @abstractmethod
    def get_unread_count(self, user_id: str) -> int: ...

    @abstractmethod
    def mark_as_read(self, notif_id: str) -> bool: ...

    @abstractmethod
    def mark_all_read(self, user_id: str) -> bool: ...


