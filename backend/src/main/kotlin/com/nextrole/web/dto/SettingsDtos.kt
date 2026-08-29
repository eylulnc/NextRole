package com.nextrole.web.dto

data class UserSettingsResponse(
	val language: String,
	val defaultCurrency: String,
	val interviewReminderMode: String,
	val interviewReminderHours: Int,
	val interviewReminderPrompted: Boolean
)

data class UpdateUserSettingsRequest(
	val language: String? = null,
	val defaultCurrency: String? = null,
	val interviewReminderMode: String? = null,
	val interviewReminderHours: Int? = null,
	val interviewReminderPrompted: Boolean? = null
)
