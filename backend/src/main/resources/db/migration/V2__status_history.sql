CREATE TABLE application_status_history (
	id UUID PRIMARY KEY,
	application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
	status VARCHAR(50) NOT NULL,
	changed_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_status_history_application_id ON application_status_history(application_id);
