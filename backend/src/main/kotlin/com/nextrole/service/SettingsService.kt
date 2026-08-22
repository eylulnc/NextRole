package com.nextrole.service

import com.nextrole.exception.ResourceNotFoundException
import com.nextrole.repository.UserRepository
import com.nextrole.web.dto.UpdateUserSettingsRequest
import com.nextrole.web.dto.UserSettingsResponse
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class SettingsService(
	private val userRepository: UserRepository
) {

	fun get(userId: UUID): UserSettingsResponse {
		val user = userRepository.findById(userId).orElseThrow { ResourceNotFoundException("User", userId) }
		return UserSettingsResponse(language = user.language, defaultCurrency = user.defaultCurrency)
	}

	fun update(userId: UUID, request: UpdateUserSettingsRequest): UserSettingsResponse {
		val user = userRepository.findById(userId).orElseThrow { ResourceNotFoundException("User", userId) }
		request.language?.let { user.language = it }
		request.defaultCurrency?.let { user.defaultCurrency = it }
		userRepository.save(user)
		return UserSettingsResponse(language = user.language, defaultCurrency = user.defaultCurrency)
	}
}
