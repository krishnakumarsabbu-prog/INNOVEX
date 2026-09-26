class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(code="NOT_FOUND", message=message, status_code=404)


class ConflictError(AppException):
    def __init__(self, message: str = "Conflict"):
        super().__init__(code="CONFLICT", message=message, status_code=409)


class ValidationError(AppException):
    def __init__(self, message: str = "Validation failed"):
        super().__init__(code="VALIDATION_ERROR", message=message, status_code=422)


class SetupError(AppException):
    def __init__(self, message: str = "Setup required"):
        super().__init__(code="SETUP_REQUIRED", message=message, status_code=412)
