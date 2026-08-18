-- migrate:up

ALTER TABLE api_tokens
    ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'personal'
        CHECK (type IN ('personal', 'session'));

UPDATE api_tokens SET type = 'session' WHERE name LIKE 'Session %';

-- migrate:down

ALTER TABLE api_tokens DROP COLUMN IF EXISTS type;
