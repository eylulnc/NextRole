package com.nextrole.service

import com.nextrole.domain.User
import com.nextrole.exception.EmailAlreadyRegisteredException
import com.nextrole.exception.InvalidCredentialsException
import com.nextrole.exception.InvalidRefreshTokenException
import com.nextrole.repository.UserRepository
import com.nextrole.security.JwtService
import com.nextrole.web.dto.AuthResponse
import com.nextrole.web.dto.LoginRequest
import com.nextrole.web.dto.RefreshResponse
import com.nextrole.web.dto.RegisterRequest
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

@Service
class AuthService(
	private val userRepository: UserRepository,
	private val passwordEncoder: PasswordEncoder,
	private val jwtService: JwtService,
	private val pipelineStageService: PipelineStageService,
	private val refreshTokenService: RefreshTokenService
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
		pipelineStageService.seedDefaults(user.id)
		val token = jwtService.generateToken(user.id, user.email)
		return AuthResponse(
			token,
			refreshTokenService.issue(user.id),
			user.email,
			user.language,
			user.defaultCurrency,
			user.interviewReminderMode,
			user.interviewReminderHours,
			user.interviewReminderPrompted
		)
	}

	fun login(request: LoginRequest): AuthResponse {
		val user = userRepository.findByEmail(request.email)
			?: throw InvalidCredentialsException()
		if (!passwordEncoder.matches(request.password, user.passwordHash)) {
			throw InvalidCredentialsException()
		}
		val token = jwtService.generateToken(user.id, user.email)
		return AuthResponse(
			token,
			refreshTokenService.issue(user.id),
			user.email,
			user.language,
			user.defaultCurrency,
			user.interviewReminderMode,
			user.interviewReminderHours,
			user.interviewReminderPrompted
		)
	}

	/**
	 * Revokes the session's refresh token so it can't be used after the client has discarded it.
	 * Only the presented token is revoked — logging out of the web app should not sign you out
	 * on your phone.
	 */
	fun logout(rawRefreshToken: String) {
		refreshTokenService.revoke(rawRefreshToken)
	}

	/**
	 * Exchanges a refresh token for a fresh access token, rotating the refresh token in the
	 * process. Deliberately returns only the token pair — settings come from /api/settings, so
	 * a silent refresh never has to touch user state.
	 */
	fun refresh(rawRefreshToken: String): RefreshResponse {
		val rotated = refreshTokenService.rotate(rawRefreshToken)
		val user = userRepository.findById(rotated.userId).orElseThrow { InvalidRefreshTokenException() }
		return RefreshResponse(
			token = jwtService.generateToken(user.id, user.email),
			refreshToken = rotated.refreshToken
		)
	}
}
