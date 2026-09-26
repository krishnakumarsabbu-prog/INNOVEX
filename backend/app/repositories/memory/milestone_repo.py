from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Milestone


class MilestoneRepository:
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, milestone: Milestone) -> Milestone:
        self._db.execute(
            """INSERT INTO milestones (id, project_id, title, description, status, due_date, completed_at, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (milestone.id, milestone.project_id, milestone.title, milestone.description,
             milestone.status, milestone.due_date, milestone.completed_at, milestone.created_at, milestone.updated_at),
        )
        return milestone

    def get_by_id(self, milestone_id: str) -> Milestone | None:
        row = self._db.query_one("SELECT * FROM milestones WHERE id = ?", (milestone_id,))
        return Milestone(**dict(row)) if row else None

    def get_all(self) -> list[Milestone]:
        rows = self._db.query_all("SELECT * FROM milestones ORDER BY created_at DESC")
        return [Milestone(**dict(r)) for r in rows]

    def get_by_project(self, project_id: str) -> list[Milestone]:
        rows = self._db.query_all("SELECT * FROM milestones WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
        return [Milestone(**dict(r)) for r in rows]

    def update(self, milestone_id: str, **kwargs) -> Milestone | None:
        milestone = self.get_by_id(milestone_id)
        if not milestone:
            return None
        for k, v in kwargs.items():
            if hasattr(milestone, k):
                setattr(milestone, k, v)
        self._db.execute(
            "UPDATE milestones SET title = ?, description = ?, status = ?, due_date = ?, completed_at = ?, updated_at = ? WHERE id = ?",
            (milestone.title, milestone.description, milestone.status, milestone.due_date,
             milestone.completed_at, milestone.updated_at, milestone.id),
        )
        return milestone

    def delete(self, milestone_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM milestones WHERE id = ?", (milestone_id,))
        return cursor.rowcount > 0

    def count_by_status(self, status: str) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM milestones WHERE status = ?", (status,))
        return row["cnt"] if row else 0
