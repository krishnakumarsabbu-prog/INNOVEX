from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import IdeaTechnology
from app.repositories.interfaces import BaseRepository


class InMemoryIdeaTechnologyRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, tech: IdeaTechnology) -> IdeaTechnology:
        self._db.execute(
            "INSERT INTO idea_technologies (id, idea_id, technology, created_at) VALUES (?, ?, ?, ?)",
            (tech.id, tech.idea_id, tech.technology, tech.created_at),
        )
        return tech

    def get_by_id(self, tech_id: str) -> IdeaTechnology | None:
        row = self._db.query_one("SELECT * FROM idea_technologies WHERE id = ?", (tech_id,))
        return IdeaTechnology(**dict(row)) if row else None

    def get_all(self) -> list[IdeaTechnology]:
        rows = self._db.query_all("SELECT * FROM idea_technologies ORDER BY created_at DESC")
        return [IdeaTechnology(**dict(r)) for r in rows]

    def get_by_idea(self, idea_id: str) -> list[IdeaTechnology]:
        rows = self._db.query_all("SELECT * FROM idea_technologies WHERE idea_id = ? ORDER BY created_at DESC", (idea_id,))
        return [IdeaTechnology(**dict(r)) for r in rows]

    def update(self, tech_id: str, **kwargs) -> IdeaTechnology | None:
        tech = self.get_by_id(tech_id)
        if not tech:
            return None
        for k, v in kwargs.items():
            if hasattr(tech, k):
                setattr(tech, k, v)
        self._db.execute(
            "UPDATE idea_technologies SET technology = ? WHERE id = ?",
            (tech.technology, tech.id),
        )
        return tech

    def delete(self, tech_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM idea_technologies WHERE id = ?", (tech_id,))
        return cursor.rowcount > 0

    def delete_by_idea(self, idea_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM idea_technologies WHERE idea_id = ?", (idea_id,))
        return cursor.rowcount > 0


IdeaTechnologyRepository = InMemoryIdeaTechnologyRepository
