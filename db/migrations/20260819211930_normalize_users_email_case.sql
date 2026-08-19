-- migrate:up

UPDATE users SET email = lower(email) WHERE email <> lower(email);

ALTER TABLE users DROP CONSTRAINT users_email_key;

CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));

-- migrate:down

DROP INDEX IF EXISTS users_email_lower_key;

ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
