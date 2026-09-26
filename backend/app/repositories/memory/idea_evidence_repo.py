from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import IdeaEvidence
from app.repositories.interfaces import BaseRepository


class InMemoryIdeaEvidenceRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, evidence: IdeaEvidence) -> IdeaEvidence:
        self._db.execute(
            """INSERT INTO idea_evidence
               (id, idea_id, title, description, evidence_type, url, created_by, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (evidence.id, evidence.idea_id, evidence.title, evidence.description,
             evidence.evidence_type, evidence.url, evidence.created_by,
             evidence.created_at, evidence.updated_at),
        )
        return evidence

    def get_by_id(self, evidence_id: str) -> IdeaEvidence | None:
        row = self._db.query_one("SELECT * FROM idea_evidence WHERE id = ?", (evidence_id,))
        return IdeaEvidence(**dict(row)) if row else None

    def get_all(self) -> list[IdeaEvidence]:
        rows = self._db.query_all("SELECT * FROM idea_evidence ORDER BY created_at DESC")
        return [IdeaEvidence(**dict(r)) for r in rows]

    def get_by_idea(self, idea_id: str) -> list[IdeaEvidence]:
        rows = self._db.query_all("SELECT * FROM idea_evidence WHERE idea_id = ? ORDER BY created_at DESC", (idea_id,))
        return [IdeaEvidence(**dict(r)) for r in rows]

    def update(self, evidence_id: str, **kwargs) -> IdeaEvidence | None:
        evidence = self.get_by_id(evidence_id)
        if not evidence:
            return None
        for k, v in kwargs.items():
            if hasattr(evidence, k):
                setattr(evidence, k, v)
        self._db.execute(
            "UPDATE idea_evidence SET title = ?, description = ?, evidence_type = ?, url = ?, updated_at = ? WHERE id = ?",
            (evidence.title, evidence.description, evidence.evidence_type, evidence.url, evidence.updated_at, evidence.id),
        )
        return evidence

    def delete(self, evidence_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM idea_evidence WHERE id = ?", (evidence_id,))
        return cursor.rowcount > 0


IdeaEvidenceRepository = InMemoryIdeaEvidenceRepository
