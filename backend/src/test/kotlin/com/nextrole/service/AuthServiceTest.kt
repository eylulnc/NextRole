package com.nextrole.service

import com.nextrole.domain.User
import com.nextrole.exception.EmailAlreadyRegisteredException
import com.nextrole.exception.InvalidCredentialsException
import com.nextrole.repository.UserRepository
import com.nextrole.security.JwtService
import com.nextrole.web.dto.LoginRequest
import com.nextrole.web.dto.RegisterRequest
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.security.crypto.password.PasswordEncoder
import java.util.UUID

class AuthServiceTest {

	private val userRepository = mockk<UserRepository>()
	private val passwordEncoder = mockk<PasswordEncoder>()
	private val jwtService = mockk<JwtService>()
	private val authService = AuthService(userRepository, passwordEncoder, jwtService)

	@BeforeEach
	fun setUp() {
		every { jwtService.generateToken(any(), any()) } returns "fake-jwt-token"
	}

	@Test
	fun `register creates a user and returns a token`() {
		every { userRepository.existsByEmail("new@example.com") } returns false
		every { passwordEncoder.encode("password123") } returns "hashed-password"
		val savedSlot = slot<User>()
		every { userRepository.save(capture(savedSlot)) } answers { savedSlot.captured }

		val response = authService.register(RegisterRequest("new@example.com", "password123"))

		assertEquals("new@example.com", response.email)
		assertEquals("fake-jwt-token", response.token)
		assertEquals("hashed-password", savedSlot.captured.passwordHash)
	}

	@Test
	fun `register rejects an already-registered email`() {
		every { userRepository.existsByEmail("taken@example.com") } returns true

		assertThrows(EmailAlreadyRegisteredException::class.java) {
			authService.register(RegisterRequest("taken@example.com", "password123"))
		}
		verify(exactly = 0) { userRepository.save(any()) }
	}

	@Test
	fun `login succeeds with correct credentials`() {
		val user = User(id = UUID.randomUUID(), email = "user@example.com", passwordHash = "hashed-password")
		every { userRepository.findByEmail("user@example.com") } returns user
		every { passwordEncoder.matches("password123", "hashed-password") } returns true

		val response = authService.login(LoginRequest("user@example.com", "password123"))

		assertEquals("user@example.com", response.email)
		assertEquals("fake-jwt-token", response.token)
	}

	@Test
	fun `login rejects unknown email`() {
		every { userRepository.findByEmail("ghost@example.com") } returns null

		assertThrows(InvalidCredentialsException::class.java) {
			authService.login(LoginRequest("ghost@example.com", "password123"))
		}
	}

	@Test
	fun `login rejects wrong password`() {
		val user = User(id = UUID.randomUUID(), email = "user@example.com", passwordHash = "hashed-password")
		every { userRepository.findByEmail("user@example.com") } returns user
		every { passwordEncoder.matches("wrong-password", "hashed-password") } returns false

		assertThrows(InvalidCredentialsException::class.java) {
			authService.login(LoginRequest("user@example.com", "wrong-password"))
		}
	}
}
