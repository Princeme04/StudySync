ALTER TABLE matches
  ADD CONSTRAINT matches_status_check CHECK (status IN ('pending', 'accepted', 'rejected')),
  ADD CONSTRAINT matches_percentage_check CHECK (match_percentage BETWEEN 0 AND 100);

ALTER TABLE match_candidates
  ADD CONSTRAINT match_candidates_role_check CHECK (role IN ('requester', 'candidate')),
  ADD CONSTRAINT match_candidates_status_check CHECK (status IN ('pending', 'accepted', 'rejected'));

ALTER TABLE group_members
  ADD CONSTRAINT group_members_role_check CHECK (role IN ('owner', 'member'));

ALTER TABLE study_sessions
  ADD CONSTRAINT study_sessions_status_check CHECK (status IN ('confirmed', 'completed', 'missed'));

ALTER TABLE attendance_records
  ADD CONSTRAINT attendance_status_check CHECK (status IN ('joined', 'late', 'missed'));

ALTER TABLE accountability_records
  ADD CONSTRAINT accountability_attendance_rate_check CHECK (attendance_rate BETWEEN 0 AND 100),
  ADD CONSTRAINT accountability_participation_score_check CHECK (participation_score BETWEEN 0 AND 100),
  ADD CONSTRAINT accountability_sessions_missed_check CHECK (sessions_missed >= 0);

ALTER TABLE progress_analytics
  ADD CONSTRAINT progress_nonnegative_check CHECK (
    sessions_completed >= 0 AND completed_sessions >= 0 AND total_study_hours >= 0
  ),
  ADD CONSTRAINT progress_tracking_rate_check CHECK (progress_tracking_rate BETWEEN 0 AND 100);
