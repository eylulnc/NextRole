package com.nextrole.web

import com.nextrole.security.CurrentUser
import com.nextrole.service.SettingsService
import com.nextrole.web.dto.UpdateUserSettingsRequest
import com.nextrole.web.dto.UserSettingsResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/settings")
class SettingsController(
	private val settingsService: SettingsService
) {

	@GetMapping
	fun get(): UserSettingsResponse =
		settingsService.get(CurrentUser.id())

	@PatchMapping
	fun update(@RequestBody request: UpdateUserSettingsRequest): UserSettingsResponse =
		settingsService.update(CurrentUser.id(), request)
}
