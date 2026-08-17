package com.nextrole.web

import com.nextrole.security.CurrentUser
import com.nextrole.service.ApplicationService
import com.nextrole.web.dto.ApplicationResponse
import com.nextrole.web.dto.CreateApplicationRequest
import com.nextrole.web.dto.UpdateApplicationRequest
import com.nextrole.web.dto.toResponse
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/applications")
class ApplicationController(
	private val applicationService: ApplicationService
) {

	@PostMapping
	fun create(@Valid @RequestBody request: CreateApplicationRequest): ResponseEntity<ApplicationResponse> {
		val application = applicationService.create(CurrentUser.id(), request)
		return ResponseEntity.status(HttpStatus.CREATED).body(application.toResponse())
	}

	@GetMapping
	fun list(pageable: Pageable): Page<ApplicationResponse> =
		applicationService.list(CurrentUser.id(), pageable).map { it.toResponse() }

	@GetMapping("/{id}")
	fun get(@PathVariable id: UUID): ApplicationResponse =
		applicationService.get(CurrentUser.id(), id).toResponse()

	@PatchMapping("/{id}")
	fun update(@PathVariable id: UUID, @Valid @RequestBody request: UpdateApplicationRequest): ApplicationResponse =
		applicationService.update(CurrentUser.id(), id, request).toResponse()

	@DeleteMapping("/{id}")
	fun delete(@PathVariable id: UUID): ResponseEntity<Void> {
		applicationService.delete(CurrentUser.id(), id)
		return ResponseEntity.noContent().build()
	}
}
