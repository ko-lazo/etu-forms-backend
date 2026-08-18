-- migrate:up

ALTER TABLE api_tokens DROP COLUMN last_used_at;

-- migrate:down

ALTER TABLE api_tokens ADD COLUMN last_used_at TIMESTAMPTZ;
