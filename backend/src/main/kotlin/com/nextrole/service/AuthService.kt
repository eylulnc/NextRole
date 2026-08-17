package com.nextrole.service

import com.nextrole.domain.User
import com.nextrole.exception.EmailAlreadyRegisteredException
import com.nextrole.exception.InvalidCredentialsException
import com.nextrole.repository.UserRepository
import com.nextrole.security.JwtService
import com.nextrole.web.dto.AuthResponse
import com.nextrole.web.dto.LoginRequest
import com.nextrole.web.dto.RegisterRequest
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

@Service
class AuthService(
	private val userRepository: UserRepository,
	private val passwordEncoder: PasswordEncoder,
	private val jwtService: JwtService
) {

	fun register(request: RegisterRequest): AuthResponse {
		if (userRepository.existsByEmail(request.email)) {
			throw EmailAlreadyRegisteredException(request.email)
		}
		val user = User(
			email = request.email,
			passwordHash = passwordEncoder.encode(request.password)
		)
		userRepository.save(user)
		val token = jwtService.generateToken(user.id, user.email)
		return AuthResponse(token, user.email)
	}

	fun login(request: LoginRequest): AuthResponse {
		val user = userRepository.findByEmail(request.email)
			?: throw InvalidCredentialsException()
		if (!passwordEncoder.matches(request.password, user.passwordHash)) {
			throw InvalidCredentialsException()
		}
		val token = jwtService.generateToken(user.id, user.email)
		return AuthResponse(token, user.email)
	}
}
