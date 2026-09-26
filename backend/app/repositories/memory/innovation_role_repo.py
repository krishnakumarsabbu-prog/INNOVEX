from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import InnovationRole
from app.repositories.interfaces import BaseRepository


class InMemoryInnovationRoleRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, role: InnovationRole) -> InnovationRole:
        self._db.execute(
            """INSERT INTO innovation_roles (id, innovation_id, title, role, technology, capacity, filled, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (role.id, role.innovation_id, role.title, role.role, role.technology,
             role.capacity, role.filled, role.status, role.created_at, role.updated_at),
        )
        return role

    def get_by_id(self, role_id: str) -> InnovationRole | None:
        row = self._db.query_one("SELECT * FROM innovation_roles WHERE id = ?", (role_id,))
        return InnovationRole(**dict(row)) if row else None

    def get_all(self) -> list[InnovationRole]:
        rows = self._db.query_all("SELECT * FROM innovation_roles ORDER BY created_at DESC")
        return [InnovationRole(**dict(r)) for r in rows]

    def get_by_innovation(self, innovation_id: str) -> list[InnovationRole]:
        rows = self._db.query_all("SELECT * FROM innovation_roles WHERE innovation_id = ? ORDER BY created_at DESC", (innovation_id,))
        return [InnovationRole(**dict(r)) for r in rows]

    def get_open(self) -> list[InnovationRole]:
        rows = self._db.query_all("SELECT * FROM innovation_roles WHERE status = 'open' ORDER BY created_at DESC")
        return [InnovationRole(**dict(r)) for r in rows]

    def update(self, role_id: str, **kwargs) -> InnovationRole | None:
        role = self.get_by_id(role_id)
        if not role:
            return None
        for k, v in kwargs.items():
            if hasattr(role, k):
                setattr(role, k, v)
        self._db.execute(
            "UPDATE innovation_roles SET title = ?, role = ?, technology = ?, capacity = ?, filled = ?, status = ?, updated_at = ? WHERE id = ?",
            (role.title, role.role, role.technology, role.capacity, role.filled, role.status, role.updated_at, role.id),
        )
        return role

    def delete(self, role_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM innovation_roles WHERE id = ?", (role_id,))
        return cursor.rowcount > 0

    def count_open(self) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM innovation_roles WHERE status = 'open'")
        return row["cnt"] if row else 0


InnovationRoleRepository = InMemoryInnovationRoleRepository
PositionRepository = InMemoryInnovationRoleRepository
