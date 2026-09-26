import json

from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import ValidationSprint
from app.repositories.interfaces.base import BaseRepository


class InMemoryValidationSprintRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, sprint: ValidationSprint) -> ValidationSprint:
        self._db.execute(
            """INSERT INTO validation_sprints
               (id, idea_id, principal_engineer_id, manager_id, status, start_date, end_date,
                objectives, findings, objectives_checklist, checklist, decision, decision_reason,
                created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (sprint.id, sprint.idea_id, sprint.principal_engineer_id, sprint.manager_id,
             sprint.status, sprint.start_date, sprint.end_date, sprint.objectives, sprint.findings,
             sprint.objectives_checklist, sprint.checklist, sprint.decision, sprint.decision_reason,
             sprint.created_at, sprint.updated_at),
        )
        return sprint

    def _row_to_entity(self, row) -> ValidationSprint:
        d = dict(row)
        if "objectives_checklist" not in d:
            d["objectives_checklist"] = "[]"
        if "checklist" not in d:
            d["checklist"] = "[]"
        if "decision" not in d:
            d["decision"] = None
        if "decision_reason" not in d:
            d["decision_reason"] = ""
        return ValidationSprint(**d)

    def get_by_id(self, sprint_id: str) -> ValidationSprint | None:
        row = self._db.query_one("SELECT * FROM validation_sprints WHERE id = ?", (sprint_id,))
        return self._row_to_entity(row) if row else None

    def get_all(self) -> list[ValidationSprint]:
        rows = self._db.query_all("SELECT * FROM validation_sprints ORDER BY created_at DESC")
        return [self._row_to_entity(r) for r in rows]

    def get_by_idea(self, idea_id: str) -> ValidationSprint | None:
        row = self._db.query_one("SELECT * FROM validation_sprints WHERE idea_id = ?", (idea_id,))
        return self._row_to_entity(row) if row else None

    def update(self, sprint_id: str, **kwargs) -> ValidationSprint | None:
        sprint = self.get_by_id(sprint_id)
        if not sprint:
            return None
        for k, v in kwargs.items():
            if hasattr(sprint, k):
                setattr(sprint, k, v)
        self._db.execute(
            """UPDATE validation_sprints SET principal_engineer_id = ?, manager_id = ?, status = ?,
               start_date = ?, end_date = ?, objectives = ?, findings = ?,
               objectives_checklist = ?, checklist = ?, decision = ?, decision_reason = ?, updated_at = ?
               WHERE id = ?""",
            (sprint.principal_engineer_id, sprint.manager_id, sprint.status,
             sprint.start_date, sprint.end_date, sprint.objectives, sprint.findings,
             sprint.objectives_checklist, sprint.checklist, sprint.decision, sprint.decision_reason,
             sprint.updated_at, sprint.id),
        )
        return sprint

    def delete(self, sprint_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM validation_sprints WHERE id = ?", (sprint_id,))
        return cursor.rowcount > 0

    def count_by_status(self, status: str) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM validation_sprints WHERE status = ?", (status,))
        return row["cnt"] if row else 0


ValidationSprintRepository = InMemoryValidationSprintRepository
