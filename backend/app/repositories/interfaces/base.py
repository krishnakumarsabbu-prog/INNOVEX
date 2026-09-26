from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar

T = TypeVar("T")


class BaseRepository(ABC, Generic[T]):
    @abstractmethod
    def create(self, entity: T) -> T: ...

    @abstractmethod
    def get_by_id(self, entity_id: str) -> T | None: ...

    @abstractmethod
    def get_all(self) -> list[T]: ...

    @abstractmethod
    def update(self, entity_id: str, **kwargs) -> T | None: ...

    @abstractmethod
    def delete(self, entity_id: str) -> bool: ...


class OrganizationRepositoryInterface(BaseRepository):
    @abstractmethod
    def get_first(self) -> Any | None: ...

    @abstractmethod
    def count(self) -> int: ...


class UserRepositoryInterface(BaseRepository):
    @abstractmethod
    def get_by_email(self, email: str) -> Any | None: ...

    @abstractmethod
    def get_by_role(self, role: str) -> list[Any]: ...

    @abstractmethod
    def count(self) -> int: ...

    @abstractmethod
    def search(self, query: str) -> list[Any]: ...


