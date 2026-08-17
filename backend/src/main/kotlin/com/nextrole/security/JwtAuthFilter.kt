package com.nextrole.security

import io.jsonwebtoken.JwtException
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.filter.OncePerRequestFilter

class JwtAuthFilter(
	private val jwtService: JwtService
) : OncePerRequestFilter() {

	override fun doFilterInternal(
		request: HttpServletRequest,
		response: HttpServletResponse,
		filterChain: FilterChain
	) {
		val header = request.getHeader("Authorization")
		if (header != null && header.startsWith("Bearer ")) {
			val token = header.removePrefix("Bearer ")
			try {
				val userId = jwtService.extractUserId(token)
				val auth = UsernamePasswordAuthenticationToken(userId, null, emptyList())
				SecurityContextHolder.getContext().authentication = auth
			} catch (_: JwtException) {
				// invalid/expired token: leave context unauthenticated, request will be rejected downstream
			}
		}
		filterChain.doFilter(request, response)
	}
}
