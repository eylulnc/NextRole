package com.nextrole.web.dto

import com.nextrole.domain.ApplicationStatusHistory
import jakarta.validation.constraints.NotBlank
import java.time.Instant
import java.util.UUID

data class ChangeStatusRequest(
	@field:NotBlank val status: String
)

data class StatusHistoryResponse(
	val id: UUID,
	val status: String,
	val changedAt: Instant
)

fun ApplicationStatusHistory.toResponse() = StatusHistoryResponse(
	id = id,
	status = status,
	changedAt = changedAt
)
