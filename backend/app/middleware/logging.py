import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger = logging.getLogger("innovex.request")
        response: Response = await call_next(request)
        logger.info(f"{request.method} {request.url.path} {response.status_code} [{getattr(request.state, 'request_id', '-')}]")
        return response
