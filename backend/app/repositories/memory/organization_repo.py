import json
from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Organization


class OrganizationRepository:
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, org: Organization) -> Organization:
        self._db.execute(
            "INSERT INTO organizations (id, name, created_at, updated_at, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)",
            (org.id, org.name, org.created_at, org.updated_at, org.created_by, org.updated_by),
        )
        return org

    def get_by_id(self, org_id: str) -> Organization | None:
        row = self._db.query_one("SELECT * FROM organizations WHERE id = ?", (org_id,))
        if not row:
            return None
        return Organization(**dict(row))

    def get_first(self) -> Organization | None:
        row = self._db.query_one("SELECT * FROM organizations LIMIT 1")
        if not row:
            return None
        return Organization(**dict(row))

    def get_all(self) -> list[Organization]:
        rows = self._db.query_all("SELECT * FROM organizations")
        return [Organization(**dict(r)) for r in rows]

    def update(self, org_id: str, **kwargs) -> Organization | None:
        org = self.get_by_id(org_id)
        if not org:
            return None
        for k, v in kwargs.items():
            if hasattr(org, k):
                setattr(org, k, v)
        self._db.execute(
            "UPDATE organizations SET name = ?, updated_at = ?, updated_by = ? WHERE id = ?",
            (org.name, org.updated_at, org.updated_by, org.id),
        )
        return org

    def delete(self, org_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM organizations WHERE id = ?", (org_id,))
        return cursor.rowcount > 0

    def count(self) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM organizations")
        return row["cnt"] if row else 0
