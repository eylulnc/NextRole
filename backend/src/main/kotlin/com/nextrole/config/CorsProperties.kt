package com.nextrole.config

import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component

@Component
@ConfigurationProperties(prefix = "app.cors")
class CorsProperties {
	var allowedOrigins: List<String> = emptyList()
}
