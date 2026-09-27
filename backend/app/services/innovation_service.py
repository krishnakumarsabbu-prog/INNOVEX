from app.core.security import generate_id, utc_now
from app.core.exceptions import NotFoundError, ValidationError
from app.database.repository_factory import RepositoryFactory
from app.domain.models.entities import (
    Innovation, Activity, Notification, InnovationRole, JoinRequest,
    TeamMembership, AuditEvent,
)
from app.domain.enums.types import InnovationStage, RoleStatus, JoinRequestStatus, IdeaStatus
from app.schemas.models import (
    InnovationCreate, InnovationUpdate, PositionCreate, PositionUpdate,
    ApplicationCreate, JoinRequestCreate,
    MarketplaceInnovationResponse, MarketplaceInnovationDetailResponse,
    MarketplaceRoleResponse, MarketplaceTeamMemberResponse,
    SkillMatchResponse,
)


class InnovationService:
    def __init__(self, repos: RepositoryFactory):
        self._repos = repos

    def create(self, data: InnovationCreate) -> Innovation:
        idea = self._repos.idea.get_by_id(data.idea_id)
        if not idea:
            raise NotFoundError("Idea not found")
        existing = self._repos.innovation.get_by_idea(data.idea_id)
        if existing:
            raise ValidationError("Innovation already exists for this idea")
        now = utc_now()
        innovation = Innovation(
            id=generate_id(),
            idea_id=data.idea_id,
            stage=InnovationStage.VALIDATION.value,
            is_open=False,
            summary=data.summary or (idea.proposed_solution or idea.problem_statement or idea.title)[:200],
            founder_id=data.founder_id or idea.founder_id,
            principal_engineer_id=data.principal_engineer_id,
            manager_id=data.manager_id,
            created_at=now,
            updated_at=now,
        )
        self._repos.innovation.create(innovation)

        self._repos.idea.update(idea.id, status=IdeaStatus.APPROVED.value, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="innovation", entity_id=innovation.id,
            action="created", description=f"Innovation created from idea '{idea.title}'",
            user_id=None, created_at=now,
        ))

        self._repos.audit.create(AuditEvent(
            id=generate_id(), entity_type="innovation", entity_id=innovation.id,
            action="created", user_id=None,
            details=f"Innovation created from idea '{idea.title}'", created_at=now,
        ))
        return innovation

    def get_by_id(self, innovation_id: str) -> Innovation:
        innovation = self._repos.innovation.get_by_id(innovation_id)
        if not innovation:
            raise NotFoundError("Innovation not found")
        return innovation

    def get_all(self) -> list[Innovation]:
        return self._repos.innovation.get_all()

    def get_open(self) -> list[Innovation]:
        return self._repos.innovation.get_open()

    def update(self, innovation_id: str, data: InnovationUpdate) -> Innovation:
        innovation = self.get_by_id(innovation_id)
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            setattr(innovation, k, v)
        innovation.updated_at = now
        self._repos.innovation.update(innovation_id, **update_data, updated_at=now)

        if data.is_open:
            self._repos.idea.update(innovation.idea_id, status=IdeaStatus.APPROVED.value, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="innovation", entity_id=innovation.id,
            action="updated", description=f"Innovation stage updated to {data.stage or 'open'}",
            user_id=None, created_at=now,
        ))
        return innovation

    def delete(self, innovation_id: str) -> bool:
        return self._repos.innovation.delete(innovation_id)

    # ---- Roles ----

    def create_position(self, data: PositionCreate) -> InnovationRole:
        innovation = self.get_by_id(data.innovation_id)
        now = utc_now()
        role = InnovationRole(
            id=generate_id(),
            innovation_id=data.innovation_id,
            title=data.title,
            role=data.role,
            technology=data.technology,
            description=getattr(data, "description", ""),
            required_skills=getattr(data, "required_skills", []),
            preferred_skills=getattr(data, "preferred_skills", []),
            capacity=data.capacity,
            filled=0,
            status=RoleStatus.OPEN.value,
            commitment=getattr(data, "commitment", ""),
            created_at=now,
            updated_at=now,
        )
        self._repos.innovation_role.create(role)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="position", entity_id=role.id,
            action="created", description=f"Role '{data.title}' opened for innovation",
            user_id=None, created_at=now,
        ))
        return role

    def get_positions(self, innovation_id: str) -> list[InnovationRole]:
        return self._repos.innovation_role.get_by_innovation(innovation_id)

    def get_open_positions(self) -> list[InnovationRole]:
        return self._repos.innovation_role.get_open()

    def update_position(self, position_id: str, data: PositionUpdate) -> InnovationRole:
        position = self._repos.innovation_role.get_by_id(position_id)
        if not position:
            raise NotFoundError("Position not found")
        now = utc_now()
        update_data = data.model_dump(exclude_unset=True)
        self._repos.innovation_role.update(position_id, **update_data, updated_at=now)
        return self._repos.innovation_role.get_by_id(position_id)

    def delete_position(self, position_id: str) -> bool:
        return self._repos.innovation_role.delete(position_id)

    # ---- Skill Matching ----

    def get_skill_match(self, role_id: str, user_id: str) -> SkillMatchResponse:
        role = self._repos.innovation_role.get_by_id(role_id)
        if not role:
            raise NotFoundError("Role not found")
        user = self._repos.user.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        required = [s.lower().strip() for s in role.required_skills]
        user_skills_lower = [s.lower().strip() for s in user.skills]
        user_skills_set = set(user_skills_lower)

        matched = [s for s in role.required_skills if s.lower().strip() in user_skills_set]
        missing = [s for s in role.required_skills if s.lower().strip() not in user_skills_set]

        if len(required) == 0:
            match_pct = 100
        else:
            match_pct = int((len(matched) / len(required)) * 100)

        return SkillMatchResponse(
            required_skills=role.required_skills,
            matched_skills=matched,
            missing_skills=missing,
            match_percentage=match_pct,
        )

    # ---- Join Flow ----

    def request_to_join_role(self, innovation_id: str, role_id: str, user_id: str, message: str = "") -> JoinRequest:
        innovation = self.get_by_id(innovation_id)
        user = self._repos.user.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        role = self._repos.innovation_role.get_by_id(role_id)
        if not role:
            raise NotFoundError("Role not found")
        if role.innovation_id != innovation_id:
            raise ValidationError("Role does not belong to this innovation")
        if role.status == RoleStatus.FILLED.value:
            raise ValidationError("This role is filled")

        existing = self._repos.join_request.get_by_innovation_and_user(innovation_id, user_id)
        if existing and existing.status == JoinRequestStatus.REQUESTED.value:
            raise ValidationError("Already requested to join this innovation")

        now = utc_now()
        join_req = JoinRequest(
            id=generate_id(),
            innovation_id=innovation_id,
            user_id=user_id,
            role=role.title,
            role_id=role_id,
            status=JoinRequestStatus.REQUESTED.value,
            message=message,
            created_at=now,
            updated_at=now,
        )
        self._repos.join_request.create(join_req)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="join_request", entity_id=join_req.id,
            action="requested", description=f"User requested to join role '{role.title}'",
            user_id=user_id, created_at=now,
        ))

        if innovation.founder_id:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=innovation.founder_id,
                message=f"New join request for role '{role.title}'",
                read=False, created_at=now,
            ))
        if innovation.manager_id and innovation.manager_id != innovation.founder_id:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=innovation.manager_id,
                message=f"New join request for role '{role.title}'",
                read=False, created_at=now,
            ))
        return join_req

    def approve_join_request(self, request_id: str) -> JoinRequest:
        join_req = self._repos.join_request.get_by_id(request_id)
        if not join_req:
            raise NotFoundError("Join request not found")
        if join_req.status != JoinRequestStatus.REQUESTED.value:
            raise ValidationError("Join request is not pending")

        role = None
        if join_req.role_id:
            role = self._repos.innovation_role.get_by_id(join_req.role_id)
            if role and role.status == RoleStatus.FILLED.value:
                raise ValidationError("Role is already filled")
            if role and role.filled >= role.capacity:
                raise ValidationError("Role has reached capacity")

        now = utc_now()
        self._repos.join_request.update(request_id, status=JoinRequestStatus.APPROVED.value, updated_at=now)

        self._repos.team_membership.create(TeamMembership(
            id=generate_id(),
            innovation_id=join_req.innovation_id,
            user_id=join_req.user_id,
            role=join_req.role,
            joined_at=now,
        ))

        if role:
            role.filled += 1
            if role.filled >= role.capacity:
                role.status = RoleStatus.FILLED.value
            self._repos.innovation_role.update(role.id, filled=role.filled, status=role.status, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="join_request", entity_id=join_req.id,
            action="approved", description=f"Join request approved for role '{join_req.role}'",
            user_id=join_req.user_id, created_at=now,
        ))

        self._repos.notification.create(Notification(
            id=generate_id(), user_id=join_req.user_id,
            message=f"Your join request has been approved. You are now part of the team as '{join_req.role}'.",
            read=False, created_at=now,
        ))
        return self._repos.join_request.get_by_id(request_id)

    def decline_join_request(self, request_id: str) -> JoinRequest:
        join_req = self._repos.join_request.get_by_id(request_id)
        if not join_req:
            raise NotFoundError("Join request not found")
        if join_req.status != JoinRequestStatus.REQUESTED.value:
            raise ValidationError("Join request is not pending")

        now = utc_now()
        self._repos.join_request.update(request_id, status=JoinRequestStatus.DECLINED.value, updated_at=now)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="join_request", entity_id=join_req.id,
            action="declined", description=f"Join request declined for role '{join_req.role}'",
            user_id=join_req.user_id, created_at=now,
        ))

        self._repos.notification.create(Notification(
            id=generate_id(), user_id=join_req.user_id,
            message="Your join request has been declined",
            read=False, created_at=now,
        ))
        return self._repos.join_request.get_by_id(request_id)

    def get_join_requests(self, innovation_id: str) -> list[JoinRequest]:
        return self._repos.join_request.get_by_innovation(innovation_id)

    def get_team_members(self, innovation_id: str) -> list[TeamMembership]:
        return self._repos.team_membership.get_by_innovation(innovation_id)

    # ---- Legacy join (no role_id) ----

    def apply_for_position(self, data: ApplicationCreate) -> JoinRequest:
        position = self._repos.innovation_role.get_by_id(data.position_id)
        if not position:
            raise NotFoundError("Position not found")
        if position.status != RoleStatus.OPEN.value:
            raise ValidationError("Position is not open")
        user = self._repos.user.get_by_id(data.user_id)
        if not user:
            raise NotFoundError("User not found")
        existing = self._repos.join_request.get_by_innovation_and_user(position.innovation_id, data.user_id)
        if existing:
            raise ValidationError("Already applied for this innovation")

        now = utc_now()
        join_req = JoinRequest(
            id=generate_id(),
            innovation_id=position.innovation_id,
            user_id=data.user_id,
            role=position.role,
            role_id=position.id,
            status=JoinRequestStatus.APPROVED.value,
            message=f"Auto-approved for position '{position.title}'",
            created_at=now,
            updated_at=now,
        )
        self._repos.join_request.create(join_req)

        position.filled += 1
        if position.filled >= position.capacity:
            position.status = RoleStatus.FILLED.value
        self._repos.innovation_role.update(position.id, filled=position.filled, status=position.status, updated_at=now)

        self._repos.team_membership.create(TeamMembership(
            id=generate_id(),
            innovation_id=position.innovation_id,
            user_id=data.user_id,
            role=position.role,
            joined_at=now,
        ))

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="position", entity_id=position.id,
            action="application", description=f"User applied for position '{position.title}'",
            user_id=data.user_id, created_at=now,
        ))

        self._repos.notification.create(Notification(
            id=generate_id(), user_id=data.user_id,
            message=f"You have been accepted into position '{position.title}'",
            read=False, created_at=now,
        ))

        return join_req

    def get_applications_by_position(self, position_id: str) -> list[JoinRequest]:
        position = self._repos.innovation_role.get_by_id(position_id)
        if not position:
            raise NotFoundError("Position not found")
        return self._repos.join_request.get_by_innovation(position.innovation_id)

    def get_applications_by_user(self, user_id: str) -> list[JoinRequest]:
        return self._repos.join_request.get_by_user(user_id)

    def request_to_join(self, data: JoinRequestCreate) -> JoinRequest:
        innovation = self.get_by_id(data.innovation_id)
        user = self._repos.user.get_by_id(data.user_id)
        if not user:
            raise NotFoundError("User not found")
        existing = self._repos.join_request.get_by_innovation_and_user(data.innovation_id, data.user_id)
        if existing and existing.status == JoinRequestStatus.REQUESTED.value:
            raise ValidationError("Already requested to join this innovation")

        now = utc_now()
        join_req = JoinRequest(
            id=generate_id(),
            innovation_id=data.innovation_id,
            user_id=data.user_id,
            role=data.role,
            role_id=data.role_id,
            status=JoinRequestStatus.REQUESTED.value,
            message=data.message,
            created_at=now,
            updated_at=now,
        )
        self._repos.join_request.create(join_req)

        self._repos.activity.create(Activity(
            id=generate_id(), entity_type="join_request", entity_id=join_req.id,
            action="requested", description=f"User requested to join innovation",
            user_id=data.user_id, created_at=now,
        ))

        if innovation.founder_id:
            self._repos.notification.create(Notification(
                id=generate_id(), user_id=innovation.founder_id,
                message=f"New join request for your innovation",
                read=False, created_at=now,
            ))
        return join_req

    # ---- Follow ----

    def follow(self, innovation_id: str, user_id: str) -> dict:
        from app.domain.models.entities import Follow
        self.get_by_id(innovation_id)
        existing = self._repos.follow.get_by_innovation_and_user(innovation_id, user_id)
        if existing:
            raise ValidationError("Already following")
        now = utc_now()
        follow = Follow(
            id=generate_id(),
            innovation_id=innovation_id,
            user_id=user_id,
            created_at=now,
        )
        self._repos.follow.create(follow)
        return {"id": follow.id, "innovation_id": follow.innovation_id, "user_id": follow.user_id, "created_at": follow.created_at}

    def unfollow(self, innovation_id: str, user_id: str) -> bool:
        return self._repos.follow.unfollow(innovation_id, user_id)

    def get_followers(self, innovation_id: str) -> list[dict]:
        follows = self._repos.follow.get_by_innovation(innovation_id)
        return [{"id": f.id, "innovation_id": f.innovation_id, "user_id": f.user_id, "created_at": f.created_at} for f in follows]

    def get_follower_count(self, innovation_id: str) -> int:
        return self._repos.follow.count_by_innovation(innovation_id)

    # ---- Marketplace enrichment ----

    def _user_name(self, user_id: str | None) -> str:
        if not user_id:
            return ""
        user = self._repos.user.get_by_id(user_id)
        return user.name if user else ""

    def _last_activity(self, innovation_id: str) -> str:
        activities = self._repos.activity.get_by_entity("innovation", innovation_id)
        if activities:
            return activities[0].created_at
        return ""

    def _enrich_roles(self, innovation_id: str) -> list[MarketplaceRoleResponse]:
        roles = self._repos.innovation_role.get_by_innovation(innovation_id)
        return [
            MarketplaceRoleResponse(
                id=r.id, innovation_id=r.innovation_id, title=r.title,
                role=r.role, technology=r.technology, description=r.description,
                required_skills=r.required_skills, preferred_skills=r.preferred_skills,
                capacity=r.capacity, filled=r.filled, status=r.status,
                commitment=r.commitment, created_at=r.created_at, updated_at=r.updated_at,
            )
            for r in roles
        ]

    def _enrich_team_members(self, innovation_id: str) -> list[MarketplaceTeamMemberResponse]:
        memberships = self._repos.team_membership.get_by_innovation(innovation_id)
        result: list[MarketplaceTeamMemberResponse] = []
        for m in memberships:
            user = self._repos.user.get_by_id(m.user_id)
            result.append(MarketplaceTeamMemberResponse(
                id=m.id, user_id=m.user_id, role=m.role,
                name=user.name if user else "",
                title=user.title if user else "",
                department=user.department if user else "",
                joined_at=m.joined_at,
            ))
        return result

    def _team_progress(self, innovation_id: str) -> int:
        roles = self._repos.innovation_role.get_by_innovation(innovation_id)
        if not roles:
            return 0
        total_capacity = sum(r.capacity for r in roles)
        total_filled = sum(r.filled for r in roles)
        if total_capacity == 0:
            return 0
        return int((total_filled / total_capacity) * 100)

    def _base_marketplace_dict(self, innovation: Innovation) -> dict:
        idea = self._repos.idea.get_by_id(innovation.idea_id)
        roles = self._enrich_roles(innovation.id)
        team_members = self._repos.team_membership.get_by_innovation(innovation.id)
        follower_count = self._repos.follow.count_by_innovation(innovation.id)
        return {
            "id": innovation.id,
            "idea_id": innovation.idea_id,
            "stage": innovation.stage,
            "is_open": innovation.is_open,
            "summary": innovation.summary,
            "founder_id": innovation.founder_id,
            "founder_name": self._user_name(innovation.founder_id),
            "principal_engineer_id": innovation.principal_engineer_id,
            "principal_engineer_name": self._user_name(innovation.principal_engineer_id),
            "manager_id": innovation.manager_id,
            "manager_name": self._user_name(innovation.manager_id),
            "title": idea.title if idea else innovation.summary,
            "problem_statement": idea.problem_statement if idea else "",
            "business_impact": idea.business_impact if idea else "",
            "business_area": idea.business_area if idea else "",
            "technologies": idea.technologies if idea else [],
            "team_size": len(team_members),
            "team_progress": self._team_progress(innovation.id),
            "open_roles": roles,
            "followers": follower_count,
            "last_activity": self._last_activity(innovation.id),
            "created_at": innovation.created_at,
            "updated_at": innovation.updated_at,
        }

    def get_marketplace_all(self) -> list[MarketplaceInnovationResponse]:
        innovations = self.get_all()
        return [MarketplaceInnovationResponse(**self._base_marketplace_dict(i)) for i in innovations]

    def get_marketplace_by_id(self, innovation_id: str) -> MarketplaceInnovationDetailResponse:
        innovation = self.get_by_id(innovation_id)
        base = self._base_marketplace_dict(innovation)
        idea = self._repos.idea.get_by_id(innovation.idea_id)
        base["proposed_solution"] = idea.proposed_solution if idea else ""
        base["engineering_impact"] = idea.engineering_impact if idea else ""
        base["expected_benefits"] = idea.expected_benefits if idea else ""
        base["dependencies"] = idea.dependencies if idea else ""
        base["risks"] = idea.risks if idea else ""
        base["estimated_complexity"] = idea.estimated_complexity if idea else ""
        base["estimated_duration"] = idea.estimated_duration if idea else ""
        base["team_members"] = self._enrich_team_members(innovation_id)
        return MarketplaceInnovationDetailResponse(**base)

    def create_from_idea(self, idea_id: str, data: InnovationCreate) -> Innovation:
        data.idea_id = idea_id
        return self.create(data)

    def patch_update(self, innovation_id: str, data: InnovationUpdate) -> Innovation:
        return self.update(innovation_id, data)
