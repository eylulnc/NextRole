package com.nextrole.service

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
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.util.UUID

class PipelineStageServiceTest {

	private val pipelineStageRepository = mockk<PipelineStageRepository>()
	private val applicationRepository = mockk<ApplicationRepository>()
	private val statusHistoryRepository = mockk<ApplicationStatusHistoryRepository>()
	private val pipelineStageService = PipelineStageService(pipelineStageRepository, applicationRepository, statusHistoryRepository)
	private val userId = UUID.randomUUID()

	private fun stage(
		key: String,
		label: String = key,
		orderIndex: Int = 0,
		isBuiltIn: Boolean = false,
		visible: Boolean = true
	) = PipelineStage(
		userId = userId, key = key, label = label, orderIndex = orderIndex, hue = 0,
		category = PipelineStageCategory.ACTIVE, isBuiltIn = isBuiltIn, visible = visible
	)

	@Test
	fun `seedDefaults creates the 8 built-in stages`() {
		val savedSlots = mutableListOf<PipelineStage>()
		every { pipelineStageRepository.save(capture(savedSlots)) } answers { savedSlots.last() }

		pipelineStageService.seedDefaults(userId)

		assertEquals(8, savedSlots.size)
		assertEquals(
			setOf("SAVED", "APPLIED", "HR_INTERVIEW", "CODING_ASSIGNMENT", "TECHNICAL", "FINAL", "OFFER", "REJECTED"),
			savedSlots.map { it.key }.toSet()
		)
		assert(savedSlots.all { it.isBuiltIn })
	}

	@Test
	fun `seedDefaults creates Coding Assignment hidden by default`() {
		val savedSlots = mutableListOf<PipelineStage>()
		every { pipelineStageRepository.save(capture(savedSlots)) } answers { savedSlots.last() }

		pipelineStageService.seedDefaults(userId)

		val codingAssignment = savedSlots.single { it.key == "CODING_ASSIGNMENT" }
		assert(!codingAssignment.visible)
		assert(savedSlots.filter { it.key != "CODING_ASSIGNMENT" }.all { it.visible })
	}

	@Test
	fun `create slugifies the label into a unique uppercase key and appends at the end`() {
		every { pipelineStageRepository.findByUserIdOrderByOrderIndexAsc(userId) } returns listOf(stage("SAVED", orderIndex = 0))
		every { pipelineStageRepository.existsByUserIdAndKey(userId, "CODING_ASSIGNMENT") } returns false
		val savedSlot = slot<PipelineStage>()
		every { pipelineStageRepository.save(capture(savedSlot)) } answers { savedSlot.captured }

		val result = pipelineStageService.create(userId, CreatePipelineStageRequest(label = "Coding Assignment"))

		assertEquals("CODING_ASSIGNMENT", result.key)
		assertEquals(1, result.orderIndex)
		assert(!result.isBuiltIn)
	}

	@Test
	fun `create appends a numeric suffix when the slug already exists`() {
		every { pipelineStageRepository.findByUserIdOrderByOrderIndexAsc(userId) } returns emptyList()
		every { pipelineStageRepository.existsByUserIdAndKey(userId, "PHONE_SCREEN") } returns true
		every { pipelineStageRepository.existsByUserIdAndKey(userId, "PHONE_SCREEN_2") } returns false
		val savedSlot = slot<PipelineStage>()
		every { pipelineStageRepository.save(capture(savedSlot)) } answers { savedSlot.captured }

		val result = pipelineStageService.create(userId, CreatePipelineStageRequest(label = "Phone Screen"))

		assertEquals("PHONE_SCREEN_2", result.key)
	}

	@Test
	fun `create rejects a new stage once the pipeline stage limit is reached`() {
		val existing = (0 until MAX_PIPELINE_STAGES).map { stage("STAGE_$it", orderIndex = it) }
		every { pipelineStageRepository.findByUserIdOrderByOrderIndexAsc(userId) } returns existing

		assertThrows(PipelineStageLimitExceededException::class.java) {
			pipelineStageService.create(userId, CreatePipelineStageRequest(label = "One Too Many"))
		}
	}

	@Test
	fun `update blocks hiding a stage that still has applications`() {
		val existing = stage("TECHNICAL")
		every { pipelineStageRepository.findByIdAndUserId(existing.id, userId) } returns existing
		every { applicationRepository.existsByUserIdAndStatus(userId, "TECHNICAL") } returns true

		assertThrows(PipelineStageInUseException::class.java) {
			pipelineStageService.update(userId, existing.id, UpdatePipelineStageRequest(visible = false))
		}
	}

	@Test
	fun `update allows hiding a stage with no applications`() {
		val existing = stage("TECHNICAL")
		every { pipelineStageRepository.findByIdAndUserId(existing.id, userId) } returns existing
		every { applicationRepository.existsByUserIdAndStatus(userId, "TECHNICAL") } returns false
		every { pipelineStageRepository.save(existing) } returns existing

		val result = pipelineStageService.update(userId, existing.id, UpdatePipelineStageRequest(visible = false))

		assertEquals(false, result.visible)
	}

	@Test
	fun `update renames the label without touching the key`() {
		val existing = stage("HR_INTERVIEW", label = "HR Interview")
		every { pipelineStageRepository.findByIdAndUserId(existing.id, userId) } returns existing
		every { pipelineStageRepository.save(existing) } returns existing

		val result = pipelineStageService.update(userId, existing.id, UpdatePipelineStageRequest(label = "Recruiter Call"))

		assertEquals("Recruiter Call", result.label)
		assertEquals("HR_INTERVIEW", result.key)
	}

	@Test
	fun `delete blocks deleting a built-in stage`() {
		val existing = stage("SAVED", isBuiltIn = true)
		every { pipelineStageRepository.findByIdAndUserId(existing.id, userId) } returns existing

		assertThrows(BuiltInPipelineStageException::class.java) {
			pipelineStageService.delete(userId, existing.id)
		}
		verify(exactly = 0) { pipelineStageRepository.delete(any()) }
	}

	@Test
	fun `delete blocks deleting a custom stage that still has applications`() {
		val existing = stage("CODING_ASSIGNMENT", isBuiltIn = false)
		every { pipelineStageRepository.findByIdAndUserId(existing.id, userId) } returns existing
		every { applicationRepository.existsByUserIdAndStatus(userId, "CODING_ASSIGNMENT") } returns true

		assertThrows(PipelineStageInUseException::class.java) {
			pipelineStageService.delete(userId, existing.id)
		}
	}

	@Test
	fun `delete removes a custom stage with no applications`() {
		val existing = stage("CODING_ASSIGNMENT", isBuiltIn = false)
		every { pipelineStageRepository.findByIdAndUserId(existing.id, userId) } returns existing
		every { applicationRepository.existsByUserIdAndStatus(userId, "CODING_ASSIGNMENT") } returns false
		every { pipelineStageRepository.delete(existing) } returns Unit

		pipelineStageService.delete(userId, existing.id)

		verify(exactly = 1) { pipelineStageRepository.delete(existing) }
	}

	@Test
	fun `update throws when the stage does not belong to the user`() {
		val id = UUID.randomUUID()
		every { pipelineStageRepository.findByIdAndUserId(id, userId) } returns null

		assertThrows(ResourceNotFoundException::class.java) {
			pipelineStageService.update(userId, id, UpdatePipelineStageRequest(label = "New label"))
		}
	}

	@Test
	fun `reorder rewrites order index based on the given sequence`() {
		val a = stage("SAVED", orderIndex = 0)
		val b = stage("APPLIED", orderIndex = 1)
		every { pipelineStageRepository.findByUserIdOrderByOrderIndexAsc(userId) } returns listOf(a, b)
		every { pipelineStageRepository.saveAll(any<List<PipelineStage>>()) } answers { firstArg() }

		val result = pipelineStageService.reorder(userId, listOf(b.id, a.id))

		assertEquals(0, b.orderIndex)
		assertEquals(1, a.orderIndex)
		assertEquals(listOf(b, a), result)
	}

	@Test
	fun `applicationCounts groups applications by status`() {
		val applications = listOf(
			com.nextrole.domain.Application(userId = userId, company = "Acme", role = "Engineer", status = "SAVED"),
			com.nextrole.domain.Application(userId = userId, company = "Acme", role = "Engineer", status = "SAVED"),
			com.nextrole.domain.Application(userId = userId, company = "Acme", role = "Engineer", status = "APPLIED")
		)
		every { applicationRepository.findByUserId(userId) } returns applications

		val counts = pipelineStageService.applicationCounts(userId)

		assertEquals(2, counts["SAVED"])
		assertEquals(1, counts["APPLIED"])
	}

	@Test
	fun `reassign moves all applications from one stage to another and records history`() {
		val from = stage("TECHNICAL")
		val to = stage("HR_INTERVIEW")
		every { pipelineStageRepository.findByIdAndUserId(from.id, userId) } returns from
		every { pipelineStageRepository.findByIdAndUserId(to.id, userId) } returns to
		val applications = listOf(
			com.nextrole.domain.Application(userId = userId, company = "Acme", role = "Engineer", status = "TECHNICAL"),
			com.nextrole.domain.Application(userId = userId, company = "Globex", role = "Engineer", status = "TECHNICAL"),
			com.nextrole.domain.Application(userId = userId, company = "Initech", role = "Engineer", status = "OFFER")
		)
		every { applicationRepository.findByUserId(userId) } returns applications
		every { applicationRepository.save(any()) } answers { firstArg() }
		every { statusHistoryRepository.save(any()) } answers { firstArg() }

		val movedCount = pipelineStageService.reassign(userId, from.id, to.id)

		assertEquals(2, movedCount)
		assertEquals("HR_INTERVIEW", applications[0].status)
		assertEquals("HR_INTERVIEW", applications[1].status)
		assertEquals("OFFER", applications[2].status)
	}
}
