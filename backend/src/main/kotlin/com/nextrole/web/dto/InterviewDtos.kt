package com.nextrole.web.dto

import com.nextrole.domain.Interview
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

data class CreateInterviewRequest(
	@field:NotBlank val round: String,
	val interviewer: String? = null,
	@field:NotNull val scheduledAt: Instant,
	val mode: String? = null,
	val notes: String? = null
)

data class InterviewResponse(
	val id: UUID,
	val round: String,
	val interviewer: String?,
	val scheduledAt: Instant,
	val mode: String?,
	val notes: String?,
	val createdAt: Instant
)

fun Interview.toResponse() = InterviewResponse(
	id = id,
	round = round,
	interviewer = interviewer,
	scheduledAt = scheduledAt,
	mode = mode,
	notes = notes,
	createdAt = createdAt
)
