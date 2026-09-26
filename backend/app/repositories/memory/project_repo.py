from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Project
from app.repositories.interfaces import ProjectRepositoryInterface


class InMemoryProjectRepository(ProjectRepositoryInterface):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, project: Project) -> Project:
        self._db.execute(
            """INSERT INTO projects (id, name, innovation_id, team_id, description, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (project.id, project.name, project.innovation_id, project.team_id, project.description,
             project.status, project.created_at, project.updated_at),
        )
        return project

    def get_by_id(self, project_id: str) -> Project | None:
        row = self._db.query_one("SELECT * FROM projects WHERE id = ?", (project_id,))
        return Project(**dict(row)) if row else None

    def get_all(self) -> list[Project]:
        rows = self._db.query_all("SELECT * FROM projects ORDER BY created_at DESC")
        return [Project(**dict(r)) for r in rows]

    def get_by_innovation(self, innovation_id: str) -> list[Project]:
        rows = self._db.query_all("SELECT * FROM projects WHERE innovation_id = ? ORDER BY created_at DESC", (innovation_id,))
        return [Project(**dict(r)) for r in rows]

    def get_by_team(self, team_id: str) -> list[Project]:
        rows = self._db.query_all("SELECT * FROM projects WHERE team_id = ? ORDER BY created_at DESC", (team_id,))
        return [Project(**dict(r)) for r in rows]

    def update(self, project_id: str, **kwargs) -> Project | None:
        project = self.get_by_id(project_id)
        if not project:
            return None
        for k, v in kwargs.items():
            if hasattr(project, k):
                setattr(project, k, v)
        self._db.execute(
            "UPDATE projects SET name = ?, innovation_id = ?, team_id = ?, description = ?, status = ?, updated_at = ? WHERE id = ?",
            (project.name, project.innovation_id, project.team_id, project.description, project.status, project.updated_at, project.id),
        )
        return project

    def delete(self, project_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        return cursor.rowcount > 0

    def count(self) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM projects")
        return row["cnt"] if row else 0

    def count_by_status(self, status: str) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM projects WHERE status = ?", (status,))
        return row["cnt"] if row else 0


ProjectRepository = InMemoryProjectRepository
