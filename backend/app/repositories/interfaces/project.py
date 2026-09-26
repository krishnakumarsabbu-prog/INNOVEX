from abc import abstractmethod
from typing import Any

from app.repositories.interfaces.base import BaseRepository


class ProjectRepositoryInterface(BaseRepository):
    @abstractmethod
    def get_by_innovation(self, innovation_id: str) -> list[Any]: ...

    @abstractmethod
    def get_by_team(self, team_id: str) -> list[Any]: ...

    @abstractmethod
    def count(self) -> int: ...

    @abstractmethod
    def count_by_status(self, status: str) -> int: ...


