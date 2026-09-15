package com.nextrole.exception

class EmailAlreadyRegisteredException(email: String) : RuntimeException("Email already registered: $email")

class InvalidCredentialsException : RuntimeException("Invalid email or password")

class InvalidRefreshTokenException : RuntimeException("Refresh token is invalid or has expired")

class ApplicationNotFoundException(id: Any) : RuntimeException("Application not found: $id")

class ResourceNotFoundException(resource: String, id: Any) : RuntimeException("$resource not found: $id")

class PipelineStageInUseException(message: String) : RuntimeException(message)

class BuiltInPipelineStageException(message: String) : RuntimeException(message)

class PipelineStageLimitExceededException(message: String) : RuntimeException(message)
