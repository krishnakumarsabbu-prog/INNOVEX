import json

from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Workflow
from app.repositories.interfaces.base import BaseRepository


class InMemoryWorkflowRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def _row_to_workflow(self, row) -> Workflow | None:
        if not row:
            return None
        d = dict(row)
        d["stages"] = json.loads(d.get("stages", "[]"))
        d["is_active"] = bool(d.get("is_active", 1))
        return Workflow(**d)

    def create(self, workflow: Workflow) -> Workflow:
        self._db.execute(
            "INSERT INTO workflows (id, name, description, stages, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (workflow.id, workflow.name, workflow.description, json.dumps(workflow.stages), int(workflow.is_active), workflow.created_at, workflow.updated_at),
        )
        return workflow

    def get_by_id(self, workflow_id: str) -> Workflow | None:
        return self._row_to_workflow(self._db.query_one("SELECT * FROM workflows WHERE id = ?", (workflow_id,)))

    def get_all(self) -> list[Workflow]:
        rows = self._db.query_all("SELECT * FROM workflows ORDER BY name")
        return [self._row_to_workflow(r) for r in rows]

    def update(self, workflow_id: str, **kwargs) -> Workflow | None:
        workflow = self.get_by_id(workflow_id)
        if not workflow:
            return None
        for k, v in kwargs.items():
            if hasattr(workflow, k):
                if k == "is_active":
                    v = bool(v)
                setattr(workflow, k, v)
        self._db.execute(
            "UPDATE workflows SET name = ?, description = ?, stages = ?, is_active = ?, updated_at = ? WHERE id = ?",
            (workflow.name, workflow.description, json.dumps(workflow.stages), int(workflow.is_active), workflow.updated_at, workflow.id),
        )
        return workflow

    def delete(self, workflow_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM workflows WHERE id = ?", (workflow_id,))
        return cursor.rowcount > 0


WorkflowRepository = InMemoryWorkflowRepository
