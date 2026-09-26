from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import IdeaFollow
from app.repositories.interfaces import BaseRepository


class InMemoryIdeaFollowRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, follow: IdeaFollow) -> IdeaFollow:
        self._db.execute(
            "INSERT OR IGNORE INTO idea_follows (id, idea_id, user_id, created_at) VALUES (?, ?, ?, ?)",
            (follow.id, follow.idea_id, follow.user_id, follow.created_at),
        )
        return follow

    def get_by_id(self, follow_id: str) -> IdeaFollow | None:
        row = self._db.query_one("SELECT * FROM idea_follows WHERE id = ?", (follow_id,))
        return IdeaFollow(**dict(row)) if row else None

    def get_all(self) -> list[IdeaFollow]:
        rows = self._db.query_all("SELECT * FROM idea_follows ORDER BY created_at DESC")
        return [IdeaFollow(**dict(r)) for r in rows]

    def get_by_idea(self, idea_id: str) -> list[IdeaFollow]:
        rows = self._db.query_all("SELECT * FROM idea_follows WHERE idea_id = ? ORDER BY created_at DESC", (idea_id,))
        return [IdeaFollow(**dict(r)) for r in rows]

    def get_by_user(self, user_id: str) -> list[IdeaFollow]:
        rows = self._db.query_all("SELECT * FROM idea_follows WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        return [IdeaFollow(**dict(r)) for r in rows]

    def get_by_idea_and_user(self, idea_id: str, user_id: str) -> IdeaFollow | None:
        row = self._db.query_one(
            "SELECT * FROM idea_follows WHERE idea_id = ? AND user_id = ?",
            (idea_id, user_id),
        )
        return IdeaFollow(**dict(row)) if row else None

    def count_by_idea(self, idea_id: str) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM idea_follows WHERE idea_id = ?", (idea_id,))
        return row["cnt"] if row else 0

    def update(self, follow_id: str, **kwargs) -> IdeaFollow | None:
        return None

    def delete(self, follow_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM idea_follows WHERE id = ?", (follow_id,))
        return cursor.rowcount > 0

    def unfollow(self, idea_id: str, user_id: str) -> bool:
        cursor = self._db.execute(
            "DELETE FROM idea_follows WHERE idea_id = ? AND user_id = ?",
            (idea_id, user_id),
        )
        return cursor.rowcount > 0


IdeaFollowRepository = InMemoryIdeaFollowRepository
