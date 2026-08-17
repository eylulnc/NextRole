package com.nextrole.web.dto

import com.nextrole.domain.Application

fun Application.toResponse() = ApplicationResponse(
	id = id,
	company = company,
	role = role,
	location = location,
	salaryMin = salaryMin,
	salaryMax = salaryMax,
	techStack = techStack,
	jobDescription = jobDescription,
	applicationDate = applicationDate,
	status = status,
	notes = notes,
	createdAt = createdAt,
	updatedAt = updatedAt
)
