import json

from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Idea
from app.repositories.interfaces import IdeaRepositoryInterface


class InMemoryIdeaRepository(IdeaRepositoryInterface):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def _row_to_idea(self, row) -> Idea | None:
        if not row:
            return None
        d = dict(row)
        d["technologies"] = json.loads(d.get("technologies") or "[]")
        return Idea(**d)

    def create(self, idea: Idea) -> Idea:
        self._db.execute(
            """INSERT INTO ideas
               (id, organization_id, title, problem_statement, proposed_solution,
                business_impact, engineering_impact, expected_benefits, business_area,
                technologies, dependencies, risks, estimated_complexity, estimated_duration,
                founder_id, status, created_at, updated_at, created_by, updated_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (idea.id, idea.organization_id, idea.title, idea.problem_statement,
             idea.proposed_solution, idea.business_impact, idea.engineering_impact,
             idea.expected_benefits, idea.business_area,
             json.dumps(idea.technologies), idea.dependencies, idea.risks,
             idea.estimated_complexity, idea.estimated_duration,
             idea.founder_id, idea.status, idea.created_at, idea.updated_at,
             idea.created_by, idea.updated_by),
        )
        return idea

    def get_by_id(self, idea_id: str) -> Idea | None:
        return self._row_to_idea(self._db.query_one("SELECT * FROM ideas WHERE id = ?", (idea_id,)))

    def get_all(self) -> list[Idea]:
        rows = self._db.query_all("SELECT * FROM ideas ORDER BY created_at DESC")
        return [self._row_to_idea(r) for r in rows]

    def get_by_founder(self, founder_id: str) -> list[Idea]:
        rows = self._db.query_all("SELECT * FROM ideas WHERE founder_id = ? ORDER BY created_at DESC", (founder_id,))
        return [self._row_to_idea(r) for r in rows]

    def get_by_status(self, status: str) -> list[Idea]:
        rows = self._db.query_all("SELECT * FROM ideas WHERE status = ? ORDER BY created_at DESC", (status,))
        return [self._row_to_idea(r) for r in rows]

    def get_by_business_area(self, area: str) -> list[Idea]:
        rows = self._db.query_all("SELECT * FROM ideas WHERE business_area = ? ORDER BY created_at DESC", (area,))
        return [self._row_to_idea(r) for r in rows]

    def get_by_technology(self, technology: str) -> list[Idea]:
        rows = self._db.query_all("SELECT * FROM ideas ORDER BY created_at DESC")
        return [i for i in (self._row_to_idea(r) for r in rows) if technology in i.technologies]

    def update(self, idea_id: str, **kwargs) -> Idea | None:
        idea = self.get_by_id(idea_id)
        if not idea:
            return None
        for k, v in kwargs.items():
            if hasattr(idea, k):
                setattr(idea, k, v)
        self._db.execute(
            """UPDATE ideas SET
               title = ?, problem_statement = ?, proposed_solution = ?,
               business_impact = ?, engineering_impact = ?, expected_benefits = ?,
               business_area = ?, technologies = ?, dependencies = ?, risks = ?,
               estimated_complexity = ?, estimated_duration = ?, founder_id = ?,
               status = ?, updated_at = ?, updated_by = ?
               WHERE id = ?""",
            (idea.title, idea.problem_statement, idea.proposed_solution,
             idea.business_impact, idea.engineering_impact, idea.expected_benefits,
             idea.business_area, json.dumps(idea.technologies), idea.dependencies,
             idea.risks, idea.estimated_complexity, idea.estimated_duration,
             idea.founder_id, idea.status, idea.updated_at, idea.updated_by, idea.id),
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
            "SELECT * FROM ideas WHERE title LIKE ? OR problem_statement LIKE ? OR proposed_solution LIKE ? OR business_area LIKE ? ORDER BY created_at DESC",
            (pattern, pattern, pattern, pattern),
        )
        return [self._row_to_idea(r) for r in rows]

    # Backward-compat alias
    def get_by_submitter(self, user_id: str) -> list[Idea]:
        return self.get_by_founder(user_id)


IdeaRepository = InMemoryIdeaRepository
