package com.nextrole.service

import com.nextrole.domain.RefreshToken
import com.nextrole.exception.InvalidRefreshTokenException
import com.nextrole.repository.RefreshTokenRepository
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.time.Duration
import java.time.Instant
import java.util.UUID

class RefreshTokenServiceTest {

	private val refreshTokenRepository = mockk<RefreshTokenRepository>(relaxed = true)
	private val thirtyDaysMs = Duration.ofDays(30).toMillis()
	private val service = RefreshTokenService(refreshTokenRepository, thirtyDaysMs)
	private val userId = UUID.randomUUID()
	private val now = Instant.parse("2026-10-01T12:00:00Z")

	@Test
	fun `issue stores a hash rather than the token itself`() {
		val saved = slot<RefreshToken>()
		every { refreshTokenRepository.save(capture(saved)) } answers { saved.captured }

		val raw = service.issue(userId, now)

		assertNotEquals(raw, saved.captured.tokenHash)
		assertEquals(64, saved.captured.tokenHash.length) // SHA-256 hex
		assertEquals(userId, saved.captured.userId)
		assertEquals(now.plusMillis(thirtyDaysMs), saved.captured.expiresAt)
	}

	@Test
	fun `issue produces a different token each time`() {
		every { refreshTokenRepository.save(any()) } answers { firstArg() }

		assertNotEquals(service.issue(userId, now), service.issue(userId, now))
	}

	@Test
	fun `rotate revokes the presented token and returns a new one`() {
		val existing = activeToken()
		every { refreshTokenRepository.findByTokenHash(any()) } returns existing
		every { refreshTokenRepository.save(any()) } answers { firstArg() }

		val rotated = service.rotate("whatever", now)

		assertEquals(userId, rotated.userId)
		assertNotNull(existing.revokedAt)
		assertTrue(rotated.refreshToken.isNotBlank())
	}

	@Test
	fun `rotate rejects an expired token`() {
		val expired = RefreshToken(
			userId = userId,
			tokenHash = "hash",
			expiresAt = now.minusSeconds(1),
			createdAt = now.minusSeconds(100)
		)
		every { refreshTokenRepository.findByTokenHash(any()) } returns expired

		assertThrows(InvalidRefreshTokenException::class.java) { service.rotate("whatever", now) }
	}

	@Test
	fun `rotate rejects an unknown token`() {
		every { refreshTokenRepository.findByTokenHash(any()) } returns null

		assertThrows(InvalidRefreshTokenException::class.java) { service.rotate("whatever", now) }
	}

	@Test
	fun `replaying an already-rotated token revokes every token for that user`() {
		val replayed = activeToken().apply { revokedAt = now.minusSeconds(60) }
		val otherActive = activeToken()
		every { refreshTokenRepository.findByTokenHash(any()) } returns replayed
		every { refreshTokenRepository.findAllByUserId(userId) } returns listOf(otherActive)
		every { refreshTokenRepository.saveAll(any<List<RefreshToken>>()) } answers { firstArg() }

		assertThrows(InvalidRefreshTokenException::class.java) { service.rotate("whatever", now) }

		// The family is burned: a stolen token can't be traded for a working session, and the
		// legitimate holder is forced to log in again rather than sharing one with an attacker.
		assertEquals(now, otherActive.revokedAt)
	}

	@Test
	fun `revoke marks a single token revoked`() {
		val existing = activeToken()
		every { refreshTokenRepository.findByTokenHash(any()) } returns existing
		every { refreshTokenRepository.save(any()) } answers { firstArg() }

		service.revoke("whatever", now)

		assertEquals(now, existing.revokedAt)
	}

	@Test
	fun `revoke is silent for an unknown token`() {
		every { refreshTokenRepository.findByTokenHash(any()) } returns null

		// No throw: the client is logging out regardless, and failing the call would strand it.
		service.revoke("whatever", now)
	}

	@Test
	fun `revoke leaves an already-revoked token's timestamp alone`() {
		val already = activeToken().apply { revokedAt = now.minusSeconds(90) }
		every { refreshTokenRepository.findByTokenHash(any()) } returns already

		service.revoke("whatever", now)

		assertEquals(now.minusSeconds(90), already.revokedAt)
	}

	@Test
	fun `revokeAllForUser leaves already-revoked tokens untouched`() {
		val alreadyRevoked = activeToken().apply { revokedAt = now.minusSeconds(500) }
		every { refreshTokenRepository.findAllByUserId(userId) } returns listOf(alreadyRevoked)
		every { refreshTokenRepository.saveAll(any<List<RefreshToken>>()) } answers { firstArg() }

		service.revokeAllForUser(userId, now)

		assertEquals(now.minusSeconds(500), alreadyRevoked.revokedAt)
	}

	private fun activeToken() = RefreshToken(
		userId = userId,
		tokenHash = UUID.randomUUID().toString(),
		expiresAt = now.plusMillis(thirtyDaysMs),
		createdAt = now
	)
}
