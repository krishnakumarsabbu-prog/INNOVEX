import sqlite3
import threading
from contextlib import contextmanager

from app.core.config import settings


class DatabaseConnection:
    _instance: "DatabaseConnection | None" = None
    _lock = threading.Lock()

    def __init__(self, db_path: str):
        self._db_path = db_path
        self._local = threading.local()

    @classmethod
    def get_instance(cls) -> "DatabaseConnection":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = DatabaseConnection(settings.DATABASE_PATH)
        return cls._instance

    def _get_conn(self) -> sqlite3.Connection:
        if not hasattr(self._local, "conn"):
            conn = sqlite3.connect(self._db_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA foreign_keys=ON")
            self._local.conn = conn
        return self._local.conn

    @contextmanager
    def connection(self):
        conn = self._get_conn()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise

    def execute(self, sql: str, params: tuple = ()) -> sqlite3.Cursor:
        conn = self._get_conn()
        cursor = conn.execute(sql, params)
        conn.commit()
        return cursor

    def execute_script(self, sql: str) -> None:
        conn = self._get_conn()
        conn.executescript(sql)
        conn.commit()

    def query_one(self, sql: str, params: tuple = ()) -> sqlite3.Row | None:
        conn = self._get_conn()
        return conn.execute(sql, params).fetchone()

    def query_all(self, sql: str, params: tuple = ()) -> list[sqlite3.Row]:
        conn = self._get_conn()
        return conn.execute(sql, params).fetchall()


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT,
    updated_by TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    title TEXT DEFAULT '',
    department TEXT DEFAULT '',
    skills TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT,
    updated_by TEXT
);

CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY,
    organization_id TEXT,
    title TEXT NOT NULL,
    problem_statement TEXT DEFAULT '',
    proposed_solution TEXT DEFAULT '',
    business_impact TEXT DEFAULT '',
    engineering_impact TEXT DEFAULT '',
    expected_benefits TEXT DEFAULT '',
    business_area TEXT DEFAULT '',
    technologies TEXT DEFAULT '[]',
    dependencies TEXT DEFAULT '',
    risks TEXT DEFAULT '',
    estimated_complexity TEXT DEFAULT '',
    estimated_duration TEXT DEFAULT '',
    founder_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT,
    updated_by TEXT,
    FOREIGN KEY (founder_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS idea_technologies (
    id TEXT PRIMARY KEY,
    idea_id TEXT NOT NULL,
    technology TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (idea_id) REFERENCES ideas(id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    idea_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    decision TEXT NOT NULL DEFAULT 'pending',
    comments TEXT DEFAULT '',
    reason TEXT DEFAULT '',
    evidence TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (idea_id) REFERENCES ideas(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS review_dimensions (
    id TEXT PRIMARY KEY,
    review_id TEXT NOT NULL,
    dimension TEXT NOT NULL,
    rating TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    FOREIGN KEY (review_id) REFERENCES reviews(id)
);

CREATE TABLE IF NOT EXISTS review_assignments (
    id TEXT PRIMARY KEY,
    idea_id TEXT NOT NULL,
    reviewer_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (idea_id) REFERENCES ideas(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS validation_sprints (
    id TEXT PRIMARY KEY,
    idea_id TEXT NOT NULL,
    principal_engineer_id TEXT,
    manager_id TEXT,
    status TEXT NOT NULL DEFAULT 'not_started',
    start_date TEXT,
    end_date TEXT,
    objectives TEXT DEFAULT '',
    findings TEXT DEFAULT '',
    objectives_checklist TEXT DEFAULT '[]',
    checklist TEXT DEFAULT '[]',
    decision TEXT,
    decision_reason TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (idea_id) REFERENCES ideas(id)
);

CREATE TABLE IF NOT EXISTS validation_evidence (
    id TEXT PRIMARY KEY,
    sprint_id TEXT NOT NULL,
    evidence_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    url TEXT DEFAULT '',
    conclusion TEXT DEFAULT '',
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (sprint_id) REFERENCES validation_sprints(id)
);

CREATE TABLE IF NOT EXISTS innovations (
    id TEXT PRIMARY KEY,
    idea_id TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'validation',
    is_open INTEGER NOT NULL DEFAULT 0,
    summary TEXT DEFAULT '',
    founder_id TEXT,
    principal_engineer_id TEXT,
    manager_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (idea_id) REFERENCES ideas(id)
);

CREATE TABLE IF NOT EXISTS innovation_roles (
    id TEXT PRIMARY KEY,
    innovation_id TEXT NOT NULL,
    title TEXT NOT NULL,
    role TEXT NOT NULL,
    technology TEXT DEFAULT '',
    capacity INTEGER NOT NULL DEFAULT 1,
    filled INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (innovation_id) REFERENCES innovations(id)
);

CREATE TABLE IF NOT EXISTS team_memberships (
    id TEXT PRIMARY KEY,
    innovation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT '',
    joined_at TEXT NOT NULL,
    FOREIGN KEY (innovation_id) REFERENCES innovations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS join_requests (
    id TEXT PRIMARY KEY,
    innovation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'requested',
    message TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (innovation_id) REFERENCES innovations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    innovation_id TEXT,
    project_id TEXT,
    lead_id TEXT,
    member_ids TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    innovation_id TEXT,
    team_id TEXT,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'not_started',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS work_items (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    milestone_id TEXT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'backlog',
    assignee_id TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (milestone_id) REFERENCES milestones(id)
);

CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    evidence_type TEXT DEFAULT 'document',
    url TEXT DEFAULT '',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY,
    innovation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(innovation_id, user_id),
    FOREIGN KEY (innovation_id) REFERENCES innovations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    user_id TEXT,
    details TEXT DEFAULT '',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS idea_follows (
    id TEXT PRIMARY KEY,
    idea_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(idea_id, user_id),
    FOREIGN KEY (idea_id) REFERENCES ideas(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS idea_evidence (
    id TEXT PRIMARY KEY,
    idea_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    evidence_type TEXT DEFAULT 'document',
    url TEXT DEFAULT '',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (idea_id) REFERENCES ideas(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
"""


def init_db() -> None:
    db = DatabaseConnection.get_instance()
    db.execute_script(SCHEMA_SQL)
    _migrate_validation_sprints(db)


def _migrate_validation_sprints(db: DatabaseConnection) -> None:
    cols = {row["name"] for row in db.query_all("PRAGMA table_info(validation_sprints)")}
    for col, col_type in [
        ("objectives_checklist", "TEXT DEFAULT '[]'"),
        ("checklist", "TEXT DEFAULT '[]'"),
        ("decision", "TEXT"),
        ("decision_reason", "TEXT DEFAULT ''"),
    ]:
        if col not in cols:
            db.execute(f"ALTER TABLE validation_sprints ADD COLUMN {col} {col_type}")
