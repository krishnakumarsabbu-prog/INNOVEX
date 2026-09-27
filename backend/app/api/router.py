from fastapi import APIRouter
from app.api.v1 import setup, users, ideas, validation, innovations, engineering, notifications, dashboard, skills, reviews, insights, copilot, people, administration

api_router = APIRouter()
api_router.include_router(setup.router)
api_router.include_router(users.router)
api_router.include_router(people.router)
api_router.include_router(validation.router)
api_router.include_router(ideas.router)
api_router.include_router(innovations.router)
api_router.include_router(engineering.router)
api_router.include_router(notifications.router)
api_router.include_router(dashboard.router)
api_router.include_router(skills.router)
api_router.include_router(reviews.router)
api_router.include_router(insights.router)
api_router.include_router(copilot.router)
api_router.include_router(administration.router)
