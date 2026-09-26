from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Review
from app.repositories.interfaces import ReviewRepositoryInterface


class InMemoryReviewRepository(ReviewRepositoryInterface):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, review: Review) -> Review:
        self._db.execute(
            """INSERT INTO reviews (id, idea_id, reviewer_id, decision, comments, reason, evidence, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (review.id, review.idea_id, review.reviewer_id, review.decision,
             review.comments, review.reason, review.evidence,
             review.created_at, review.updated_at),
        )
        return review

    def get_by_id(self, review_id: str) -> Review | None:
        row = self._db.query_one("SELECT * FROM reviews WHERE id = ?", (review_id,))
        return Review(**dict(row)) if row else None

    def get_all(self) -> list[Review]:
        rows = self._db.query_all("SELECT * FROM reviews ORDER BY created_at DESC")
        return [Review(**dict(r)) for r in rows]

    def get_by_idea(self, idea_id: str) -> list[Review]:
        rows = self._db.query_all("SELECT * FROM reviews WHERE idea_id = ? ORDER BY created_at DESC", (idea_id,))
        return [Review(**dict(r)) for r in rows]

    def get_by_reviewer(self, reviewer_id: str) -> list[Review]:
        rows = self._db.query_all("SELECT * FROM reviews WHERE reviewer_id = ? ORDER BY created_at DESC", (reviewer_id,))
        return [Review(**dict(r)) for r in rows]

    def update(self, review_id: str, **kwargs) -> Review | None:
        review = self.get_by_id(review_id)
        if not review:
            return None
        for k, v in kwargs.items():
            if hasattr(review, k):
                setattr(review, k, v)
        self._db.execute(
            "UPDATE reviews SET decision = ?, comments = ?, reason = ?, evidence = ?, updated_at = ? WHERE id = ?",
            (review.decision, review.comments, review.reason, review.evidence, review.updated_at, review.id),
        )
        return review

    def delete(self, review_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
        return cursor.rowcount > 0


ReviewRepository = InMemoryReviewRepository
