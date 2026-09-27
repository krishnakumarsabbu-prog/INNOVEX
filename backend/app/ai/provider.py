from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AIContext:
    """Structured context passed to an AI provider for analysis."""

    capability: str
    entity_type: str
    entity_id: str
    data: dict[str, Any] = field(default_factory=dict)
    related: dict[str, Any] = field(default_factory=dict)


@dataclass
class AIRecommendation:
    """A single recommendation returned by the AI layer.

    AI never makes decisions. It only produces recommendations that a human
    user must accept, modify, or dismiss.
    """

    capability: str
    recommendation: str
    reason: str
    evidence: str
    confidence: float
    created_at: str
    items: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "capability": self.capability,
            "recommendation": self.recommendation,
            "reason": self.reason,
            "evidence": self.evidence,
            "confidence": self.confidence,
            "created_at": self.created_at,
            "items": self.items,
        }


class AIProvider(ABC):
    """Abstract interface that every LLM / analysis adapter must implement.

    Business services depend on this interface, never on a concrete provider.
    Swapping providers (e.g. DevelopmentAdapter -> OpenAIAdapter) requires only
    changing the wiring in app/ai/copilot.py.
    """

    @abstractmethod
    def analyze(self, context: AIContext) -> list[AIRecommendation]:
        """Return one or more recommendations for the given context."""
        raise NotImplementedError
