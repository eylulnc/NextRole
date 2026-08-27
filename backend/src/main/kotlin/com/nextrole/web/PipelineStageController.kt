package com.nextrole.web

import com.nextrole.security.CurrentUser
import com.nextrole.service.PipelineStageService
import com.nextrole.web.dto.CreatePipelineStageRequest
import com.nextrole.web.dto.PipelineStageResponse
import com.nextrole.web.dto.ReassignPipelineStageRequest
import com.nextrole.web.dto.ReassignPipelineStageResponse
import com.nextrole.web.dto.ReorderPipelineStagesRequest
import com.nextrole.web.dto.UpdatePipelineStageRequest
import com.nextrole.web.dto.toResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/pipeline-stages")
class PipelineStageController(
	private val pipelineStageService: PipelineStageService
) {

	@GetMapping
	fun list(): List<PipelineStageResponse> {
		val userId = CurrentUser.id()
		val counts = pipelineStageService.applicationCounts(userId)
		return pipelineStageService.list(userId).map { it.toResponse(counts[it.key] ?: 0) }
	}

	@PostMapping
	fun create(@Valid @RequestBody request: CreatePipelineStageRequest): ResponseEntity<PipelineStageResponse> {
		val userId = CurrentUser.id()
		val stage = pipelineStageService.create(userId, request)
		return ResponseEntity.status(HttpStatus.CREATED).body(stage.toResponse(0))
	}

	@PatchMapping("/{id}")
	fun update(@PathVariable id: UUID, @RequestBody request: UpdatePipelineStageRequest): PipelineStageResponse {
		val userId = CurrentUser.id()
		val stage = pipelineStageService.update(userId, id, request)
		return stage.toResponse(pipelineStageService.applicationCounts(userId)[stage.key] ?: 0)
	}

	@DeleteMapping("/{id}")
	fun delete(@PathVariable id: UUID): ResponseEntity<Void> {
		pipelineStageService.delete(CurrentUser.id(), id)
		return ResponseEntity.noContent().build()
	}

	@PostMapping("/{id}/reassign")
	fun reassign(@PathVariable id: UUID, @RequestBody request: ReassignPipelineStageRequest): ReassignPipelineStageResponse {
		val movedCount = pipelineStageService.reassign(CurrentUser.id(), id, request.toStageId)
		return ReassignPipelineStageResponse(movedCount = movedCount)
	}

	@PatchMapping("/reorder")
	fun reorder(@RequestBody request: ReorderPipelineStagesRequest): List<PipelineStageResponse> {
		val userId = CurrentUser.id()
		val counts = pipelineStageService.applicationCounts(userId)
		return pipelineStageService.reorder(userId, request.orderedIds).map { it.toResponse(counts[it.key] ?: 0) }
	}
}
