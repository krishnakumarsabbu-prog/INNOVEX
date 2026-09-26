from abc import abstractmethod
from typing import Any

from app.repositories.interfaces.base import BaseRepository


class InnovationRepositoryInterface(BaseRepository):
    @abstractmethod
    def get_open(self) -> list[Any]: ...

    @abstractmethod
    def get_by_idea(self, idea_id: str) -> Any | None: ...

    @abstractmethod
    def count_by_stage(self, stage: str) -> int: ...


