from app.core.exceptions import AppException, UnauthorizedError, ForbiddenError
from app.database.repository_factory import get_repository_factory, RepositoryFactory
from app.domain.models.entities import User
from fastapi import Request, Depends, Header
from fastapi.responses import JSONResponse


async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "request_id": getattr(request.state, "request_id", ""),
            }
        },
    )


async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred",
                "request_id": getattr(request.state, "request_id", ""),
            }
        },
    )


async def get_current_user_optional(
    request: Request,
    x_user_id: str | None = Header(None, alias="X-User-Id"),
    repos: RepositoryFactory = Depends(get_repository_factory),
) -> User | None:
    user_id = x_user_id or request.headers.get("X-User-Id")
    if not user_id:
        return None
    return repos.user.get_by_id(user_id)


async def get_current_user(
    user: User | None = Depends(get_current_user_optional),
) -> User:
    if not user:
        raise UnauthorizedError("Authentication required. Please select or log in with an active persona.")
    return user


def require_role(*allowed_roles: str):
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        # Admins have superuser access across governance operations
        if user.role == "admin":
            return user
        if user.role not in allowed_roles:
            roles_str = ", ".join(allowed_roles)
            raise ForbiddenError(f"Permission denied: Requires role ({roles_str}). You are logged in as '{user.role}'.")
        return user
    return role_checker
