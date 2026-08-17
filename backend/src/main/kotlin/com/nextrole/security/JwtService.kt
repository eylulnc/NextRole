package com.nextrole.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.Date
import java.util.UUID
import javax.crypto.SecretKey

@Service
class JwtService(
	@Value("\${app.jwt.secret}") secret: String,
	@Value("\${app.jwt.expiration-ms}") private val expirationMs: Long
) {
	private val key: SecretKey = Keys.hmacShaKeyFor(secret.toByteArray())

	fun generateToken(userId: UUID, email: String): String {
		val now = Date()
		val expiry = Date(now.time + expirationMs)
		return Jwts.builder()
			.subject(userId.toString())
			.claim("email", email)
			.issuedAt(now)
			.expiration(expiry)
			.signWith(key)
			.compact()
	}

	fun parseClaims(token: String): Claims =
		Jwts.parser().verifyWith(key).build().parseSignedClaims(token).payload

	fun extractUserId(token: String): UUID =
		UUID.fromString(parseClaims(token).subject)
}
