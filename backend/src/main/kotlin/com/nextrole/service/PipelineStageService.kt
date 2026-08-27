package com.nextrole.service

import com.nextrole.domain.ApplicationStatusHistory
import com.nextrole.domain.PipelineStage
import com.nextrole.domain.PipelineStageCategory
import com.nextrole.exception.BuiltInPipelineStageException
import com.nextrole.exception.PipelineStageInUseException
import com.nextrole.exception.PipelineStageLimitExceededException
import com.nextrole.exception.ResourceNotFoundException
import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.ApplicationStatusHistoryRepository
import com.nextrole.repository.PipelineStageRepository
import com.nextrole.web.dto.CreatePipelineStageRequest
import com.nextrole.web.dto.UpdatePipelineStageRequest
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

private data class DefaultStage(
	val key: String,
	val label: String,
	val hue: Int,
	val category: PipelineStageCategory,
	val visible: Boolean = true
)

private val DEFAULT_STAGES = listOf(
	DefaultStage("SAVED", "Saved", 230, PipelineStageCategory.PRE_RESPONSE),
	DefaultStage("APPLIED", "Applied", 200, PipelineStageCategory.PRE_RESPONSE),
	DefaultStage("HR_INTERVIEW", "HR Interview", 280, PipelineStageCategory.ACTIVE),
	DefaultStage("TECHNICAL", "Technical", 310, PipelineStageCategory.ACTIVE),
	DefaultStage("FINAL", "Final Round", 20, PipelineStageCategory.ACTIVE),
	DefaultStage("OFFER", "Offer", 150, PipelineStageCategory.TERMINAL),
	DefaultStage("REJECTED", "Rejected", 0, PipelineStageCategory.TERMINAL),
	DefaultStage("CODING_ASSIGNMENT", "Coding Assignment", 85, PipelineStageCategory.ACTIVE, visible = false)
)

const val MAX_PIPELINE_STAGES = 12

@Service
class PipelineStageService(
	private val pipelineStageRepository: PipelineStageRepository,
	private val applicationRepository: ApplicationRepository,
	private val statusHistoryRepository: ApplicationStatusHistoryRepository
) {

	fun applicationCounts(userId: UUID): Map<String, Int> =
		applicationRepository.findByUserId(userId).groupingBy { it.status }.eachCount()

	fun seedDefaults(userId: UUID) {
		DEFAULT_STAGES.forEachIndexed { index, default ->
			pipelineStageRepository.save(
				PipelineStage(
					userId = userId,
					key = default.key,
					label = default.label,
					orderIndex = index,
					hue = default.hue,
					category = default.category,
					isBuiltIn = true,
					visible = default.visible
				)
			)
		}
	}

	fun list(userId: UUID): List<PipelineStage> =
		pipelineStageRepository.findByUserIdOrderByOrderIndexAsc(userId)

	fun create(userId: UUID, request: CreatePipelineStageRequest): PipelineStage {
		val existing = pipelineStageRepository.findByUserIdOrderByOrderIndexAsc(userId)
		if (existing.size >= MAX_PIPELINE_STAGES) {
			throw PipelineStageLimitExceededException("Cannot add more than $MAX_PIPELINE_STAGES pipeline stages")
		}
		val key = uniqueKey(userId, slugify(request.label))
		val nextOrderIndex = (existing.maxOfOrNull { it.orderIndex } ?: -1) + 1
		val hue = request.hue ?: ((nextOrderIndex * 47) % 360)
		return pipelineStageRepository.save(
			PipelineStage(
				userId = userId,
				key = key,
				label = request.label,
				orderIndex = nextOrderIndex,
				hue = hue,
				category = request.category,
				isBuiltIn = false,
				visible = true
			)
		)
	}

	fun update(userId: UUID, id: UUID, request: UpdatePipelineStageRequest): PipelineStage {
		val stage = get(userId, id)
		if (request.visible == false && applicationRepository.existsByUserIdAndStatus(userId, stage.key)) {
			throw PipelineStageInUseException("Cannot hide '${stage.label}' while applications are still in this stage")
		}
		request.label?.let { stage.label = it }
		request.hue?.let { stage.hue = it }
		request.category?.let { stage.category = it }
		request.visible?.let { stage.visible = it }
		return pipelineStageRepository.save(stage)
	}

	fun delete(userId: UUID, id: UUID) {
		val stage = get(userId, id)
		if (stage.isBuiltIn) {
			throw BuiltInPipelineStageException("'${stage.label}' is a built-in stage — hide it instead of deleting it")
		}
		if (applicationRepository.existsByUserIdAndStatus(userId, stage.key)) {
			throw PipelineStageInUseException("Cannot delete '${stage.label}' while applications are still in this stage")
		}
		pipelineStageRepository.delete(stage)
	}

	fun reassign(userId: UUID, fromId: UUID, toId: UUID): Int {
		val from = get(userId, fromId)
		val to = get(userId, toId)
		val applications = applicationRepository.findByUserId(userId).filter { it.status == from.key }
		applications.forEach { application ->
			application.status = to.key
			application.updatedAt = Instant.now()
			applicationRepository.save(application)
			statusHistoryRepository.save(ApplicationStatusHistory(applicationId = application.id, status = to.key))
		}
		return applications.size
	}

	fun reorder(userId: UUID, orderedIds: List<UUID>): List<PipelineStage> {
		val stages = pipelineStageRepository.findByUserIdOrderByOrderIndexAsc(userId).associateBy { it.id }
		orderedIds.forEachIndexed { index, id ->
			stages[id]?.let { it.orderIndex = index }
		}
		return pipelineStageRepository.saveAll(orderedIds.mapNotNull { stages[it] })
	}

	private fun get(userId: UUID, id: UUID): PipelineStage =
		pipelineStageRepository.findByIdAndUserId(id, userId) ?: throw ResourceNotFoundException("PipelineStage", id)

	private fun slugify(label: String): String {
		val slug = label.trim().lowercase()
			.replace(Regex("[^a-z0-9]+"), "_")
			.trim('_')
		return if (slug.isEmpty()) "stage" else slug.uppercase()
	}

	private fun uniqueKey(userId: UUID, baseKey: String): String {
		var candidate = baseKey
		var suffix = 2
		while (pipelineStageRepository.existsByUserIdAndKey(userId, candidate)) {
			candidate = "${baseKey}_$suffix"
			suffix++
		}
		return candidate
	}
}
