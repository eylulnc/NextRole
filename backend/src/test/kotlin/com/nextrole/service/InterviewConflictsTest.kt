package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.Interview
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

class InterviewConflictsTest {

	private val userId = UUID.randomUUID()
	private val acme = Application(userId = userId, company = "Acme", role = "Engineer")
	private val globex = Application(userId = userId, company = "Globex", role = "Engineer")
	private val applicationsById = listOf(acme, globex).associateBy { it.id }

	private fun interview(application: Application, at: String, durationMinutes: Int? = null) =
		Interview(
			applicationId = application.id,
			round = "Technical",
			scheduledAt = Instant.parse(at),
			durationMinutes = durationMinutes
		)

	@Test
	fun `flags both sides of an overlapping pair`() {
		val first = interview(acme, "2026-10-01T14:00:00Z", 60)
		val second = interview(globex, "2026-10-01T14:30:00Z", 60)

		val conflicts = InterviewConflicts.findConflicts(listOf(first, second), applicationsById)

		assertEquals(second.id, conflicts[first.id]?.id)
		assertEquals("Globex", conflicts[first.id]?.company)
		assertEquals(first.id, conflicts[second.id]?.id)
		assertEquals("Acme", conflicts[second.id]?.company)
	}

	@Test
	fun `treats back-to-back interviews as non-overlapping`() {
		val first = interview(acme, "2026-10-01T14:00:00Z", 60)
		val second = interview(globex, "2026-10-01T15:00:00Z", 60)

		val conflicts = InterviewConflicts.findConflicts(listOf(first, second), applicationsById)

		assertTrue(conflicts.isEmpty())
	}

	@Test
	fun `falls back to the default duration when none is set`() {
		val first = interview(acme, "2026-10-01T14:00:00Z", null)
		val second = interview(globex, "2026-10-01T14:45:00Z", null)

		val conflicts = InterviewConflicts.findConflicts(listOf(first, second), applicationsById)

		assertEquals(second.id, conflicts[first.id]?.id)
	}

	@Test
	fun `never reports an interview as conflicting with itself`() {
		val only = interview(acme, "2026-10-01T14:00:00Z", 60)

		val conflicts = InterviewConflicts.findConflicts(listOf(only), applicationsById)

		assertNull(conflicts[only.id])
	}

	@Test
	fun `ignores interviews whose application no longer exists`() {
		val orphan = interview(Application(userId = userId, company = "Gone", role = "Engineer"), "2026-10-01T14:00:00Z", 60)
		val known = interview(acme, "2026-10-01T14:15:00Z", 60)

		val conflicts = InterviewConflicts.findConflicts(listOf(orphan, known), applicationsById)

		assertTrue(conflicts.isEmpty())
	}

	@Test
	fun `detects a conflict between interviews on the same application`() {
		val first = interview(acme, "2026-10-01T14:00:00Z", 60)
		val second = interview(acme, "2026-10-01T14:30:00Z", 60)

		val conflicts = InterviewConflicts.findConflicts(listOf(first, second), applicationsById)

		assertEquals(second.id, conflicts[first.id]?.id)
	}
}
