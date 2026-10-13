CREATE TABLE app_auth.users (
  id UUID PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT normalized_email CHECK (email = lower(btrim(email)) AND length(email) > 3)
);

CREATE TABLE app_auth.sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT session_expiration CHECK (expires_at > created_at)
);
CREATE INDEX sessions_user_id_idx ON app_auth.sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON app_auth.sessions(expires_at);

-- Retain used tokens until the session is removed, so replay can be detected.
-- Only hashes are stored; a database read cannot recover a refresh secret.
CREATE TABLE app_auth.refresh_tokens (
  token_hash CHAR(64) PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  session_id UUID NOT NULL REFERENCES app_auth.sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMPTZ
);
CREATE INDEX refresh_tokens_session_id_idx ON app_auth.refresh_tokens(session_id);
CREATE UNIQUE INDEX refresh_tokens_one_current_idx
  ON app_auth.refresh_tokens(session_id) WHERE used_at IS NULL;

-- Atomic shared rate limits work across processes and serverless instances.
CREATE TABLE app_auth.rate_limits (
  key CHAR(64) PRIMARY KEY,
  attempts INTEGER NOT NULL CHECK (attempts > 0),
  resets_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX rate_limits_resets_at_idx ON app_auth.rate_limits(resets_at);
