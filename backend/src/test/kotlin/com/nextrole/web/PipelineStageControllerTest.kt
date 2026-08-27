package com.nextrole.web

import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import com.nextrole.domain.PipelineStage
import com.nextrole.domain.PipelineStageCategory
import com.nextrole.service.PipelineStageService
import com.nextrole.web.dto.CreatePipelineStageRequest
import com.nextrole.web.dto.ReassignPipelineStageRequest
import com.nextrole.web.dto.ReorderPipelineStagesRequest
import com.nextrole.web.dto.UpdatePipelineStageRequest
import io.mockk.every
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import java.util.UUID

@WebMvcTest(PipelineStageController::class)
@AutoConfigureMockMvc(addFilters = false)
class PipelineStageControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var objectMapper: ObjectMapper

	@MockkBean
	private lateinit var pipelineStageService: PipelineStageService

	private val userId = UUID.randomUUID()

	private fun stage(key: String, orderIndex: Int = 0) = PipelineStage(
		userId = userId, key = key, label = key, orderIndex = orderIndex, hue = 200,
		category = PipelineStageCategory.ACTIVE, isBuiltIn = false, visible = true
	)

	@BeforeEach
	fun setUp() {
		val auth = UsernamePasswordAuthenticationToken(userId, null, emptyList())
		SecurityContextHolder.getContext().authentication = auth
		every { pipelineStageService.applicationCounts(userId) } returns emptyMap()
	}

	@AfterEach
	fun tearDown() {
		SecurityContextHolder.clearContext()
	}

	@Test
	fun `list returns the user's pipeline stages with application counts`() {
		every { pipelineStageService.list(userId) } returns listOf(stage("SAVED"))
		every { pipelineStageService.applicationCounts(userId) } returns mapOf("SAVED" to 3)

		mockMvc.get("/api/pipeline-stages").andExpect {
			status { isOk() }
			jsonPath("$[0].key") { value("SAVED") }
			jsonPath("$[0].applicationCount") { value(3) }
		}
	}

	@Test
	fun `create returns 201 with the created stage`() {
		val request = CreatePipelineStageRequest(label = "Coding Assignment")
		every { pipelineStageService.create(userId, request) } returns stage("CODING_ASSIGNMENT")

		mockMvc.post("/api/pipeline-stages") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(request)
		}.andExpect {
			status { isCreated() }
			jsonPath("$.key") { value("CODING_ASSIGNMENT") }
		}
	}

	@Test
	fun `update returns the updated stage`() {
		val id = UUID.randomUUID()
		val request = UpdatePipelineStageRequest(label = "Recruiter Call")
		every { pipelineStageService.update(userId, id, request) } returns stage("HR_INTERVIEW")

		mockMvc.patch("/api/pipeline-stages/$id") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(request)
		}.andExpect {
			status { isOk() }
		}
	}

	@Test
	fun `delete returns 204`() {
		val id = UUID.randomUUID()
		every { pipelineStageService.delete(userId, id) } returns Unit

		mockMvc.delete("/api/pipeline-stages/$id").andExpect {
			status { isNoContent() }
		}
	}

	@Test
	fun `reassign returns the number of applications moved`() {
		val fromId = UUID.randomUUID()
		val toId = UUID.randomUUID()
		every { pipelineStageService.reassign(userId, fromId, toId) } returns 3

		mockMvc.post("/api/pipeline-stages/$fromId/reassign") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(ReassignPipelineStageRequest(toStageId = toId))
		}.andExpect {
			status { isOk() }
			jsonPath("$.movedCount") { value(3) }
		}
	}

	@Test
	fun `reorder returns the reordered stages`() {
		val ids = listOf(UUID.randomUUID(), UUID.randomUUID())
		val request = ReorderPipelineStagesRequest(orderedIds = ids)
		every { pipelineStageService.reorder(userId, ids) } returns listOf(stage("APPLIED", 0), stage("SAVED", 1))

		mockMvc.patch("/api/pipeline-stages/reorder") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(request)
		}.andExpect {
			status { isOk() }
			jsonPath("$[0].key") { value("APPLIED") }
		}
	}
}
