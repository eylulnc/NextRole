package com.nextrole.config

import io.github.bucket4j.Bandwidth
import io.github.bucket4j.Bucket
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.time.Duration
import java.util.concurrent.ConcurrentHashMap

@Component
class RateLimitFilter : OncePerRequestFilter() {

	private val buckets = ConcurrentHashMap<String, Bucket>()

	private fun newBucket(): Bucket =
		Bucket.builder()
			.addLimit(Bandwidth.builder().capacity(10).refillIntervally(10, Duration.ofMinutes(1)).build())
			.build()

	override fun doFilterInternal(
		request: HttpServletRequest,
		response: HttpServletResponse,
		filterChain: FilterChain
	) {
		if (request.requestURI.startsWith("/api/auth/")) {
			val key = request.remoteAddr
			val bucket = buckets.computeIfAbsent(key) { newBucket() }
			if (!bucket.tryConsume(1)) {
				response.status = 429
				response.contentType = "application/json"
				response.writer.write("""{"error":"Too many requests, please try again later."}""")
				return
			}
		}
		filterChain.doFilter(request, response)
	}
}
