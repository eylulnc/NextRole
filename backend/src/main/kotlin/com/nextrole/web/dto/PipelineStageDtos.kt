package com.nextrole.web.dto

import com.nextrole.domain.PipelineStage
import com.nextrole.domain.PipelineStageCategory
import jakarta.validation.constraints.NotBlank
import java.util.UUID

data class CreatePipelineStageRequest(
	@field:NotBlank val label: String,
	val hue: Int? = null,
	val category: PipelineStageCategory = PipelineStageCategory.ACTIVE
)

data class UpdatePipelineStageRequest(
	val label: String? = null,
	val hue: Int? = null,
	val category: PipelineStageCategory? = null,
	val visible: Boolean? = null
)

data class ReorderPipelineStagesRequest(
	val orderedIds: List<UUID>
)

data class ReassignPipelineStageRequest(
	val toStageId: UUID
)

data class ReassignPipelineStageResponse(
	val movedCount: Int
)

data class PipelineStageResponse(
	val id: UUID,
	val key: String,
	val label: String,
	val orderIndex: Int,
	val hue: Int,
	val category: PipelineStageCategory,
	val isBuiltIn: Boolean,
	val visible: Boolean,
	val applicationCount: Int
)

fun PipelineStage.toResponse(applicationCount: Int) = PipelineStageResponse(
	id = id,
	key = key,
	label = label,
	orderIndex = orderIndex,
	hue = hue,
	category = category,
	isBuiltIn = isBuiltIn,
	visible = visible,
	applicationCount = applicationCount
)
