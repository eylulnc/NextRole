CREATE TABLE interviews (
	id UUID PRIMARY KEY,
	application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
	round VARCHAR(255) NOT NULL,
	interviewer VARCHAR(255),
	scheduled_at TIMESTAMPTZ NOT NULL,
	mode VARCHAR(100),
	notes TEXT,
	created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_interviews_application_id ON interviews(application_id);
