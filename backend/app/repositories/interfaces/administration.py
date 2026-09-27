from abc import abstractmethod
from typing import Any

from app.repositories.interfaces.base import BaseRepository


class TechnologyTaxonomyRepositoryInterface(BaseRepository):
    @abstractmethod
    def get_by_name(self, name: str) -> Any | None: ...

    @abstractmethod
    def get_by_category(self, category: str) -> list[Any]: ...


