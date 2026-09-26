from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import PositionApplication


class PositionApplicationRepository:
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, app: PositionApplication) -> PositionApplication:
        self._db.execute(
            "INSERT INTO position_applications (id, position_id, user_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (app.id, app.position_id, app.user_id, app.status, app.created_at, app.updated_at),
        )
        return app

    def get_by_id(self, app_id: str) -> PositionApplication | None:
        row = self._db.query_one("SELECT * FROM position_applications WHERE id = ?", (app_id,))
        return PositionApplication(**dict(row)) if row else None

    def get_all(self) -> list[PositionApplication]:
        rows = self._db.query_all("SELECT * FROM position_applications ORDER BY created_at DESC")
        return [PositionApplication(**dict(r)) for r in rows]

    def get_by_position(self, position_id: str) -> list[PositionApplication]:
        rows = self._db.query_all("SELECT * FROM position_applications WHERE position_id = ? ORDER BY created_at DESC", (position_id,))
        return [PositionApplication(**dict(r)) for r in rows]

    def get_by_user(self, user_id: str) -> list[PositionApplication]:
        rows = self._db.query_all("SELECT * FROM position_applications WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        return [PositionApplication(**dict(r)) for r in rows]

    def get_by_position_and_user(self, position_id: str, user_id: str) -> PositionApplication | None:
        row = self._db.query_one("SELECT * FROM position_applications WHERE position_id = ? AND user_id = ?", (position_id, user_id))
        return PositionApplication(**dict(row)) if row else None

    def update(self, app_id: str, **kwargs) -> PositionApplication | None:
        app = self.get_by_id(app_id)
        if not app:
            return None
        for k, v in kwargs.items():
            if hasattr(app, k):
                setattr(app, k, v)
        self._db.execute(
            "UPDATE position_applications SET status = ?, updated_at = ? WHERE id = ?",
            (app.status, app.updated_at, app.id),
        )
        return app

    def delete(self, app_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM position_applications WHERE id = ?", (app_id,))
        return cursor.rowcount > 0

    def count_by_position(self, position_id: str) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM position_applications WHERE position_id = ?", (position_id,))
        return row["cnt"] if row else 0
