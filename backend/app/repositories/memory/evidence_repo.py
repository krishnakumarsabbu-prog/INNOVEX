from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Evidence
from app.repositories.interfaces import EvidenceRepositoryInterface


class InMemoryEvidenceRepository(EvidenceRepositoryInterface):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, evidence: Evidence) -> Evidence:
        self._db.execute(
            """INSERT INTO evidence (id, project_id, title, description, evidence_type, url, created_by, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (evidence.id, evidence.project_id, evidence.title, evidence.description,
             evidence.evidence_type, evidence.url, evidence.created_by, evidence.created_at, evidence.updated_at),
        )
        return evidence

    def get_by_id(self, evidence_id: str) -> Evidence | None:
        row = self._db.query_one("SELECT * FROM evidence WHERE id = ?", (evidence_id,))
        return Evidence(**dict(row)) if row else None

    def get_all(self) -> list[Evidence]:
        rows = self._db.query_all("SELECT * FROM evidence ORDER BY created_at DESC")
        return [Evidence(**dict(r)) for r in rows]

    def get_by_project(self, project_id: str) -> list[Evidence]:
        rows = self._db.query_all("SELECT * FROM evidence WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
        return [Evidence(**dict(r)) for r in rows]

    def update(self, evidence_id: str, **kwargs) -> Evidence | None:
        evidence = self.get_by_id(evidence_id)
        if not evidence:
            return None
        for k, v in kwargs.items():
            if hasattr(evidence, k):
                setattr(evidence, k, v)
        self._db.execute(
            "UPDATE evidence SET title = ?, description = ?, evidence_type = ?, url = ?, updated_at = ? WHERE id = ?",
            (evidence.title, evidence.description, evidence.evidence_type, evidence.url, evidence.updated_at, evidence.id),
        )
        return evidence

    def delete(self, evidence_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM evidence WHERE id = ?", (evidence_id,))
        return cursor.rowcount > 0

    def count(self) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM evidence")
        return row["cnt"] if row else 0


EvidenceRepository = InMemoryEvidenceRepository
