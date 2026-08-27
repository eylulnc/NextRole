CREATE TABLE pipeline_stages (
	id UUID PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	key VARCHAR(64) NOT NULL,
	label VARCHAR(255) NOT NULL,
	order_index INTEGER NOT NULL,
	hue INTEGER NOT NULL,
	category VARCHAR(20) NOT NULL,
	is_built_in BOOLEAN NOT NULL DEFAULT FALSE,
	visible BOOLEAN NOT NULL DEFAULT TRUE,
	created_at TIMESTAMPTZ NOT NULL,
	UNIQUE (user_id, key)
);

CREATE INDEX idx_pipeline_stages_user_id ON pipeline_stages(user_id);

INSERT INTO pipeline_stages (id, user_id, key, label, order_index, hue, category, is_built_in, visible, created_at)
SELECT gen_random_uuid(), id, 'SAVED', 'Saved', 0, 230, 'PRE_RESPONSE', TRUE, TRUE, now() FROM users;

INSERT INTO pipeline_stages (id, user_id, key, label, order_index, hue, category, is_built_in, visible, created_at)
SELECT gen_random_uuid(), id, 'APPLIED', 'Applied', 1, 200, 'PRE_RESPONSE', TRUE, TRUE, now() FROM users;

INSERT INTO pipeline_stages (id, user_id, key, label, order_index, hue, category, is_built_in, visible, created_at)
SELECT gen_random_uuid(), id, 'HR_INTERVIEW', 'HR Interview', 2, 280, 'ACTIVE', TRUE, TRUE, now() FROM users;

INSERT INTO pipeline_stages (id, user_id, key, label, order_index, hue, category, is_built_in, visible, created_at)
SELECT gen_random_uuid(), id, 'TECHNICAL', 'Technical', 3, 310, 'ACTIVE', TRUE, TRUE, now() FROM users;

INSERT INTO pipeline_stages (id, user_id, key, label, order_index, hue, category, is_built_in, visible, created_at)
SELECT gen_random_uuid(), id, 'FINAL', 'Final Round', 4, 20, 'ACTIVE', TRUE, TRUE, now() FROM users;

INSERT INTO pipeline_stages (id, user_id, key, label, order_index, hue, category, is_built_in, visible, created_at)
SELECT gen_random_uuid(), id, 'OFFER', 'Offer', 5, 150, 'TERMINAL', TRUE, TRUE, now() FROM users;

INSERT INTO pipeline_stages (id, user_id, key, label, order_index, hue, category, is_built_in, visible, created_at)
SELECT gen_random_uuid(), id, 'REJECTED', 'Rejected', 6, 0, 'TERMINAL', TRUE, TRUE, now() FROM users;

INSERT INTO pipeline_stages (id, user_id, key, label, order_index, hue, category, is_built_in, visible, created_at)
SELECT gen_random_uuid(), id, 'CODING_ASSIGNMENT', 'Coding Assignment', 7, 85, 'ACTIVE', TRUE, FALSE, now() FROM users;

ALTER TABLE applications
	ADD CONSTRAINT fk_applications_status_stage FOREIGN KEY (user_id, status) REFERENCES pipeline_stages(user_id, key);
