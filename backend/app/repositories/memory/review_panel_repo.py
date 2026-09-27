import json

from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import ReviewPanel
from app.repositories.interfaces.base import BaseRepository


class InMemoryReviewPanelRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def _row_to_panel(self, row) -> ReviewPanel | None:
        if not row:
            return None
        d = dict(row)
        raw_members = d.get("member_ids")
        if isinstance(raw_members, str):
            try:
                d["member_ids"] = json.loads(raw_members)
            except Exception:
                d["member_ids"] = []
        elif isinstance(raw_members, list):
            d["member_ids"] = raw_members
        else:
            d["member_ids"] = []
        d.pop("is_active", None)
        return ReviewPanel(**d)

    def create(self, panel: ReviewPanel) -> ReviewPanel:
        self._db.execute(
            "INSERT INTO review_panels (id, name, description, member_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (panel.id, panel.name, panel.description, json.dumps(panel.member_ids), panel.created_at, panel.updated_at),
        )
        return panel

    def get_by_id(self, panel_id: str) -> ReviewPanel | None:
        return self._row_to_panel(self._db.query_one("SELECT * FROM review_panels WHERE id = ?", (panel_id,)))

    def get_all(self) -> list[ReviewPanel]:
        rows = self._db.query_all("SELECT * FROM review_panels ORDER BY name")
        return [self._row_to_panel(r) for r in rows]

    def update(self, panel_id: str, **kwargs) -> ReviewPanel | None:
        panel = self.get_by_id(panel_id)
        if not panel:
            return None
        for k, v in kwargs.items():
            if hasattr(panel, k):
                setattr(panel, k, v)
        self._db.execute(
            "UPDATE review_panels SET name = ?, description = ?, member_ids = ?, updated_at = ? WHERE id = ?",
            (panel.name, panel.description, json.dumps(panel.member_ids), panel.updated_at, panel.id),
        )
        return panel

    def delete(self, panel_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM review_panels WHERE id = ?", (panel_id,))
        return cursor.rowcount > 0


ReviewPanelRepository = InMemoryReviewPanelRepository
