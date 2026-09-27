from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import BusinessArea
from app.repositories.interfaces.base import BaseRepository


class InMemoryBusinessAreaRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, area: BusinessArea) -> BusinessArea:
        self._db.execute(
            "INSERT INTO business_areas (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (area.id, area.name, area.description, area.created_at, area.updated_at),
        )
        return area

    def get_by_id(self, area_id: str) -> BusinessArea | None:
        row = self._db.query_one("SELECT * FROM business_areas WHERE id = ?", (area_id,))
        return BusinessArea(**dict(row)) if row else None

    def get_by_name(self, name: str) -> BusinessArea | None:
        row = self._db.query_one("SELECT * FROM business_areas WHERE name = ?", (name,))
        return BusinessArea(**dict(row)) if row else None

    def get_all(self) -> list[BusinessArea]:
        rows = self._db.query_all("SELECT * FROM business_areas ORDER BY name")
        return [BusinessArea(**dict(r)) for r in rows]

    def update(self, area_id: str, **kwargs) -> BusinessArea | None:
        area = self.get_by_id(area_id)
        if not area:
            return None
        for k, v in kwargs.items():
            if hasattr(area, k):
                setattr(area, k, v)
        self._db.execute(
            "UPDATE business_areas SET name = ?, description = ?, updated_at = ? WHERE id = ?",
            (area.name, area.description, area.updated_at, area.id),
        )
        return area

    def delete(self, area_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM business_areas WHERE id = ?", (area_id,))
        return cursor.rowcount > 0


BusinessAreaRepository = InMemoryBusinessAreaRepository
