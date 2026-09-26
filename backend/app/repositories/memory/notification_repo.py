from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Notification
from app.repositories.interfaces import NotificationRepositoryInterface


class InMemoryNotificationRepository(NotificationRepositoryInterface):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, notif: Notification) -> Notification:
        self._db.execute(
            "INSERT INTO notifications (id, user_id, message, read, created_at) VALUES (?, ?, ?, ?, ?)",
            (notif.id, notif.user_id, notif.message, int(notif.read), notif.created_at),
        )
        return notif

    def get_by_id(self, notif_id: str) -> Notification | None:
        row = self._db.query_one("SELECT * FROM notifications WHERE id = ?", (notif_id,))
        if not row:
            return None
        d = dict(row)
        d["read"] = bool(d["read"])
        return Notification(**d)

    def get_all(self) -> list[Notification]:
        rows = self._db.query_all("SELECT * FROM notifications ORDER BY created_at DESC")
        result = []
        for r in rows:
            d = dict(r)
            d["read"] = bool(d["read"])
            result.append(Notification(**d))
        return result

    def get_by_user(self, user_id: str) -> list[Notification]:
        rows = self._db.query_all("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        result = []
        for r in rows:
            d = dict(r)
            d["read"] = bool(d["read"])
            result.append(Notification(**d))
        return result

    def get_unread_count(self, user_id: str) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND read = 0", (user_id,))
        return row["cnt"] if row else 0

    def mark_as_read(self, notif_id: str) -> bool:
        cursor = self._db.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notif_id,))
        return cursor.rowcount > 0

    def mark_all_read(self, user_id: str) -> bool:
        cursor = self._db.execute("UPDATE notifications SET read = 1 WHERE user_id = ?", (user_id,))
        return cursor.rowcount > 0

    def update(self, notif_id: str, **kwargs) -> Notification | None:
        return None

    def delete(self, notif_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM notifications WHERE id = ?", (notif_id,))
        return cursor.rowcount > 0


NotificationRepository = InMemoryNotificationRepository
