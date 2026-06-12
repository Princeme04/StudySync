CREATE UNIQUE INDEX IF NOT EXISTS idx_study_sessions_group_slot
  ON study_sessions(group_id, date, time);

CREATE INDEX IF NOT EXISTS idx_attendance_records_user_id
  ON attendance_records(user_id);
