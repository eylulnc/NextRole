package com.nextrole.web.dto

import com.nextrole.domain.Contact
import jakarta.validation.constraints.NotBlank
import java.time.Instant
import java.util.UUID

data class CreateContactRequest(
	@field:NotBlank val name: String,
	val role: String? = null,
	val email: String? = null
)

data class UpdateContactRequest(
	val name: String? = null,
	val role: String? = null,
	val email: String? = null
)

data class ContactResponse(
	val id: UUID,
	val name: String,
	val role: String?,
	val email: String?,
	val createdAt: Instant
)

fun Contact.toResponse() = ContactResponse(
	id = id,
	name = name,
	role = role,
	email = email,
	createdAt = createdAt
)
