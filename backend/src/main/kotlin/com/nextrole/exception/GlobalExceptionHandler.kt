package com.nextrole.exception

import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

data class ErrorResponse(val error: String)

@RestControllerAdvice
class GlobalExceptionHandler {

	@ExceptionHandler(EmailAlreadyRegisteredException::class)
	fun handleEmailTaken(ex: EmailAlreadyRegisteredException): ResponseEntity<ErrorResponse> =
		ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorResponse(ex.message ?: "Email already registered"))

	@ExceptionHandler(InvalidCredentialsException::class)
	fun handleInvalidCredentials(ex: InvalidCredentialsException): ResponseEntity<ErrorResponse> =
		ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ErrorResponse(ex.message ?: "Invalid credentials"))

	@ExceptionHandler(ApplicationNotFoundException::class)
	fun handleApplicationNotFound(ex: ApplicationNotFoundException): ResponseEntity<ErrorResponse> =
		ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErrorResponse(ex.message ?: "Not found"))

	@ExceptionHandler(ResourceNotFoundException::class)
	fun handleResourceNotFound(ex: ResourceNotFoundException): ResponseEntity<ErrorResponse> =
		ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErrorResponse(ex.message ?: "Not found"))

	@ExceptionHandler(MethodArgumentNotValidException::class)
	fun handleValidation(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
		val message = ex.bindingResult.fieldErrors
			.joinToString("; ") { "${it.field}: ${it.defaultMessage}" }
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ErrorResponse(message))
	}
}
