package com.nextrole.web.dto

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class RegisterRequest(
	@field:NotBlank @field:Email val email: String,
	@field:NotBlank @field:Size(min = 8, max = 100) val password: String
)

data class LoginRequest(
	@field:NotBlank @field:Email val email: String,
	@field:NotBlank val password: String
)

data class AuthResponse(val token: String, val email: String)
