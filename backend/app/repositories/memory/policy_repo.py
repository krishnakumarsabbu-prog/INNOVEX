from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Policy
from app.repositories.interfaces.base import BaseRepository


class InMemoryPolicyRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def _row_to_policy(self, row) -> Policy | None:
        if not row:
            return None
        d = dict(row)
        d["is_active"] = bool(d.get("is_active", 1))
        return Policy(**d)

    def create(self, policy: Policy) -> Policy:
        self._db.execute(
            "INSERT INTO policies (id, key, name, description, value, policy_type, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (policy.id, policy.key, policy.name, policy.description, policy.value, policy.policy_type, int(policy.is_active), policy.created_at, policy.updated_at),
        )
        return policy

    def get_by_id(self, policy_id: str) -> Policy | None:
        return self._row_to_policy(self._db.query_one("SELECT * FROM policies WHERE id = ?", (policy_id,)))

    def get_by_key(self, key: str) -> Policy | None:
        return self._row_to_policy(self._db.query_one("SELECT * FROM policies WHERE key = ?", (key,)))

    def get_all(self) -> list[Policy]:
        rows = self._db.query_all("SELECT * FROM policies ORDER BY name")
        return [self._row_to_policy(r) for r in rows]

    def update(self, policy_id: str, **kwargs) -> Policy | None:
        policy = self.get_by_id(policy_id)
        if not policy:
            return None
        for k, v in kwargs.items():
            if hasattr(policy, k):
                if k == "is_active":
                    v = bool(v)
                setattr(policy, k, v)
        self._db.execute(
            "UPDATE policies SET value = ?, is_active = ?, updated_at = ? WHERE id = ?",
            (policy.value, int(policy.is_active), policy.updated_at, policy.id),
        )
        return policy

    def delete(self, policy_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM policies WHERE id = ?", (policy_id,))
        return cursor.rowcount > 0


PolicyRepository = InMemoryPolicyRepository
