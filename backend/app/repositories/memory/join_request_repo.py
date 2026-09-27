from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import JoinRequest
from app.repositories.interfaces import BaseRepository


class InMemoryJoinRequestRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, request: JoinRequest) -> JoinRequest:
        self._db.execute(
            "INSERT INTO join_requests (id, innovation_id, user_id, role, role_id, status, message, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (request.id, request.innovation_id, request.user_id, request.role, request.role_id,
             request.status, request.message, request.created_at, request.updated_at),
        )
        return request

    def get_by_id(self, request_id: str) -> JoinRequest | None:
        row = self._db.query_one("SELECT * FROM join_requests WHERE id = ?", (request_id,))
        return JoinRequest(**dict(row)) if row else None

    def get_all(self) -> list[JoinRequest]:
        rows = self._db.query_all("SELECT * FROM join_requests ORDER BY created_at DESC")
        return [JoinRequest(**dict(r)) for r in rows]

    def get_by_innovation(self, innovation_id: str) -> list[JoinRequest]:
        rows = self._db.query_all("SELECT * FROM join_requests WHERE innovation_id = ? ORDER BY created_at DESC", (innovation_id,))
        return [JoinRequest(**dict(r)) for r in rows]

    def get_by_user(self, user_id: str) -> list[JoinRequest]:
        rows = self._db.query_all("SELECT * FROM join_requests WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        return [JoinRequest(**dict(r)) for r in rows]

    def get_by_innovation_and_user(self, innovation_id: str, user_id: str) -> JoinRequest | None:
        row = self._db.query_one(
            "SELECT * FROM join_requests WHERE innovation_id = ? AND user_id = ?",
            (innovation_id, user_id),
        )
        return JoinRequest(**dict(row)) if row else None

    def get_by_role_and_user(self, role_id: str, user_id: str) -> JoinRequest | None:
        row = self._db.query_one(
            "SELECT * FROM join_requests WHERE role_id = ? AND user_id = ?",
            (role_id, user_id),
        )
        return JoinRequest(**dict(row)) if row else None

    def update(self, request_id: str, **kwargs) -> JoinRequest | None:
        request = self.get_by_id(request_id)
        if not request:
            return None
        for k, v in kwargs.items():
            if hasattr(request, k):
                setattr(request, k, v)
        self._db.execute(
            "UPDATE join_requests SET status = ?, message = ?, updated_at = ? WHERE id = ?",
            (request.status, request.message, request.updated_at, request.id),
        )
        return request

    def delete(self, request_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM join_requests WHERE id = ?", (request_id,))
        return cursor.rowcount > 0

    def count_by_innovation(self, innovation_id: str) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM join_requests WHERE innovation_id = ?", (innovation_id,))
        return row["cnt"] if row else 0


JoinRequestRepository = InMemoryJoinRequestRepository
PositionApplicationRepository = InMemoryJoinRequestRepository
