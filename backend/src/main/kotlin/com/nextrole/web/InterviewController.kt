package com.nextrole.web

import com.nextrole.security.CurrentUser
import com.nextrole.service.InterviewService
import com.nextrole.web.dto.CreateInterviewRequest
import com.nextrole.web.dto.InterviewResponse
import com.nextrole.web.dto.toResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/applications/{applicationId}/interviews")
class InterviewController(
	private val interviewService: InterviewService
) {

	@PostMapping
	fun create(
		@PathVariable applicationId: UUID,
		@Valid @RequestBody request: CreateInterviewRequest
	): ResponseEntity<InterviewResponse> {
		val interview = interviewService.create(CurrentUser.id(), applicationId, request)
		return ResponseEntity.status(HttpStatus.CREATED).body(interview.toResponse())
	}

	@GetMapping
	fun list(@PathVariable applicationId: UUID): List<InterviewResponse> =
		interviewService.list(CurrentUser.id(), applicationId).map { it.toResponse() }
}
