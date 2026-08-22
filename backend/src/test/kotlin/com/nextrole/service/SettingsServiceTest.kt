package com.nextrole.service

import com.nextrole.domain.User
import com.nextrole.exception.ResourceNotFoundException
import com.nextrole.repository.UserRepository
import com.nextrole.web.dto.UpdateUserSettingsRequest
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.util.Optional
import java.util.UUID

class SettingsServiceTest {

	private val userRepository = mockk<UserRepository>()
	private val settingsService = SettingsService(userRepository)
	private val userId = UUID.randomUUID()

	@Test
	fun `get returns the user's current language and default currency`() {
		val user = User(id = userId, email = "user@example.com", passwordHash = "hash", language = "de", defaultCurrency = "USD")
		every { userRepository.findById(userId) } returns Optional.of(user)

		val result = settingsService.get(userId)

		assertEquals("de", result.language)
		assertEquals("USD", result.defaultCurrency)
	}

	@Test
	fun `get throws when the user does not exist`() {
		every { userRepository.findById(userId) } returns Optional.empty()

		assertThrows(ResourceNotFoundException::class.java) {
			settingsService.get(userId)
		}
	}

	@Test
	fun `update changes only the fields provided`() {
		val user = User(id = userId, email = "user@example.com", passwordHash = "hash", language = "en", defaultCurrency = "EUR")
		every { userRepository.findById(userId) } returns Optional.of(user)
		every { userRepository.save(user) } returns user

		val result = settingsService.update(userId, UpdateUserSettingsRequest(language = "tr", defaultCurrency = null))

		assertEquals("tr", result.language)
		assertEquals("EUR", result.defaultCurrency)
	}
}
