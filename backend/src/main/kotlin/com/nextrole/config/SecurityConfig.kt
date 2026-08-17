package com.nextrole.config

import com.nextrole.security.JwtAuthFilter
import com.nextrole.security.JwtService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
class SecurityConfig(
	private val jwtService: JwtService,
	private val corsProperties: CorsProperties
) {

	@Bean
	fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

	@Bean
	fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
		http
			.csrf { it.disable() }
			.cors { it.configurationSource(corsConfigurationSource()) }
			.sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
			.authorizeHttpRequests {
				it.requestMatchers("/api/auth/**", "/actuator/health").permitAll()
				it.anyRequest().authenticated()
			}
			.addFilterBefore(JwtAuthFilter(jwtService), UsernamePasswordAuthenticationFilter::class.java)

		return http.build()
	}

	private fun corsConfigurationSource(): CorsConfigurationSource {
		val config = CorsConfiguration()
		config.allowedOrigins = corsProperties.allowedOrigins
		config.allowedMethods = listOf("GET", "POST", "PATCH", "DELETE", "OPTIONS")
		config.allowedHeaders = listOf("Authorization", "Content-Type")

		val source = UrlBasedCorsConfigurationSource()
		source.registerCorsConfiguration("/**", config)
		return source
	}
}
