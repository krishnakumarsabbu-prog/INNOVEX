from __future__ import annotations

from app.ai.provider import AIProvider, AIContext, AIRecommendation
from app.ai.development_adapter import DevelopmentAdapter
from app.ai.llm_adapter import LLMAdapter
from app.database.repository_factory import RepositoryFactory
from app.core.exceptions import NotFoundError


# Capabilities grouped by domain, used to validate requests and drive the
# frontend's contextual actions.
CAPABILITIES_BY_DOMAIN: dict[str, list[str]] = {
    "idea": [
        "analyze_idea",
        "find_similar_ideas",
        "identify_technologies",
        "identify_dependencies",
        "suggest_validation_questions",
        "suggest_roles",
    ],
    "review": [
        "summarize_evidence",
        "identify_missing_information",
        "generate_review_questions",
        "identify_risks",
    ],
    "validation": [
        "generate_validation_checklist",
        "suggest_poc_scope",
        "identify_technical_risks",
    ],
    "team": [
        "identify_skill_gaps",
        "recommend_roles",
        "suggest_potential_contributors",
    ],
    "engineering": [
        "summarize_progress",
        "identify_blockers",
        "generate_risk_summary",
        "summarize_engineering_evidence",
        "prepare_demo_summary",
    ],
}

ALL_CAPABILITIES: list[str] = [c for caps in CAPABILITIES_BY_DOMAIN.values() for c in caps]


class AICopilotService:
    """Orchestrates AI analysis across the innovation lifecycle.

    This service gathers context from the repositories, builds an AIContext,
    and delegates to the configured AIProvider.  It never mutates business
    data and never makes decisions -- it only returns recommendations.
    """

    def __init__(self, repos: RepositoryFactory, provider: AIProvider | None = None):
        self._repos = repos
        self._provider = provider or LLMAdapter()

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #

    def get_capabilities(self) -> dict[str, list[str]]:
        return CAPABILITIES_BY_DOMAIN

    def analyze(self, capability: str, entity_type: str, entity_id: str) -> list[dict]:
        if capability not in ALL_CAPABILITIES:
            raise NotFoundError(f"Unknown AI capability: {capability}")

        context = self._build_context(capability, entity_type, entity_id)
        recs = self._provider.analyze(context)
        return [r.to_dict() for r in recs]

    def get_context_capabilities(self, entity_type: str, entity_id: str) -> list[dict]:
        """Return the capabilities available for a given page context."""
        domain = self._domain_for_entity(entity_type)
        caps = CAPABILITIES_BY_DOMAIN.get(domain, [])
        return [{"capability": c, "label": c.replace("_", " ").title()} for c in caps]

    # ------------------------------------------------------------------ #
    # Context building
    # ------------------------------------------------------------------ #

    def _domain_for_entity(self, entity_type: str) -> str:
        mapping = {
            "idea": "idea",
            "review": "review",
            "validation": "validation",
            "innovation": "team",
            "project": "engineering",
        }
        return mapping.get(entity_type, "idea")

    def _build_context(self, capability: str, entity_type: str, entity_id: str) -> AIContext:
        data: dict = {}
        related: dict = {}

        if entity_type == "idea":
            idea = self._repos.idea.get_by_id(entity_id)
            if not idea:
                raise NotFoundError("Idea not found")
            data = {
                "id": idea.id, "title": idea.title,
                "problem_statement": idea.problem_statement,
                "proposed_solution": idea.proposed_solution,
                "business_impact": idea.business_impact,
                "engineering_impact": idea.engineering_impact,
                "expected_benefits": idea.expected_benefits,
                "business_area": idea.business_area,
                "technologies": idea.technologies,
                "dependencies": idea.dependencies,
                "risks": idea.risks,
                "estimated_complexity": idea.estimated_complexity,
                "estimated_duration": idea.estimated_duration,
                "status": idea.status,
            }
            related["all_ideas"] = [self._idea_summary(i) for i in self._repos.idea.get_all()]
            related["evidence"] = [self._evidence_dict(e) for e in self._repos.idea_evidence.get_by_idea(entity_id)]

        elif entity_type == "review":
            idea = self._repos.idea.get_by_id(entity_id)
            if not idea:
                raise NotFoundError("Idea not found")
            data = self._idea_summary(idea)
            related["evidence"] = [self._evidence_dict(e) for e in self._repos.idea_evidence.get_by_idea(entity_id)]

        elif entity_type == "validation":
            idea = self._repos.idea.get_by_id(entity_id)
            if not idea:
                raise NotFoundError("Idea not found")
            data = self._idea_summary(idea)
            sprint = self._repos.validation.get_by_idea(entity_id)
            if sprint:
                related["sprint"] = {
                    "id": sprint.id, "status": sprint.status,
                    "objectives": sprint.objectives, "findings": sprint.findings,
                }
                related["evidence"] = [
                    {"title": e.title, "evidence_type": e.evidence_type, "description": e.description}
                    for e in self._repos.validation_evidence.get_by_sprint(sprint.id)
                ]

        elif entity_type == "innovation":
            innovation = self._repos.innovation.get_by_id(entity_id)
            if not innovation:
                raise NotFoundError("Innovation not found")
            data = {"id": innovation.id, "summary": innovation.summary}
            related["roles"] = [
                {
                    "id": r.id, "title": r.title, "role": r.role,
                    "technology": r.technology, "status": r.status,
                    "required_skills": r.required_skills, "preferred_skills": r.preferred_skills,
                    "capacity": r.capacity, "filled": r.filled,
                }
                for r in self._repos.innovation_role.get_by_innovation(entity_id)
            ]
            members = self._repos.team_membership.get_by_innovation(entity_id)
            enriched_members = []
            for m in members:
                user = self._repos.user.get_by_id(m.user_id)
                enriched_members.append({
                    "user_id": m.user_id, "role": m.role,
                    "name": user.name if user else "",
                    "skills": user.skills if user else [],
                })
            related["team_members"] = enriched_members
            related["all_users"] = [
                {"id": u.id, "name": u.name, "title": u.title, "skills": u.skills}
                for u in self._repos.user.get_all()
            ]

        elif entity_type == "project":
            project = self._repos.project.get_by_id(entity_id)
            if not project:
                raise NotFoundError("Project not found")
            data = {"id": project.id, "name": project.name, "status": project.status, "description": project.description}
            related["milestones"] = [
                {"id": m.id, "title": m.title, "status": m.status, "due_date": m.due_date}
                for m in self._repos.milestone.get_by_project(entity_id)
            ]
            related["work_items"] = [
                {"id": w.id, "title": w.title, "status": w.status, "description": w.description, "assignee_id": w.assignee_id}
                for w in self._repos.work_item.get_by_project(entity_id)
            ]
            related["evidence"] = [
                {"title": e.title, "evidence_type": e.evidence_type, "description": e.description}
                for e in self._repos.evidence.get_by_project(entity_id)
            ]

        return AIContext(
            capability=capability,
            entity_type=entity_type,
            entity_id=entity_id,
            data=data,
            related=related,
        )

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #

    def _idea_summary(self, idea) -> dict:
        return {
            "id": idea.id, "title": idea.title,
            "business_area": idea.business_area,
            "technologies": idea.technologies,
            "status": idea.status,
            "problem_statement": idea.problem_statement,
            "proposed_solution": idea.proposed_solution,
            "business_impact": idea.business_impact,
            "engineering_impact": idea.engineering_impact,
            "expected_benefits": idea.expected_benefits,
            "dependencies": idea.dependencies,
            "risks": idea.risks,
            "estimated_complexity": idea.estimated_complexity,
            "estimated_duration": idea.estimated_duration,
        }

    def _evidence_dict(self, e) -> dict:
        return {
            "id": e.id, "title": e.title, "description": e.description,
            "evidence_type": e.evidence_type, "url": e.url,
        }
