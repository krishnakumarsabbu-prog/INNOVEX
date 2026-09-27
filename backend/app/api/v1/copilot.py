from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.dependencies import get_repository_factory
from app.database.repository_factory import RepositoryFactory
from app.ai.copilot import AICopilotService

router = APIRouter(prefix="/ai", tags=["ai-copilot"])


def get_copilot_service(repos: RepositoryFactory = Depends(get_repository_factory)) -> AICopilotService:
    return AICopilotService(repos)


class AnalyzeRequest(BaseModel):
    capability: str
    entity_type: str
    entity_id: str


@router.get("/capabilities")
async def get_capabilities(service: AICopilotService = Depends(get_copilot_service)):
    return service.get_capabilities()


@router.get("/context/{entity_type}/{entity_id}")
async def get_context_capabilities(
    entity_type: str,
    entity_id: str,
    service: AICopilotService = Depends(get_copilot_service),
):
    return service.get_context_capabilities(entity_type, entity_id)


@router.post("/analyze")
async def analyze(
    req: AnalyzeRequest,
    service: AICopilotService = Depends(get_copilot_service),
):
    return service.analyze(req.capability, req.entity_type, req.entity_id)
