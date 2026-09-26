import json

from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import ValidationEvidence
from app.repositories.interfaces.base import BaseRepository


class InMemoryValidationEvidenceRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, evidence: ValidationEvidence) -> ValidationEvidence:
        self._db.execute(
            """INSERT INTO validation_evidence
               (id, sprint_id, evidence_type, title, description, url, conclusion, created_by, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (evidence.id, evidence.sprint_id, evidence.evidence_type, evidence.title,
             evidence.description, evidence.url, evidence.conclusion, evidence.created_by,
             evidence.created_at, evidence.updated_at),
        )
        return evidence

    def get_by_id(self, evidence_id: str) -> ValidationEvidence | None:
        row = self._db.query_one("SELECT * FROM validation_evidence WHERE id = ?", (evidence_id,))
        return ValidationEvidence(**dict(row)) if row else None

    def get_all(self) -> list[ValidationEvidence]:
        rows = self._db.query_all("SELECT * FROM validation_evidence ORDER BY created_at DESC")
        return [ValidationEvidence(**dict(r)) for r in rows]

    def get_by_sprint(self, sprint_id: str) -> list[ValidationEvidence]:
        rows = self._db.query_all(
            "SELECT * FROM validation_evidence WHERE sprint_id = ? ORDER BY created_at DESC",
            (sprint_id,),
        )
        return [ValidationEvidence(**dict(r)) for r in rows]

    def update(self, evidence_id: str, **kwargs) -> ValidationEvidence | None:
        evidence = self.get_by_id(evidence_id)
        if not evidence:
            return None
        for k, v in kwargs.items():
            if hasattr(evidence, k):
                setattr(evidence, k, v)
        self._db.execute(
            """UPDATE validation_evidence SET evidence_type = ?, title = ?, description = ?,
               url = ?, conclusion = ?, updated_at = ? WHERE id = ?""",
            (evidence.evidence_type, evidence.title, evidence.description,
             evidence.url, evidence.conclusion, evidence.updated_at, evidence.id),
        )
        return evidence

    def delete(self, evidence_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM validation_evidence WHERE id = ?", (evidence_id,))
        return cursor.rowcount > 0


ValidationEvidenceRepository = InMemoryValidationEvidenceRepository
