-- migrate:up

CREATE INDEX idx_form_responses_form_id_created_at ON form_responses (form_id, created_at);

DROP INDEX IF EXISTS idx_form_responses_form_id;

-- migrate:down

CREATE INDEX idx_form_responses_form_id ON form_responses (form_id);

DROP INDEX IF EXISTS idx_form_responses_form_id_created_at;
