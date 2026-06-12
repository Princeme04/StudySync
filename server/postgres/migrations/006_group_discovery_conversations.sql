INSERT INTO conversations (id, group_id, created_at)
SELECT 'group-conversation-' || g.id, g.id, g.created_at
FROM study_groups g
LEFT JOIN conversations c ON c.group_id = g.id
WHERE c.id IS NULL;

INSERT INTO conversation_members (conversation_id, user_id, joined_at)
SELECT c.id, gm.user_id, gm.joined_at
FROM conversations c
JOIN group_members gm ON gm.group_id = c.group_id
WHERE c.group_id IS NOT NULL
ON CONFLICT (conversation_id, user_id) DO NOTHING;
