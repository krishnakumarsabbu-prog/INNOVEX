from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Follow
from app.repositories.interfaces import BaseRepository


class InMemoryFollowRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, follow: Follow) -> Follow:
        self._db.execute(
            "INSERT OR IGNORE INTO follows (id, innovation_id, user_id, created_at) VALUES (?, ?, ?, ?)",
            (follow.id, follow.innovation_id, follow.user_id, follow.created_at),
        )
        return follow

    def get_by_id(self, follow_id: str) -> Follow | None:
        row = self._db.query_one("SELECT * FROM follows WHERE id = ?", (follow_id,))
        return Follow(**dict(row)) if row else None

    def get_all(self) -> list[Follow]:
        rows = self._db.query_all("SELECT * FROM follows ORDER BY created_at DESC")
        return [Follow(**dict(r)) for r in rows]

    def get_by_innovation(self, innovation_id: str) -> list[Follow]:
        rows = self._db.query_all("SELECT * FROM follows WHERE innovation_id = ? ORDER BY created_at DESC", (innovation_id,))
        return [Follow(**dict(r)) for r in rows]

    def get_by_user(self, user_id: str) -> list[Follow]:
        rows = self._db.query_all("SELECT * FROM follows WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        return [Follow(**dict(r)) for r in rows]

    def get_by_innovation_and_user(self, innovation_id: str, user_id: str) -> Follow | None:
        row = self._db.query_one(
            "SELECT * FROM follows WHERE innovation_id = ? AND user_id = ?",
            (innovation_id, user_id),
        )
        return Follow(**dict(row)) if row else None

    def count_by_innovation(self, innovation_id: str) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM follows WHERE innovation_id = ?", (innovation_id,))
        return row["cnt"] if row else 0

    def update(self, follow_id: str, **kwargs) -> Follow | None:
        return None

    def delete(self, follow_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM follows WHERE id = ?", (follow_id,))
        return cursor.rowcount > 0

    def unfollow(self, innovation_id: str, user_id: str) -> bool:
        cursor = self._db.execute(
            "DELETE FROM follows WHERE innovation_id = ? AND user_id = ?",
            (innovation_id, user_id),
        )
        return cursor.rowcount > 0


FollowRepository = InMemoryFollowRepository
