from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.services.notification_service import NotificationService, ActivityService, AuditService
from app.schemas.models import NotificationResponse, ActivityResponse, AuditEventResponse

router = APIRouter(tags=["notifications"])


def get_notification_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> NotificationService:
    return NotificationService(repos)


def get_activity_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> ActivityService:
    return ActivityService(repos)


def get_audit_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> AuditService:
    return AuditService(repos)


# ---- Notifications ----

@router.get("/notifications", response_model=list[NotificationResponse])
async def get_all_notifications(service: NotificationService = Depends(get_notification_service)):
    notifs = service.get_all()
    return [NotificationResponse(**_notif_dict(n)) for n in notifs]


@router.get("/notifications/user/{user_id}", response_model=list[NotificationResponse])
async def get_user_notifications(user_id: str, service: NotificationService = Depends(get_notification_service)):
    notifs = service.get_by_user(user_id)
    return [NotificationResponse(**_notif_dict(n)) for n in notifs]


@router.get("/notifications/user/{user_id}/unread-count")
async def get_unread_count(user_id: str, service: NotificationService = Depends(get_notification_service)):
    return {"count": service.get_unread_count(user_id)}


@router.post("/notifications/{notif_id}/read")
async def mark_as_read(notif_id: str, service: NotificationService = Depends(get_notification_service)):
    service.mark_as_read(notif_id)
    return {"read": True}


@router.post("/notifications/read-all")
async def mark_all_read(body: dict, service: NotificationService = Depends(get_notification_service)):
    user_id = body.get("user_id", "")
    service.mark_all_read(user_id)
    return {"read": True}


@router.put("/notifications/{notif_id}/read")
async def mark_as_read_put(notif_id: str, service: NotificationService = Depends(get_notification_service)):
    service.mark_as_read(notif_id)
    return {"read": True}


@router.put("/notifications/user/{user_id}/read-all")
async def mark_all_read_put(user_id: str, service: NotificationService = Depends(get_notification_service)):
    service.mark_all_read(user_id)
    return {"read": True}


@router.delete("/notifications/{notif_id}")
async def delete_notification(notif_id: str, service: NotificationService = Depends(get_notification_service)):
    service.delete(notif_id)
    return {"deleted": True}


# ---- Activity ----

@router.get("/activity", response_model=list[ActivityResponse])
async def get_activities(
    entity: str | None = Query(None),
    entity_id: str | None = Query(None),
    actor: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    service: ActivityService = Depends(get_activity_service),
):
    filters: dict = {}
    if entity:
        filters["entity"] = entity
    if entity_id:
        filters["entity_id"] = entity_id
    if actor:
        filters["actor"] = actor
    if date_from:
        filters["date_from"] = date_from
    if date_to:
        filters["date_to"] = date_to
    if filters:
        activities = service.get_filtered(filters)
    else:
        activities = service.get_all()
    return [ActivityResponse(**_activity_dict(a)) for a in activities]


@router.get("/activities", response_model=list[ActivityResponse])
async def get_all_activities(service: ActivityService = Depends(get_activity_service)):
    activities = service.get_all()
    return [ActivityResponse(**_activity_dict(a)) for a in activities]


@router.get("/activities/{entity_type}/{entity_id}", response_model=list[ActivityResponse])
async def get_entity_activities(entity_type: str, entity_id: str, service: ActivityService = Depends(get_activity_service)):
    activities = service.get_by_entity(entity_type, entity_id)
    return [ActivityResponse(**_activity_dict(a)) for a in activities]


# ---- Audit ----

@router.get("/audit", response_model=list[AuditEventResponse])
async def get_audit_events(
    entity: str | None = Query(None),
    entity_id: str | None = Query(None),
    actor: str | None = Query(None),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    service: AuditService = Depends(get_audit_service),
):
    filters: dict = {}
    if entity:
        filters["entity"] = entity
    if entity_id:
        filters["entity_id"] = entity_id
    if actor:
        filters["actor"] = actor
    if date_from:
        filters["date_from"] = date_from
    if date_to:
        filters["date_to"] = date_to
    if filters:
        events = service.get_filtered(filters)
    else:
        events = service.get_all()
    return [AuditEventResponse(**_audit_dict(a)) for a in events]


@router.get("/audit-events", response_model=list[AuditEventResponse])
async def get_all_audit_events(service: AuditService = Depends(get_audit_service)):
    events = service.get_all()
    return [AuditEventResponse(**_audit_dict(a)) for a in events]


@router.get("/audit-events/{entity_type}/{entity_id}", response_model=list[AuditEventResponse])
async def get_entity_audit_events(entity_type: str, entity_id: str, service: AuditService = Depends(get_audit_service)):
    events = service.get_by_entity(entity_type, entity_id)
    return [AuditEventResponse(**_audit_dict(a)) for a in events]


def _notif_dict(n) -> dict:
    return {"id": n.id, "user_id": n.user_id, "message": n.message, "read": n.read, "created_at": n.created_at}


def _activity_dict(a) -> dict:
    return {
        "id": a.id, "entity_type": a.entity_type, "entity_id": a.entity_id,
        "action": a.action, "description": a.description, "user_id": a.user_id, "created_at": a.created_at,
    }


def _audit_dict(a) -> dict:
    return {
        "id": a.id, "entity_type": a.entity_type, "entity_id": a.entity_id,
        "action": a.action, "user_id": a.user_id, "details": a.details, "created_at": a.created_at,
    }
