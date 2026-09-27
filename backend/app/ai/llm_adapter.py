import json
import logging
from datetime import datetime, timezone
import httpx

from app.core.config import settings
from app.ai.provider import AIProvider, AIContext, AIRecommendation
from app.ai.development_adapter import DevelopmentAdapter

logger = logging.getLogger("innovex.ai")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class LLMAdapter(AIProvider):
    """Real LLM adapter that communicates with Gemini or OpenAI-compatible APIs.

    Adheres strictly to the INNOVEX governance mandate:
    AI is advisory only and never makes business decisions.
    If no API key is configured or the LLM call fails, it gracefully falls back
    to the deterministic DevelopmentAdapter.
    """

    def __init__(self, fallback: AIProvider | None = None):
        self._fallback = fallback or DevelopmentAdapter()

    def analyze(self, context: AIContext) -> list[AIRecommendation]:
        provider = (settings.AI_PROVIDER or "development").lower()

        if provider == "gemini" and settings.GEMINI_API_KEY:
            try:
                return self._call_gemini(context)
            except Exception as e:
                logger.warning(f"Gemini LLM call failed ({e}); falling back to DevelopmentAdapter")
                return self._fallback.analyze(context)

        elif provider in ("openai", "azure") and settings.OPENAI_API_KEY:
            try:
                return self._call_openai(context)
            except Exception as e:
                logger.warning(f"OpenAI LLM call failed ({e}); falling back to DevelopmentAdapter")
                return self._fallback.analyze(context)

        # Default fallback
        return self._fallback.analyze(context)

    def _build_prompt(self, context: AIContext) -> str:
        return (
            f"You are INNOVEX Intelligence, an enterprise innovation and engineering advisor.\n"
            f"GOVERNANCE MANDATE: Your recommendations are strictly advisory. You must provide high-value, "
            f"actionable guidance to engineering leaders, reviewers, and contributors.\n\n"
            f"Task: Execute the capability '{context.capability}' for entity type '{context.entity_type}'.\n"
            f"Entity Data: {json.dumps(context.data, indent=2)}\n"
            f"Related Context: {json.dumps(context.related, indent=2)}\n\n"
            f"Respond ONLY with a valid JSON array of recommendations conforming to this schema:\n"
            f"[\n"
            f"  {{\n"
            f'    "recommendation": "Concise, actionable advice headline",\n'
            f'    "reason": "Engineering or business rationale",\n'
            f'    "evidence": "Observed data points or gaps justifying this recommendation",\n'
            f'    "confidence": 0.85,\n'
            f'    "items": [{{"item": "Specific item or checklist point"}}]\n'
            f"  }}\n"
            f"]\n"
            f"Do not include markdown code block backticks. Return raw JSON array only."
        )

    def _call_gemini(self, context: AIContext) -> list[AIRecommendation]:
        model = settings.GEMINI_MODEL or "gemini-2.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"

        prompt = self._build_prompt(context)
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
            },
        }

        with httpx.Client(timeout=25.0) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return self._parse_json_recommendations(text, context.capability)

    def _call_openai(self, context: AIContext) -> list[AIRecommendation]:
        model = settings.OPENAI_MODEL or "gpt-4o-mini"
        base_url = (settings.OPENAI_BASE_URL or "https://api.openai.com/v1").rstrip("/")
        url = f"{base_url}/chat/completions"

        prompt = self._build_prompt(context)
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are INNOVEX Intelligence. You always respond in raw valid JSON."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }

        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }

        with httpx.Client(timeout=25.0) as client:
            resp = client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        text = data["choices"][0]["message"]["content"]
        return self._parse_json_recommendations(text, context.capability)

    def _parse_json_recommendations(self, text: str, capability: str) -> list[AIRecommendation]:
        clean = text.strip()
        if clean.startswith("```json"):
            clean = clean[7:]
        if clean.startswith("```"):
            clean = clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()

        parsed = json.loads(clean)
        if isinstance(parsed, dict) and "recommendations" in parsed:
            raw_list = parsed["recommendations"]
        elif isinstance(parsed, list):
            raw_list = parsed
        else:
            raw_list = [parsed]

        now = _now()
        results: list[AIRecommendation] = []
        for r in raw_list:
            if not isinstance(r, dict):
                continue
            confidence = float(r.get("confidence", 0.85))
            results.append(AIRecommendation(
                capability=capability,
                recommendation=r.get("recommendation", "Recommendation from INNOVEX Intelligence"),
                reason=r.get("reason", "Based on contextual analysis"),
                evidence=r.get("evidence", "Contextual telemetry"),
                confidence=min(max(confidence, 0.0), 1.0),
                created_at=now,
                items=r.get("items", []),
            ))
        return results if results else self._fallback.analyze(AIContext(capability=capability, entity_type="", entity_id=""))
