from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Activity
from app.repositories.interfaces import ActivityRepositoryInterface


class InMemoryActivityRepository(ActivityRepositoryInterface):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, activity: Activity) -> Activity:
        self._db.execute(
            "INSERT INTO activities (id, entity_type, entity_id, action, description, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (activity.id, activity.entity_type, activity.entity_id, activity.action, activity.description, activity.user_id, activity.created_at),
        )
        return activity

    def get_by_id(self, activity_id: str) -> Activity | None:
        row = self._db.query_one("SELECT * FROM activities WHERE id = ?", (activity_id,))
        return Activity(**dict(row)) if row else None

    def get_all(self) -> list[Activity]:
        rows = self._db.query_all("SELECT * FROM activities ORDER BY created_at DESC LIMIT 100")
        return [Activity(**dict(r)) for r in rows]

    def get_by_entity(self, entity_type: str, entity_id: str) -> list[Activity]:
        rows = self._db.query_all(
            "SELECT * FROM activities WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC",
            (entity_type, entity_id),
        )
        return [Activity(**dict(r)) for r in rows]

    def update(self, activity_id: str, **kwargs) -> Activity | None:
        return None

    def delete(self, activity_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM activities WHERE id = ?", (activity_id,))
        return cursor.rowcount > 0

    def count(self) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM activities")
        return row["cnt"] if row else 0


ActivityRepository = InMemoryActivityRepository
