from app.database.memory_store import DatabaseConnection
from app.domain.models.entities import TechnologyTaxonomyItem
from app.repositories.interfaces.administration import TechnologyTaxonomyRepositoryInterface


class InMemoryTechnologyTaxonomyRepository(TechnologyTaxonomyRepositoryInterface):
    def __init__(self, db: DatabaseConnection | None = None):
        self._db = db or DatabaseConnection.get_instance()

    def create(self, item: TechnologyTaxonomyItem) -> TechnologyTaxonomyItem:
        self._db.execute(
            "INSERT INTO technology_taxonomy (id, name, category, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (item.id, item.name, item.category, item.description, item.created_at, item.updated_at),
        )
        return item

    def get_by_id(self, item_id: str) -> TechnologyTaxonomyItem | None:
        row = self._db.query_one("SELECT * FROM technology_taxonomy WHERE id = ?", (item_id,))
        return TechnologyTaxonomyItem(**dict(row)) if row else None

    def get_by_name(self, name: str) -> TechnologyTaxonomyItem | None:
        row = self._db.query_one("SELECT * FROM technology_taxonomy WHERE name = ?", (name,))
        return TechnologyTaxonomyItem(**dict(row)) if row else None

    def get_by_category(self, category: str) -> list[TechnologyTaxonomyItem]:
        rows = self._db.query_all("SELECT * FROM technology_taxonomy WHERE category = ? ORDER BY name", (category,))
        return [TechnologyTaxonomyItem(**dict(r)) for r in rows]

    def get_all(self) -> list[TechnologyTaxonomyItem]:
        rows = self._db.query_all("SELECT * FROM technology_taxonomy ORDER BY category, name")
        return [TechnologyTaxonomyItem(**dict(r)) for r in rows]

    def update(self, item_id: str, **kwargs) -> TechnologyTaxonomyItem | None:
        item = self.get_by_id(item_id)
        if not item:
            return None
        for k, v in kwargs.items():
            if hasattr(item, k):
                setattr(item, k, v)
        self._db.execute(
            "UPDATE technology_taxonomy SET name = ?, category = ?, description = ?, updated_at = ? WHERE id = ?",
            (item.name, item.category, item.description, item.updated_at, item.id),
        )
        return item

    def delete(self, item_id: str) -> bool:
        cursor = self._db.execute("DELETE FROM technology_taxonomy WHERE id = ?", (item_id,))
        return cursor.rowcount > 0


TechnologyTaxonomyRepository = InMemoryTechnologyTaxonomyRepository
