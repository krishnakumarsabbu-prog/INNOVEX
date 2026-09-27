from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.ai.provider import AIProvider, AIContext, AIRecommendation


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class DevelopmentAdapter(AIProvider):
    """Safe development adapter that returns structured recommendations
    without calling any external LLM and without creating fake business records.

    Every capability produces deterministic, context-aware recommendations
    derived from the data already in the system.  This lets the frontend and
    API work end-to-end during development; swapping in a real provider later
    only changes the adapter implementation.
    """

    # ------------------------------------------------------------------ #
    # Public entry point
    # ------------------------------------------------------------------ #

    def analyze(self, context: AIContext) -> list[AIRecommendation]:
        handler = _CAPABILITY_MAP.get(context.capability)
        if handler is None:
            return [AIRecommendation(
                capability=context.capability,
                recommendation="This capability is not yet available.",
                reason="The requested analysis type has not been implemented.",
                evidence="No provider handler registered for this capability.",
                confidence=0.0,
                created_at=_now(),
            )]
        return handler(self, context)

    # ------------------------------------------------------------------ #
    # Idea capabilities
    # ------------------------------------------------------------------ #

    def _analyze_idea(self, ctx: AIContext) -> list[AIRecommendation]:
        idea = ctx.data
        recs: list[AIRecommendation] = []

        gaps: list[str] = []
        if not idea.get("problem_statement"):
            gaps.append("problem statement")
        if not idea.get("proposed_solution"):
            gaps.append("proposed solution")
        if not idea.get("business_impact"):
            gaps.append("business impact")
        if not idea.get("engineering_impact"):
            gaps.append("engineering impact")
        if not idea.get("expected_benefits"):
            gaps.append("expected benefits")

        if gaps:
            recs.append(AIRecommendation(
                capability="analyze_idea",
                recommendation=f"Strengthen the idea by adding: {', '.join(gaps)}.",
                reason="A well-rounded idea increases review throughput and reduces back-and-forth.",
                evidence=f"Missing fields: {', '.join(gaps)}",
                confidence=0.85,
                created_at=_now(),
            ))
        else:
            recs.append(AIRecommendation(
                capability="analyze_idea",
                recommendation="The idea is well-structured and ready for submission.",
                reason="All core fields are populated, giving reviewers the context they need.",
                evidence="All required idea fields are present.",
                confidence=0.9,
                created_at=_now(),
            ))

        tech = idea.get("technologies") or []
        if not tech:
            recs.append(AIRecommendation(
                capability="analyze_idea",
                recommendation="Identify the technologies this idea relies on.",
                reason="Listing technologies helps match the idea to skilled contributors and reviewers.",
                evidence="No technologies listed.",
                confidence=0.8,
                created_at=_now(),
            ))

        return recs

    def _find_similar_ideas(self, ctx: AIContext) -> list[AIRecommendation]:
        idea = ctx.data
        all_ideas: list[dict] = ctx.related.get("all_ideas", [])
        matches: list[dict] = []
        my_tech = set(t.lower() for t in (idea.get("technologies") or []))
        my_area = (idea.get("business_area") or "").lower()

        for other in all_ideas:
            if other.get("id") == idea.get("id"):
                continue
            score = 0
            other_tech = set(t.lower() for t in (other.get("technologies") or []))
            overlap = my_tech & other_tech
            if overlap:
                score += len(overlap) * 2
            if my_area and (other.get("business_area") or "").lower() == my_area:
                score += 3
            if score >= 2:
                matches.append({
                    "idea_id": other.get("id"),
                    "title": other.get("title"),
                    "score": score,
                    "shared_technologies": sorted(list(overlap)),
                    "same_business_area": (other.get("business_area") or "").lower() == my_area,
                })

        matches.sort(key=lambda m: m["score"], reverse=True)
        top = matches[:5]

        if top:
            return [AIRecommendation(
                capability="find_similar_ideas",
                recommendation=f"{len(top)} similar idea(s) found. Consider linking or merging to avoid duplication.",
                reason="Overlapping technologies and business areas suggest potential duplication or synergy.",
                evidence=f"Top match: '{top[0]['title']}' (score {top[0]['score']})",
                confidence=0.75,
                created_at=_now(),
                items=top,
            )]
        return [AIRecommendation(
            capability="find_similar_ideas",
            recommendation="No similar ideas found. This idea appears to be novel within the current portfolio.",
            reason="No other ideas share the same technologies or business area.",
            evidence="Searched all existing ideas by technology overlap and business area.",
            confidence=0.7,
            created_at=_now(),
        )]

    def _identify_technologies(self, ctx: AIContext) -> list[AIRecommendation]:
        idea = ctx.data
        text = " ".join([
            idea.get("proposed_solution", ""),
            idea.get("problem_statement", ""),
            idea.get("engineering_impact", ""),
            idea.get("expected_benefits", ""),
        ]).lower()

        known = [
            "react", "typescript", "python", "fastapi", "postgresql", "supabase",
            "kubernetes", "docker", "aws", "azure", "gcp", "redis", "kafka",
            "graphql", "rest", "grpc", "rust", "go", "java", "spring",
            "kafka", "elasticsearch", "mongodb", "terraform", "ansible",
            "machine learning", "llm", "ai", "data pipeline", "etl",
        ]
        found = [t for t in known if t in text]
        existing = set(t.lower() for t in (idea.get("technologies") or []))
        suggested = [t for t in found if t.lower() not in existing]

        if suggested:
            return [AIRecommendation(
                capability="identify_technologies",
                recommendation=f"Consider adding these technologies: {', '.join(suggested)}.",
                reason="They appear in the idea description but are not listed in the technologies field.",
                evidence=f"Detected mentions: {', '.join(suggested)}",
                confidence=0.7,
                created_at=_now(),
                items=[{"technology": t} for t in suggested],
            )]
        return [AIRecommendation(
            capability="identify_technologies",
            recommendation="No additional technologies detected from the description.",
            reason="The technologies field already captures what is mentioned in the text.",
            evidence="Scanned problem statement, solution, and impact fields.",
            confidence=0.6,
            created_at=_now(),
        )]

    def _identify_dependencies(self, ctx: AIContext) -> list[AIRecommendation]:
        idea = ctx.data
        deps_text = idea.get("dependencies", "")
        risks_text = idea.get("risks", "")
        text = f"{deps_text} {risks_text}".lower()

        dep_keywords = [
            "api", "database", "authentication", "payment", "stripe",
            "infrastructure", "network", "storage", "queue", "cache",
            "third-party", "vendor", "legacy system", "compliance",
        ]
        found = [k for k in dep_keywords if k in text]

        if found:
            return [AIRecommendation(
                capability="identify_dependencies",
                recommendation=f"Key dependencies identified: {', '.join(found)}. Ensure these are accounted for in planning.",
                reason="Dependencies mentioned in the idea may require coordination or external teams.",
                evidence=f"Found in dependencies/risks fields: {', '.join(found)}",
                confidence=0.75,
                created_at=_now(),
                items=[{"dependency": d} for d in found],
            )]
        return [AIRecommendation(
            capability="identify_dependencies",
            recommendation="No explicit dependencies detected. Consider whether this idea relies on existing systems.",
            reason="The dependencies field is empty or does not mention specific systems.",
            evidence="Dependencies field scanned.",
            confidence=0.6,
            created_at=_now(),
        )]

    def _suggest_validation_questions(self, ctx: AIContext) -> list[AIRecommendation]:
        idea = ctx.data
        questions = [
            "What is the smallest experiment that would validate the core hypothesis?",
            "Who are the target users and how will you reach them for feedback?",
            "What metrics will determine success during the validation sprint?",
            "What are the technical risks that could block a proof of concept?",
            "How does this idea align with current organizational priorities?",
        ]
        if idea.get("estimated_complexity", "").lower() in ("high", "very high"):
            questions.append("Given the high complexity, what can be de-scoped for the initial POC?")

        return [AIRecommendation(
            capability="suggest_validation_questions",
            recommendation="Use these questions to frame the validation sprint objectives.",
            reason="Structured validation questions ensure the sprint produces actionable evidence.",
            evidence=f"Generated {len(questions)} questions based on idea profile.",
            confidence=0.8,
            created_at=_now(),
            items=[{"question": q} for q in questions],
        )]

    def _suggest_roles(self, ctx: AIContext) -> list[AIRecommendation]:
        idea = ctx.data
        tech = idea.get("technologies") or []
        roles: list[dict] = []

        if tech:
            roles.append({
                "title": "Principal Engineer",
                "role": "tech_lead",
                "technology": ", ".join(tech[:3]),
                "description": "Provide technical leadership and architecture guidance.",
            })
        if idea.get("business_impact"):
            roles.append({
                "title": "Product Manager",
                "role": "product_manager",
                "technology": "",
                "description": "Define success metrics and stakeholder communication.",
            })
        roles.append({
            "title": "Validation Engineer",
            "role": "engineer",
            "technology": ", ".join(tech[:2]) if tech else "",
            "description": "Build and run the proof of concept.",
        })

        return [AIRecommendation(
            capability="suggest_roles",
            recommendation=f"Consider creating {len(roles)} role(s) for this innovation.",
            reason="A balanced team covers technical leadership, product direction, and execution.",
            evidence=f"Suggested {len(roles)} roles based on technologies and business impact.",
            confidence=0.75,
            created_at=_now(),
            items=roles,
        )]

    # ------------------------------------------------------------------ #
    # Review capabilities
    # ------------------------------------------------------------------ #

    def _summarize_evidence(self, ctx: AIContext) -> list[AIRecommendation]:
        evidence: list[dict] = ctx.related.get("evidence", [])
        if not evidence:
            return [AIRecommendation(
                capability="summarize_evidence",
                recommendation="No evidence has been submitted yet. Encourage the founder to add supporting material.",
                reason="Evidence strengthens the case for approval and helps reviewers make informed decisions.",
                evidence="Evidence list is empty.",
                confidence=0.8,
                created_at=_now(),
            )]
        types = {}
        for e in evidence:
            t = e.get("evidence_type", "other")
            types[t] = types.get(t, 0) + 1
        summary = ", ".join(f"{k}: {v}" for k, v in types.items())
        return [AIRecommendation(
            capability="summarize_evidence",
            recommendation=f"{len(evidence)} evidence item(s) submitted across {len(types)} type(s): {summary}.",
            reason="A diverse evidence base gives reviewers more confidence.",
            evidence=f"Breakdown: {summary}",
            confidence=0.85,
            created_at=_now(),
            items=[{"title": e.get("title"), "type": e.get("evidence_type")} for e in evidence],
        )]

    def _identify_missing_information(self, ctx: AIContext) -> list[AIRecommendation]:
        idea = ctx.data
        missing: list[str] = []
        if not idea.get("business_impact"):
            missing.append("business impact")
        if not idea.get("engineering_impact"):
            missing.append("engineering impact")
        if not idea.get("expected_benefits"):
            missing.append("expected benefits")
        if not idea.get("estimated_complexity"):
            missing.append("estimated complexity")
        if not idea.get("estimated_duration"):
            missing.append("estimated duration")
        if not idea.get("risks"):
            missing.append("risk assessment")

        if missing:
            return [AIRecommendation(
                capability="identify_missing_information",
                recommendation=f"Request additional information: {', '.join(missing)}.",
                reason="Incomplete information makes it harder for reviewers to assess the idea.",
                evidence=f"Missing: {', '.join(missing)}",
                confidence=0.85,
                created_at=_now(),
                items=[{"field": m} for m in missing],
            )]
        return [AIRecommendation(
            capability="identify_missing_information",
            recommendation="The idea contains all expected information for review.",
            reason="All standard fields are populated.",
            evidence="All fields present.",
            confidence=0.9,
            created_at=_now(),
        )]

    def _generate_review_questions(self, ctx: AIContext) -> list[AIRecommendation]:
        idea = ctx.data
        questions = [
            "Does the proposed solution directly address the stated problem?",
            "Is the business impact measurable and realistic?",
            "Are the estimated complexity and duration justified?",
            "What are the key technical risks and how will they be mitigated?",
            "Does this idea duplicate or overlap with existing initiatives?",
        ]
        if idea.get("dependencies"):
            questions.append("Are the identified dependencies manageable within the proposed timeline?")

        return [AIRecommendation(
            capability="generate_review_questions",
            recommendation="Use these questions to structure the review discussion.",
            reason="Consistent review questions ensure all dimensions are evaluated.",
            evidence=f"Generated {len(questions)} review questions.",
            confidence=0.8,
            created_at=_now(),
            items=[{"question": q} for q in questions],
        )]

    def _identify_risks(self, ctx: AIContext) -> list[AIRecommendation]:
        idea = ctx.data
        risks: list[dict] = []
        if idea.get("estimated_complexity", "").lower() in ("high", "very high"):
            risks.append({"risk": "High technical complexity may delay delivery", "severity": "high"})
        if idea.get("dependencies"):
            risks.append({"risk": "External dependencies may introduce scheduling risk", "severity": "medium"})
        if not idea.get("risks"):
            risks.append({"risk": "No explicit risk assessment has been provided", "severity": "medium"})
        if len(idea.get("technologies") or []) > 5:
            risks.append({"risk": "Large technology surface area increases integration risk", "severity": "medium"})

        if not risks:
            risks.append({"risk": "No significant risks identified from the idea profile", "severity": "low"})

        return [AIRecommendation(
            capability="identify_risks",
            recommendation=f"{len(risks)} risk(s) identified. Review and plan mitigations.",
            reason="Early risk identification prevents downstream blockers.",
            evidence=f"Risks: {'; '.join(r['risk'] for r in risks)}",
            confidence=0.75,
            created_at=_now(),
            items=risks,
        )]

    # ------------------------------------------------------------------ #
    # Validation capabilities
    # ------------------------------------------------------------------ #

    def _generate_validation_checklist(self, ctx: AIContext) -> list[AIRecommendation]:
        idea = ctx.data
        checklist = [
            "Define success metrics and target thresholds",
            "Build minimal proof of concept",
            "Collect user feedback from at least 3 stakeholders",
            "Document technical findings and limitations",
            "Assess production readiness and remaining gaps",
        ]
        if idea.get("estimated_complexity", "").lower() in ("high", "very high"):
            checklist.append("Conduct technical spike on the highest-risk component")
        if idea.get("dependencies"):
            checklist.append("Validate that external dependencies are available")

        return [AIRecommendation(
            capability="generate_validation_checklist",
            recommendation="Use this checklist to track validation sprint progress.",
            reason="A structured checklist ensures the sprint covers all critical validation activities.",
            evidence=f"Generated {len(checklist)} checklist items.",
            confidence=0.85,
            created_at=_now(),
            items=[{"item": c} for c in checklist],
        )]

    def _suggest_poc_scope(self, ctx: AIContext) -> list[AIRecommendation]:
        idea = ctx.data
        scope = [
            "Focus on the core hypothesis from the problem statement",
            "Exclude production-grade infrastructure and scaling concerns",
            "Target a 2-4 week timeline for the initial build",
            "Prioritize the highest-risk technical assumption",
        ]
        tech = idea.get("technologies") or []
        if tech:
            scope.append(f"Use {', '.join(tech[:2])} as the primary technology stack")

        return [AIRecommendation(
            capability="suggest_poc_scope",
            recommendation="Scope the POC to validate the riskiest assumption with minimal effort.",
            reason="A focused POC produces faster, clearer evidence for decision-making.",
            evidence=f"{len(scope)} scoping guidelines generated.",
            confidence=0.8,
            created_at=_now(),
            items=[{"guideline": s} for s in scope],
        )]

    def _identify_technical_risks(self, ctx: AIContext) -> list[AIRecommendation]:
        idea = ctx.data
        risks: list[dict] = []
        tech = idea.get("technologies") or []
        if len(tech) > 4:
            risks.append({"risk": "Technology sprawl: many technologies increase integration complexity", "severity": "medium"})
        if idea.get("estimated_complexity", "").lower() in ("high", "very high"):
            risks.append({"risk": "High complexity may require specialized expertise not on the team", "severity": "high"})
        if not idea.get("engineering_impact"):
            risks.append({"risk": "Engineering impact not assessed: unknown technical debt", "severity": "medium"})
        if not risks:
            risks.append({"risk": "No significant technical risks detected from the idea profile", "severity": "low"})

        return [AIRecommendation(
            capability="identify_technical_risks",
            recommendation=f"{len(risks)} technical risk(s) identified for the validation sprint.",
            reason="Technical risks should be addressed in the POC before committing to production.",
            evidence=f"Risks: {'; '.join(r['risk'] for r in risks)}",
            confidence=0.75,
            created_at=_now(),
            items=risks,
        )]

    # ------------------------------------------------------------------ #
    # Team capabilities
    # ------------------------------------------------------------------ #

    def _identify_skill_gaps(self, ctx: AIContext) -> list[AIRecommendation]:
        roles: list[dict] = ctx.related.get("roles", [])
        members: list[dict] = ctx.related.get("team_members", [])
        member_skills: set[str] = set()
        for m in members:
            for s in m.get("skills", []) or []:
                member_skills.add(s.lower())

        gaps: list[dict] = []
        for role in roles:
            for skill in role.get("required_skills", []) or []:
                if skill.lower() not in member_skills:
                    gaps.append({"role": role.get("title"), "missing_skill": skill})

        if gaps:
            return [AIRecommendation(
                capability="identify_skill_gaps",
                recommendation=f"{len(gaps)} skill gap(s) found across open roles.",
                reason="Filling skill gaps is critical before the team can execute effectively.",
                evidence=f"Missing skills: {', '.join(g['missing_skill'] for g in gaps[:5])}",
                confidence=0.8,
                created_at=_now(),
                items=gaps,
            )]
        return [AIRecommendation(
            capability="identify_skill_gaps",
            recommendation="No skill gaps detected. Current team skills cover all role requirements.",
            reason="All required skills are represented among current team members.",
            evidence="Compared role requirements against member skills.",
            confidence=0.75,
            created_at=_now(),
        )]

    def _recommend_roles(self, ctx: AIContext) -> list[AIRecommendation]:
        roles: list[dict] = ctx.related.get("roles", [])
        members: list[dict] = ctx.related.get("team_members", [])
        open_roles = [r for r in roles if r.get("status") == "open"]

        if not open_roles:
            return [AIRecommendation(
                capability="recommend_roles",
                recommendation="All roles are filled. No new roles needed at this time.",
                reason="The team has no open positions.",
                evidence=f"{len(roles)} role(s), all filled.",
                confidence=0.85,
                created_at=_now(),
            )]

        suggestions: list[dict] = []
        for role in open_roles:
            suggestions.append({
                "title": role.get("title"),
                "technology": role.get("technology"),
                "required_skills": role.get("required_skills"),
            })

        return [AIRecommendation(
            capability="recommend_roles",
            recommendation=f"{len(open_roles)} open role(s) need to be filled.",
            reason="Open roles block team formation and project progress.",
            evidence=f"Open roles: {', '.join(r.get('title', '') for r in open_roles)}",
            confidence=0.8,
            created_at=_now(),
            items=suggestions,
        )]

    def _suggest_potential_contributors(self, ctx: AIContext) -> list[AIRecommendation]:
        roles: list[dict] = ctx.related.get("roles", [])
        users: list[dict] = ctx.related.get("all_users", [])
        open_roles = [r for r in roles if r.get("status") == "open"]

        if not open_roles or not users:
            return [AIRecommendation(
                capability="suggest_potential_contributors",
                recommendation="No open roles or no users available to suggest.",
                reason="Either all roles are filled or no users are registered.",
                evidence=f"Open roles: {len(open_roles)}, Users: {len(users)}",
                confidence=0.6,
                created_at=_now(),
            )]

        suggestions: list[dict] = []
        for role in open_roles:
            required = set(s.lower() for s in (role.get("required_skills") or []))
            best: list[dict] = []
            for user in users:
                user_skills = set(s.lower() for s in (user.get("skills") or []))
                matched = required & user_skills
                if matched:
                    pct = int((len(matched) / len(required)) * 100) if required else 100
                    best.append({
                        "user_id": user.get("id"),
                        "name": user.get("name"),
                        "title": user.get("title"),
                        "match_percentage": pct,
                        "matched_skills": sorted(list(matched)),
                    })
            best.sort(key=lambda x: x["match_percentage"], reverse=True)
            if best:
                suggestions.append({
                    "role_title": role.get("title"),
                    "candidates": best[:3],
                })

        if suggestions:
            return [AIRecommendation(
                capability="suggest_potential_contributors",
                recommendation=f"Found potential contributors for {len(suggestions)} open role(s).",
                reason="Matching existing user skills to open role requirements accelerates team formation.",
                evidence=f"Top candidates identified for: {', '.join(s['role_title'] for s in suggestions)}",
                confidence=0.8,
                created_at=_now(),
                items=suggestions,
            )]
        return [AIRecommendation(
            capability="suggest_potential_contributors",
            recommendation="No users match the required skills for open roles. Consider external hiring or training.",
            reason="No registered users have the skills needed for open positions.",
            evidence="Compared all users against open role requirements.",
            confidence=0.7,
            created_at=_now(),
        )]

    # ------------------------------------------------------------------ #
    # Engineering capabilities
    # ------------------------------------------------------------------ #

    def _summarize_progress(self, ctx: AIContext) -> list[AIRecommendation]:
        milestones: list[dict] = ctx.related.get("milestones", [])
        work_items: list[dict] = ctx.related.get("work_items", [])
        if not milestones and not work_items:
            return [AIRecommendation(
                capability="summarize_progress",
                recommendation="No milestones or work items defined yet. Start by creating a project plan.",
                reason="Without milestones and work items, progress cannot be tracked.",
                evidence="No milestones or work items found.",
                confidence=0.85,
                created_at=_now(),
            )]

        done_milestones = [m for m in milestones if m.get("status") == "done"]
        total_milestones = len(milestones) if milestones else 0
        done_items = [w for w in work_items if w.get("status") == "done"]
        blocked_items = [w for w in work_items if w.get("status") == "blocked"]
        in_progress_items = [w for w in work_items if w.get("status") == "in_progress"]

        pct = 0
        if work_items:
            pct = int((len(done_items) / len(work_items)) * 100)

        summary = f"{pct}% of work items complete ({len(done_items)}/{len(work_items)})."
        if total_milestones:
            summary += f" {len(done_milestones)}/{total_milestones} milestones done."

        return [AIRecommendation(
            capability="summarize_progress",
            recommendation=summary,
            reason="Tracking progress helps identify whether the project is on schedule.",
            evidence=f"{len(in_progress_items)} in progress, {len(blocked_items)} blocked, {len(done_items)} done.",
            confidence=0.85,
            created_at=_now(),
            items=[{"milestone": m.get("title"), "status": m.get("status")} for m in milestones],
        )]

    def _identify_blockers(self, ctx: AIContext) -> list[AIRecommendation]:
        work_items: list[dict] = ctx.related.get("work_items", [])
        blocked = [w for w in work_items if w.get("status") == "blocked"]

        if blocked:
            return [AIRecommendation(
                capability="identify_blockers",
                recommendation=f"{len(blocked)} work item(s) are blocked and need attention.",
                reason="Blocked items stall progress and should be escalated or unblocked.",
                evidence=f"Blocked: {', '.join(w.get('title', '') for w in blocked)}",
                confidence=0.85,
                created_at=_now(),
                items=[{"title": w.get("title"), "description": w.get("description")} for w in blocked],
            )]
        return [AIRecommendation(
            capability="identify_blockers",
            recommendation="No blockers detected. All work items are progressing.",
            reason="No work items are in a blocked state.",
            evidence="All work items checked.",
            confidence=0.8,
            created_at=_now(),
        )]

    def _generate_risk_summary(self, ctx: AIContext) -> list[AIRecommendation]:
        work_items: list[dict] = ctx.related.get("work_items", [])
        milestones: list[dict] = ctx.related.get("milestones", [])
        risks: list[dict] = []

        blocked = [w for w in work_items if w.get("status") == "blocked"]
        if blocked:
            risks.append({"risk": f"{len(blocked)} blocked work item(s)", "severity": "high"})

        overdue = [m for m in milestones if m.get("due_date") and m.get("status") != "done"]
        if overdue:
            risks.append({"risk": f"{len(overdue)} milestone(s) with due dates not yet complete", "severity": "medium"})

        unassigned = [w for w in work_items if not w.get("assignee_id") and w.get("status") not in ("done", "cancelled")]
        if unassigned:
            risks.append({"risk": f"{len(unassigned)} unassigned work item(s)", "severity": "medium"})

        if not risks:
            risks.append({"risk": "No significant risks detected in the current project state", "severity": "low"})

        return [AIRecommendation(
            capability="generate_risk_summary",
            recommendation=f"Project risk summary: {len(risks)} risk indicator(s).",
            reason="Regular risk summaries help teams proactively address issues.",
            evidence=f"Risks: {'; '.join(r['risk'] for r in risks)}",
            confidence=0.8,
            created_at=_now(),
            items=risks,
        )]

    def _summarize_engineering_evidence(self, ctx: AIContext) -> list[AIRecommendation]:
        evidence: list[dict] = ctx.related.get("evidence", [])
        if not evidence:
            return [AIRecommendation(
                capability="summarize_engineering_evidence",
                recommendation="No engineering evidence collected yet. Add prototypes, benchmarks, or test results.",
                reason="Evidence is needed to demonstrate technical viability.",
                evidence="Evidence list is empty.",
                confidence=0.8,
                created_at=_now(),
            )]
        types = {}
        for e in evidence:
            t = e.get("evidence_type", "other")
            types[t] = types.get(t, 0) + 1
        breakdown = ", ".join(f"{k}: {v}" for k, v in types.items())
        return [AIRecommendation(
            capability="summarize_engineering_evidence",
            recommendation=f"{len(evidence)} evidence item(s): {breakdown}.",
            reason="A strong evidence base supports the case for production adoption.",
            evidence=f"Types: {breakdown}",
            confidence=0.85,
            created_at=_now(),
            items=[{"title": e.get("title"), "type": e.get("evidence_type")} for e in evidence],
        )]

    def _prepare_demo_summary(self, ctx: AIContext) -> list[AIRecommendation]:
        milestones: list[dict] = ctx.related.get("milestones", [])
        work_items: list[dict] = ctx.related.get("work_items", [])
        evidence: list[dict] = ctx.related.get("evidence", [])

        done = [w for w in work_items if w.get("status") == "done"]
        talking_points: list[str] = [
            f"Completed {len(done)} work items",
            f"Delivered {len([m for m in milestones if m.get('status') == 'done'])} milestones",
            f"Collected {len(evidence)} pieces of evidence",
        ]
        if evidence:
            talking_points.append(f"Key evidence: {evidence[0].get('title', '')}")

        return [AIRecommendation(
            capability="prepare_demo_summary",
            recommendation="Use these talking points for the demo presentation.",
            reason="A structured demo summary ensures stakeholders see the value and evidence.",
            evidence=f"{len(talking_points)} talking points generated.",
            confidence=0.8,
            created_at=_now(),
            items=[{"point": p} for p in talking_points],
        )]


# ------------------------------------------------------------------ #
# Capability dispatch table
# ------------------------------------------------------------------ #

_CAPABILITY_MAP: dict[str, Any] = {
    # Idea
    "analyze_idea": DevelopmentAdapter._analyze_idea,
    "find_similar_ideas": DevelopmentAdapter._find_similar_ideas,
    "identify_technologies": DevelopmentAdapter._identify_technologies,
    "identify_dependencies": DevelopmentAdapter._identify_dependencies,
    "suggest_validation_questions": DevelopmentAdapter._suggest_validation_questions,
    "suggest_roles": DevelopmentAdapter._suggest_roles,
    # Review
    "summarize_evidence": DevelopmentAdapter._summarize_evidence,
    "identify_missing_information": DevelopmentAdapter._identify_missing_information,
    "generate_review_questions": DevelopmentAdapter._generate_review_questions,
    "identify_risks": DevelopmentAdapter._identify_risks,
    # Validation
    "generate_validation_checklist": DevelopmentAdapter._generate_validation_checklist,
    "suggest_poc_scope": DevelopmentAdapter._suggest_poc_scope,
    "identify_technical_risks": DevelopmentAdapter._identify_technical_risks,
    # Team
    "identify_skill_gaps": DevelopmentAdapter._identify_skill_gaps,
    "recommend_roles": DevelopmentAdapter._recommend_roles,
    "suggest_potential_contributors": DevelopmentAdapter._suggest_potential_contributors,
    # Engineering
    "summarize_progress": DevelopmentAdapter._summarize_progress,
    "identify_blockers": DevelopmentAdapter._identify_blockers,
    "generate_risk_summary": DevelopmentAdapter._generate_risk_summary,
    "summarize_engineering_evidence": DevelopmentAdapter._summarize_engineering_evidence,
    "prepare_demo_summary": DevelopmentAdapter._prepare_demo_summary,
}
