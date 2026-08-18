-- migrate:up

CREATE INDEX idx_api_tokens_user_id ON api_tokens (user_id, created_at);

-- migrate:down

DROP INDEX IF EXISTS idx_api_tokens_user_id;
