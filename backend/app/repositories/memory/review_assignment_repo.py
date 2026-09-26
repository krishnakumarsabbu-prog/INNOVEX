from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import ReviewAssignment
from app.repositories.interfaces import BaseRepository


class InMemoryReviewAssignmentRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, assignment: ReviewAssignment) -> ReviewAssignment:
        self._db.execute(
            "INSERT INTO review_assignments (id, idea_id, reviewer_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (assignment.id, assignment.idea_id, assignment.reviewer_id, assignment.status, assignment.created_at, assignment.updated_at),
        )
        return assignment

    def get_by_id(self, assignment_id: str) -> ReviewAssignment | None:
        row = self._db.query_one("SELECT * FROM review_assignments WHERE id = ?", (assignment_id,))
        return ReviewAssignment(**dict(row)) if row else None

    def get_all(self) -> list[ReviewAssignment]:
        rows = self._db.query_all("SELECT * FROM review_assignments ORDER BY created_at DESC")
        return [ReviewAssignment(**dict(r)) for r in rows]

    def get_by_idea(self, idea_id: str) -> list[ReviewAssignment]:
        rows = self._db.query_all("SELECT * FROM review_assignments WHERE idea_id = ? ORDER BY created_at DESC", (idea_id,))
        return [ReviewAssignment(**dict(r)) for r in rows]

    def get_by_reviewer(self, reviewer_id: str) -> list[ReviewAssignment]:
        rows = self._db.query_all("SELECT * FROM review_assignments WHERE reviewer_id = ? ORDER BY created_at DESC", (reviewer_id,))
        return [ReviewAssignment(**dict(r)) for r in rows]

    def update(self, assignment_id: str, **kwargs) -> ReviewAssignment | None:
        assignment = self.get_by_id(assignment_id)
        if not assignment:
            return None
        for k, v in kwargs.items():
            if hasattr(assignment, k):
                setattr(assignment, k, v)
        self._db.execute(
            "UPDATE review_assignments SET status = ?, updated_at = ? WHERE id = ?",
            (assignment.status, assignment.updated_at, assignment.id),
        )
        return assignment

    def delete(self, assignment_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM review_assignments WHERE id = ?", (assignment_id,))
        return cursor.rowcount > 0


ReviewAssignmentRepository = InMemoryReviewAssignmentRepository
