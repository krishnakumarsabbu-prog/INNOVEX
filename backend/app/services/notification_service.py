from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import Notification, Activity


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


class AuditService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def get_all(self):
        return self._repos.audit.get_all()

    def get_by_entity(self, entity_type: str, entity_id: str):
        return self._repos.audit.get_by_entity(entity_type, entity_id)
