from abc import abstractmethod
from typing import Any

from app.repositories.interfaces.base import BaseRepository


class ReviewRepositoryInterface(BaseRepository):
    @abstractmethod
    def get_by_idea(self, idea_id: str) -> list[Any]: ...

    @abstractmethod
    def get_by_reviewer(self, reviewer_id: str) -> list[Any]: ...


