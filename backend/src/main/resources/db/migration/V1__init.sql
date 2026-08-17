CREATE TABLE users (
	id UUID PRIMARY KEY,
	email VARCHAR(255) NOT NULL UNIQUE,
	password_hash VARCHAR(255) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE applications (
	id UUID PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	company VARCHAR(255) NOT NULL,
	role VARCHAR(255) NOT NULL,
	location VARCHAR(255),
	salary_min INTEGER,
	salary_max INTEGER,
	tech_stack VARCHAR(500),
	job_description TEXT,
	application_date DATE,
	status VARCHAR(50) NOT NULL,
	notes TEXT,
	created_at TIMESTAMPTZ NOT NULL,
	updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
