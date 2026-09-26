from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import AuditEvent
from app.repositories.interfaces import AuditRepositoryInterface


class InMemoryAuditRepository(AuditRepositoryInterface):
    """Append-only audit event store. Update and delete are not permitted."""

    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, event: AuditEvent) -> AuditEvent:
        self._db.execute(
            "INSERT INTO audit_events (id, entity_type, entity_id, action, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (event.id, event.entity_type, event.entity_id, event.action, event.user_id, event.details, event.created_at),
        )
        return event

    def get_by_id(self, event_id: str) -> AuditEvent | None:
        row = self._db.query_one("SELECT * FROM audit_events WHERE id = ?", (event_id,))
        return AuditEvent(**dict(row)) if row else None

    def get_all(self) -> list[AuditEvent]:
        rows = self._db.query_all("SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 200")
        return [AuditEvent(**dict(r)) for r in rows]

    def get_by_entity(self, entity_type: str, entity_id: str) -> list[AuditEvent]:
        rows = self._db.query_all(
            "SELECT * FROM audit_events WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC",
            (entity_type, entity_id),
        )
        return [AuditEvent(**dict(r)) for r in rows]

    def count(self) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM audit_events")
        return row["cnt"] if row else 0


AuditRepository = InMemoryAuditRepository
