package com.nextrole.web.dto

import com.nextrole.domain.Application

fun Application.toResponse() = ApplicationResponse(
	id = id,
	company = company,
	role = role,
	location = location,
	workMode = workMode,
	salaryMin = salaryMin,
	salaryMax = salaryMax,
	currency = currency,
	techStack = techStack,
	jobDescription = jobDescription,
	applicationDate = applicationDate,
	status = status,
	notes = notes,
	createdAt = createdAt,
	updatedAt = updatedAt
)
