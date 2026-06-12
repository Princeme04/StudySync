import { db, id, now, parseJson } from './connection.ts';

type ColumnInfo = { name: string };

const hasColumn = (table: string, column: string) =>
  (db.prepare(`PRAGMA table_info(${table})`).all() as ColumnInfo[]).some((item) => item.name === column);

const addColumn = (table: string, definition: string, column: string) => {
  if (!hasColumn(table, column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
};

export function migrateDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
  if (hasColumn('users', 'auth_token')) db.prepare('UPDATE users SET auth_token = NULL').run();

  addColumn('matches', 'candidate_user_id TEXT REFERENCES users(id) ON DELETE CASCADE', 'candidate_user_id');
  addColumn('matches', 'conversation_id TEXT', 'conversation_id');

  db.exec(`
    CREATE TABLE IF NOT EXISTS match_candidates (
      match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('requester', 'candidate')),
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      PRIMARY KEY (match_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_match_candidates_user_id ON match_candidates(user_id);

    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner', 'member')),
      joined_at TEXT NOT NULL,
      PRIMARY KEY (group_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      match_id TEXT REFERENCES matches(id) ON DELETE SET NULL,
      group_id TEXT REFERENCES study_groups(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_conversations_group_id ON conversations(group_id);

    CREATE TABLE IF NOT EXISTS conversation_members (
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TEXT NOT NULL,
      PRIMARY KEY (conversation_id, user_id)
    );
    CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON conversation_members(user_id);
  `);

  const migrationId = '2026-06-11-collaboration-membership';
  db.prepare('INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)').run(migrationId, now());

  db.exec(`
    DELETE FROM attendance_records
    WHERE rowid NOT IN (
      SELECT MIN(rowid) FROM attendance_records GROUP BY session_id, user_id
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_session_user ON attendance_records(session_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_group_slot ON study_sessions(group_id, date, time);
  `);
  db.prepare('INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)').run('2026-06-11-workflow-integrity', now());
  db.exec('DROP TABLE IF EXISTS payments; DROP TABLE IF EXISTS ai_feedback;');
  db.prepare('INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)').run('2026-06-11-remove-simulated-features', now());
  db.exec(`
    DELETE FROM study_groups
    WHERE user_id LIKE 'seed-user-%'
       OR user_id IN (
         SELECT id FROM users
         WHERE email GLOB 'qa-*@studysync.edu'
            OR email GLOB 'browser-*@example.edu'
            OR email GLOB 'browser-candidate-*@example.edu'
            OR email GLOB 'a11y-*@example.edu'
       )
       OR user_id NOT IN (SELECT id FROM users);
    DELETE FROM users
    WHERE (id LIKE 'seed-user-%' AND email GLOB 'student[0-9]*@studysync.edu')
       OR email GLOB 'qa-*@studysync.edu'
       OR email GLOB 'browser-*@example.edu'
       OR email GLOB 'browser-candidate-*@example.edu'
       OR email GLOB 'a11y-*@example.edu';
    DELETE FROM student_profiles
    WHERE user_id NOT IN (SELECT id FROM users);
    DELETE FROM matches
    WHERE user_id NOT IN (SELECT id FROM users)
       OR (candidate_user_id IS NOT NULL AND candidate_user_id NOT IN (SELECT id FROM users));
    DELETE FROM group_members
    WHERE group_id NOT IN (SELECT id FROM study_groups)
       OR user_id NOT IN (SELECT id FROM users);
    DELETE FROM match_candidates
    WHERE match_id NOT IN (SELECT id FROM matches)
       OR user_id NOT IN (SELECT id FROM users);
    DELETE FROM conversation_members
    WHERE conversation_id NOT IN (SELECT id FROM conversations)
       OR user_id NOT IN (SELECT id FROM users);
    UPDATE matches SET avatar_url = NULL
    WHERE avatar_url LIKE 'https://images.unsplash.com/%';
  `);
  db.prepare('INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)').run('2026-06-12-remove-demo-seed-data', now());

  const groups = db.prepare('SELECT id, user_id, members, created_at FROM study_groups').all() as Array<Record<string, any>>;
  const addGroupMember = db.prepare("INSERT OR IGNORE INTO group_members (group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)");
  for (const group of groups) {
    addGroupMember.run(group.id, group.user_id, 'owner', group.created_at);
    for (const memberName of parseJson<string[]>(group.members, [])) {
      const user = db.prepare('SELECT id FROM users WHERE name = ?').get(memberName) as { id: string } | undefined;
      if (user && user.id !== group.user_id) addGroupMember.run(group.id, user.id, 'member', group.created_at);
    }
    let conversation = db.prepare('SELECT id FROM conversations WHERE group_id = ? ORDER BY created_at LIMIT 1').get(group.id) as { id: string } | undefined;
    if (!conversation) {
      conversation = { id: id('conversation') };
      db.prepare('INSERT INTO conversations (id, group_id, created_at) VALUES (?, ?, ?)').run(conversation.id, group.id, group.created_at);
    }
    const groupMembers = db.prepare('SELECT user_id FROM group_members WHERE group_id = ?').all(group.id) as Array<{ user_id: string }>;
    for (const member of groupMembers) {
      db.prepare('INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)')
        .run(conversation.id, member.user_id, group.created_at);
    }
  }

  const matches = db.prepare('SELECT * FROM matches').all() as Array<Record<string, any>>;
  for (const match of matches) {
    const owner = db.prepare('SELECT id FROM users WHERE id = ?').get(match.user_id) as { id: string } | undefined;
    const candidate = match.candidate_user_id
      ? { id: match.candidate_user_id }
      : db.prepare('SELECT id FROM users WHERE name = ?').get(match.candidate_name) as { id: string } | undefined;
    if (!owner || !candidate) {
      db.prepare('DELETE FROM matches WHERE id = ?').run(match.id);
      continue;
    }
    const conversationId = match.conversation_id || match.id;
    db.prepare('UPDATE matches SET candidate_user_id = ?, conversation_id = ? WHERE id = ?').run(candidate.id, conversationId, match.id);
    db.prepare('INSERT OR IGNORE INTO match_candidates (match_id, user_id, role, status, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(match.id, match.user_id, 'requester', match.status, match.created_at);
    db.prepare('INSERT OR IGNORE INTO match_candidates (match_id, user_id, role, status, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(match.id, candidate.id, 'candidate', match.status, match.created_at);
    db.prepare('INSERT OR IGNORE INTO conversations (id, match_id, created_at) VALUES (?, ?, ?)').run(conversationId, match.id, match.created_at);
    db.prepare('INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)').run(conversationId, match.user_id, match.created_at);
    db.prepare('INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)').run(conversationId, candidate.id, match.created_at);
  }

  const unknownConversationIds = db.prepare(`
    SELECT DISTINCT cm.conversation_id
    FROM chat_messages cm
    LEFT JOIN conversations c ON c.id = cm.conversation_id
    WHERE c.id IS NULL
  `).all() as Array<{ conversation_id: string }>;
  for (const item of unknownConversationIds) {
    db.prepare('INSERT INTO conversations (id, created_at) VALUES (?, ?)').run(item.conversation_id, now());
    const senders = db.prepare('SELECT DISTINCT user_id FROM chat_messages WHERE conversation_id = ?').all(item.conversation_id) as Array<{ user_id: string }>;
    for (const sender of senders) {
      db.prepare('INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)').run(item.conversation_id, sender.user_id, now());
    }
  }
}
