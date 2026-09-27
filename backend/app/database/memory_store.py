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
    description TEXT DEFAULT '',
    required_skills TEXT DEFAULT '[]',
    preferred_skills TEXT DEFAULT '[]',
    capacity INTEGER NOT NULL DEFAULT 1,
    filled INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open',
    commitment TEXT DEFAULT '',
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
    role_id TEXT DEFAULT '',
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

CREATE TABLE IF NOT EXISTS technology_taxonomy (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS business_areas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_panels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    member_ids TEXT DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflows (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    stages TEXT DEFAULT '[]',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS policies (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    value TEXT NOT NULL DEFAULT '',
    policy_type TEXT NOT NULL DEFAULT 'string',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""


def init_db() -> None:
    db = DatabaseConnection.get_instance()
    db.execute_script(SCHEMA_SQL)
    _migrate_validation_sprints(db)
    _migrate_innovation_roles(db)
    _migrate_join_requests(db)
    _seed_technology_taxonomy(db)
    _seed_default_policies(db)
    _seed_business_areas(db)
    _seed_review_panels(db)
    _seed_skills(db)
    _seed_workflows(db)
    _seed_personas(db)


TECHNOLOGY_TAXONOMY_SEED = [
    ("AI / ML", "Artificial Intelligence & Machine Learning"),
    ("React", "Frontend"),
    ("Angular", "Frontend"),
    ("Java", "Backend"),
    ("Spring", "Backend"),
    ("Python", "Backend"),
    ("Node", "Backend"),
    ("Cloud", "Infrastructure"),
    ("AWS", "Cloud Provider"),
    ("Azure", "Cloud Provider"),
    ("GCP", "Cloud Provider"),
    ("Data", "Data Engineering"),
    ("Security", "Security"),
    ("DevOps", "DevOps"),
    ("Testing", "Quality Assurance"),
    ("Observability", "Monitoring"),
    ("Architecture", "Architecture"),
]


DEFAULT_POLICIES = [
    ("required_review", "Required Review", "Whether a formal review is required before an idea advances", "true", "boolean"),
    ("validation_requirement", "Validation Requirement", "Whether a validation sprint is required before approval", "true", "boolean"),
    ("security_review", "Security Review", "Whether a security review is required during validation", "true", "boolean"),
    ("evidence_requirement", "Evidence Requirement", "Minimum number of evidence items required for validation", "3", "integer"),
    ("team_size", "Team Size", "Maximum recommended team size for an innovation project", "8", "integer"),
    ("poc_duration", "POC Duration", "Maximum duration in weeks for a proof-of-concept sprint", "4", "integer"),
    ("approval_requirements", "Approval Requirements", "Comma-separated list of roles that must approve an idea", "principal_engineer,manager", "string"),
]


def _seed_technology_taxonomy(db: DatabaseConnection) -> None:
    from app.core.security import generate_id, utc_now
    existing = db.query_one("SELECT COUNT(*) as cnt FROM technology_taxonomy")
    if existing and existing["cnt"] > 0:
        return
    now = utc_now()
    for name, category in TECHNOLOGY_TAXONOMY_SEED:
        db.execute(
            "INSERT INTO technology_taxonomy (id, name, category, description, created_at, updated_at) VALUES (?, ?, ?, '', ?, ?)",
            (generate_id(), name, category, now, now),
        )


def _seed_default_policies(db: DatabaseConnection) -> None:
    from app.core.security import generate_id, utc_now
    existing = db.query_one("SELECT COUNT(*) as cnt FROM policies")
    if existing and existing["cnt"] > 0:
        return
    now = utc_now()
    for key, name, desc, value, ptype in DEFAULT_POLICIES:
        db.execute(
            "INSERT INTO policies (id, key, name, description, value, policy_type, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)",
            (generate_id(), key, name, desc, value, ptype, now, now),
        )


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


def _migrate_innovation_roles(db: DatabaseConnection) -> None:
    cols = {row["name"] for row in db.query_all("PRAGMA table_info(innovation_roles)")}
    for col, col_type in [
        ("description", "TEXT DEFAULT ''"),
        ("required_skills", "TEXT DEFAULT '[]'"),
        ("preferred_skills", "TEXT DEFAULT '[]'"),
        ("commitment", "TEXT DEFAULT ''"),
    ]:
        if col not in cols:
            db.execute(f"ALTER TABLE innovation_roles ADD COLUMN {col} {col_type}")


def _migrate_join_requests(db: DatabaseConnection) -> None:
    cols = {row["name"] for row in db.query_all("PRAGMA table_info(join_requests)")}
    if "role_id" not in cols:
        db.execute("ALTER TABLE join_requests ADD COLUMN role_id TEXT DEFAULT ''")


BUSINESS_AREAS_SEED = [
    ("Core Banking", "Core transaction processing, accounts, ledgers, and settlement engines"),
    ("Payments & Transfers", "Domestic and cross-border payment rails, instant transfers, card acquiring"),
    ("Digital Channels", "Web, mobile applications, conversational interfaces, and customer self-service"),
    ("Risk & Compliance", "Fraud detection, regulatory compliance, credit decisioning, AML"),
    ("Data & AI", "Data warehousing, streaming analytics, machine learning platforms, LLM tooling"),
    ("Cloud & Infrastructure", "Kubernetes platform engineering, cloud security, network automation"),
    ("Developer Experience", "CI/CD pipelines, testing automation, developer tools, telemetry and observability"),
]

REVIEW_PANELS_SEED = [
    ("Architecture Review Board (ARB)", "Evaluates high-level technical architecture, feasibility, and scalability"),
    ("Security & Compliance Panel", "Assesses data privacy, security posture, compliance, and threat surfaces"),
    ("Executive Innovation Council", "Evaluates strategic alignment, commercial impact, and budget allocation"),
]

SKILLS_SEED = [
    ("Python", "Backend"),
    ("TypeScript", "Frontend"),
    ("React", "Frontend"),
    ("FastAPI", "Backend"),
    ("Java", "Backend"),
    ("Spring Boot", "Backend"),
    ("Docker", "DevOps"),
    ("Kubernetes", "DevOps"),
    ("AWS", "Cloud"),
    ("Azure", "Cloud"),
    ("GCP", "Cloud"),
    ("Machine Learning", "AI / ML"),
    ("Deep Learning", "AI / ML"),
    ("System Design", "Architecture"),
    ("Microservices", "Architecture"),
    ("PostgreSQL", "Database"),
    ("Redis", "Database"),
    ("Kafka", "Messaging"),
    ("GraphQL", "API"),
    ("Cybersecurity", "Security"),
    ("DevOps & CI/CD", "DevOps"),
]


def _seed_business_areas(db: DatabaseConnection) -> None:
    from app.core.security import generate_id, utc_now
    existing = db.query_one("SELECT COUNT(*) as cnt FROM business_areas")
    if existing and existing["cnt"] > 0:
        return
    now = utc_now()
    for name, desc in BUSINESS_AREAS_SEED:
        db.execute(
            "INSERT INTO business_areas (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (generate_id(), name, desc, now, now),
        )


def _seed_review_panels(db: DatabaseConnection) -> None:
    from app.core.security import generate_id, utc_now
    existing = db.query_one("SELECT COUNT(*) as cnt FROM review_panels")
    if existing and existing["cnt"] > 0:
        return
    now = utc_now()
    # Try to include the first user (admin) if available
    admin = db.query_one("SELECT id FROM users LIMIT 1")
    member_ids = f'["{admin["id"]}"]' if admin else '[]'
    for name, desc in REVIEW_PANELS_SEED:
        db.execute(
            "INSERT INTO review_panels (id, name, description, member_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (generate_id(), name, desc, member_ids, now, now),
        )


def _seed_skills(db: DatabaseConnection) -> None:
    from app.core.security import generate_id, utc_now
    existing = db.query_one("SELECT COUNT(*) as cnt FROM skills")
    if existing and existing["cnt"] > 0:
        return
    now = utc_now()
    for name, category in SKILLS_SEED:
        db.execute(
            "INSERT INTO skills (id, name, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (generate_id(), name, category, now, now),
        )


def _seed_workflows(db: DatabaseConnection) -> None:
    import json
    from app.core.security import generate_id, utc_now
    existing = db.query_one("SELECT COUNT(*) as cnt FROM workflows")
    if existing and existing["cnt"] > 0:
        return
    now = utc_now()
    stages = json.dumps([
        "draft", "submitted", "under_review", "validation", "approved",
        "open_for_team", "building", "poc", "demo", "adopted"
    ])
    db.execute(
        "INSERT INTO workflows (id, name, description, stages, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?)",
        (
            generate_id(),
            "Standard Innovation Lifecycle",
            "End-to-end innovation pipeline from idea drafting to enterprise adoption",
            stages,
            now,
            now,
        ),
    )


def _seed_personas(db: DatabaseConnection) -> None:
    import json
    from app.core.security import generate_id, utc_now

    existing = db.query_all("SELECT email, role FROM users")
    existing_roles = {r["role"] for r in existing} if existing else set()
    existing_emails = {r["email"] for r in existing} if existing else set()

    # If principal_engineer or admin does not exist, seed standard personas
    if "principal_engineer" not in existing_roles or "admin" not in existing_roles:
        now = utc_now()
        personas = [
            ("Dr. Marcus Vance", "marcus.vance@innovex.corp", "principal_engineer", "Principal Systems Engineer", "Core Architecture", ["Architecture", "AI / ML", "Cloud", "Security", "Distributed Systems"]),
            ("Sarah Chen", "sarah.chen@innovex.corp", "admin", "Chief Technology Officer & Admin", "Executive Innovation", ["Architecture", "Governance", "Cloud", "DevOps"]),
            ("Elena Rostova", "elena.rostova@innovex.corp", "manager", "Engineering Director", "Platform Engineering", ["Leadership", "Cloud", "Agile", "Testing"]),
            ("David Kim", "david.kim@innovex.corp", "panel_member", "Innovation Panel Chair & Staff Eng", "Emerging Technologies", ["AI / ML", "Python", "React", "Data"]),
            ("Alex Morgan", "alex.morgan@innovex.corp", "engineer", "Senior Software Engineer", "Applications & Services", ["React", "Node", "Python", "Observability"]),
            ("Priya Sharma", "priya.sharma@innovex.corp", "contributor", "Product & Innovation Specialist", "Product Management", ["Business Strategy", "Product Design", "Testing"]),
        ]
        for name, email, role, title, dept, skills in personas:
            if email not in existing_emails:
                db.execute(
                    """INSERT INTO users (id, name, email, role, title, department, skills, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (generate_id(), name, email, role, title, dept, json.dumps(skills), now, now),
                )
