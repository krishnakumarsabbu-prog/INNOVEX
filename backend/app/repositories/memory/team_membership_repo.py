from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import TeamMembership
from app.repositories.interfaces import BaseRepository


class InMemoryTeamMembershipRepository(BaseRepository):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, membership: TeamMembership) -> TeamMembership:
        self._db.execute(
            "INSERT INTO team_memberships (id, innovation_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)",
            (membership.id, membership.innovation_id, membership.user_id, membership.role, membership.joined_at),
        )
        return membership

    def get_by_id(self, membership_id: str) -> TeamMembership | None:
        row = self._db.query_one("SELECT * FROM team_memberships WHERE id = ?", (membership_id,))
        return TeamMembership(**dict(row)) if row else None

    def get_all(self) -> list[TeamMembership]:
        rows = self._db.query_all("SELECT * FROM team_memberships ORDER BY joined_at DESC")
        return [TeamMembership(**dict(r)) for r in rows]

    def get_by_innovation(self, innovation_id: str) -> list[TeamMembership]:
        rows = self._db.query_all("SELECT * FROM team_memberships WHERE innovation_id = ? ORDER BY joined_at DESC", (innovation_id,))
        return [TeamMembership(**dict(r)) for r in rows]

    def get_by_user(self, user_id: str) -> list[TeamMembership]:
        rows = self._db.query_all("SELECT * FROM team_memberships WHERE user_id = ? ORDER BY joined_at DESC", (user_id,))
        return [TeamMembership(**dict(r)) for r in rows]

    def update(self, membership_id: str, **kwargs) -> TeamMembership | None:
        membership = self.get_by_id(membership_id)
        if not membership:
            return None
        for k, v in kwargs.items():
            if hasattr(membership, k):
                setattr(membership, k, v)
        self._db.execute(
            "UPDATE team_memberships SET role = ? WHERE id = ?",
            (membership.role, membership.id),
        )
        return membership

    def delete(self, membership_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM team_memberships WHERE id = ?", (membership_id,))
        return cursor.rowcount > 0

    def delete_by_innovation_and_user(self, innovation_id: str, user_id: str) -> bool:
        cursor = self._db.execute(
            "DELETE FROM team_memberships WHERE innovation_id = ? AND user_id = ?",
            (innovation_id, user_id),
        )
        return cursor.rowcount > 0


TeamMembershipRepository = InMemoryTeamMembershipRepository
