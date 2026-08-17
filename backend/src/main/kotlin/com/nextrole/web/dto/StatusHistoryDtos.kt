package com.nextrole.web.dto

import com.nextrole.domain.ApplicationStatus
import com.nextrole.domain.ApplicationStatusHistory
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

data class ChangeStatusRequest(
	@field:NotNull val status: ApplicationStatus
)

data class StatusHistoryResponse(
	val id: UUID,
	val status: ApplicationStatus,
	val changedAt: Instant
)

fun ApplicationStatusHistory.toResponse() = StatusHistoryResponse(
	id = id,
	status = status,
	changedAt = changedAt
)
