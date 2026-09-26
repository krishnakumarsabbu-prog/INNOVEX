from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import WorkItem
from app.repositories.interfaces import WorkItemRepositoryInterface


class InMemoryWorkItemRepository(WorkItemRepositoryInterface):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, item: WorkItem) -> WorkItem:
        self._db.execute(
            """INSERT INTO work_items (id, project_id, milestone_id, title, description, status, assignee_id, order_index, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (item.id, item.project_id, item.milestone_id, item.title, item.description,
             item.status, item.assignee_id, item.order_index, item.created_at, item.updated_at),
        )
        return item

    def get_by_id(self, item_id: str) -> WorkItem | None:
        row = self._db.query_one("SELECT * FROM work_items WHERE id = ?", (item_id,))
        return WorkItem(**dict(row)) if row else None

    def get_all(self) -> list[WorkItem]:
        rows = self._db.query_all("SELECT * FROM work_items ORDER BY order_index ASC, created_at DESC")
        return [WorkItem(**dict(r)) for r in rows]

    def get_by_project(self, project_id: str) -> list[WorkItem]:
        rows = self._db.query_all("SELECT * FROM work_items WHERE project_id = ? ORDER BY order_index ASC, created_at DESC", (project_id,))
        return [WorkItem(**dict(r)) for r in rows]

    def get_by_milestone(self, milestone_id: str) -> list[WorkItem]:
        rows = self._db.query_all("SELECT * FROM work_items WHERE milestone_id = ? ORDER BY order_index ASC", (milestone_id,))
        return [WorkItem(**dict(r)) for r in rows]

    def get_by_assignee(self, assignee_id: str) -> list[WorkItem]:
        rows = self._db.query_all("SELECT * FROM work_items WHERE assignee_id = ? ORDER BY created_at DESC", (assignee_id,))
        return [WorkItem(**dict(r)) for r in rows]

    def update(self, item_id: str, **kwargs) -> WorkItem | None:
        item = self.get_by_id(item_id)
        if not item:
            return None
        for k, v in kwargs.items():
            if hasattr(item, k):
                setattr(item, k, v)
        self._db.execute(
            """UPDATE work_items SET title = ?, description = ?, status = ?, assignee_id = ?, order_index = ?, updated_at = ?
               WHERE id = ?""",
            (item.title, item.description, item.status, item.assignee_id, item.order_index, item.updated_at, item.id),
        )
        return item

    def delete(self, item_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM work_items WHERE id = ?", (item_id,))
        return cursor.rowcount > 0

    def count_by_status(self, status: str) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM work_items WHERE status = ?", (status,))
        return row["cnt"] if row else 0


WorkItemRepository = InMemoryWorkItemRepository
