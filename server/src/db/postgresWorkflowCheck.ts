import type { ClientBase } from 'pg';

export async function checkPostgresWorkflow(client: ClientBase) {
  const suffix = crypto.randomUUID();
  const ids = {
    owner: `workflow-owner-${suffix}`,
    candidate: `workflow-candidate-${suffix}`,
    ownerProfile: `workflow-owner-profile-${suffix}`,
    candidateProfile: `workflow-candidate-profile-${suffix}`,
    match: `workflow-match-${suffix}`,
    conversation: `workflow-conversation-${suffix}`,
    group: `workflow-group-${suffix}`,
    session: `workflow-session-${suffix}`,
    attendance: `workflow-attendance-${suffix}`
  };
  const createdAt = new Date().toISOString();

  try {
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO users (id, name, email, password_hash, created_at) VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10)',
      [ids.owner, 'PostgreSQL Owner', `owner-${suffix}@example.edu`, 'argon2id$check', createdAt,
        ids.candidate, 'PostgreSQL Candidate', `candidate-${suffix}@example.edu`, 'argon2id$check', createdAt]
    );
    await client.query(`
      INSERT INTO student_profiles (
        id, user_id, course, subject, university, class_name, study_goal, preferred_study_time,
        learning_style, availability, study_preference, profile_completed, created_at, updated_at
      ) VALUES
        ($1,$2,'CS301','Algorithms','Workflow University','CS301','Complete final','Evening','visual',$3,'group',TRUE,$4,$4),
        ($5,$6,'CS301','Algorithms','Workflow University','CS301','Complete final','Evening','practice',$3,'group',TRUE,$4,$4)
    `, [ids.ownerProfile, ids.owner, JSON.stringify([{ day: 'Wednesday', startTime: '18:00', endTime: '20:00' }]), createdAt, ids.candidateProfile, ids.candidate]);
    await client.query(`
      INSERT INTO matches (
        id,user_id,candidate_user_id,candidate_name,candidate_university,course,study_goal,
        available_time,learning_style,study_preference,match_percentage,match_reason,status,created_at
      ) VALUES ($1,$2,$3,'PostgreSQL Candidate','Workflow University','CS301','Complete final','Evening','practice','group',95,'Shared workflow','accepted',$4)
    `, [ids.match, ids.owner, ids.candidate, createdAt]);
    await client.query(
      "INSERT INTO match_candidates (match_id,user_id,role,status,created_at) VALUES ($1,$2,'requester','accepted',$4),($1,$3,'candidate','accepted',$4)",
      [ids.match, ids.owner, ids.candidate, createdAt]
    );
    await client.query('INSERT INTO conversations (id,match_id,created_at) VALUES ($1,$2,$3)', [ids.conversation, ids.match, createdAt]);
    await client.query('UPDATE matches SET conversation_id = $1 WHERE id = $2', [ids.conversation, ids.match]);
    await client.query('INSERT INTO conversation_members (conversation_id,user_id,joined_at) VALUES ($1,$2,$4),($1,$3,$4)', [ids.conversation, ids.owner, ids.candidate, createdAt]);
    await client.query(`
      INSERT INTO study_groups (id,user_id,group_name,purpose,members,rules,study_target,meeting_style,created_at,is_active)
      VALUES ($1,$2,'PostgreSQL Workflow Group','Integration check','[]','[]','Complete final','Online',$3,TRUE)
    `, [ids.group, ids.owner, createdAt]);
    await client.query(
      "INSERT INTO group_members (group_id,user_id,role,joined_at) VALUES ($1,$2,'owner',$4),($1,$3,'member',$4)",
      [ids.group, ids.owner, ids.candidate, createdAt]
    );
    await client.query(`
      INSERT INTO study_sessions (id,group_id,date,time,topic,members,study_goal,status,created_at)
      VALUES ($1,$2,CURRENT_DATE + 7,'18:00 - 20:00','PostgreSQL Workflow Session','[]','Complete final','completed',$3)
    `, [ids.session, ids.group, createdAt]);
    await client.query(
      "INSERT INTO attendance_records (id,session_id,user_id,name,status,joined_at) VALUES ($1,$2,$3,'PostgreSQL Owner','joined',$4)",
      [ids.attendance, ids.session, ids.owner, createdAt]
    );

    const result = await client.query<{ members: string; sessions: string; attendance: string }>(`
      SELECT
        (SELECT COUNT(*) FROM group_members WHERE group_id = $1)::text AS members,
        (SELECT COUNT(*) FROM study_sessions WHERE group_id = $1 AND status = 'completed')::text AS sessions,
        (SELECT COUNT(*) FROM attendance_records WHERE session_id = $2 AND user_id = $3)::text AS attendance
    `, [ids.group, ids.session, ids.owner]);
    const counts = result.rows[0];
    const normalized = {
      members: Number(String(counts.members).replace(/\D/g, '')),
      sessions: Number(String(counts.sessions).replace(/\D/g, '')),
      attendance: Number(String(counts.attendance).replace(/\D/g, ''))
    };
    if (normalized.members !== 2 || normalized.sessions !== 1 || normalized.attendance !== 1) {
      throw new Error(`PostgreSQL workflow relationship check failed: ${JSON.stringify(counts)}`);
    }
    await client.query('ROLLBACK');
    console.log(JSON.stringify({ event: 'postgres_workflow_valid', counts: normalized }));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}
