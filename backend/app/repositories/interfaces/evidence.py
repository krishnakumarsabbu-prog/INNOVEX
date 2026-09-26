from abc import abstractmethod
from typing import Any

from app.repositories.interfaces.base import BaseRepository


class EvidenceRepositoryInterface(BaseRepository):
    @abstractmethod
    def get_by_project(self, project_id: str) -> list[Any]: ...

    @abstractmethod
    def count(self) -> int: ...


class WorkItemRepositoryInterface(BaseRepository):
    @abstractmethod
    def get_by_project(self, project_id: str) -> list[Any]: ...

    @abstractmethod
    def get_by_milestone(self, milestone_id: str) -> list[Any]: ...

    @abstractmethod
    def get_by_assignee(self, assignee_id: str) -> list[Any]: ...

    @abstractmethod
    def count_by_status(self, status: str) -> int: ...


