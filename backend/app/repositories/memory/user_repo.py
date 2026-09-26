import json

from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import User
from app.repositories.interfaces import UserRepositoryInterface


class InMemoryUserRepository(UserRepositoryInterface):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def _row_to_user(self, row) -> User | None:
        if not row:
            return None
        d = dict(row)
        d["skills"] = json.loads(d.get("skills", "[]"))
        return User(**d)

    def create(self, user: User) -> User:
        self._db.execute(
            """INSERT INTO users (id, name, email, role, title, department, skills, created_at, updated_at, created_by, updated_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user.id, user.name, user.email, user.role, user.title, user.department,
             json.dumps(user.skills), user.created_at, user.updated_at, user.created_by, user.updated_by),
        )
        return user

    def get_by_id(self, user_id: str) -> User | None:
        return self._row_to_user(self._db.query_one("SELECT * FROM users WHERE id = ?", (user_id,)))

    def get_by_email(self, email: str) -> User | None:
        return self._row_to_user(self._db.query_one("SELECT * FROM users WHERE email = ?", (email,)))

    def get_all(self) -> list[User]:
        rows = self._db.query_all("SELECT * FROM users ORDER BY created_at DESC")
        return [self._row_to_user(r) for r in rows]

    def get_by_role(self, role: str) -> list[User]:
        rows = self._db.query_all("SELECT * FROM users WHERE role = ? ORDER BY created_at DESC", (role,))
        return [self._row_to_user(r) for r in rows]

    def update(self, user_id: str, **kwargs) -> User | None:
        user = self.get_by_id(user_id)
        if not user:
            return None
        for k, v in kwargs.items():
            if hasattr(user, k):
                setattr(user, k, v)
        self._db.execute(
            """UPDATE users SET name = ?, email = ?, role = ?, title = ?, department = ?, skills = ?, updated_at = ?, updated_by = ?
               WHERE id = ?""",
            (user.name, user.email, user.role, user.title, user.department,
             json.dumps(user.skills), user.updated_at, user.updated_by, user.id),
        )
        return user

    def delete(self, user_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM users WHERE id = ?", (user_id,))
        return cursor.rowcount > 0

    def count(self) -> int:
        row = self._db.query_one("SELECT COUNT(*) as cnt FROM users")
        return row["cnt"] if row else 0

    def search(self, query: str) -> list[User]:
        pattern = f"%{query}%"
        rows = self._db.query_all(
            "SELECT * FROM users WHERE name LIKE ? OR email LIKE ? OR department LIKE ? ORDER BY created_at DESC",
            (pattern, pattern, pattern),
        )
        return [self._row_to_user(r) for r in rows]


UserRepository = InMemoryUserRepository
