package com.nextrole.exception

class EmailAlreadyRegisteredException(email: String) : RuntimeException("Email already registered: $email")

class InvalidCredentialsException : RuntimeException("Invalid email or password")

class ApplicationNotFoundException(id: Any) : RuntimeException("Application not found: $id")
