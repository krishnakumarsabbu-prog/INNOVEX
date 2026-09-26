import json
from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Team


class TeamRepository:
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def _row_to_team(self, row) -> Team | None:
        if not row:
            return None
        d = dict(row)
        d["member_ids"] = json.loads(d.get("member_ids", "[]"))
        return Team(**d)

    def create(self, team: Team) -> Team:
        self._db.execute(
            "INSERT INTO teams (id, name, innovation_id, project_id, lead_id, member_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (team.id, team.name, team.innovation_id, team.project_id, team.lead_id,
             json.dumps(team.member_ids), team.created_at, team.updated_at),
        )
        return team

    def get_by_id(self, team_id: str) -> Team | None:
        return self._row_to_team(self._db.query_one("SELECT * FROM teams WHERE id = ?", (team_id,)))

    def get_all(self) -> list[Team]:
        rows = self._db.query_all("SELECT * FROM teams ORDER BY created_at DESC")
        return [self._row_to_team(r) for r in rows]

    def get_by_innovation(self, innovation_id: str) -> list[Team]:
        rows = self._db.query_all("SELECT * FROM teams WHERE innovation_id = ? ORDER BY created_at DESC", (innovation_id,))
        return [self._row_to_team(r) for r in rows]

    def get_by_project(self, project_id: str) -> Team | None:
        return self._row_to_team(self._db.query_one("SELECT * FROM teams WHERE project_id = ?", (project_id,)))

    def update(self, team_id: str, **kwargs) -> Team | None:
        team = self.get_by_id(team_id)
        if not team:
            return None
        for k, v in kwargs.items():
            if hasattr(team, k):
                setattr(team, k, v)
        self._db.execute(
            "UPDATE teams SET name = ?, innovation_id = ?, project_id = ?, lead_id = ?, member_ids = ?, updated_at = ? WHERE id = ?",
            (team.name, team.innovation_id, team.project_id, team.lead_id,
             json.dumps(team.member_ids), team.updated_at, team.id),
        )
        return team

    def delete(self, team_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM teams WHERE id = ?", (team_id,))
        return cursor.rowcount > 0

    def count(self) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM teams")
        return row["cnt"] if row else 0
