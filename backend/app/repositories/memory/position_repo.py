from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Position


class PositionRepository:
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, position: Position) -> Position:
        self._db.execute(
            """INSERT INTO positions (id, innovation_id, title, role, technology, capacity, filled, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (position.id, position.innovation_id, position.title, position.role, position.technology,
             position.capacity, position.filled, position.status, position.created_at, position.updated_at),
        )
        return position

    def get_by_id(self, position_id: str) -> Position | None:
        row = self._db.query_one("SELECT * FROM positions WHERE id = ?", (position_id,))
        return Position(**dict(row)) if row else None

    def get_all(self) -> list[Position]:
        rows = self._db.query_all("SELECT * FROM positions ORDER BY created_at DESC")
        return [Position(**dict(r)) for r in rows]

    def get_by_innovation(self, innovation_id: str) -> list[Position]:
        rows = self._db.query_all("SELECT * FROM positions WHERE innovation_id = ? ORDER BY created_at DESC", (innovation_id,))
        return [Position(**dict(r)) for r in rows]

    def get_open(self) -> list[Position]:
        rows = self._db.query_all("SELECT * FROM positions WHERE status = 'open' ORDER BY created_at DESC")
        return [Position(**dict(r)) for r in rows]

    def update(self, position_id: str, **kwargs) -> Position | None:
        position = self.get_by_id(position_id)
        if not position:
            return None
        for k, v in kwargs.items():
            if hasattr(position, k):
                setattr(position, k, v)
        self._db.execute(
            "UPDATE positions SET title = ?, role = ?, technology = ?, capacity = ?, filled = ?, status = ?, updated_at = ? WHERE id = ?",
            (position.title, position.role, position.technology, position.capacity,
             position.filled, position.status, position.updated_at, position.id),
        )
        return position

    def delete(self, position_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM positions WHERE id = ?", (position_id,))
        return cursor.rowcount > 0

    def count_open(self) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM positions WHERE status = 'open'")
        return row["cnt"] if row else 0
