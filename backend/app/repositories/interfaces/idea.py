from abc import abstractmethod
from typing import Any

from app.repositories.interfaces.base import BaseRepository


class IdeaRepositoryInterface(BaseRepository):
    @abstractmethod
    def get_by_founder(self, founder_id: str) -> list[Any]: ...

    @abstractmethod
    def get_by_status(self, status: str) -> list[Any]: ...

    @abstractmethod
    def get_by_business_area(self, area: str) -> list[Any]: ...

    @abstractmethod
    def get_by_technology(self, technology: str) -> list[Any]: ...

    @abstractmethod
    def count(self) -> int: ...

    @abstractmethod
    def count_by_status(self, status: str) -> int: ...

    @abstractmethod
    def search(self, query: str) -> list[Any]: ...


