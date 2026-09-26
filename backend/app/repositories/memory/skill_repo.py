from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import Skill
from app.repositories.interfaces import SkillRepositoryInterface


class InMemorySkillRepository(SkillRepositoryInterface):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, skill: Skill) -> Skill:
        self._db.execute(
            "INSERT INTO skills (id, name, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (skill.id, skill.name, skill.category, skill.created_at, skill.updated_at),
        )
        return skill

    def get_by_id(self, skill_id: str) -> Skill | None:
        row = self._db.query_one("SELECT * FROM skills WHERE id = ?", (skill_id,))
        return Skill(**dict(row)) if row else None

    def get_by_name(self, name: str) -> Skill | None:
        row = self._db.query_one("SELECT * FROM skills WHERE name = ?", (name,))
        return Skill(**dict(row)) if row else None

    def get_by_category(self, category: str) -> list[Skill]:
        rows = self._db.query_all("SELECT * FROM skills WHERE category = ? ORDER BY name", (category,))
        return [Skill(**dict(r)) for r in rows]

    def get_all(self) -> list[Skill]:
        rows = self._db.query_all("SELECT * FROM skills ORDER BY name")
        return [Skill(**dict(r)) for r in rows]

    def update(self, skill_id: str, **kwargs) -> Skill | None:
        skill = self.get_by_id(skill_id)
        if not skill:
            return None
        for k, v in kwargs.items():
            if hasattr(skill, k):
                setattr(skill, k, v)
        self._db.execute(
            "UPDATE skills SET name = ?, category = ?, updated_at = ? WHERE id = ?",
            (skill.name, skill.category, skill.updated_at, skill.id),
        )
        return skill

    def delete(self, skill_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM skills WHERE id = ?", (skill_id,))
        return cursor.rowcount > 0

    def count(self) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM skills")
        return row["cnt"] if row else 0


SkillRepository = InMemorySkillRepository
