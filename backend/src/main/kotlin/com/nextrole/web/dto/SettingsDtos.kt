package com.nextrole.web.dto

data class UserSettingsResponse(
	val language: String,
	val defaultCurrency: String
)

data class UpdateUserSettingsRequest(
	val language: String? = null,
	val defaultCurrency: String? = null
)
