package com.nextrole

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan

@SpringBootApplication
@ConfigurationPropertiesScan
class NextRoleApplication

fun main(args: Array<String>) {
	runApplication<NextRoleApplication>(*args)
}
