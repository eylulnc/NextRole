package com.nextrole.service

import com.nextrole.domain.RefreshToken
import com.nextrole.exception.InvalidRefreshTokenException
import com.nextrole.repository.RefreshTokenRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Duration
import java.time.Instant
import java.util.Base64
import java.util.UUID

/**
 * Opaque, rotating refresh tokens.
 *
 * Every refresh issues a new token and revokes the one presented, so a stolen token is usable at
 * most once. Presenting an already-revoked token is treated as a breach signal: every token for
 * that user is revoked, forcing a fresh login on all devices.
 */
@Service
class RefreshTokenService(
	private val refreshTokenRepository: RefreshTokenRepository,
	@Value("\${app.jwt.refresh-expiration-ms}") private val refreshExpirationMs: Long
) {

	private val random = SecureRandom()

	fun issue(userId: UUID, now: Instant = Instant.now()): String {
		val raw = generateRawToken()
		refreshTokenRepository.save(
			RefreshToken(
				userId = userId,
				tokenHash = hash(raw),
				expiresAt = now.plus(Duration.ofMillis(refreshExpirationMs)),
				createdAt = now
			)
		)
		return raw
	}

	/**
	 * Validates and consumes [rawToken], returning the user it belonged to. The caller mints a new
	 * access token; a replacement refresh token is issued here as part of rotation.
	 */
	fun rotate(rawToken: String, now: Instant = Instant.now()): RotatedRefreshToken {
		val existing = refreshTokenRepository.findByTokenHash(hash(rawToken))
			?: throw InvalidRefreshTokenException()

		if (existing.revokedAt != null) {
			// Someone is replaying a token we already rotated away. We can't tell the legitimate
			// user from the attacker, so we invalidate the whole family and make both log in.
			revokeAllForUser(existing.userId, now)
			throw InvalidRefreshTokenException()
		}
		if (!existing.isActive(now)) {
			throw InvalidRefreshTokenException()
		}

		existing.revokedAt = now
		refreshTokenRepository.save(existing)
		return RotatedRefreshToken(userId = existing.userId, refreshToken = issue(existing.userId, now))
	}

	/**
	 * Revokes a single token on logout. Deliberately silent when the token is unknown or already
	 * revoked — the caller is logging out either way, and a client that can't complete logout
	 * because the server rejected it would be worse than useless.
	 */
	fun revoke(rawToken: String, now: Instant = Instant.now()) {
		val existing = refreshTokenRepository.findByTokenHash(hash(rawToken)) ?: return
		if (existing.revokedAt != null) return
		existing.revokedAt = now
		refreshTokenRepository.save(existing)
	}

	fun revokeAllForUser(userId: UUID, now: Instant = Instant.now()) {
		val active = refreshTokenRepository.findAllByUserId(userId).filter { it.revokedAt == null }
		active.forEach { it.revokedAt = now }
		refreshTokenRepository.saveAll(active)
	}

	private fun generateRawToken(): String {
		val bytes = ByteArray(32)
		random.nextBytes(bytes)
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
	}

	private fun hash(rawToken: String): String =
		MessageDigest.getInstance("SHA-256")
			.digest(rawToken.toByteArray())
			.joinToString("") { "%02x".format(it) }
}

data class RotatedRefreshToken(
	val userId: UUID,
	val refreshToken: String
)
