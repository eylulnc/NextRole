package com.nextrole.web

import com.nextrole.security.CurrentUser
import com.nextrole.service.ContactService
import com.nextrole.web.dto.ContactResponse
import com.nextrole.web.dto.CreateContactRequest
import com.nextrole.web.dto.UpdateContactRequest
import com.nextrole.web.dto.toResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/applications/{applicationId}/contacts")
class ContactController(
	private val contactService: ContactService
) {

	@PostMapping
	fun create(
		@PathVariable applicationId: UUID,
		@Valid @RequestBody request: CreateContactRequest
	): ResponseEntity<ContactResponse> {
		val contact = contactService.create(CurrentUser.id(), applicationId, request)
		return ResponseEntity.status(HttpStatus.CREATED).body(contact.toResponse())
	}

	@GetMapping
	fun list(@PathVariable applicationId: UUID): List<ContactResponse> =
		contactService.list(CurrentUser.id(), applicationId).map { it.toResponse() }

	@PatchMapping("/{contactId}")
	fun update(
		@PathVariable applicationId: UUID,
		@PathVariable contactId: UUID,
		@RequestBody request: UpdateContactRequest
	): ContactResponse =
		contactService.update(CurrentUser.id(), applicationId, contactId, request).toResponse()

	@DeleteMapping("/{contactId}")
	fun delete(@PathVariable applicationId: UUID, @PathVariable contactId: UUID): ResponseEntity<Void> {
		contactService.delete(CurrentUser.id(), applicationId, contactId)
		return ResponseEntity.noContent().build()
	}
}
