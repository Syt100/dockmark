CREATE TABLE IF NOT EXISTS auth_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  password_hash TEXT NOT NULL,
  password_algo TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 1,
  disabled_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_users_email
ON auth_users(email);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  session_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_hash
ON auth_sessions(session_hash);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
ON auth_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry
ON auth_sessions(expires_at);
