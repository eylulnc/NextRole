package com.nextrole.domain

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "refresh_tokens")
class RefreshToken(
	@Id
	@Column(nullable = false, updatable = false)
	val id: UUID = UUID.randomUUID(),

	@Column(name = "user_id", nullable = false)
	val userId: UUID,

	// SHA-256 of the token we handed out — the raw value is never stored, so a database
	// leak alone doesn't yield usable tokens.
	@Column(name = "token_hash", nullable = false, unique = true)
	val tokenHash: String,

	@Column(name = "expires_at", nullable = false)
	val expiresAt: Instant,

	@Column(name = "revoked_at")
	var revokedAt: Instant? = null,

	@Column(name = "created_at", nullable = false, updatable = false)
	val createdAt: Instant = Instant.now()
) {
	fun isActive(now: Instant): Boolean = revokedAt == null && expiresAt.isAfter(now)
}
