from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Innovation
from app.repositories.interfaces import InnovationRepositoryInterface


class InMemoryInnovationRepository(InnovationRepositoryInterface):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def _row_to_innovation(self, row) -> Innovation | None:
        if not row:
            return None
        d = dict(row)
        d["is_open"] = bool(d["is_open"])
        return Innovation(**d)

    def create(self, innovation: Innovation) -> Innovation:
        self._db.execute(
            """INSERT INTO innovations (id, idea_id, stage, is_open, summary, founder_id, principal_engineer_id, manager_id, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (innovation.id, innovation.idea_id, innovation.stage, int(innovation.is_open),
             innovation.summary, innovation.founder_id, innovation.principal_engineer_id,
             innovation.manager_id, innovation.created_at, innovation.updated_at),
        )
        return innovation

    def get_by_id(self, innovation_id: str) -> Innovation | None:
        return self._row_to_innovation(self._db.query_one("SELECT * FROM innovations WHERE id = ?", (innovation_id,)))

    def get_all(self) -> list[Innovation]:
        rows = self._db.query_all("SELECT * FROM innovations ORDER BY created_at DESC")
        return [self._row_to_innovation(r) for r in rows]

    def get_open(self) -> list[Innovation]:
        rows = self._db.query_all("SELECT * FROM innovations WHERE is_open = 1 ORDER BY created_at DESC")
        return [self._row_to_innovation(r) for r in rows]

    def get_by_idea(self, idea_id: str) -> Innovation | None:
        return self._row_to_innovation(self._db.query_one("SELECT * FROM innovations WHERE idea_id = ?", (idea_id,)))

    def update(self, innovation_id: str, **kwargs) -> Innovation | None:
        innovation = self.get_by_id(innovation_id)
        if not innovation:
            return None
        for k, v in kwargs.items():
            if hasattr(innovation, k):
                setattr(innovation, k, v)
        self._db.execute(
            """UPDATE innovations SET stage = ?, is_open = ?, summary = ?, founder_id = ?, principal_engineer_id = ?, manager_id = ?, updated_at = ?
               WHERE id = ?""",
            (innovation.stage, int(innovation.is_open), innovation.summary,
             innovation.founder_id, innovation.principal_engineer_id, innovation.manager_id,
             innovation.updated_at, innovation.id),
        )
        return innovation

    def delete(self, innovation_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM innovations WHERE id = ?", (innovation_id,))
        return cursor.rowcount > 0

    def count_by_stage(self, stage: str) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM innovations WHERE stage = ?", (stage,))
        return row["cnt"] if row else 0


InnovationRepository = InMemoryInnovationRepository
