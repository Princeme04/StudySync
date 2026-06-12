CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, university TEXT DEFAULT '', class_name TEXT DEFAULT '',
  is_pro INTEGER DEFAULT 0, paused INTEGER DEFAULT 0, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL,
  last_used_at TEXT NOT NULL, user_agent TEXT NOT NULL DEFAULT '', ip_address TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at);
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE TABLE IF NOT EXISTS student_profiles (
  id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE, course TEXT NOT NULL, subject TEXT NOT NULL,
  university TEXT NOT NULL, class_name TEXT NOT NULL, study_goal TEXT NOT NULL,
  preferred_study_time TEXT NOT NULL, learning_style TEXT NOT NULL, availability TEXT NOT NULL,
  study_preference TEXT NOT NULL, profile_completed INTEGER DEFAULT 1,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_user_id TEXT REFERENCES users(id) ON DELETE CASCADE, conversation_id TEXT,
  candidate_name TEXT NOT NULL,
  candidate_university TEXT NOT NULL, course TEXT NOT NULL, study_goal TEXT NOT NULL,
  available_time TEXT NOT NULL, learning_style TEXT NOT NULL, study_preference TEXT NOT NULL,
  match_percentage INTEGER NOT NULL, match_reason TEXT NOT NULL, status TEXT DEFAULT 'pending',
  avatar_url TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS study_groups (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, group_name TEXT NOT NULL, purpose TEXT NOT NULL,
  members TEXT NOT NULL, rules TEXT NOT NULL, study_target TEXT NOT NULL, meeting_style TEXT NOT NULL,
  created_at TEXT NOT NULL, is_active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE, date TEXT NOT NULL, time TEXT NOT NULL,
  topic TEXT NOT NULL, members TEXT NOT NULL, study_goal TEXT NOT NULL, status TEXT NOT NULL,
  reminder_active INTEGER DEFAULT 0, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL,
  status TEXT NOT NULL, joined_at TEXT
);
CREATE TABLE IF NOT EXISTS accountability_records (
  id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, attendance_rate INTEGER NOT NULL,
  sessions_missed INTEGER NOT NULL, participation_score INTEGER NOT NULL, is_inactive INTEGER NOT NULL,
  suggested_action TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS progress_analytics (
  id TEXT PRIMARY KEY, user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE, sessions_completed INTEGER NOT NULL,
  attendance_history TEXT NOT NULL, group_activity_level TEXT NOT NULL, study_consistency TEXT NOT NULL,
  most_active_study_time TEXT NOT NULL, total_study_hours REAL NOT NULL,
  completed_sessions INTEGER NOT NULL, progress_tracking_rate INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS metrics (key TEXT PRIMARY KEY, value REAL NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL
);
