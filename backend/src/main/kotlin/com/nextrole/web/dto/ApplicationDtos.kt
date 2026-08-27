package com.nextrole.web.dto

import jakarta.validation.constraints.NotBlank
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreateApplicationRequest(
	@field:NotBlank val company: String,
	@field:NotBlank val role: String,
	val location: String? = null,
	val workMode: String? = null,
	val salaryMin: Int? = null,
	val salaryMax: Int? = null,
	val currency: String = "EUR",
	val techStack: String? = null,
	val jobDescription: String? = null,
	val applicationDate: LocalDate? = null,
	val status: String = "SAVED",
	val notes: String? = null
)

data class UpdateApplicationRequest(
	val company: String? = null,
	val role: String? = null,
	val location: String? = null,
	val workMode: String? = null,
	val salaryMin: Int? = null,
	val salaryMax: Int? = null,
	val currency: String? = null,
	val techStack: String? = null,
	val jobDescription: String? = null,
	val applicationDate: LocalDate? = null,
	val status: String? = null,
	val notes: String? = null
)

data class ApplicationResponse(
	val id: UUID,
	val company: String,
	val role: String,
	val location: String?,
	val workMode: String?,
	val salaryMin: Int?,
	val salaryMax: Int?,
	val currency: String,
	val techStack: String?,
	val jobDescription: String?,
	val applicationDate: LocalDate?,
	val status: String,
	val notes: String?,
	val createdAt: Instant,
	val updatedAt: Instant
)
