from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Idea


class IdeaRepository:
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, idea: Idea) -> Idea:
        self._db.execute(
            """INSERT INTO ideas (id, title, description, category, problem_statement, proposed_solution, status, submitted_by, created_at, updated_at, updated_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (idea.id, idea.title, idea.description, idea.category, idea.problem_statement,
             idea.proposed_solution, idea.status, idea.submitted_by, idea.created_at, idea.updated_at, idea.updated_by),
        )
        return idea

    def get_by_id(self, idea_id: str) -> Idea | None:
        row = self._db.query_one("SELECT * FROM ideas WHERE id = ?", (idea_id,))
        if not row:
            return None
        return Idea(**dict(row))

    def get_all(self) -> list[Idea]:
        rows = self._db.query_all("SELECT * FROM ideas ORDER BY created_at DESC")
        return [Idea(**dict(r)) for r in rows]

    def get_by_submitter(self, user_id: str) -> list[Idea]:
        rows = self._db.query_all("SELECT * FROM ideas WHERE submitted_by = ? ORDER BY created_at DESC", (user_id,))
        return [Idea(**dict(r)) for r in rows]

    def get_by_status(self, status: str) -> list[Idea]:
        rows = self._db.query_all("SELECT * FROM ideas WHERE status = ? ORDER BY created_at DESC", (status,))
        return [Idea(**dict(r)) for r in rows]

    def update(self, idea_id: str, **kwargs) -> Idea | None:
        idea = self.get_by_id(idea_id)
        if not idea:
            return None
        for k, v in kwargs.items():
            if hasattr(idea, k):
                setattr(idea, k, v)
        self._db.execute(
            """UPDATE ideas SET title = ?, description = ?, category = ?, problem_statement = ?, proposed_solution = ?, status = ?, updated_at = ?, updated_by = ?
               WHERE id = ?""",
            (idea.title, idea.description, idea.category, idea.problem_statement,
             idea.proposed_solution, idea.status, idea.updated_at, idea.updated_by, idea.id),
        )
        return idea

    def delete(self, idea_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM ideas WHERE id = ?", (idea_id,))
        return cursor.rowcount > 0

    def count(self) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM ideas")
        return row["cnt"] if row else 0

    def count_by_status(self, status: str) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM ideas WHERE status = ?", (status,))
        return row["cnt"] if row else 0

    def search(self, query: str) -> list[Idea]:
        pattern = f"%{query}%"
        rows = self._db.query_all(
            "SELECT * FROM ideas WHERE title LIKE ? OR description LIKE ? OR category LIKE ? ORDER BY created_at DESC",
            (pattern, pattern, pattern),
        )
        return [Idea(**dict(r)) for r in rows]
