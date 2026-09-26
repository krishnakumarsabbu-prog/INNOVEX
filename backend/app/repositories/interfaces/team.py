from abc import abstractmethod
from typing import Any

from app.repositories.interfaces.base import BaseRepository


class TeamRepositoryInterface(BaseRepository):
    @abstractmethod
    def get_by_innovation(self, innovation_id: str) -> list[Any]: ...

    @abstractmethod
    def get_by_project(self, project_id: str) -> Any | None: ...

    @abstractmethod
    def count(self) -> int: ...


