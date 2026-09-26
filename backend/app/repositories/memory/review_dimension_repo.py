from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import ReviewDimension
from app.repositories.interfaces.base import BaseRepository


class InMemoryReviewDimensionRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, dimension: ReviewDimension) -> ReviewDimension:
        self._db.execute(
            """INSERT INTO review_dimensions (id, review_id, dimension, rating, comment, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (dimension.id, dimension.review_id, dimension.dimension,
             dimension.rating, dimension.comment, dimension.created_at),
        )
        return dimension

    def get_by_id(self, dimension_id: str) -> ReviewDimension | None:
        row = self._db.query_one("SELECT * FROM review_dimensions WHERE id = ?", (dimension_id,))
        return ReviewDimension(**dict(row)) if row else None

    def get_all(self) -> list[ReviewDimension]:
        rows = self._db.query_all("SELECT * FROM review_dimensions ORDER BY created_at ASC")
        return [ReviewDimension(**dict(r)) for r in rows]

    def get_by_review(self, review_id: str) -> list[ReviewDimension]:
        rows = self._db.query_all(
            "SELECT * FROM review_dimensions WHERE review_id = ? ORDER BY created_at ASC",
            (review_id,),
        )
        return [ReviewDimension(**dict(r)) for r in rows]

    def update(self, dimension_id: str, **kwargs) -> ReviewDimension | None:
        dim = self.get_by_id(dimension_id)
        if not dim:
            return None
        for k, v in kwargs.items():
            if hasattr(dim, k):
                setattr(dim, k, v)
        self._db.execute(
            "UPDATE review_dimensions SET rating = ?, comment = ? WHERE id = ?",
            (dim.rating, dim.comment, dim.id),
        )
        return dim

    def delete(self, dimension_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM review_dimensions WHERE id = ?", (dimension_id,))
        return cursor.rowcount > 0

    def delete_by_review(self, review_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM review_dimensions WHERE review_id = ?", (review_id,))
        return cursor.rowcount > 0


ReviewDimensionRepository = InMemoryReviewDimensionRepository
