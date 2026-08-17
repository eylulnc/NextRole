package com.nextrole.security

import org.springframework.security.core.context.SecurityContextHolder
import java.util.UUID

object CurrentUser {
	fun id(): UUID =
		SecurityContextHolder.getContext().authentication.principal as UUID
}
