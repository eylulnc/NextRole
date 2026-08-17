CREATE TABLE contacts (
	id UUID PRIMARY KEY,
	application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
	name VARCHAR(255) NOT NULL,
	role VARCHAR(255),
	email VARCHAR(255),
	created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_contacts_application_id ON contacts(application_id);
