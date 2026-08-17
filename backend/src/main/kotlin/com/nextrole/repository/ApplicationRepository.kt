package com.nextrole.repository

import com.nextrole.domain.Application
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ApplicationRepository : JpaRepository<Application, UUID> {
	fun findByUserId(userId: UUID, pageable: Pageable): Page<Application>
	fun findByIdAndUserId(id: UUID, userId: UUID): Application?
}
