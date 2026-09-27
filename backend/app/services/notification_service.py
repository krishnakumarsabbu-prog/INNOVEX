from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import Notification, Activity, AuditEvent


class NotificationService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def get_by_user(self, user_id: str) -> list[Notification]:
        return self._repos.notification.get_by_user(user_id)

    def get_unread_count(self, user_id: str) -> int:
        return self._repos.notification.get_unread_count(user_id)

    def mark_as_read(self, notif_id: str) -> bool:
        return self._repos.notification.mark_as_read(notif_id)

    def mark_all_read(self, user_id: str) -> bool:
        return self._repos.notification.mark_all_read(user_id)

    def get_all(self) -> list[Notification]:
        return self._repos.notification.get_all()

    def delete(self, notif_id: str) -> bool:
        return self._repos.notification.delete(notif_id)


class ActivityService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def get_all(self) -> list[Activity]:
        return self._repos.activity.get_all()

    def get_by_entity(self, entity_type: str, entity_id: str) -> list[Activity]:
        return self._repos.activity.get_by_entity(entity_type, entity_id)

    def get_filtered(self, filters: dict) -> list[Activity]:
        activities = self._repos.activity.get_all()

        entity = filters.get("entity")
        if entity:
            activities = [a for a in activities if a.entity_type == entity]

        entity_id = filters.get("entity_id")
        if entity_id:
            activities = [a for a in activities if a.entity_id == entity_id]

        actor = filters.get("actor")
        if actor:
            activities = [a for a in activities if a.user_id == actor]

        date_from = filters.get("date_from")
        if date_from:
            activities = [a for a in activities if a.created_at >= date_from]

        date_to = filters.get("date_to")
        if date_to:
            activities = [a for a in activities if a.created_at <= date_to]

        return activities


class AuditService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def get_all(self) -> list[AuditEvent]:
        return self._repos.audit.get_all()

    def get_by_entity(self, entity_type: str, entity_id: str) -> list[AuditEvent]:
        return self._repos.audit.get_by_entity(entity_type, entity_id)

    def get_filtered(self, filters: dict) -> list[AuditEvent]:
        events = self._repos.audit.get_all()

        entity = filters.get("entity")
        if entity:
            events = [a for a in events if a.entity_type == entity]

        entity_id = filters.get("entity_id")
        if entity_id:
            events = [a for a in events if a.entity_id == entity_id]

        actor = filters.get("actor")
        if actor:
            events = [a for a in events if a.user_id == actor]

        date_from = filters.get("date_from")
        if date_from:
            events = [a for a in events if a.created_at >= date_from]

        date_to = filters.get("date_to")
        if date_to:
            events = [a for a in events if a.created_at <= date_to]

        return events
